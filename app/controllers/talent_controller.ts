import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import Talent from '#models/talent'
import CharacterTalent from '#models/character_talent'
import InventoryItem from '#models/inventory_item'
import TalentService from '#services/talent_service'
import { localize } from '#services/locale_service'

export default class TalentController {
  async index({ inertia, auth, locale }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const allTalents = await Talent.query().orderBy('spec').orderBy('tier').orderBy('choiceGroup')
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

    // Build unlocked tiers per spec for prereq checks
    const unlockedTiersBySpec: Record<string, Set<number>> = {}
    // Build unlocked choice groups per tier per spec for binary exclusion
    const chosenChoiceByTier: Record<string, Record<number, number>> = {}

    for (const spec of specs) {
      unlockedTiersBySpec[spec] = new Set()
      chosenChoiceByTier[spec] = {}
    }

    for (const t of allTalents) {
      if (unlockedIds.has(t.id)) {
        unlockedTiersBySpec[t.spec].add(t.tier)
        chosenChoiceByTier[t.spec][t.tier] = t.choiceGroup
      }
    }

    const tree: Record<string, any[]> = {}

    for (const spec of specs) {
      const isLockedSpec = character.chosenSpec !== null && character.chosenSpec !== spec
      const specTiers = unlockedTiersBySpec[spec]
      const specChoices = chosenChoiceByTier[spec]

      tree[spec] = allTalents
        .filter((t) => t.spec === spec)
        .map((t) => {
          const isUnlocked = unlockedIds.has(t.id)
          const hasPrevTier = t.tier === 1 || specTiers.has(t.tier - 1)
          const otherChoicePicked = specChoices[t.tier] !== undefined && specChoices[t.tier] !== t.choiceGroup
          const canUnlock =
            !isLockedSpec &&
            !isUnlocked &&
            !otherChoicePicked &&
            character.talentPoints >= t.cost &&
            character.level >= t.requiresLevel &&
            hasPrevTier

          return {
            ...localize(t.serialize(), locale, ['name', 'description']),
            choiceGroup: t.choiceGroup,
            unlocked: isUnlocked,
            canUnlock,
            otherChoicePicked,
          }
        })
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
