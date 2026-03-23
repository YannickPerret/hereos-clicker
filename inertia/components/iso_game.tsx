import { useEffect, useRef, useCallback } from 'react'
import Phaser from 'phaser'

export interface TilesetData {
  key: string
  imagePath: string
  tileWidth: number
  tileHeight: number
  columns: number
  tileCount: number
  tilesetType: string
}

export interface SpriteData {
  key: string
  imagePath: string
  frameWidth: number
  frameHeight: number
  frameCount: number
  animations: any
  spriteType: string
}

export interface RoomEnemy {
  id: number
  enemyId: number
  name: string
  hp: number
  spriteKey: string | null
  gridX: number
  gridY: number
  isBoss: boolean
  blocksExit: boolean
}

export interface RoomData {
  id: number
  name: string
  width: number
  height: number
  tileWidth: number
  tileHeight: number
  tilesetKey: string | null
  layerGround: number[]
  layerWalls: number[]
  layerDecor: number[]
  collisions: { x: number; y: number }[]
  objects: { type: string; x: number; y: number; name?: string; metadata?: any }[]
  spawnX: number
  spawnY: number
  exitX: number | null
  exitY: number | null
  isBossRoom: boolean
  enemies: RoomEnemy[]
}

interface Props {
  room: RoomData
  tilesets: TilesetData[]
  sprites: SpriteData[]
  playerX: number
  playerY: number
  onMove: (x: number, y: number) => void
  onEnemyClick: (enemy: RoomEnemy) => void
  onExitReached: () => void
}

function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]
}

// Convert grid coords to isometric screen coords
function gridToIso(gx: number, gy: number, tw: number, th: number): { x: number; y: number } {
  return {
    x: (gx - gy) * (tw / 2),
    y: (gx + gy) * (th / 2),
  }
}

// Convert screen coords back to grid
function isoToGrid(sx: number, sy: number, tw: number, th: number): { x: number; y: number } {
  return {
    x: Math.round((sx / (tw / 2) + sy / (th / 2)) / 2),
    y: Math.round((sy / (th / 2) - sx / (tw / 2)) / 2),
  }
}

// A* pathfinding on grid
function findPath(
  startX: number, startY: number, endX: number, endY: number,
  width: number, height: number, collisions: { x: number; y: number }[]
): { x: number; y: number }[] {
  const collSet = new Set(collisions.map((c) => `${c.x},${c.y}`))
  const isBlocked = (x: number, y: number) => x < 0 || x >= width || y < 0 || y >= height || collSet.has(`${x},${y}`)

  if (isBlocked(endX, endY)) return []

  const open: any[] = [{ x: startX, y: startY, g: 0, f: 0 }]
  const closed = new Set<string>()
  const parents: Record<string, any> = {}

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f)
    const cur = open.shift()!
    const key = `${cur.x},${cur.y}`
    if (cur.x === endX && cur.y === endY) {
      const path: { x: number; y: number }[] = []
      let c = cur
      while (c) { path.unshift({ x: c.x, y: c.y }); c = parents[`${c.x},${c.y}`] }
      return path
    }
    closed.add(key)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx, ny = cur.y + dy
      if (isBlocked(nx, ny) || closed.has(`${nx},${ny}`)) continue
      const g = cur.g + 1
      const h = Math.abs(nx - endX) + Math.abs(ny - endY)
      const existing = open.find((o) => o.x === nx && o.y === ny)
      if (!existing) {
        open.push({ x: nx, y: ny, g, f: g + h })
        parents[`${nx},${ny}`] = cur
      } else if (g < existing.g) {
        existing.g = g
        existing.f = g + h
        parents[`${nx},${ny}`] = cur
      }
    }
  }
  return []
}

