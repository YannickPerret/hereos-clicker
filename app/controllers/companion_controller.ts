import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import Companion from '#models/companion'
import CharacterCompanion from '#models/character_companion'
import { DateTime } from 'luxon'
import transmit from '@adonisjs/transmit/services/main'
import QuestService from '#services/quest_service'
import CompanionService from '#services/companion_service'

export default class CompanionController {
  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const owned = await CharacterCompanion.query()
      .where('characterId', character.id)
      .preload('companion')

    const allCompanions = await Companion.query().orderBy('basePrice', 'asc')

    const ownedIds = owned.map((o) => o.companionId)

    return inertia.render('companions/index', {
      character: character.serialize(),
      owned: owned.map((o) => ({
        id: o.id,
        companionId: o.companion.id,
        name: o.companion.name,
        description: o.companion.description,
        rarity: o.companion.rarity,
        bonusType: o.companion.bonusType,
        bonusValue: CompanionService.getScaledBonusValue(o.companion.bonusValue, o.level),
        baseValue: o.companion.bonusValue,
        icon: o.companion.icon,
        isActive: o.isActive,
        level: o.level,
        xp: o.xp,
        nextBonusValue: CompanionService.getScaledBonusValue(o.companion.bonusValue, o.level + 1),
        upgradePrice: CompanionService.getUpgradePrice(o.companion.basePrice, o.level),
      })),
      shop: allCompanions.filter((c) => !ownedIds.includes(c.id)).map((c) => c.serialize()),
    })
  }

  async buy({ params, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const companion = await Companion.findOrFail(params.id)

    const alreadyOwned = await CharacterCompanion.query()
      .where('characterId', character.id)
      .where('companionId', companion.id)
      .first()

    if (alreadyOwned) {
      session.flash('errors', { message: 'Tu possedes deja ce compagnon' })
      return response.redirect('/companions')
    }

    if (character.credits < companion.basePrice) {
      session.flash('errors', { message: 'Pas assez de credits' })
      return response.redirect('/companions')
    }

    character.credits -= companion.basePrice
    await character.save()

    await CharacterCompanion.create({
      characterId: character.id,
      companionId: companion.id,
      isActive: false,
      level: 1,
      xp: 0,
      acquiredAt: DateTime.now(),
    })

    await QuestService.trackObjectiveProgress(character, 'companion_purchase', 1).catch(() => {})

    transmit.broadcast('game/notifications', {
      type: 'companion',
      message: `${character.name} a obtenu le compagnon ${companion.icon} ${companion.name}!`,
    })

    session.flash('success', `${companion.name} rejoint ton equipe!`)
    return response.redirect('/companions')
  }

  async activate({ params, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const currentlyActive = await CharacterCompanion.query()
      .where('characterId', character.id)
      .where('isActive', true)
      .first()

    let previousHpBonus = 0
    if (currentlyActive) {
      await currentlyActive.load('companion')
      previousHpBonus =
        currentlyActive.companion.bonusType === 'hp_flat'
          ? CompanionService.getScaledBonusValue(
              currentlyActive.companion.bonusValue,
              currentlyActive.level
            )
          : 0
    }

    // Deactivate all
    await CharacterCompanion.query().where('characterId', character.id).update({ isActive: false })

    // Activate selected
    const cc = await CharacterCompanion.query()
      .where('id', params.id)
      .where('characterId', character.id)
      .firstOrFail()

    cc.isActive = true
    await cc.load('companion')
    const nextHpBonus =
      cc.companion.bonusType === 'hp_flat'
        ? CompanionService.getScaledBonusValue(cc.companion.bonusValue, cc.level)
        : 0
    await CompanionService.syncHpPoolForActiveChange(character, previousHpBonus, nextHpBonus)
    await character.save()
    await cc.save()

    if (!currentlyActive || currentlyActive.id !== cc.id) {
      await QuestService.trackObjectiveProgress(character, 'companion_activate', 1).catch(() => {})
    }

    session.flash('success', `${cc.companion.name} est maintenant actif!`)
    return response.redirect('/companions')
  }

  async deactivate({ params, auth, response }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const cc = await CharacterCompanion.query()
      .where('id', params.id)
      .where('characterId', character.id)
      .preload('companion')
      .firstOrFail()

    const previousHpBonus =
      cc.isActive && cc.companion.bonusType === 'hp_flat'
        ? CompanionService.getScaledBonusValue(cc.companion.bonusValue, cc.level)
        : 0
    cc.isActive = false
    await CompanionService.syncHpPoolForActiveChange(character, previousHpBonus, 0)
    await character.save()
    await cc.save()

    return response.redirect('/companions')
  }

  async upgrade({ params, auth, response, session }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()

    const ownedCompanion = await CharacterCompanion.query()
      .where('id', params.id)
      .where('characterId', character.id)
      .preload('companion')
      .firstOrFail()

    const price = CompanionService.getUpgradePrice(
      ownedCompanion.companion.basePrice,
      ownedCompanion.level
    )

    if (character.credits < price) {
      session.flash('errors', { message: 'Pas assez de credits pour ameliorer ce drone' })
      return response.redirect('/companions')
    }

    const previousValue = CompanionService.getScaledBonusValue(
      ownedCompanion.companion.bonusValue,
      ownedCompanion.level
    )

    character.credits -= price
    ownedCompanion.level += 1

    const nextValue = CompanionService.getScaledBonusValue(
      ownedCompanion.companion.bonusValue,
      ownedCompanion.level
    )

    if (ownedCompanion.isActive && ownedCompanion.companion.bonusType === 'hp_flat') {
      await CompanionService.syncHpPoolForActiveChange(character, previousValue, nextValue)
    }

    await character.save()
    await ownedCompanion.save()

    session.flash(
      'success',
      `${ownedCompanion.companion.name} passe niveau ${ownedCompanion.level} (+${nextValue - previousValue})`
    )

    return response.redirect('/companions')
  }
}
