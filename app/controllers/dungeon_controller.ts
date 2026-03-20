import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import DungeonFloor from '#models/dungeon_floor'
import DungeonRun from '#models/dungeon_run'
import Enemy from '#models/enemy'
import InventoryItem from '#models/inventory_item'
import PartyMember from '#models/party_member'
import CombatService from '#services/combat_service'
import CharacterPvpSeasonStat from '#models/character_pvp_season_stat'
import SeasonService from '#services/season_service'

export default class DungeonController {
  private leaderboardPageSize = 25

  private isRunAccessError(error: unknown) {
    return error instanceof Error && error.message === 'Invalid run'
  }

  private isCharacterKoError(error: unknown) {
    return error instanceof Error && error.message === 'Ton personnage est KO'
  }

  private async getGlobalLeaderboardPage(offset: number, limit: number) {
    const rows = await Character.query()
      .orderBy('credits', 'desc')
      .orderBy('id', 'asc')
      .offset(offset)
      .limit(limit + 1)
      .select('id', 'name', 'credits', 'level', 'totalClicks')

    const hasMore = rows.length > limit
    const items = rows.slice(0, limit).map((player) => player.serialize())

    return {
      items,
      hasMore,
      nextOffset: offset + items.length,
    }
  }

  private async getPvpLeaderboardPage(offset: number, limit: number) {
    const activeSeason = await SeasonService.getCurrentRankedSeason()

    if (!activeSeason) {
      const rows = await Character.query()
        .orderBy('pvpRating', 'desc')
        .orderBy('id', 'asc')
        .offset(offset)
        .limit(limit + 1)
        .select('id', 'name', 'pvpRating', 'pvpWins', 'pvpLosses', 'level')

      const hasMore = rows.length > limit
      const items = rows.slice(0, limit).map((player) => player.serialize())

      return {
        items,
        hasMore,
        nextOffset: offset + items.length,
      }
    }

    const rows = await CharacterPvpSeasonStat.query()
      .where('seasonId', activeSeason.id)
      .preload('character')
      .orderBy('rating', 'desc')
      .orderBy('peakRating', 'desc')
      .orderBy('wins', 'desc')
      .orderBy('characterId', 'asc')
      .offset(offset)
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = rows.slice(0, limit).map((entry) => ({
      id: entry.character.id,
      name: entry.character.name,
      pvpRating: entry.rating,
      pvpWins: entry.wins,
      pvpLosses: entry.losses,
      level: entry.character.level,
    }))

    return {
      items,
      hasMore,
      nextOffset: offset + items.length,
    }
  }

  private async redirectAfterRunError(
    character: Character,
    runId: number,
    response: HttpContext['response'],
    session: HttpContext['session']
  ) {
    const run = await this.findAccessibleRun(character, runId)
    session.flash('errors', { message: 'Ce donjon n\'est plus actif.' })
    return response.redirect(run ? `/dungeon/run/${run.id}` : '/dungeon')
  }

  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const floors = await DungeonFloor.query().orderBy('floorNumber', 'asc')

    // Find active run: own or party
    let activeRun = await DungeonRun.query()
      .where('characterId', character.id)
      .where('status', 'in_progress')
      .first()

    if (!activeRun) {
      const membership = await PartyMember.query()
        .where('characterId', character.id)
        .whereHas('party', (q) => q.where('status', 'in_dungeon'))
        .first()
      if (membership) {
        activeRun = await DungeonRun.query()
          .where('partyId', membership.partyId)
          .where('status', 'in_progress')
          .first()
      }
    }

