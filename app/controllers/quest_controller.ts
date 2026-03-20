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

    return inertia.render('quests/index', {
      character: character.serialize(),
      journal,
    })
  }
}
