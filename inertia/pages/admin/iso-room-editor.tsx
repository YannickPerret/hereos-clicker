import { router, usePage } from '@inertiajs/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import Phaser from 'phaser'

/* ─── Types ─── */

interface TilesetData {
  id: number
  key: string
  name: string
  imagePath: string
  tileWidth: number
  tileHeight: number
  columns: number
  tileCount: number
  tilesetType: string
}

interface RoomEnemy {
  id: number
  enemyId: number
  enemyName: string
  spriteKey: string | null
  gridX: number
  gridY: number
  isBoss: boolean
  blocksExit: boolean
}

interface RoomData {
  id: number
  dungeonId: number
  name: string
  roomOrder: number
  isBossRoom: boolean
  width: number
  height: number
  tileWidth: number
  tileHeight: number
  tilesetKey: string | null
  layerGround: string | null
  layerWalls: string | null
  layerDecor: string | null
  collisions: string | null
  objectsJson: string | null
  spawnX: number
  spawnY: number
  exitX: number | null
  exitY: number | null
  dungeon: { id: number; name: string; slug: string }
  enemies: RoomEnemy[]
}

interface Props {
  room: RoomData
  tileset: TilesetData | null
}

type LayerName = 'ground' | 'walls' | 'decor' | 'collisions'
type ToolName = 'pencil' | 'eraser' | 'fill' | 'spawn' | 'exit'

/* ─── Iso math helpers ─── */

function gridToIso(gx: number, gy: number, tw: number, th: number) {
  return { x: (gx - gy) * (tw / 2), y: (gx + gy) * (th / 2) }
}

function isoToGrid(sx: number, sy: number, tw: number, th: number) {
  const gx = Math.round((sx / (tw / 2) + sy / (th / 2)) / 2)
  const gy = Math.round((sy / (th / 2) - sx / (tw / 2)) / 2)
  return { x: gx, y: gy }
}

/* ─── Phaser Editor Scene ─── */

interface EditorSharedState {
  layers: {
    ground: number[]
    walls: number[]
    decor: number[]
  }
  collisions: { x: number; y: number }[]
  spawnX: number
  spawnY: number
  exitX: number | null
  exitY: number | null
  activeLayer: LayerName
  activeTool: ToolName
  selectedGid: number
  showGrid: boolean
  roomWidth: number
  roomHeight: number
  tileWidth: number
  tileHeight: number
  tilesetKey: string | null
  tilesetImagePath: string | null
  tilesetColumns: number
  tilesetTileCount: number
  onStateChange: () => void
}

class EditorScene extends Phaser.Scene {
  shared!: EditorSharedState
  private isPainting = false
  private isPanning = false
  private panStart = { x: 0, y: 0 }
  private camStart = { x: 0, y: 0 }
  private tileGraphics!: Phaser.GameObjects.Graphics
  private overlayGraphics!: Phaser.GameObjects.Graphics
  private cursorGraphics!: Phaser.GameObjects.Graphics
  private markerGraphics!: Phaser.GameObjects.Graphics
  private gridGraphics!: Phaser.GameObjects.Graphics
  private tilesetTexLoaded = false
  private lastPaintedCell = { x: -1, y: -1 }

  constructor() {
    super({ key: 'EditorScene' })
  }

  init(data: { shared: EditorSharedState }) {
    this.shared = data.shared
  }

  preload() {
    if (this.shared.tilesetKey && this.shared.tilesetImagePath) {
      this.load.spritesheet(this.shared.tilesetKey, `/assets/maps/tilesets/${this.shared.tilesetImagePath}`, {
        frameWidth: this.shared.tileWidth,
        frameHeight: this.shared.tileHeight,
      })
    }
  }