    return inertia.render('dungeon/index', {
      character: character.serialize(),
      floors: floors.map((f) => f.serialize()),
      activeRun: activeRun?.serialize() || null,
    })
  }

  async enter({ params, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const { run } = await CombatService.startRun(character, params.floorId)
      return response.redirect(`/dungeon/run/${run.id}`)
    } catch (e: any) {
      session.flash('errors', { message: e.message })
      return response.redirect('/dungeon')
    }
  }

  /** Helper: check if character can access this run (owner or party member) */
  private async findAccessibleRun(character: Character, runId: number) {
    // Try as owner first
    let run = await DungeonRun.query()
      .where('id', runId)
      .where('characterId', character.id)
      .preload('dungeonFloor')
      .first()

    if (!run) {
      // Try as party member
      run = await DungeonRun.query()
        .where('id', runId)
        .whereNotNull('partyId')
        .preload('dungeonFloor')
        .first()

      if (run) {
        const isMember = await PartyMember.query()
          .where('partyId', run.partyId!)
          .where('characterId', character.id)
          .first()
        if (!isMember) run = null
      }
    }

    return run
  }

  async show({ params, inertia, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const run = await this.findAccessibleRun(character, params.runId)
    if (!run) {
      session.flash('errors', { message: 'Donjon introuvable.' })
      return response.redirect('/dungeon')
    }

    let currentEnemy = null
    if (run.currentEnemyId) {
      currentEnemy = await Enemy.find(run.currentEnemyId)
    }

    const combatPreview = await CombatService.getCombatPreview(character, currentEnemy, run)

    const consumables = await InventoryItem.query()
      .where('characterId', character.id)
      .preload('item')
      .whereHas('item', (q) => q.where('type', 'consumable'))

    // Get combat skills
    const skills = await CombatService.getAvailableSkills(character)
    const cooldowns = JSON.parse(run.skillCooldowns || '{}')
    const charCooldowns = cooldowns[character.id] || {}
    const activeEffects = JSON.parse(run.activeEffects || '[]')

    return inertia.render('dungeon/run', {
      character: character.serialize(),
      run: run.serialize(),
      floor: run.dungeonFloor.serialize(),
      currentEnemy: currentEnemy?.serialize() || null,
      combatPreview,
      consumables: consumables.map((c) => ({ ...c.serialize(), item: c.item.serialize() })),
      skills: skills.map((s) => ({
        ...s.serialize(),
        currentCooldown: charCooldowns[s.id] || 0,
      })),
      activeEffects,
    })
  }

  async attack({ params, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const result = await CombatService.attack(character, params.runId)
      session.flash('combatLog', result.log)
    } catch (error) {
      if (this.isRunAccessError(error)) {
        return this.redirectAfterRunError(character, Number(params.runId), response, session)
      }
      if (this.isCharacterKoError(error)) {
        session.flash('errors', { message: 'Ton personnage est KO. Attends la fin du combat.' })
        return response.redirect(`/dungeon/run/${params.runId}`)
      }
      throw error
    }

    return response.redirect(`/dungeon/run/${params.runId}`)
  }

  async useSkill({ params, request, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const skillId = Number(request.input('skillId'))
      const result = await CombatService.useSkill(character, params.runId, skillId)
      session.flash('combatLog', result.log)
    } catch (e: any) {
      if (this.isRunAccessError(e)) {
        return this.redirectAfterRunError(character, Number(params.runId), response, session)
      }
      session.flash('errors', { message: e.message })
    }

    return response.redirect(`/dungeon/run/${params.runId}`)
  }

  async useItem({ params, request, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const inventoryItemId = request.input('inventoryItemId')
      await CombatService.useConsumable(character, params.runId, inventoryItemId)
    } catch (error) {
      if (this.isRunAccessError(error)) {
        return this.redirectAfterRunError(character, Number(params.runId), response, session)
      }
      if (this.isCharacterKoError(error)) {
        session.flash('errors', { message: 'Ton personnage est KO. Attends la fin du combat.' })
        return response.redirect(`/dungeon/run/${params.runId}`)
      }
      throw error
    }

    return response.redirect(`/dungeon/run/${params.runId}`)
  }

  async flee({ params, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    let result
    try {
      result = await CombatService.flee(character, params.runId)
    } catch (error) {
      if (this.isRunAccessError(error)) {
        return this.redirectAfterRunError(character, Number(params.runId), response, session)
      }
      if (this.isCharacterKoError(error)) {
        session.flash('errors', { message: 'Ton personnage est KO. Attends la fin du combat.' })
        return response.redirect(`/dungeon/run/${params.runId}`)
      }
      throw error
    }

    return response.redirect(result.run.partyId ? '/party' : '/dungeon')
  }

  /** JSON API: poll run state for party members */
  async runState({ params, auth, response }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const run = await this.findAccessibleRun(character, params.runId)
    if (!run) return response.notFound({ error: 'Run introuvable' })

    // Handle auto-attack timeout for group runs
    if (run.partyId && run.status === 'in_progress' && run.currentTurnId && run.turnDeadline) {
      if (Date.now() > run.turnDeadline) {
        const timedOutChar = await Character.findOrFail(run.currentTurnId)
        await CombatService.performAutoAttackPublic(timedOutChar, run)
      }
    }

    let currentEnemy = null
    if (run.currentEnemyId) {
      currentEnemy = await Enemy.find(run.currentEnemyId)
    }

    const combatPreview = await CombatService.getCombatPreview(character, currentEnemy, run)

    // Get party members info for turn display
    let partyMembers: any[] = []
    if (run.partyId) {
      const members = await PartyMember.query()
        .where('partyId', run.partyId)
        .preload('character')
      partyMembers = members.map((m) => ({
        id: m.character.id,
        name: m.character.name,
        level: m.character.level,
        hpCurrent: m.character.hpCurrent,
        hpMax: m.character.hpMax,
      }))
    }

    return response.json({
      character: character.serialize(),
      run: {
        ...run.serialize(),
        combatLog: JSON.parse(run.combatLog || '[]'),
      },
      currentEnemy: currentEnemy?.serialize() || null,
      combatPreview,
      partyMembers,
    })
  }

  async leaderboard({ inertia }: HttpContext) {
    const globalLeaderboard = await this.getGlobalLeaderboardPage(0, this.leaderboardPageSize)
    const pvpLeaderboard = await this.getPvpLeaderboardPage(0, this.leaderboardPageSize)

    return inertia.render('leaderboard/index', {
      players: globalLeaderboard.items,
      playersHasMore: globalLeaderboard.hasMore,
      playersNextOffset: globalLeaderboard.nextOffset,
      pvpRankings: pvpLeaderboard.items,
      pvpHasMore: pvpLeaderboard.hasMore,
      pvpNextOffset: pvpLeaderboard.nextOffset,
    })
  }

  async leaderboardState({ request, response }: HttpContext) {
    const board = request.input('board', 'global')
    const offset = Math.max(0, Number(request.input('offset', 0)) || 0)
    const limit = Math.max(1, Math.min(100, Number(request.input('limit', this.leaderboardPageSize)) || this.leaderboardPageSize))

    if (board === 'pvp') {
      return response.json(await this.getPvpLeaderboardPage(offset, limit))
    }

    return response.json(await this.getGlobalLeaderboardPage(offset, limit))
  }
}
