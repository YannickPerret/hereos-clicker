import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import Talent from '#models/talent'
import CharacterTalent from '#models/character_talent'
import InventoryItem from '#models/inventory_item'
import TalentService from '#services/talent_service'

export default class TalentController {
  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const allTalents = await Talent.query().orderBy('spec').orderBy('tier')
    const unlockedTalents = await CharacterTalent.query()
      .where('characterId', character.id)

    const unlockedIds = new Set(unlockedTalents.map((ct) => ct.talentId))
    const bonuses = await TalentService.getCharacterBonuses(character.id)

    // Check if player has a respec chip in inventory
    const hasRespec = await InventoryItem.query()
      .where('characterId', character.id)
      .whereHas('item', (q) => q.where('effectType', 'talent_respec'))
      .preload('item')
      .first()

    const specs = ['hacker', 'netrunner', 'samurai', 'chrome_dealer']
    const tree: Record<string, any[]> = {}

    for (const spec of specs) {
      const isLockedSpec = character.chosenSpec !== null && character.chosenSpec !== spec

      tree[spec] = allTalents
        .filter((t) => t.spec === spec)
        .map((t) => ({
          ...t.serialize(),
          unlocked: unlockedIds.has(t.id),
          canUnlock:
            !isLockedSpec &&
            !unlockedIds.has(t.id) &&
            character.talentPoints >= t.cost &&
            character.level >= t.requiresLevel &&
            (!t.requiresTalentId || unlockedIds.has(t.requiresTalentId)),
        }))
    }

    return inertia.render('talents/index', {
      character: { ...character.serialize(), chosenSpec: character.chosenSpec },
      tree,
      bonuses,
      hasRespecChip: hasRespec ? { inventoryItemId: hasRespec.id } : null,
    })
  }

  async unlock({ request, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const talentId = request.input('talentId')

    try {
      await TalentService.unlockTalent(character, talentId)
      session.flash('success', 'Talent debloque !')
    } catch (e: any) {
      session.flash('errors', { message: e.message })
    }

    return response.redirect('/talents')
  }

  async respec({ auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    // Check has respec chip
    const invItem = await InventoryItem.query()
      .where('characterId', character.id)
      .whereHas('item', (q) => q.where('effectType', 'talent_respec'))
      .preload('item')
      .first()

    if (!invItem) {
      session.flash('errors', { message: 'Tu n\'as pas de Neural Respec Chip' })
      return response.redirect('/talents')
    }

    const refunded = await TalentService.respec(character)

    invItem.quantity -= 1
    if (invItem.quantity <= 0) {
      await invItem.delete()
    } else {
      await invItem.save()
    }

    session.flash('success', `Respec effectue ! ${refunded} points de talent recuperes.`)
    return response.redirect('/talents')
  }
}
