import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import InventoryItem from '#models/inventory_item'
import BossRushRun from '#models/boss_rush_run'
import BossRushService from '#services/boss_rush_service'
import SeasonService from '#services/season_service'
import CompanionService from '#services/companion_service'
import ActiveActivityService from '#services/active_activity_service'
import { localize } from '#services/locale_service'

export default class BossRushController {
  private async getCharacter(ctx: HttpContext) {
    return Character.query().where('userId', ctx.auth.user!.id).firstOrFail()
  }

  private isRunAccessError(error: unknown) {
    return error instanceof Error && error.message === 'Invalid run'
  }

  private async buildRunPagePayload(character: Character, run: BossRushRun, locale: string) {
    const enemyState = await BossRushService.getCurrentEnemyState(run)
    const combatPreview = await BossRushService.getCombatPreview(character, run)
    const consumables = await InventoryItem.query()
      .where('characterId', character.id)
      .preload('item')
      .whereHas('item', (query) => query.where('type', 'consumable').where('usableInCombat', true))
    const skills = await BossRushService.getAvailableSkills(character)
    const cooldowns = JSON.parse(run.skillCooldowns || '{}')
    const charCooldowns = cooldowns[character.id] || {}
    const activeEffects = JSON.parse(run.activeEffects || '[]')
    const companionBonuses = await CompanionService.getActiveBonuses(character.id)
    const activeSeason = await SeasonService.getCurrentBossRushSeason()

    return {
      character: {
        ...character.serialize(),
        hpMax: character.hpMax + companionBonuses.hpBonus,
        critChance: Math.min(100, character.critChance + companionBonuses.critChanceBonus),
      },
      run: run.serialize(),
      season: activeSeason ? SeasonService.serializeSummary(activeSeason) : null,
      currentEnemy: {
        ...localize(enemyState.enemy.serialize(), locale, ['name', 'description']),
        hp: enemyState.scaled.hp,
        attack: enemyState.scaled.attack,
        defense: enemyState.scaled.defense,
        critChance: enemyState.scaled.critChance,
        critDamage: enemyState.scaled.critDamage,
      },
      combatPreview,
      consumables: consumables.map((entry) => ({
        ...entry.serialize(),
        item: localize(entry.item.serialize(), locale, ['name', 'description']),
      })),
      pendingRewards: BossRushService.getPendingRewardsForCharacter(run, character.id),
      skills: skills.map((skill) => ({
        ...localize(skill.serialize(), locale, ['name', 'description']),
        currentCooldown: charCooldowns[skill.id] || 0,
      })),
      activeEffects,
    }
  }

