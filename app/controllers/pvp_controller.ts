import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import PvpMatchParticipant from '#models/pvp_match_participant'
import CombatService from '#services/combat_service'
import ClickerService from '#services/clicker_service'
import PvpService from '#services/pvp_service'
import DailyMissionService from '#services/daily_mission_service'
import SeasonService from '#services/season_service'
import CharacterPvpSeasonStat from '#models/character_pvp_season_stat'
import { localize } from '#services/locale_service'

export default class PvpController {
  private async serializeArenaCharacter(character: Character) {
    const equipBonuses = await ClickerService.calculateEquipBonuses(character)

    return {
      ...character.serialize(),
      attack: character.attack + equipBonuses.attackBonus,
      defense: character.defense + equipBonuses.defenseBonus,
      hpMax: character.hpMax + equipBonuses.hpBonus,
      critChance: Math.min(100, character.critChance + equipBonuses.critChanceBonus),
    }
  }

  private async getSeasonRank(stat: CharacterPvpSeasonStat) {
    const ahead = await CharacterPvpSeasonStat.query()
      .where('seasonId', stat.seasonId)
      .where((query) => {
        query
          .where('rating', '>', stat.rating)
          .orWhere((subquery) => {
            subquery.where('rating', stat.rating).where('peakRating', '>', stat.peakRating)
          })
          .orWhere((subquery) => {
            subquery.where('rating', stat.rating).where('peakRating', stat.peakRating).where('wins', '>', stat.wins)
          })
          .orWhere((subquery) => {
            subquery
              .where('rating', stat.rating)
              .where('peakRating', stat.peakRating)
              .where('wins', stat.wins)
              .where('characterId', '<', stat.characterId)
          })
      })
      .count('* as total')

    return Number(ahead[0]?.$extras.total || 0) + 1
  }

  private async buildMatchPayload(character: Character, matchId: number, locale: string) {
    const state = await PvpService.getMatchState(matchId)
    const skills = await CombatService.getAvailableSkills(character)
    const cooldowns = state.match.skillCooldowns?.[character.id] || {}

    return {
      myId: character.id,
      ...state,
      skills: skills.map((skill) => ({
        ...localize(skill.serialize(), locale, ['name', 'description']),
        currentCooldown: cooldowns[skill.id] || 0,
      })),
    }
  }

  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const activeSeason = await SeasonService.getCurrentRankedSeason()
    const currentSeasonStat = activeSeason
      ? await SeasonService.getOrCreatePvpSeasonStat(character, activeSeason)
      : null
    const currentSeasonRank = currentSeasonStat ? await this.getSeasonRank(currentSeasonStat) : null

    if (currentSeasonStat && character.pvpRating !== currentSeasonStat.rating) {
      character.pvpRating = currentSeasonStat.rating
      await character.save()
    }

    const activeParticipant = await PvpMatchParticipant.query()
      .where('characterId', character.id)
      .whereHas('match', (q) => q.whereIn('status', ['waiting', 'in_progress']))
      .preload('match')
      .orderBy('id', 'desc')
      .first()
    const activeMatch = activeParticipant?.match || null

    console.log('[pvp.index]', {
      userId: auth.user?.id,
      characterId: character.id,
      activeParticipantId: activeParticipant?.id ?? null,
      activeMatchId: activeMatch?.id ?? null,
      activeMatchStatus: activeMatch?.status ?? null,
    })

    const recentParticipants = await PvpMatchParticipant.query()
      .where('characterId', character.id)
      .whereHas('match', (q) => q.where('status', 'completed'))
      .preload('match')
      .orderBy('id', 'desc')
      .limit(10)

    const matchData = []
    for (const entry of recentParticipants) {
      const match = entry.match
      const challenger = await Character.find(match.challengerId)
      const defender = match.defenderId ? await Character.find(match.defenderId) : null
      matchData.push({
        id: match.id,
        challengerName: challenger?.name || '???',
        defenderName: defender?.name || '???',
        isWin: match.winnerTeam === entry.team,
        ratingChange: match.ratingChange,
        queueMode: match.queueMode,
      })
    }

    const queueOverview = await PvpService.getQueueOverview(character)
    const seasonHistory = await CharacterPvpSeasonStat.query()
      .where('characterId', character.id)
      .preload('season')
      .orderBy('id', 'desc')
      .limit(8)

