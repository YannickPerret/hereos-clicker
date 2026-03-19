import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import PvpMatch from '#models/pvp_match'
import PvpService from '#services/pvp_service'
import DailyMissionService from '#services/daily_mission_service'

export default class PvpController {
  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    // Check if already in an active match
    const activeMatch = await PvpMatch.query()
      .where((q) => {
        q.where('challengerId', character.id).orWhere('defenderId', character.id)
      })
      .whereIn('status', ['waiting', 'in_progress'])
      .first()

    const recentMatches = await PvpMatch.query()
      .where('status', 'completed')
      .where((q) => {
        q.where('challengerId', character.id).orWhere('defenderId', character.id)
      })
      .orderBy('createdAt', 'desc')
      .limit(10)

    const matchData = []
    for (const match of recentMatches) {
      const challenger = await Character.find(match.challengerId)
      const defender = match.defenderId ? await Character.find(match.defenderId) : null
      matchData.push({
        id: match.id,
        challengerName: challenger?.name || '???',
        defenderName: defender?.name || '???',
        isWin: match.winnerId === character.id,
        ratingChange: match.ratingChange,
      })
    }

    const rankings = await Character.query()
      .orderBy('pvpRating', 'desc')
      .limit(20)
      .select('id', 'name', 'pvpRating', 'pvpWins', 'pvpLosses', 'level')

    return inertia.render('pvp/index', {
      character: character.serialize(),
      activeMatchId: activeMatch?.id || null,
      recentMatches: matchData,
      rankings: rankings.map((r) => r.serialize()),
    })
  }

  async queue({ auth, response }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const match = await PvpService.joinQueue(character)

    if (match.status === 'in_progress') {
      return response.redirect(`/pvp/match/${match.id}`)
    }

    // Still waiting
    return response.redirect(`/pvp/match/${match.id}`)
  }

  async leaveQueue({ auth, response }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    await PvpService.leaveQueue(character)
    return response.redirect('/pvp')
  }

  async show({ params, inertia, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const state = await PvpService.getMatchState(params.matchId)

    return inertia.render('pvp/match', {
      myId: character.id,
      ...state,
    })
  }

  /** JSON API for polling match state */
  async state({ params, response }: HttpContext) {
    const state = await PvpService.getMatchState(params.matchId)
    return response.json(state)
  }

  async attack({ params, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const result = await PvpService.attack(character, params.matchId)

      if (result.match.status === 'completed' && result.match.winnerId === character.id) {
        await DailyMissionService.trackProgress(character.id, 'pvp_win')
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