  async index({ inertia, locale, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const activeSeason = await SeasonService.getCurrentBossRushSeason()
    const activeRun = await BossRushService.getActiveRun(character.id)
    const currentSeasonStat = activeSeason
      ? await SeasonService.getOrCreateBossRushSeasonStat(character, activeSeason)
      : null
    const currentSeasonRank = currentSeasonStat
      ? await BossRushService.getSeasonRank(currentSeasonStat)
      : null
    const leaderboard = activeSeason ? await BossRushService.getLeaderboard(activeSeason.id, 10) : []
    const seasonHistory = await BossRushService.getSeasonHistory(character.id)

    return inertia.render('boss_rush/index', {
      character: character.serialize(),
      season: activeSeason ? SeasonService.serializeSummary(activeSeason) : null,
      activeRun: activeRun?.serialize() || null,
      currentSeason: currentSeasonStat && activeSeason
        ? {
            id: currentSeasonStat.id,
            seasonId: activeSeason.id,
            seasonName: locale === 'en' ? activeSeason.nameEn || activeSeason.name : activeSeason.name,
            bestFloor: currentSeasonStat.bestFloor,
            runsPlayed: currentSeasonStat.runsPlayed,
            totalBossesKilled: currentSeasonStat.totalBossesKilled,
            rank: currentSeasonRank,
          }
        : null,
      seasonHistory: seasonHistory.map((entry) => ({
        id: entry.id,
        seasonId: entry.seasonId,
        seasonName: locale === 'en' ? entry.season.nameEn || entry.season.name : entry.season.name,
        seasonStatus: entry.season.status,
        bestFloor: entry.bestFloor,
        runsPlayed: entry.runsPlayed,
        totalBossesKilled: entry.totalBossesKilled,
        finalRank: entry.finalRank,
        rewardCredits: entry.rewardCredits,
        rewardTier: entry.rewardTier,
        rewardClaimed: entry.rewardClaimed,
      })),
      leaderboard,
    })
  }

  async start({ response, session, locale, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const activeActivity = await ActiveActivityService.getForCharacter(character.id)

    if (activeActivity && activeActivity.mode !== 'boss_rush') {
      session.flash('errors', {
        message:
          locale === 'en'
            ? 'Another activity is already in progress. Use the banner to return to it.'
            : 'Une autre activite est deja en cours. Utilise la banniere pour y retourner.',
      })
      return response.redirect('/boss-rush')
    }

    try {
      const run = await BossRushService.startRun(character)
      return response.redirect(`/boss-rush/run/${run.id}`)
    } catch (error) {
      session.flash('errors', {
        message:
          error instanceof Error && error.message === 'Boss Rush is disabled for the active season'
            ? locale === 'en'
              ? 'Boss Rush is disabled for the active season'
              : 'Le Boss Rush est desactive pour la saison active'
            : error instanceof Error
              ? error.message
              : 'Boss Rush unavailable',
      })
      return response.redirect('/boss-rush')
    }
  }

  async show(ctx: HttpContext) {
    const character = await this.getCharacter(ctx)
    const run = await BossRushRun.query()
      .where('id', ctx.params.runId)
      .where('characterId', character.id)
      .first()

    if (!run) {
      ctx.session.flash('errors', { message: ctx.locale === 'en' ? 'Run not found' : 'Run introuvable' })
      return ctx.response.redirect('/boss-rush')
    }

    return ctx.inertia.render('boss_rush/run', await this.buildRunPagePayload(character, run, ctx.locale))
  }

  async state({ params, auth, response, locale }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const run = await BossRushRun.query()
      .where('id', params.runId)
      .where('characterId', character.id)
      .first()

    if (!run) return response.notFound({ error: locale === 'en' ? 'Run not found' : 'Run introuvable' })

    return response.json(await this.buildRunPagePayload(character, run, locale))
  }

  async attack({ params, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    try {
      const result = await BossRushService.attack(character, Number(params.runId))
      session.flash('combatLog', result.log)
    } catch (error) {
      if (this.isRunAccessError(error)) {
        session.flash('errors', { message: 'Run introuvable' })
        return response.redirect('/boss-rush')
      }
      session.flash('errors', { message: error instanceof Error ? error.message : 'Action impossible' })
    }

    return response.redirect(`/boss-rush/run/${params.runId}`)
  }

  async useSkill({ params, request, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    try {
      const result = await BossRushService.useSkill(character, Number(params.runId), Number(request.input('skillId')))
      session.flash('combatLog', result.log)
    } catch (error) {
      if (this.isRunAccessError(error)) {
        session.flash('errors', { message: 'Run introuvable' })
        return response.redirect('/boss-rush')
      }
      session.flash('errors', { message: error instanceof Error ? error.message : 'Action impossible' })
    }

    return response.redirect(`/boss-rush/run/${params.runId}`)
  }

  async useItem({ params, request, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    try {
      const result = await BossRushService.useConsumable(character, Number(params.runId), Number(request.input('inventoryItemId')))
      session.flash('combatLog', result.log)
    } catch (error) {
      if (this.isRunAccessError(error)) {
        session.flash('errors', { message: 'Run introuvable' })
        return response.redirect('/boss-rush')
      }
      session.flash('errors', { message: error instanceof Error ? error.message : 'Action impossible' })
    }

    return response.redirect(`/boss-rush/run/${params.runId}`)
  }

  async flee({ params, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    try {
      await BossRushService.flee(character, Number(params.runId))
    } catch (error) {
      if (this.isRunAccessError(error)) {
        session.flash('errors', { message: 'Run introuvable' })
        return response.redirect('/boss-rush')
      }
      session.flash('errors', { message: error instanceof Error ? error.message : 'Action impossible' })
    }

    return response.redirect(`/boss-rush/run/${params.runId}`)
  }

  async claimSeasonReward({ params, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    try {
      const stat = await BossRushService.claimSeasonReward(character, Number(params.statId))
      session.flash('success', `Recompense de saison recuperee: +${stat.rewardCredits} credits`)
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Impossible de recuperer la recompense',
      })
    }

    return response.redirect('/boss-rush')
  }
}
