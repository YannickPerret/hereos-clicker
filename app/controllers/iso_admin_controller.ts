import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import IsoDungeon from '#models/iso_dungeon'
import IsoDungeonRoom from '#models/iso_dungeon_room'
import IsoTileset from '#models/iso_tileset'
import IsoSprite from '#models/iso_sprite'
import IsoRoomEnemy from '#models/iso_room_enemy'
import Enemy from '#models/enemy'
import fs from 'node:fs/promises'

export default class IsoAdminController {
  /** Main admin page — manage dungeons, tilesets, sprites */
  async index({ inertia }: HttpContext) {
    const [dungeons, tilesets, sprites, enemies] = await Promise.all([
      IsoDungeon.query().preload('rooms', (q) => q.preload('enemies').orderBy('roomOrder', 'asc')).orderBy('sortOrder', 'asc'),
      IsoTileset.query().orderBy('name', 'asc'),
      IsoSprite.query().orderBy('name', 'asc'),
      Enemy.query().orderBy('name', 'asc'),
    ])

    return inertia.render('admin/iso-dungeons', {
      dungeons: dungeons.map((d) => ({
        ...d.serialize(),
        rooms: d.rooms.map((r) => ({
          ...r.serialize(),
          enemies: r.enemies.map((e) => e.serialize()),
        })),
      })),
      tilesets: tilesets.map((t) => t.serialize()),
      sprites: sprites.map((s) => s.serialize()),
      enemies: enemies.map((e) => ({ id: e.id, name: e.name, hp: e.hp, tier: e.tier })),
    })
  }

  // ── Tilesets ──

  async uploadTileset({ request, response, session }: HttpContext) {
    const file = request.file('image', { size: '5mb', extnames: ['png', 'jpg', 'webp'] })
    if (!file) {
      session.flash('errors', { message: 'Fichier image requis' })
      return response.redirect('/admin/iso-dungeons')
    }

    const key = String(request.input('key', '')).trim().toLowerCase().replace(/\s+/g, '_')
    const name = String(request.input('name', '')).trim()
    if (!key || !name) {
      session.flash('errors', { message: 'Cle et nom requis' })
      return response.redirect('/admin/iso-dungeons')
    }

    const fileName = `${key}_${cuid()}.${file.extname}`
    await file.move(app.publicPath('assets/maps/tilesets'), { name: fileName })

    await IsoTileset.create({
      key,
      name,
      imagePath: fileName,
      tileWidth: Math.max(1, Number(request.input('tileWidth', 64)) || 64),
      tileHeight: Math.max(1, Number(request.input('tileHeight', 32)) || 32),
      columns: Math.max(1, Number(request.input('columns', 8)) || 8),
      tileCount: Math.max(1, Number(request.input('tileCount', 64)) || 64),
      tilesetType: request.input('tilesetType') === 'orthogonal' ? 'orthogonal' : 'isometric',
    })

    session.flash('success', `Tileset "${name}" uploade`)
    return response.redirect('/admin/iso-dungeons')
  }

  async deleteTileset({ params, response, session }: HttpContext) {
    const tileset = await IsoTileset.findOrFail(params.id)
    try {
      await fs.unlink(app.publicPath(`assets/maps/tilesets/${tileset.imagePath}`))
    } catch {}
    await tileset.delete()
    session.flash('success', 'Tileset supprime')
    return response.redirect('/admin/iso-dungeons')
  }

  // ── Sprites ──