  create() {
    this.tilesetTexLoaded = !!(this.shared.tilesetKey && this.textures.exists(this.shared.tilesetKey))

    this.tileGraphics = this.add.graphics()
    this.overlayGraphics = this.add.graphics()
    this.gridGraphics = this.add.graphics()
    this.markerGraphics = this.add.graphics()
    this.cursorGraphics = this.add.graphics()

    // Center camera
    const centerIso = gridToIso(
      this.shared.roomWidth / 2,
      this.shared.roomHeight / 2,
      this.shared.tileWidth,
      this.shared.tileHeight
    )
    this.cameras.main.centerOn(centerIso.x, centerIso.y)
    this.cameras.main.setZoom(1)

    // Input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        this.isPanning = true
        this.panStart = { x: pointer.x, y: pointer.y }
        this.camStart = { x: this.cameras.main.scrollX, y: this.cameras.main.scrollY }
        return
      }
      if (pointer.leftButtonDown() || pointer.rightButtonDown()) {
        this.isPainting = true
        this.lastPaintedCell = { x: -1, y: -1 }
        this.handlePaint(pointer)
      }
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning) {
        const dx = this.panStart.x - pointer.x
        const dy = this.panStart.y - pointer.y
        this.cameras.main.scrollX = this.camStart.x + dx / this.cameras.main.zoom
        this.cameras.main.scrollY = this.camStart.y + dy / this.cameras.main.zoom
        return
      }
      if (this.isPainting) {
        this.handlePaint(pointer)
      }
      this.drawCursor(pointer)
    })

    this.input.on('pointerup', () => {
      this.isPainting = false
      this.isPanning = false
    })

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gx: number, _gy: number, _dx: number, dy: number) => {
      const zoom = this.cameras.main.zoom
      const newZoom = Phaser.Math.Clamp(zoom - dy * 0.001, 0.25, 4)
      this.cameras.main.setZoom(newZoom)
    })

    // Disable context menu
    this.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    this.redraw()
  }

  update() {
    // Redraw every frame to keep in sync with React state
    this.redraw()
  }

  private handlePaint(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    const grid = isoToGrid(worldPoint.x, worldPoint.y, this.shared.tileWidth, this.shared.tileHeight)
    const gx = grid.x
    const gy = grid.y

    if (gx < 0 || gx >= this.shared.roomWidth || gy < 0 || gy >= this.shared.roomHeight) return
    if (this.lastPaintedCell.x === gx && this.lastPaintedCell.y === gy) return
    this.lastPaintedCell = { x: gx, y: gy }

    const isRightClick = pointer.rightButtonDown()
    const tool = isRightClick ? 'eraser' : this.shared.activeTool
    const layer = this.shared.activeLayer

    if (tool === 'spawn') {
      this.shared.spawnX = gx
      this.shared.spawnY = gy
      this.shared.onStateChange()
      return
    }

    if (tool === 'exit') {
      this.shared.exitX = gx
      this.shared.exitY = gy
      this.shared.onStateChange()
      return
    }

    if (layer === 'collisions') {
      const idx = this.shared.collisions.findIndex((c) => c.x === gx && c.y === gy)
      if (tool === 'eraser') {
        if (idx >= 0) this.shared.collisions.splice(idx, 1)
      } else if (tool === 'pencil') {
        if (idx < 0) this.shared.collisions.push({ x: gx, y: gy })
      } else if (tool === 'fill') {
        // Fill all empty cells with collision
        for (let y = 0; y < this.shared.roomHeight; y++) {
          for (let x = 0; x < this.shared.roomWidth; x++) {
            if (!this.shared.collisions.find((c) => c.x === x && c.y === y)) {
              this.shared.collisions.push({ x, y })
            }
          }
        }
      }
      this.shared.onStateChange()
      return
    }

    // Tile layers
    const layerArr = this.shared.layers[layer as keyof typeof this.shared.layers]
    const idx = gy * this.shared.roomWidth + gx

    if (tool === 'eraser') {
      layerArr[idx] = 0
    } else if (tool === 'pencil') {
      layerArr[idx] = this.shared.selectedGid
    } else if (tool === 'fill') {
      this.floodFill(layerArr, gx, gy, layerArr[idx], this.shared.selectedGid)
    }
    this.shared.onStateChange()
  }

  private floodFill(arr: number[], startX: number, startY: number, targetGid: number, fillGid: number) {
    if (targetGid === fillGid) return
    const w = this.shared.roomWidth
    const h = this.shared.roomHeight
    const stack: [number, number][] = [[startX, startY]]
    const visited = new Set<number>()

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!
      const ci = cy * w + cx
      if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue
      if (visited.has(ci)) continue
      if (arr[ci] !== targetGid) continue
      visited.add(ci)
      arr[ci] = fillGid
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
    }
  }

  private drawCursor(pointer: Phaser.Input.Pointer) {
    this.cursorGraphics.clear()
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    const grid = isoToGrid(worldPoint.x, worldPoint.y, this.shared.tileWidth, this.shared.tileHeight)
    if (grid.x < 0 || grid.x >= this.shared.roomWidth || grid.y < 0 || grid.y >= this.shared.roomHeight) return

    const iso = gridToIso(grid.x, grid.y, this.shared.tileWidth, this.shared.tileHeight)
    const tw = this.shared.tileWidth
    const th = this.shared.tileHeight

    this.cursorGraphics.lineStyle(2, 0x00ffff, 0.8)
    this.cursorGraphics.beginPath()
    this.cursorGraphics.moveTo(iso.x, iso.y - th / 2)
    this.cursorGraphics.lineTo(iso.x + tw / 2, iso.y)
    this.cursorGraphics.lineTo(iso.x, iso.y + th / 2)
    this.cursorGraphics.lineTo(iso.x - tw / 2, iso.y)
    this.cursorGraphics.closePath()
    this.cursorGraphics.strokePath()

    // Show selected tile preview if painting
    if (this.shared.activeTool === 'pencil' && this.shared.activeLayer !== 'collisions' && this.tilesetTexLoaded && this.shared.selectedGid > 0) {
      // Preview tile with alpha
    }
  }

  private redraw() {
    this.tileGraphics.clear()
    this.overlayGraphics.clear()
    this.gridGraphics.clear()
    this.markerGraphics.clear()

    const tw = this.shared.tileWidth
    const th = this.shared.tileHeight
    const w = this.shared.roomWidth
    const h = this.shared.roomHeight
    const activeLayer = this.shared.activeLayer

    // Remove old tile sprites (we recreate each frame - simple approach)
    this.children.list
      .filter((c) => c.getData('isTileSprite'))
      .forEach((c) => c.destroy())

    // Draw layers
    const layerOrder: (keyof typeof this.shared.layers)[] = ['ground', 'walls', 'decor']
    for (const layerName of layerOrder) {
      const arr = this.shared.layers[layerName]
      const isActive = activeLayer === layerName
      const alpha = isActive ? 1 : (activeLayer === 'collisions' ? 0.3 : 0.4)

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const gid = arr[y * w + x]
          if (gid <= 0) continue

          const iso = gridToIso(x, y, tw, th)

          if (this.tilesetTexLoaded && this.shared.tilesetKey) {
            const sprite = this.add.sprite(iso.x, iso.y, this.shared.tilesetKey, gid - 1)
            sprite.setAlpha(alpha)
            sprite.setData('isTileSprite', true)
            sprite.setDepth(layerOrder.indexOf(layerName))
          } else {
            // Fallback: colored diamond
            const colors = { ground: 0x336633, walls: 0x663333, decor: 0x333366 }
            this.tileGraphics.fillStyle(colors[layerName], alpha * 0.7)
            this.tileGraphics.beginPath()
            this.tileGraphics.moveTo(iso.x, iso.y - th / 2)
            this.tileGraphics.lineTo(iso.x + tw / 2, iso.y)
            this.tileGraphics.lineTo(iso.x, iso.y + th / 2)
            this.tileGraphics.lineTo(iso.x - tw / 2, iso.y)
            this.tileGraphics.closePath()
            this.tileGraphics.fillPath()
          }
        }
      }
    }

    // Grid
    if (this.shared.showGrid) {
      this.gridGraphics.lineStyle(1, 0xffffff, 0.12)
      this.gridGraphics.setDepth(5)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const iso = gridToIso(x, y, tw, th)
          this.gridGraphics.beginPath()
          this.gridGraphics.moveTo(iso.x, iso.y - th / 2)
          this.gridGraphics.lineTo(iso.x + tw / 2, iso.y)
          this.gridGraphics.lineTo(iso.x, iso.y + th / 2)
          this.gridGraphics.lineTo(iso.x - tw / 2, iso.y)
          this.gridGraphics.closePath()
          this.gridGraphics.strokePath()
        }
      }
    }

    // Collisions
    const collAlpha = activeLayer === 'collisions' ? 0.5 : 0.2
    this.overlayGraphics.setDepth(6)
    for (const c of this.shared.collisions) {
      const iso = gridToIso(c.x, c.y, tw, th)
      this.overlayGraphics.fillStyle(0xff0000, collAlpha)
      this.overlayGraphics.beginPath()
      this.overlayGraphics.moveTo(iso.x, iso.y - th / 2)
      this.overlayGraphics.lineTo(iso.x + tw / 2, iso.y)
      this.overlayGraphics.lineTo(iso.x, iso.y + th / 2)
      this.overlayGraphics.lineTo(iso.x - tw / 2, iso.y)
      this.overlayGraphics.closePath()
      this.overlayGraphics.fillPath()
    }

    // Spawn marker
    this.markerGraphics.setDepth(8)
    const spawnIso = gridToIso(this.shared.spawnX, this.shared.spawnY, tw, th)
    this.markerGraphics.fillStyle(0x00ff00, 0.6)
    this.markerGraphics.beginPath()
    this.markerGraphics.moveTo(spawnIso.x, spawnIso.y - th / 2)
    this.markerGraphics.lineTo(spawnIso.x + tw / 2, spawnIso.y)
    this.markerGraphics.lineTo(spawnIso.x, spawnIso.y + th / 2)
    this.markerGraphics.lineTo(spawnIso.x - tw / 2, spawnIso.y)
    this.markerGraphics.closePath()
    this.markerGraphics.fillPath()
    this.markerGraphics.lineStyle(2, 0x00ff00, 1)
    this.markerGraphics.strokePath()

    // Exit marker
    if (this.shared.exitX != null && this.shared.exitY != null) {
      const exitIso = gridToIso(this.shared.exitX, this.shared.exitY, tw, th)
      this.markerGraphics.fillStyle(0xffff00, 0.6)
      this.markerGraphics.beginPath()
      this.markerGraphics.moveTo(exitIso.x, exitIso.y - th / 2)
      this.markerGraphics.lineTo(exitIso.x + tw / 2, exitIso.y)
      this.markerGraphics.lineTo(exitIso.x, exitIso.y + th / 2)
      this.markerGraphics.lineTo(exitIso.x - tw / 2, exitIso.y)
      this.markerGraphics.closePath()
      this.markerGraphics.fillPath()
      this.markerGraphics.lineStyle(2, 0xffff00, 1)
      this.markerGraphics.strokePath()
    }

    // Enemy markers
    for (const enemy of (this.shared as any).enemies || []) {
      const eIso = gridToIso(enemy.gridX, enemy.gridY, tw, th)
      this.markerGraphics.fillStyle(enemy.isBoss ? 0xff0066 : 0xff6600, 0.5)
      this.markerGraphics.beginPath()
      this.markerGraphics.moveTo(eIso.x, eIso.y - th / 2)
      this.markerGraphics.lineTo(eIso.x + tw / 2, eIso.y)
      this.markerGraphics.lineTo(eIso.x, eIso.y + th / 2)
      this.markerGraphics.lineTo(eIso.x - tw / 2, eIso.y)
      this.markerGraphics.closePath()
      this.markerGraphics.fillPath()
      this.markerGraphics.lineStyle(2, enemy.isBoss ? 0xff0066 : 0xff6600, 0.8)
      this.markerGraphics.strokePath()
    }

    // Set depths
    this.tileGraphics.setDepth(1)
    this.cursorGraphics.setDepth(10)
  }
}