    return inertia.render('pvp/index', {
      character: await this.serializeArenaCharacter(character),
      activeMatch: activeMatch
        ? {
            id: activeMatch.id,
            status: activeMatch.status,
            queueMode: activeMatch.queueMode,
            teamSize: activeMatch.teamSize,
          }
        : null,
      recentMatches: matchData,
      queueOverview,
      currentSeason: currentSeasonStat && activeSeason
        ? {
            id: currentSeasonStat.id,
            seasonId: activeSeason.id,
            seasonName: activeSeason.name,
            rating: currentSeasonStat.rating,
            peakRating: currentSeasonStat.peakRating,
            wins: currentSeasonStat.wins,
            losses: currentSeasonStat.losses,
            gamesPlayed: currentSeasonStat.gamesPlayed,
            rank: currentSeasonRank,
          }
        : null,
      seasonHistory: seasonHistory.map((entry) => ({
        id: entry.id,
        seasonId: entry.seasonId,
        seasonName: entry.season.name,
        seasonStatus: entry.season.status,
        rating: entry.rating,
        peakRating: entry.peakRating,
        wins: entry.wins,
        losses: entry.losses,
        gamesPlayed: entry.gamesPlayed,
        finalRank: entry.finalRank,
        rewardCredits: entry.rewardCredits,
        rewardTier: entry.rewardTier,
        rewardClaimed: entry.rewardClaimed,
      })),
    })
  }

  async queue({ request, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const mode = request.input('mode', 'solo')
      const match = await PvpService.joinQueue(character, mode)

      console.log('[pvp.queue]', {
        userId: auth.user?.id,
        characterId: character.id,
        mode,
        matchId: match.id,
        status: match.status,
        queueMode: match.queueMode,
        teamSize: match.teamSize,
      })

      if (match.status === 'in_progress') {
        return response.redirect(`/pvp/match/${match.id}`)
      }

      return response.redirect('/pvp')
    } catch (error) {
      console.error('[pvp.queue.error]', {
        userId: auth.user?.id,
        characterId: character.id,
        error: error instanceof Error ? error.message : error,
      })
      session.flash('errors', { message: error instanceof Error ? error.message : 'Impossible de rejoindre la file PvP' })
      return response.redirect('/pvp')
    }
  }

  async claimSeasonReward({ params, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const stat = await SeasonService.claimSeasonReward(character, Number(params.statId))
      session.flash('success', `Recompense de saison recuperee: +${stat.rewardCredits} credits`)
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Impossible de recuperer la recompense',
      })
    }

    return response.redirect('/pvp')
  }

  async leaveQueue({ auth, response }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    await PvpService.leaveQueue(character)
    return response.redirect('/pvp')
  }

  async show({ params, inertia, auth, locale }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    return inertia.render('pvp/match', await this.buildMatchPayload(character, params.matchId, locale))
  }

  /** JSON API for polling match state */
  async state({ params, auth, response, locale }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    return response.json(await this.buildMatchPayload(character, params.matchId, locale))
  }

  async attack({ params, request, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const result = await PvpService.attack(character, params.matchId, request.input('targetId'))

      if (result.match.status === 'completed' && result.match.winnerTeam) {
        const participant = await PvpMatchParticipant.query()
          .where('matchId', result.match.id)
          .where('characterId', character.id)
          .first()

        if (participant && participant.team === result.match.winnerTeam) {
          await DailyMissionService.trackProgress(character.id, 'pvp_win')
        }
      }
    } catch (e: any) {
      session.flash('errors', { message: e.message })
    }

    return response.redirect(`/pvp/match/${params.matchId}`)
  }

  async useSkill({ params, request, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const skillId = Number(request.input('skillId'))
      const result = await PvpService.useSkill(character, params.matchId, skillId, request.input('targetId'))

      if (result.match.status === 'completed' && result.match.winnerTeam) {
        const participant = await PvpMatchParticipant.query()
          .where('matchId', result.match.id)
          .where('characterId', character.id)
          .first()

        if (participant && participant.team === result.match.winnerTeam) {
          await DailyMissionService.trackProgress(character.id, 'pvp_win')
        }
      }
    } catch (e: any) {
      session.flash('errors', { message: e.message })
    }

    return response.redirect(`/pvp/match/${params.matchId}`)
  }

  async forfeit({ params, auth, response }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    await PvpService.forfeit(character, params.matchId)
    return response.redirect('/pvp')
  }
}