  async uploadSprite({ request, response, session }: HttpContext) {
    const file = request.file('image', { size: '5mb', extnames: ['png', 'jpg', 'webp'] })
    if (!file) {
      session.flash('errors', { message: 'Fichier image requis' })
      return response.redirect('/admin/iso-dungeons')
    }

    const key = String(request.input('key', '')).trim().toLowerCase().replace(/\s+/g, '_')
    const name = String(request.input('name', '')).trim()
    if (!key || !name) {
      session.flash('errors', { message: 'Cle et nom requis' })
      return response.redirect('/admin/iso-dungeons')
    }

    const fileName = `${key}_${cuid()}.${file.extname}`
    await file.move(app.publicPath('assets/sprites'), { name: fileName })

    await IsoSprite.create({
      key,
      name,
      imagePath: fileName,
      frameWidth: Math.max(1, Number(request.input('frameWidth', 64)) || 64),
      frameHeight: Math.max(1, Number(request.input('frameHeight', 64)) || 64),
      frameCount: Math.max(1, Number(request.input('frameCount', 1)) || 1),
      animationsJson: request.input('animationsJson') || null,
      spriteType: ['character', 'enemy', 'npc'].includes(request.input('spriteType')) ? request.input('spriteType') : 'character',
    })

    session.flash('success', `Sprite "${name}" uploade`)
    return response.redirect('/admin/iso-dungeons')
  }

  async deleteSprite({ params, response, session }: HttpContext) {
    const sprite = await IsoSprite.findOrFail(params.id)
    try {
      await fs.unlink(app.publicPath(`assets/sprites/${sprite.imagePath}`))
    } catch {}
    await sprite.delete()
    session.flash('success', 'Sprite supprime')
    return response.redirect('/admin/iso-dungeons')
  }

  // ── Dungeons ──

  async createDungeon({ request, response, session }: HttpContext) {
    const name = String(request.input('name', '')).trim()
    const slug = String(request.input('slug', '')).trim().toLowerCase().replace(/\s+/g, '-')
    if (!name || !slug) {
      session.flash('errors', { message: 'Nom et slug requis' })
      return response.redirect('/admin/iso-dungeons')
    }

    await IsoDungeon.create({
      name,
      slug,
      description: String(request.input('description', '')).trim(),
      minLevel: Math.max(1, Number(request.input('minLevel', 1)) || 1),
      maxPlayers: Math.max(1, Number(request.input('maxPlayers', 1)) || 1),
      icon: request.input('icon') || null,
      isActive: request.input('isActive') === 'true' || request.input('isActive') === true,
      sortOrder: Math.max(1, Number(request.input('sortOrder', 1)) || 1),
    })

    session.flash('success', `Donjon "${name}" cree`)
    return response.redirect('/admin/iso-dungeons')
  }

  async deleteDungeon({ params, response, session }: HttpContext) {
    const dungeon = await IsoDungeon.findOrFail(params.id)
    await dungeon.delete()
    session.flash('success', 'Donjon supprime')
    return response.redirect('/admin/iso-dungeons')
  }

  async toggleDungeon({ params, response, session }: HttpContext) {
    const dungeon = await IsoDungeon.findOrFail(params.id)
    dungeon.isActive = !dungeon.isActive
    await dungeon.save()
    session.flash('success', `Donjon "${dungeon.name}" ${dungeon.isActive ? 'active' : 'desactive'}`)
    return response.redirect('/admin/iso-dungeons')
  }

  // ── Rooms ──

  async createRoom({ request, response, session }: HttpContext) {
    const dungeonId = Number(request.input('dungeonId'))
    const dungeon = await IsoDungeon.findOrFail(dungeonId)

    const roomCount = await IsoDungeonRoom.query().where('dungeonId', dungeon.id).count('* as total')
    const nextOrder = Number(roomCount[0].$extras.total) + 1

    await IsoDungeonRoom.create({
      dungeonId: dungeon.id,
      name: String(request.input('name', `Salle ${nextOrder}`)).trim(),
      roomOrder: nextOrder,
      isBossRoom: request.input('isBossRoom') === 'true',
      width: Math.max(4, Number(request.input('width', 16)) || 16),
      height: Math.max(4, Number(request.input('height', 16)) || 16),
      tileWidth: Math.max(1, Number(request.input('tileWidth', 64)) || 64),
      tileHeight: Math.max(1, Number(request.input('tileHeight', 32)) || 32),
      tilesetKey: request.input('tilesetKey') || null,
      layerGround: request.input('layerGround') || null,
      layerWalls: request.input('layerWalls') || null,
      layerDecor: request.input('layerDecor') || null,
      collisions: request.input('collisions') || null,
      objectsJson: request.input('objectsJson') || null,
      spawnX: Number(request.input('spawnX', 0)) || 0,
      spawnY: Number(request.input('spawnY', 0)) || 0,
      exitX: request.input('exitX') !== '' ? Number(request.input('exitX')) : null,
      exitY: request.input('exitY') !== '' ? Number(request.input('exitY')) : null,
    })

    session.flash('success', 'Salle ajoutee')
    return response.redirect('/admin/iso-dungeons')
  }

