import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import IsoDungeon from '#models/iso_dungeon'
import IsoDungeonRoom from '#models/iso_dungeon_room'
import IsoDungeonRun from '#models/iso_dungeon_run'
import IsoTileset from '#models/iso_tileset'
import IsoSprite from '#models/iso_sprite'
import { localize } from '#services/locale_service'

export default class IsoDungeonController {
  /** List available iso dungeons */
  async index({ inertia, auth, locale }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const dungeons = await IsoDungeon.query()
      .where('isActive', true)
      .preload('rooms')
      .orderBy('sortOrder', 'asc')

    // Check for active run
    const activeRun = await IsoDungeonRun.query()
      .where('characterId', character.id)
      .where('status', 'in_progress')
      .preload('dungeon')
      .first()

    return inertia.render('iso-dungeon/index', {
      character: character.serialize(),
      dungeons: dungeons.map((d) => ({
        ...localize(d.serialize(), locale, ['name', 'description']),
        roomCount: d.rooms.length,
      })),
      activeRun: activeRun
        ? {
            id: activeRun.id,
            dungeonId: activeRun.dungeonId,
            dungeonName: localize(activeRun.dungeon.serialize(), locale, ['name']).name,
          }
        : null,
    })
  }

  /** Enter a dungeon — create a run */
  async enter({ params, response, auth, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const dungeon = await IsoDungeon.findOrFail(params.dungeonId)

    if (character.level < dungeon.minLevel) {
      session.flash('errors', { message: `Niveau ${dungeon.minLevel} requis` })
      return response.redirect('/iso-dungeon')
    }

    // Check no active run
    const existing = await IsoDungeonRun.query()
      .where('characterId', character.id)
      .where('status', 'in_progress')
      .first()
    if (existing) {
      return response.redirect(`/iso-dungeon/run/${existing.id}`)
    }

    const firstRoom = await IsoDungeonRoom.query()
      .where('dungeonId', dungeon.id)
      .orderBy('roomOrder', 'asc')
      .firstOrFail()

    const run = await IsoDungeonRun.create({
      dungeonId: dungeon.id,
      characterId: character.id,
      currentRoomOrder: firstRoom.roomOrder,
      playerX: firstRoom.spawnX,
      playerY: firstRoom.spawnY,
      status: 'in_progress',
      defeatedEnemiesJson: '[]',
      combatLogJson: '[]',
    })

    return response.redirect(`/iso-dungeon/run/${run.id}`)
  }

  /** Main game view — Phaser loads here */
  async show({ params, inertia, auth, locale }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const run = await IsoDungeonRun.query()
      .where('id', params.runId)
      .where('characterId', character.id)
      .preload('dungeon', (q) => q.preload('rooms', (rq) => rq.preload('enemies', (eq) => eq.preload('enemy'))))
      .firstOrFail()

    const currentRoom = run.dungeon.rooms.find((r) => r.roomOrder === run.currentRoomOrder)
    if (!currentRoom) throw new Error('Room not found')

    // Load tileset data
    const tilesets = await IsoTileset.query()
    const sprites = await IsoSprite.query()

    return inertia.render('iso-dungeon/run', {
      character: character.serialize(),
      run: {
        id: run.id,
        status: run.status,
        currentRoomOrder: run.currentRoomOrder,
        playerX: run.playerX,
        playerY: run.playerY,
        defeatedEnemies: run.defeatedEnemies,
      },
      dungeon: {
        id: run.dungeon.id,
        name: localize(run.dungeon.serialize(), locale, ['name']).name,
        totalRooms: run.dungeon.rooms.length,
      },
      room: {
        id: currentRoom.id,
        name: currentRoom.name,
        width: currentRoom.width,
        height: currentRoom.height,
        tileWidth: currentRoom.tileWidth,
        tileHeight: currentRoom.tileHeight,
        tilesetKey: currentRoom.tilesetKey,
        layerGround: currentRoom.layerGround ? JSON.parse(currentRoom.layerGround) : [],
        layerWalls: currentRoom.layerWalls ? JSON.parse(currentRoom.layerWalls) : [],
        layerDecor: currentRoom.layerDecor ? JSON.parse(currentRoom.layerDecor) : [],
        collisions: currentRoom.collisions ? JSON.parse(currentRoom.collisions) : [],
        objects: currentRoom.objectsJson ? JSON.parse(currentRoom.objectsJson) : [],
        spawnX: currentRoom.spawnX,
        spawnY: currentRoom.spawnY,
        exitX: currentRoom.exitX,
        exitY: currentRoom.exitY,
        isBossRoom: currentRoom.isBossRoom,
        enemies: currentRoom.enemies
          .filter((e) => !run.defeatedEnemies.includes(e.id))
          .map((e) => ({
            id: e.id,
            enemyId: e.enemyId,
            name: e.enemy.name,
            hp: e.enemy.hp,
            spriteKey: e.spriteKey,
            gridX: e.gridX,
            gridY: e.gridY,
            isBoss: e.isBoss,
            blocksExit: e.blocksExit,
          })),
      },
      tilesets: tilesets.map((t) => ({
        key: t.key,
        imagePath: t.imagePath,
        tileWidth: t.tileWidth,
        tileHeight: t.tileHeight,
        columns: t.columns,
        tileCount: t.tileCount,
        tilesetType: t.tilesetType,
      })),
      sprites: sprites.map((s) => ({
        key: s.key,
        imagePath: s.imagePath,
        frameWidth: s.frameWidth,
        frameHeight: s.frameHeight,
        frameCount: s.frameCount,
        animations: s.animationsJson ? JSON.parse(s.animationsJson) : null,
        spriteType: s.spriteType,
      })),
    })
  }

  /** Move player on the iso grid */
  async move({ params, request, response, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const run = await IsoDungeonRun.query()
      .where('id', params.runId)
      .where('characterId', character.id)
      .where('status', 'in_progress')
      .firstOrFail()

    const { x, y } = request.only(['x', 'y'])
    run.playerX = x
    run.playerY = y
    await run.save()

    return response.json({ status: 'moved', x, y })
  }

  /** Engage combat with an enemy on the grid */
  async engage({ params, request, response, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const run = await IsoDungeonRun.query()
      .where('id', params.runId)
      .where('characterId', character.id)
      .where('status', 'in_progress')
      .preload('dungeon', (q) => q.preload('rooms', (rq) => rq.preload('enemies', (eq) => eq.preload('enemy'))))
      .firstOrFail()

    const roomEnemyId = Number(request.input('roomEnemyId'))
    const currentRoom = run.dungeon.rooms.find((r) => r.roomOrder === run.currentRoomOrder)
    if (!currentRoom) return response.badRequest({ error: 'Room not found' })

    const roomEnemy = currentRoom.enemies.find((e) => e.id === roomEnemyId)
    if (!roomEnemy) return response.badRequest({ error: 'Enemy not found' })

    // Mark as defeated (combat is resolved via existing turn-based system)
    const defeated = run.defeatedEnemies
    defeated.push(roomEnemyId)
    run.defeatedEnemiesJson = JSON.stringify(defeated)
    await run.save()

    return response.json({
      status: 'defeated',
      roomEnemyId,
      enemyName: roomEnemy.enemy.name,
      xpReward: roomEnemy.enemy.xpReward,
      creditsMin: roomEnemy.enemy.creditsRewardMin,
      creditsMax: roomEnemy.enemy.creditsRewardMax,
    })
  }

  /** Move to next room */
  async nextRoom({ params, response, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const run = await IsoDungeonRun.query()
      .where('id', params.runId)
      .where('characterId', character.id)
      .where('status', 'in_progress')
      .preload('dungeon', (q) => q.preload('rooms', (rq) => rq.preload('enemies')))
      .firstOrFail()

    const currentRoom = run.dungeon.rooms.find((r) => r.roomOrder === run.currentRoomOrder)
    if (!currentRoom) return response.badRequest({ error: 'Room not found' })

    // Check all blocking enemies defeated
    const blockingEnemies = currentRoom.enemies.filter((e) => e.blocksExit)
    const allBlockersDefeated = blockingEnemies.every((e) => run.defeatedEnemies.includes(e.id))
    if (!allBlockersDefeated) {
      return response.json({ status: 'blocked', message: 'Des ennemis bloquent la sortie' })
    }

    const nextRoom = run.dungeon.rooms.find((r) => r.roomOrder === run.currentRoomOrder + 1)
    if (!nextRoom) {
      // Dungeon complete!
      run.status = 'victory'
      await run.save()
      return response.json({ status: 'victory' })
    }

    run.currentRoomOrder = nextRoom.roomOrder
    run.playerX = nextRoom.spawnX
    run.playerY = nextRoom.spawnY
    await run.save()

    return response.json({ status: 'next_room', roomOrder: nextRoom.roomOrder })
  }

  /** Flee dungeon */
  async flee({ params, response, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const run = await IsoDungeonRun.query()
      .where('id', params.runId)
      .where('characterId', character.id)
      .where('status', 'in_progress')
      .firstOrFail()

    run.status = 'fled'
    await run.save()

    return response.redirect('/iso-dungeon')
  }

  /** JSON state for polling */
  async state({ params, response, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const run = await IsoDungeonRun.query()
      .where('id', params.runId)
      .where('characterId', character.id)
      .firstOrFail()

    return response.json({
      status: run.status,
      currentRoomOrder: run.currentRoomOrder,
      playerX: run.playerX,
      playerY: run.playerY,
      defeatedEnemies: run.defeatedEnemies,
    })
  }
}
