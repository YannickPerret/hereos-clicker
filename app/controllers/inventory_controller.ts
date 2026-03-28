import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import InventoryItem from '#models/inventory_item'
import TalentService from '#services/talent_service'
import ClickerService from '#services/clicker_service'
import CompanionService from '#services/companion_service'
import { localize } from '#services/locale_service'

export default class InventoryController {
  async index({ inertia, auth, locale }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const inventory = await InventoryItem.query()
      .where('characterId', character.id)
      .preload('item')
      .orderBy('isEquipped', 'desc')

    const equipBonuses = await ClickerService.calculateEquipBonuses(character)
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)

    return inertia.render('inventory/index', {
      character: {
        ...character.serialize(),
        hpMax: character.hpMax + equipBonuses.hpBonus,
      },
      inventory: inventory.map((i) => ({
        ...i.serialize(),
        item: localize(i.item.serialize(), locale, ['name', 'description']),
      })),
      equipBonuses,
      talentBonuses: {
        atkFlat: talentBonuses.atkFlat,
        defFlat: talentBonuses.defFlat,
        cpcFlat: talentBonuses.cpcFlat,
        cpcPercent: talentBonuses.cpcPercent,
      },
    })
  }

  async equip({ params, auth, response }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const invItem = await InventoryItem.query()
      .where('id', params.id)
      .where('characterId', character.id)
      .preload('item')
      .firstOrFail()

    if (invItem.item.type === 'consumable') {
      return response.redirect('/inventory')
    }

    // Unequip any item of same type
    const sameType = await InventoryItem.query()
      .where('characterId', character.id)
      .where('isEquipped', true)
      .preload('item')

    for (const equipped of sameType) {
      if (equipped.item.type === invItem.item.type) {
        equipped.isEquipped = false
        await equipped.save()
      }
    }

    invItem.isEquipped = true
    await invItem.save()

    return response.redirect('/inventory')
  }

  async unequip({ params, auth, response }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const invItem = await InventoryItem.query()
      .where('id', params.id)
      .where('characterId', character.id)
      .firstOrFail()

    invItem.isEquipped = false
    await invItem.save()

    return response.redirect('/inventory')
  }

  async use({ params, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const invItem = await InventoryItem.query()
      .where('id', params.id)
      .where('characterId', character.id)
      .preload('item')
      .firstOrFail()

    if (invItem.item.type !== 'consumable' && invItem.item.type !== 'upgrade') {
      return response.redirect('/inventory')
    }

    const quantity = 1
    let successMessage = `${invItem.item.name} utilise`

    // Apply effect
    if (invItem.item.effectType === 'hp_restore') {
      const effectiveHpMax = await CompanionService.getEffectiveHpMax(character)
      const healed = Math.min(effectiveHpMax - character.hpCurrent, invItem.item.effectValue || 0)
      if (character.hpCurrent >= effectiveHpMax) {
        session.flash('errors', { message: 'Tes HP sont deja au maximum' })
        return response.redirect('/inventory')
      }
      character.hpCurrent = Math.min(
        effectiveHpMax,
        character.hpCurrent + (invItem.item.effectValue || 0)
      )
      successMessage = `${invItem.item.name} utilise: +${healed} HP`
      await character.save()
    } else if (invItem.item.effectType === 'xp_boost') {
      character.xp += invItem.item.effectValue || 0
      successMessage = `${invItem.item.name} utilise: +${invItem.item.effectValue || 0} XP`
      if (character.xp >= character.level * 100) {
        character.levelUp()
        await CompanionService.refillHpAfterLevelUp(character)
      }
      await character.save()
    } else if (invItem.item.effectType === 'permanent_click') {
      const percent = Math.max(1, invItem.item.effectValue || 0)
      const increase = Math.max(1, Math.ceil(character.creditsPerClick * (percent / 100)))
      character.creditsPerClick += increase
      successMessage = `${invItem.item.name} utilise: +${increase} CPC`
      await character.save()
    } else if (invItem.item.effectType === 'talent_respec') {
      await TalentService.respec(character)
      // Redirect to talents page after respec
      invItem.quantity -= 1
      if (invItem.quantity <= 0) {
        await invItem.delete()
      } else {
        await invItem.save()
      }
      session.flash('success', `${invItem.item.name} utilise: talents reinitialises`)
      return response.redirect('/talents')
    }

    invItem.quantity -= quantity
    if (invItem.quantity <= 0) {
      await invItem.delete()
    } else {
      await invItem.save()
    }

    session.flash('success', successMessage)
    return response.redirect('/inventory')
  }

  async discard({ params, request, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const invItem = await InventoryItem.query()
      .where('id', params.id)
      .where('characterId', character.id)
      .preload('item')
      .firstOrFail()

    const requestedQuantity = Math.max(1, Math.floor(Number(request.input('quantity', 1)) || 1))
    const quantity = Math.min(requestedQuantity, invItem.quantity)

    invItem.quantity -= quantity
    if (invItem.quantity <= 0) {
      await invItem.delete()
    } else {
      await invItem.save()
    }

    session.flash('success', `${quantity}x ${invItem.item.name} jete${quantity > 1 ? 's' : ''}`)
    return response.redirect('/inventory')
  }
}