/* ─── React Component ─── */

export default function IsoRoomEditor({ room, tileset }: Props) {
  const { props } = usePage<{ success?: string; errors?: { message?: string } }>()

  // Parse initial data
  const parseArr = (json: string | null, size: number): number[] => {
    if (!json) return new Array(size).fill(0)
    try {
      const parsed = JSON.parse(json)
      if (Array.isArray(parsed)) {
        while (parsed.length < size) parsed.push(0)
        return parsed
      }
    } catch {}
    return new Array(size).fill(0)
  }

  const parseCollisions = (json: string | null): { x: number; y: number }[] => {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return []
  }

  const totalTiles = room.width * room.height

  const [layers, setLayers] = useState({
    ground: parseArr(room.layerGround, totalTiles),
    walls: parseArr(room.layerWalls, totalTiles),
    decor: parseArr(room.layerDecor, totalTiles),
  })
  const [collisions, setCollisions] = useState(parseCollisions(room.collisions))
  const [spawnX, setSpawnX] = useState(room.spawnX)
  const [spawnY, setSpawnY] = useState(room.spawnY)
  const [exitX, setExitX] = useState<number | null>(room.exitX)
  const [exitY, setExitY] = useState<number | null>(room.exitY)
  const [activeLayer, setActiveLayer] = useState<LayerName>('ground')
  const [activeTool, setActiveTool] = useState<ToolName>('pencil')
  const [selectedGid, setSelectedGid] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [saving, setSaving] = useState(false)

  // Shared ref for Phaser
  const sharedRef = useRef<EditorSharedState | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stateVersion = useRef(0)
  const [, forceUpdate] = useState(0)

  const onStateChange = useCallback(() => {
    if (!sharedRef.current) return
    const s = sharedRef.current
    // Sync from shared back to React
    setLayers({ ground: [...s.layers.ground], walls: [...s.layers.walls], decor: [...s.layers.decor] })
    setCollisions([...s.collisions])
    setSpawnX(s.spawnX)
    setSpawnY(s.spawnY)
    setExitX(s.exitX)
    setExitY(s.exitY)
    stateVersion.current++
    forceUpdate((v) => v + 1)
  }, [])

  // Sync React state to shared ref
  useEffect(() => {
    if (!sharedRef.current) return
    sharedRef.current.layers = layers
    sharedRef.current.collisions = collisions
    sharedRef.current.spawnX = spawnX
    sharedRef.current.spawnY = spawnY
    sharedRef.current.exitX = exitX
    sharedRef.current.exitY = exitY
    sharedRef.current.activeLayer = activeLayer
    sharedRef.current.activeTool = activeTool
    sharedRef.current.selectedGid = selectedGid
    sharedRef.current.showGrid = showGrid
  }, [layers, collisions, spawnX, spawnY, exitX, exitY, activeLayer, activeTool, selectedGid, showGrid])

  // Init Phaser
  useEffect(() => {
    if (!containerRef.current) return
    if (gameRef.current) return

    const shared: EditorSharedState = {
      layers: { ground: [...layers.ground], walls: [...layers.walls], decor: [...layers.decor] },
      collisions: [...collisions],
      spawnX,
      spawnY,
      exitX,
      exitY,
      activeLayer,
      activeTool,
      selectedGid,
      showGrid,
      roomWidth: room.width,
      roomHeight: room.height,
      tileWidth: room.tileWidth,
      tileHeight: room.tileHeight,
      tilesetKey: tileset?.key || null,
      tilesetImagePath: tileset?.imagePath || null,
      tilesetColumns: tileset?.columns || 8,
      tilesetTileCount: tileset?.tileCount || 64,
      onStateChange,
    }
    ;(shared as any).enemies = room.enemies

    sharedRef.current = shared

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#0a0a0f',
      scene: [],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        mouse: { preventDefaultWheel: true },
      },
    })

    game.scene.add('EditorScene', EditorScene, true, { shared })
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save
  const handleSave = () => {
    setSaving(true)
    router.post(`/admin/iso-rooms/${room.id}/save-map`, {
      layerGround: JSON.stringify(layers.ground),
      layerWalls: JSON.stringify(layers.walls),
      layerDecor: JSON.stringify(layers.decor),
      collisions: JSON.stringify(collisions),
      objectsJson: room.objectsJson || '[]',
      spawnX,
      spawnY,
      exitX,
      exitY,
    }, {
      onFinish: () => setSaving(false),
    })
  }

  const inputCls = 'w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none'

  const toolButtons: { tool: ToolName; label: string; icon: string }[] = [
    { tool: 'pencil', label: 'Crayon', icon: 'P' },
    { tool: 'eraser', label: 'Gomme', icon: 'E' },
    { tool: 'fill', label: 'Remplir', icon: 'F' },
  ]

  const layerButtons: { layer: LayerName; label: string; color: string }[] = [
    { layer: 'ground', label: 'Sol', color: 'cyber-green' },
    { layer: 'walls', label: 'Murs', color: 'cyber-yellow' },
    { layer: 'decor', label: 'Decor', color: 'cyber-blue' },
    { layer: 'collisions', label: 'Collisions', color: 'cyber-red' },
  ]

  // Tile palette
  const tilesetCols = tileset?.columns || 8
  const tilesetCount = tileset?.tileCount || 0
  const tilePxW = tileset?.tileWidth || 64
  const tilePxH = tileset?.tileHeight || 32
  const paletteRows = Math.ceil(tilesetCount / tilesetCols)

  return (
    <div className="flex flex-col h-screen bg-cyber-black text-white">
        {/* Notifications */}
        {props.success && (
          <div className="mx-2 mt-1 rounded border border-cyber-green/50 bg-cyber-green/10 px-3 py-1.5 text-xs text-cyber-green">
            {props.success as string}
          </div>
        )}
        {props.errors?.message && (
          <div className="mx-2 mt-1 rounded border border-cyber-red/50 bg-cyber-red/10 px-3 py-1.5 text-xs text-cyber-red">
            {props.errors.message}
          </div>
        )}

        {/* Main area */}
        <div className="flex flex-1 overflow-hidden">

          {/* ═══ LEFT SIDEBAR ═══ */}
          <div className="flex w-[250px] flex-shrink-0 flex-col border-r border-gray-800 bg-cyber-dark overflow-y-auto">

            {/* Tools */}
            <div className="border-b border-gray-800 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">OUTILS</div>
              <div className="flex gap-1">
                {toolButtons.map((t) => (
                  <button
                    key={t.tool}
                    onClick={() => setActiveTool(t.tool)}
                    className={`flex-1 rounded border px-2 py-1.5 text-[10px] uppercase tracking-wider transition-colors ${
                      activeTool === t.tool
                        ? 'border-cyber-blue bg-cyber-blue/20 text-cyber-blue'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                    title={t.label}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`mt-1 w-full rounded border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                  showGrid
                    ? 'border-cyber-purple/50 bg-cyber-purple/10 text-cyber-purple'
                    : 'border-gray-700 text-gray-500'
                }`}
              >
                Grille {showGrid ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Layers */}
            <div className="border-b border-gray-800 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">CALQUES</div>
              <div className="space-y-1">
                {layerButtons.map((l) => (
                  <button
                    key={l.layer}
                    onClick={() => setActiveLayer(l.layer)}
                    className={`w-full rounded border px-3 py-1.5 text-left text-[10px] uppercase tracking-wider transition-colors ${
                      activeLayer === l.layer
                        ? `border-${l.color}/50 bg-${l.color}/20 text-${l.color}`
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {l.label}
                    {l.layer !== 'collisions' && (
                      <span className="ml-1 text-[9px] text-gray-600">
                        ({layers[l.layer as keyof typeof layers].filter((g) => g > 0).length})
                      </span>
                    )}
                    {l.layer === 'collisions' && (
                      <span className="ml-1 text-[9px] text-gray-600">
                        ({collisions.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tile Palette */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">PALETTE DE TILES</div>
              {!tileset ? (
                <div className="text-[10px] text-gray-600">Aucun tileset associe</div>
              ) : (
                <>
                  <div className="mb-2 text-[9px] text-gray-600">
                    {tileset.name} ({tilesetCols} col, {tilesetCount} tiles)
                  </div>
                  <div className="mb-2 text-[9px] text-gray-500">
                    Tile actif: <span className="text-cyber-blue font-bold">GID {selectedGid}</span>
                  </div>
                  <div
                    className="grid gap-0.5"
                    style={{ gridTemplateColumns: `repeat(${Math.min(tilesetCols, 6)}, 1fr)` }}
                  >
                    {Array.from({ length: tilesetCount }, (_, i) => {
                      const gid = i + 1
                      const col = i % tilesetCols
                      const row = Math.floor(i / tilesetCols)
                      const bgX = -(col * tilePxW)
                      const bgY = -(row * tilePxH)
                      // Scale tiles to fit in palette
                      const displaySize = Math.floor(220 / Math.min(tilesetCols, 6)) - 2
                      const scaleX = displaySize / tilePxW
                      const scaleY = displaySize / tilePxH

                      return (
                        <button
                          key={gid}
                          onClick={() => setSelectedGid(gid)}
                          className={`border transition-colors ${
                            selectedGid === gid
                              ? 'border-cyber-blue shadow-[0_0_6px_rgba(0,200,255,0.4)]'
                              : 'border-gray-800 hover:border-gray-600'
                          }`}
                          style={{
                            width: displaySize,
                            height: displaySize,
                            backgroundImage: `url(/assets/maps/tilesets/${tileset.imagePath})`,
                            backgroundPosition: `${bgX * scaleX}px ${bgY * scaleY}px`,
                            backgroundSize: `${tilePxW * tilesetCols * scaleX}px ${tilePxH * paletteRows * scaleY}px`,
                            backgroundRepeat: 'no-repeat',
                            imageRendering: 'pixelated',
                          }}
                          title={`GID ${gid}`}
                        />
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ═══ CENTER — PHASER CANVAS ═══ */}
          <div className="flex-1 relative" ref={containerRef} />

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="flex w-[200px] flex-shrink-0 flex-col border-l border-gray-800 bg-cyber-dark overflow-y-auto">

            {/* Spawn */}
            <div className="border-b border-gray-800 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">SPAWN</div>
              <div className="text-xs text-white mb-1">
                ({spawnX}, {spawnY})
              </div>
              <button
                onClick={() => setActiveTool('spawn')}
                className={`w-full rounded border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                  activeTool === 'spawn'
                    ? 'border-cyber-green bg-cyber-green/20 text-cyber-green'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Placer spawn
              </button>
            </div>

            {/* Exit */}
            <div className="border-b border-gray-800 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">SORTIE</div>
              <div className="text-xs text-white mb-1">
                {exitX != null && exitY != null ? `(${exitX}, ${exitY})` : 'Non definie'}
              </div>
              <button
                onClick={() => setActiveTool('exit')}
                className={`w-full rounded border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                  activeTool === 'exit'
                    ? 'border-cyber-yellow bg-cyber-yellow/20 text-cyber-yellow'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Placer sortie
              </button>
            </div>

            {/* Enemies */}
            <div className="flex-1 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-500">
                ENNEMIS ({room.enemies.length})
              </div>
              {room.enemies.length === 0 ? (
                <div className="text-[10px] text-gray-600">Aucun ennemi</div>
              ) : (
                <div className="space-y-1">
                  {room.enemies.map((e) => (
                    <div
                      key={e.id}
                      className={`rounded border p-2 text-[10px] ${
                        e.isBoss ? 'border-cyber-red/30 text-cyber-red' : 'border-gray-700 text-gray-400'
                      }`}
                    >
                      <div className="font-bold">{e.enemyName}</div>
                      <div className="text-[9px] text-gray-500">
                        ({e.gridX}, {e.gridY}) {e.isBoss ? '- BOSS' : ''} {e.blocksExit ? '- Bloque' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM BAR ═══ */}
        <div className="flex items-center justify-between border-t border-gray-800 bg-cyber-dark px-4 py-2">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-white">{room.dungeon.name}</span>
            <span className="text-[10px] text-gray-500">
              {room.name} - {room.width}x{room.height} - {room.tileWidth}x{room.tileHeight}px
            </span>
            <span className="text-[9px] text-gray-600">
              Sol: {layers.ground.filter((g) => g > 0).length} | Murs: {layers.walls.filter((g) => g > 0).length} | Decor: {layers.decor.filter((g) => g > 0).length} | Collisions: {collisions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/iso-dungeons"
              className="rounded border border-gray-700 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-400 hover:border-gray-500 hover:text-white"
            >
              Retour
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded border border-cyber-green/50 bg-cyber-green/10 px-4 py-1.5 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/20 disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