export default function IsoGame({ room, tilesets, sprites, playerX, playerY, onMove, onEnemyClick, onExitReached }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<Phaser.Scene | null>(null)
  const playerRef = useRef<Phaser.GameObjects.Sprite | null>(null)
  const playerPosRef = useRef({ x: playerX, y: playerY })

  const onMoveRef = useRef(onMove)
  const onEnemyClickRef = useRef(onEnemyClick)
  const onExitReachedRef = useRef(onExitReached)
  onMoveRef.current = onMove
  onEnemyClickRef.current = onEnemyClick
  onExitReachedRef.current = onExitReached

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const tw = room.tileWidth
    const th = room.tileHeight
    const mapPixelW = (room.width + room.height) * (tw / 2)
    const mapPixelH = (room.width + room.height) * (th / 2)

    class DungeonScene extends Phaser.Scene {
      private enemySprites: { sprite: Phaser.GameObjects.Sprite; enemy: RoomEnemy }[] = []
      private pathGraphics!: Phaser.GameObjects.Graphics
      private moving = false

      constructor() { super({ key: 'DungeonScene' }) }

      preload() {
        // Load tilesets
        for (const ts of tilesets) {
          this.load.image(ts.key, `/assets/maps/tilesets/${ts.imagePath}`)
        }
        // Load sprites
        for (const sp of sprites) {
          if (sp.frameCount > 1) {
            this.load.spritesheet(sp.key, `/assets/sprites/${sp.imagePath}`, {
              frameWidth: sp.frameWidth,
              frameHeight: sp.frameHeight,
            })
          } else {
            this.load.image(sp.key, `/assets/sprites/${sp.imagePath}`)
          }
        }
        // Default fallbacks
        this.load.on('loaderror', () => {})
      }

      create() {
        sceneRef.current = this
        const offsetX = mapPixelW / 2
        const offsetY = th * 2

        this.pathGraphics = this.add.graphics()

        // ── Draw ground layer ──
        if (room.layerGround.length > 0 && room.tilesetKey) {
          for (let gy = 0; gy < room.height; gy++) {
            for (let gx = 0; gx < room.width; gx++) {
              const gid = room.layerGround[gy * room.width + gx]
              if (gid <= 0) continue
              const iso = gridToIso(gx, gy, tw, th)
              const tile = this.add.sprite(iso.x + offsetX, iso.y + offsetY, room.tilesetKey!, gid - 1)
              tile.setDepth(0)
            }
          }
        } else {
          // Draw placeholder diamond tiles
          for (let gy = 0; gy < room.height; gy++) {
            for (let gx = 0; gx < room.width; gx++) {
              const iso = gridToIso(gx, gy, tw, th)
              const g = this.add.graphics()
              const cx = iso.x + offsetX, cy = iso.y + offsetY
              const isCollision = room.collisions.some((c) => c.x === gx && c.y === gy)
              const isExit = room.exitX === gx && room.exitY === gy

              g.fillStyle(isCollision ? 0x1a0a0a : isExit ? 0x2a1a00 : 0x0a1a2a, 0.8)
              g.lineStyle(1, isCollision ? 0x440000 : isExit ? 0x886600 : 0x003355, 0.5)
              g.beginPath()
              g.moveTo(cx, cy - th / 2)
              g.lineTo(cx + tw / 2, cy)
              g.lineTo(cx, cy + th / 2)
              g.lineTo(cx - tw / 2, cy)
              g.closePath()
              g.fillPath()
              g.strokePath()
              g.setDepth(0)

              if (isExit) {
                const exitText = this.add.text(cx, cy - 4, '▶', { fontSize: '12px', color: '#ffaa00' }).setOrigin(0.5).setDepth(1)
              }
            }
          }
        }

        // ── Draw wall layer ──
        if (room.layerWalls.length > 0 && room.tilesetKey) {
          for (let gy = 0; gy < room.height; gy++) {
            for (let gx = 0; gx < room.width; gx++) {
              const gid = room.layerWalls[gy * room.width + gx]
              if (gid <= 0) continue
              const iso = gridToIso(gx, gy, tw, th)
              const tile = this.add.sprite(iso.x + offsetX, iso.y + offsetY, room.tilesetKey!, gid - 1)
              tile.setDepth(gy * room.width + gx + 1)
            }
          }
        }

        // ── Enemies ──
        this.enemySprites = []
        for (const enemy of room.enemies) {
          const iso = gridToIso(enemy.gridX, enemy.gridY, tw, th)
          const hasSprite = enemy.spriteKey && sprites.some((s) => s.key === enemy.spriteKey)
          let sprite: Phaser.GameObjects.Sprite

          if (hasSprite) {
            sprite = this.add.sprite(iso.x + offsetX, iso.y + offsetY - 16, enemy.spriteKey!)
          } else {
            // Placeholder red diamond
            const g = this.add.graphics()
            const cx = iso.x + offsetX, cy = iso.y + offsetY - 8
            g.fillStyle(enemy.isBoss ? 0xff0000 : 0xcc3333, 1)
            g.beginPath()
            g.moveTo(cx, cy - 12)
            g.lineTo(cx + 10, cy)
            g.lineTo(cx, cy + 12)
            g.lineTo(cx - 10, cy)
            g.closePath()
            g.fillPath()
            g.setDepth(enemy.gridY * room.width + enemy.gridX + 10)

            sprite = this.add.sprite(cx, cy, '__DEFAULT').setVisible(false)
            sprite.setData('graphics', g)
          }

          sprite.setDepth(enemy.gridY * room.width + enemy.gridX + 10)
          sprite.setInteractive({ useHandCursor: true })
          sprite.on('pointerdown', () => onEnemyClickRef.current(enemy))

          // Enemy name label
          const label = this.add.text(
            iso.x + offsetX, iso.y + offsetY - 28,
            enemy.name + (enemy.isBoss ? ' ★' : ''),
            { fontSize: '9px', color: enemy.isBoss ? '#ff4444' : '#ff8888', fontStyle: 'bold' }
          ).setOrigin(0.5).setDepth(9999)

          this.enemySprites.push({ sprite, enemy })
        }

        // ── Player ──
        const playerIso = gridToIso(playerX, playerY, tw, th)
        const playerHasSprite = sprites.some((s) => s.key === 'player')

        if (playerHasSprite) {
          playerRef.current = this.add.sprite(playerIso.x + offsetX, playerIso.y + offsetY - 16, 'player')
        } else {
          // Placeholder green diamond
          const g = this.add.graphics()
          const cx = playerIso.x + offsetX, cy = playerIso.y + offsetY - 8
          g.fillStyle(0x00ff00, 1)
          g.lineStyle(2, 0xffffff, 1)
          g.beginPath()
          g.moveTo(cx, cy - 14)
          g.lineTo(cx + 12, cy)
          g.lineTo(cx, cy + 14)
          g.lineTo(cx - 12, cy)
          g.closePath()
          g.fillPath()
          g.strokePath()
          g.setDepth(9990)

          playerRef.current = this.add.sprite(cx, cy, '__DEFAULT').setVisible(false)
          playerRef.current.setData('graphics', g)
        }
        playerRef.current!.setDepth(9990)

        // ── Click to move ──
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          if (this.moving) return
          const worldX = pointer.worldX - offsetX
          const worldY = pointer.worldY - offsetY
          const grid = isoToGrid(worldX, worldY, tw, th)

          if (grid.x < 0 || grid.x >= room.width || grid.y < 0 || grid.y >= room.height) return

          const path = findPath(playerPosRef.current.x, playerPosRef.current.y, grid.x, grid.y, room.width, room.height, room.collisions)
          if (path.length <= 1) return

          this.moving = true
          this.pathGraphics.clear()

          // Animate along path
          let step = 1
          const timer = this.time.addEvent({
            delay: 120,
            repeat: path.length - 2,
            callback: () => {
              const p = path[step]
              const iso = gridToIso(p.x, p.y, tw, th)
              const newX = iso.x + offsetX
              const newY = iso.y + offsetY - 8

              // Move player graphics
              const pg = playerRef.current?.getData('graphics') as Phaser.GameObjects.Graphics
              if (pg) {
                pg.clear()
                pg.fillStyle(0x00ff00, 1)
                pg.lineStyle(2, 0xffffff, 1)
                pg.beginPath()
                pg.moveTo(newX, newY - 14)
                pg.lineTo(newX + 12, newY)
                pg.lineTo(newX, newY + 14)
                pg.lineTo(newX - 12, newY)
                pg.closePath()
                pg.fillPath()
                pg.strokePath()
                pg.setDepth(p.y * room.width + p.x + 100)
              }

              playerPosRef.current = { x: p.x, y: p.y }
              step++

              if (step >= path.length) {
                this.moving = false
                onMoveRef.current(p.x, p.y)

                // Check exit
                if (room.exitX !== null && room.exitY !== null && p.x === room.exitX && p.y === room.exitY) {
                  onExitReachedRef.current()
                }
              }
            },
          })
        })

        // Camera
        this.cameras.main.setBounds(0, 0, mapPixelW + tw, mapPixelH + th * 4)
        this.cameras.main.centerOn(offsetX, offsetY + mapPixelH / 4)

        // Drag to scroll camera
        let dragStartX = 0, dragStartY = 0
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { dragStartX = p.x; dragStartY = p.y })
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
          if (!p.isDown) return
          const dx = dragStartX - p.x
          const dy = dragStartY - p.y
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            this.cameras.main.scrollX += dx * 0.5
            this.cameras.main.scrollY += dy * 0.5
            dragStartX = p.x
            dragStartY = p.y
          }
        })
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#050a12',
      scene: DungeonScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      pixelArt: true,
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [room.id])

  return <div ref={containerRef} className="w-full h-full min-h-[500px]" />
}
