import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import DailyMissionService from '#services/daily_mission_service'

export default class MissionController {
  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const missions = await DailyMissionService.ensureDailyMissions(character.id)

    // Reload with dailyMission relation
    const loaded = []
    for (const cm of missions) {
      await cm.load('dailyMission')
      loaded.push({
        id: cm.id,
        progress: cm.progress,
        completed: cm.completed,
        claimed: cm.claimed,
        mission: {
          name: cm.dailyMission.name,
          description: cm.dailyMission.description,
          type: cm.dailyMission.type,
          targetValue: cm.dailyMission.targetValue,
          rewardType: cm.dailyMission.rewardType,
          rewardValue: cm.dailyMission.rewardValue,
          icon: cm.dailyMission.icon,
        },
      })
    }

    return inertia.render('missions/index', {
      character: character.serialize(),
      missions: loaded,
    })
  }

  async claim({ params, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const result = await DailyMissionService.claimReward(character.id, params.missionId)
      session.flash('success', `Recompense recue: +${result.rewardValue} ${result.rewardType}`)
    } catch {
      session.flash('errors', { message: 'Impossible de reclamer cette recompense' })
    }

    return response.redirect('/missions')
  }
}