  async updateRoom({ params, request, response, session }: HttpContext) {
    const room = await IsoDungeonRoom.findOrFail(params.id)

    room.merge({
      name: String(request.input('name', room.name)).trim(),
      isBossRoom: request.input('isBossRoom') === 'true',
      width: Math.max(4, Number(request.input('width', room.width)) || room.width),
      height: Math.max(4, Number(request.input('height', room.height)) || room.height),
      tilesetKey: request.input('tilesetKey') || room.tilesetKey,
      layerGround: request.input('layerGround') || room.layerGround,
      layerWalls: request.input('layerWalls') || room.layerWalls,
      layerDecor: request.input('layerDecor') || room.layerDecor,
      collisions: request.input('collisions') || room.collisions,
      objectsJson: request.input('objectsJson') || room.objectsJson,
      spawnX: Number(request.input('spawnX', room.spawnX)) || 0,
      spawnY: Number(request.input('spawnY', room.spawnY)) || 0,
      exitX: request.input('exitX') !== '' ? Number(request.input('exitX')) : null,
      exitY: request.input('exitY') !== '' ? Number(request.input('exitY')) : null,
    })
    await room.save()

    session.flash('success', 'Salle mise a jour')
    return response.redirect('/admin/iso-dungeons')
  }

  /** Import a Tiled JSON for a room */
  async importRoomTiled({ params, request, response, session }: HttpContext) {
    const room = await IsoDungeonRoom.findOrFail(params.id)
    const file = request.file('tiledJson', { size: '10mb', extnames: ['json', 'tmj'] })
    if (!file) {
      session.flash('errors', { message: 'Fichier JSON Tiled requis' })
      return response.redirect('/admin/iso-dungeons')
    }

    const tmpPath = file.tmpPath
    if (!tmpPath) {
      session.flash('errors', { message: 'Erreur upload' })
      return response.redirect('/admin/iso-dungeons')
    }

    const rawData = await fs.readFile(tmpPath, 'utf-8')
    const tiled = JSON.parse(rawData)

    const collisions: { x: number; y: number }[] = []
    let layerGround: number[] = []
    let layerWalls: number[] = []
    let layerDecor: number[] = []
    const objects: any[] = []

    for (const layer of tiled.layers || []) {
      if (layer.type === 'tilelayer') {
        const name = (layer.name || '').toLowerCase()
        if (name.includes('collision')) {
          (layer.data || []).forEach((gid: number, idx: number) => {
            if (gid > 0) collisions.push({ x: idx % tiled.width, y: Math.floor(idx / tiled.width) })
          })
        } else if (name.includes('wall') || name.includes('mur')) {
          layerWalls = layer.data || []
        } else if (name.includes('decor') || name.includes('above')) {
          layerDecor = layer.data || []
        } else {
          layerGround = layer.data || []
        }
      } else if (layer.type === 'objectgroup') {
        for (const obj of layer.objects || []) {
          const gridX = Math.floor((obj.x || 0) / (tiled.tilewidth || 64))
          const gridY = Math.floor((obj.y || 0) / (tiled.tileheight || 32))
          const metadata: any = {}
          if (obj.properties) obj.properties.forEach((p: any) => { metadata[p.name] = p.value })
          objects.push({ type: (obj.type || obj.name || 'unknown').toLowerCase(), x: gridX, y: gridY, name: obj.name, metadata })
        }
      }
    }

    room.merge({
      width: tiled.width || room.width,
      height: tiled.height || room.height,
      tileWidth: tiled.tilewidth || room.tileWidth,
      tileHeight: tiled.tileheight || room.tileHeight,
      layerGround: JSON.stringify(layerGround),
      layerWalls: JSON.stringify(layerWalls),
      layerDecor: JSON.stringify(layerDecor),
      collisions: JSON.stringify(collisions),
      objectsJson: JSON.stringify(objects),
    })

    // Extract spawn/exit from objects
    const spawn = objects.find((o) => o.type === 'spawn')
    const exit = objects.find((o) => o.type === 'exit' || o.type === 'portal')
    if (spawn) { room.spawnX = spawn.x; room.spawnY = spawn.y }
    if (exit) { room.exitX = exit.x; room.exitY = exit.y }

    await room.save()

    session.flash('success', `Map Tiled importee (${tiled.width}x${tiled.height}, ${collisions.length} collisions, ${objects.length} objets)`)
    return response.redirect('/admin/iso-dungeons')
  }

