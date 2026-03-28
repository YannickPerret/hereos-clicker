import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import DailyMissionService from '#services/daily_mission_service'
import DailyRewardService from '#services/daily_reward_service'
export default class MissionController {
  async index({ inertia, auth, locale }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const missions = await DailyMissionService.ensureDailyMissions(character.id)
    const missionReset = await DailyMissionService.getResetStatus(character)
    let dailyReward = null

    try {
      dailyReward = await DailyRewardService.getStatus(character.id)
    } catch {
      dailyReward = null
    }

    // Reload with dailyMission relation
    const loaded = []
    for (const cm of missions) {
      await cm.load('dailyMission')
      const missionName = locale === 'en' && cm.dailyMission.nameEn ? cm.dailyMission.nameEn : cm.dailyMission.name
      const missionDescription = locale === 'en' && cm.dailyMission.descriptionEn ? cm.dailyMission.descriptionEn : cm.dailyMission.description
      loaded.push({
        id: cm.id,
        progress: cm.progress,
        completed: cm.completed,
        claimed: cm.claimed,
        mission: {
          name: missionName,
          description: missionDescription,
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
      missionReset,
      dailyReward,
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

  async claimDailyReward({ auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const result = await DailyRewardService.claim(character.id)
      const labels = result.rewards.map((r) =>
        r.rewardType === 'item'
          ? `${r.rewardValue}x ${r.rewardItemName || 'item'}`
          : `+${r.rewardValue} ${r.rewardType}`
      )
      session.flash('success', `Recompense journaliere recue: ${labels.join(' + ')} • streak ${result.streak}`)
    } catch {
      session.flash('errors', { message: 'Impossible de reclamer la recompense journaliere' })
    }

    return response.redirect('/missions')
  }

  async reset({ auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    try {
      const result = await DailyMissionService.resetDailyMissions(character)
      session.flash(
        'success',
        result.cost > 0
          ? `Missions quotidiennes reinitialisees pour ${result.cost.toLocaleString()} credits`
          : 'Missions quotidiennes reinitialisees gratuitement'
      )
    } catch (error) {
      session.flash('errors', {
        message:
          error instanceof Error ? error.message : 'Impossible de reinitialiser les missions',
      })
    }

    return response.redirect('/missions')
  }
}
