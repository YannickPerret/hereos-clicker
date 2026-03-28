import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import QuestService from '#services/quest_service'

export default class QuestController {
  async index({ inertia, auth, locale }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const journal = await QuestService.getJournal(character, locale === 'en' ? 'en' : 'fr')
    await character.refresh()

    // Get flow states for all active advanced quests
    const flowStates: Record<number, any> = {}
    for (const track of journal.tracks) {
      for (const quest of track.quests) {
        if (quest.mode === 'advanced' && quest.status === 'active') {
          const flowState = await QuestService.getFlowState(
            character.id,
            quest.id,
            locale === 'en' ? 'en' : 'fr'
          )
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

  async advance({ request, response, auth, session, locale }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const questId = Number(request.param('questId'))
    const result = await QuestService.advanceFlowStep(
      character,
      questId,
      locale === 'en' ? 'en' : 'fr'
    )

    if (result.event) {
      session.flash(
        'success',
        locale === 'en'
          ? `Quest "${result.event.title}" completed! ${result.event.rewardLabel || ''}`.trim()
          : `Quete "${result.event.title}" terminee ! ${result.event.rewardLabel || ''}`.trim()
      )
    }

    return response.json(result)
  }

  async choose({ request, response, auth, session, locale }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const questId = Number(request.param('questId'))
    const optionIndex = Number(request.input('optionIndex', 0))
    const result = await QuestService.makeFlowChoice(
      character,
      questId,
      optionIndex,
      locale === 'en' ? 'en' : 'fr'
    )

    if (result.event) {
      session.flash(
        'success',
        locale === 'en'
          ? `Quest "${result.event.title}" completed! ${result.event.rewardLabel || ''}`.trim()
          : `Quete "${result.event.title}" terminee ! ${result.event.rewardLabel || ''}`.trim()
      )
    }

    return response.json(result)
  }

  async flowState({ request, response, auth, locale }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const questId = Number(request.param('questId'))
    const flowState = await QuestService.getFlowState(
      character.id,
      questId,
      locale === 'en' ? 'en' : 'fr'
    )

    return response.json({ flowState })
  }
}
