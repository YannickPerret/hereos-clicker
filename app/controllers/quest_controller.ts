import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import QuestService from '#services/quest_service'

export default class QuestController {
  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const journal = await QuestService.getJournal(character)
    await character.refresh()

    // Get flow states for all active advanced quests
    const flowStates: Record<number, any> = {}
    for (const track of journal.tracks) {
      for (const quest of track.quests) {
        if (quest.mode === 'advanced' && quest.status === 'active') {
          const flowState = await QuestService.getFlowState(character.id, quest.id)
          if (flowState) {
            flowStates[quest.id] = flowState
          }
        }
      }
    }

    return inertia.render('quests/index', {
      character: character.serialize(),
      journal,
      flowStates,
    })
  }

  async advance({ request, response, auth, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const questId = Number(request.param('questId'))
    const result = await QuestService.advanceFlowStep(character, questId)

    if (result.event) {
      session.flash('success', `Quete "${result.event.title}" terminee ! ${result.event.rewardLabel || ''}`)
    }

    return response.json(result)
  }

  async choose({ request, response, auth, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const questId = Number(request.param('questId'))
    const optionIndex = Number(request.input('optionIndex', 0))
    const result = await QuestService.makeFlowChoice(character, questId, optionIndex)

    if (result.event) {
      session.flash('success', `Quete "${result.event.title}" terminee ! ${result.event.rewardLabel || ''}`)
    }

    return response.json(result)
  }

  async flowState({ request, response, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const questId = Number(request.param('questId'))
    const flowState = await QuestService.getFlowState(character.id, questId)

    return response.json({ flowState })
  }
}