  async deleteRoom({ params, response, session }: HttpContext) {
    const room = await IsoDungeonRoom.findOrFail(params.id)
    await room.delete()
    session.flash('success', 'Salle supprimee')
    return response.redirect('/admin/iso-dungeons')
  }

  // ── Room Enemies ──

  async addRoomEnemy({ request, response, session }: HttpContext) {
    const roomId = Number(request.input('roomId'))
    const enemyId = Number(request.input('enemyId'))

    await IsoRoomEnemy.create({
      roomId,
      enemyId,
      spriteKey: request.input('spriteKey') || null,
      gridX: Number(request.input('gridX', 0)) || 0,
      gridY: Number(request.input('gridY', 0)) || 0,
      isBoss: request.input('isBoss') === 'true',
      blocksExit: request.input('blocksExit') === 'true',
    })

    session.flash('success', 'Ennemi place')
    return response.redirect('/admin/iso-dungeons')
  }

  async deleteRoomEnemy({ params, response, session }: HttpContext) {
    const enemy = await IsoRoomEnemy.findOrFail(params.id)
    await enemy.delete()
    session.flash('success', 'Ennemi retire')
    return response.redirect('/admin/iso-dungeons')
  }

  // ── Room Editor ──

  async editor({ params, inertia }: HttpContext) {
    const room = await IsoDungeonRoom.findOrFail(params.id)
    await room.load('dungeon')
    await room.load('enemies', (q) => q.preload('enemy'))

    let tileset = null
    if (room.tilesetKey) {
      tileset = await IsoTileset.findBy('key', room.tilesetKey)
    }

    return inertia.render('admin/iso-room-editor', {
      room: {
        ...room.serialize(),
        dungeon: room.dungeon.serialize(),
        enemies: room.enemies.map((e) => ({
          ...e.serialize(),
          enemyName: e.enemy?.name || `Ennemi #${e.enemyId}`,
        })),
      },
      tileset: tileset ? tileset.serialize() : null,
    })
  }

  async saveMap({ params, request, response, session }: HttpContext) {
    const room = await IsoDungeonRoom.findOrFail(params.id)

    room.merge({
      layerGround: request.input('layerGround') ?? room.layerGround,
      layerWalls: request.input('layerWalls') ?? room.layerWalls,
      layerDecor: request.input('layerDecor') ?? room.layerDecor,
      collisions: request.input('collisions') ?? room.collisions,
      objectsJson: request.input('objectsJson') ?? room.objectsJson,
      spawnX: Number(request.input('spawnX', room.spawnX)) || 0,
      spawnY: Number(request.input('spawnY', room.spawnY)) || 0,
      exitX: request.input('exitX') != null ? Number(request.input('exitX')) : room.exitX,
      exitY: request.input('exitY') != null ? Number(request.input('exitY')) : room.exitY,
    })
    await room.save()

    session.flash('success', 'Map sauvegardee')
    return response.redirect(`/admin/iso-rooms/${room.id}/editor`)
  }
}
