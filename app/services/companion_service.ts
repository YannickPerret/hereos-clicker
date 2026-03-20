import Character from '#models/character'
import CharacterCompanion from '#models/character_companion'

export interface CompanionBonuses {
  clickBonus: number
  cpsBonus: number
  attackBonus: number
  defenseBonus: number
  hpBonus: number
  critChanceBonus: number
  lootBonus: number
}

export default class CompanionService {
  private static readonly UPGRADE_GROWTH = 2.35

  static getScaledBonusValue(baseValue: number, level: number) {
    return Math.max(0, Math.floor(baseValue * Math.max(1, level)))
  }

  static getUpgradePrice(basePrice: number, level: number) {
    return Math.max(1, Math.ceil(basePrice * Math.pow(this.UPGRADE_GROWTH, Math.max(0, level - 1))))
  }

  static async getActiveBonuses(characterId: number): Promise<CompanionBonuses> {
    const activeCompanion = await CharacterCompanion.query()
      .where('characterId', characterId)
      .where('isActive', true)
      .preload('companion')
      .first()

    if (!activeCompanion) {
      return this.emptyBonuses()
    }

    const value = this.getScaledBonusValue(
      activeCompanion.companion.bonusValue,
      activeCompanion.level
    )

    switch (activeCompanion.companion.bonusType) {
      case 'cpc_flat':
        return { ...this.emptyBonuses(), clickBonus: value }
      case 'cps_flat':
        return { ...this.emptyBonuses(), cpsBonus: value }
      case 'atk_flat':
        return { ...this.emptyBonuses(), attackBonus: value }
      case 'def_flat':
        return { ...this.emptyBonuses(), defenseBonus: value }
      case 'hp_flat':
        return { ...this.emptyBonuses(), hpBonus: value }
      case 'crit_chance':
        return { ...this.emptyBonuses(), critChanceBonus: value }
      case 'loot_bonus':
        return { ...this.emptyBonuses(), lootBonus: value }
      default:
        return this.emptyBonuses()
    }
  }

  static async getEffectiveHpMax(character: Character) {
    const bonuses = await this.getActiveBonuses(character.id)
    return character.hpMax + bonuses.hpBonus
  }

  static async syncHpPoolForActiveChange(
    character: Character,
    previousHpBonus: number,
    nextHpBonus: number
  ) {
    const delta = nextHpBonus - previousHpBonus
    if (delta === 0) {
      return
    }

    const nextEffectiveHpMax = character.hpMax + nextHpBonus
    const nextCurrentHp = character.hpCurrent + delta

    if (character.hpCurrent <= 0) {
      character.hpCurrent = 0
      return
    }

    character.hpCurrent = Math.min(nextEffectiveHpMax, Math.max(1, nextCurrentHp))
  }

  static async refillHpAfterLevelUp(character: Character) {
    const bonuses = await this.getActiveBonuses(character.id)
    character.hpCurrent = character.hpMax + bonuses.hpBonus
    return bonuses
  }

  private static emptyBonuses(): CompanionBonuses {
    return {
      clickBonus: 0,
      cpsBonus: 0,
      attackBonus: 0,
      defenseBonus: 0,
      hpBonus: 0,
      critChanceBonus: 0,
      lootBonus: 0,
    }
  }
}
