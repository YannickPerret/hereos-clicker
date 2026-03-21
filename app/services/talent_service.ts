import Character from '#models/character'
import Talent from '#models/talent'
import CharacterTalent from '#models/character_talent'
import CompanionService from '#services/companion_service'

export interface TalentBonuses {
  cpcFlat: number
  cpcPercent: number
  cpsFlat: number
  cpsPercent: number
  atkFlat: number
  defFlat: number
  hpFlat: number
  combatPercent: number
  shopDiscount: number
  lootBonus: number
  dungeonCredits: number
}

export default class TalentService {
  static async getCharacterBonuses(characterId: number): Promise<TalentBonuses> {
    const unlocked = await CharacterTalent.query()
      .where('characterId', characterId)
      .preload('talent')

    const bonuses: TalentBonuses = {
      cpcFlat: 0, cpcPercent: 0, cpsFlat: 0, cpsPercent: 0,
      atkFlat: 0, defFlat: 0, hpFlat: 0, combatPercent: 0,
      shopDiscount: 0, lootBonus: 0, dungeonCredits: 0,
    }

    for (const ct of unlocked) {
      const val = ct.talent.effectValue * ct.rank
      switch (ct.talent.effectType) {
        case 'cpc_flat': bonuses.cpcFlat += val; break
        case 'cpc_percent': bonuses.cpcPercent += val; break
        case 'cps_flat': bonuses.cpsFlat += val; break
        case 'cps_percent': bonuses.cpsPercent += val; break
        case 'atk_flat': bonuses.atkFlat += val; break
        case 'def_flat': bonuses.defFlat += val; break
        case 'hp_flat': bonuses.hpFlat += val; break
        case 'combat_percent': bonuses.combatPercent += val; break
        case 'shop_discount': bonuses.shopDiscount += val; break
        case 'loot_bonus': bonuses.lootBonus += val; break
        case 'dungeon_credits': bonuses.dungeonCredits += val; break
      }
    }

    return bonuses
  }

  static async unlockTalent(character: Character, talentId: number) {
    const talent = await Talent.findOrFail(talentId)

    // Check level
    if (character.level < talent.requiresLevel) {
      throw new Error(`Niveau ${talent.requiresLevel} requis`)
    }

    // Check talent points
    if (character.talentPoints < talent.cost) {
      throw new Error('Pas assez de points de talent')
    }

    // Enforce single spec
    if (character.chosenSpec && character.chosenSpec !== talent.spec) {
      throw new Error(`Tu es specialise ${this.specLabel(character.chosenSpec)}. Achete un Neural Respec Chip pour changer.`)
    }

    // Check not already unlocked
    const existing = await CharacterTalent.query()
      .where('characterId', character.id)
      .where('talentId', talentId)
      .first()

    if (existing) {
      throw new Error('Talent deja debloque')
    }

    // Get all unlocked talents for this character in this spec
    const unlockedInSpec = await CharacterTalent.query()
      .where('characterId', character.id)
      .preload('talent', (q) => q.where('spec', talent.spec))

    const unlockedTiers = new Set(
      unlockedInSpec.filter((ct) => ct.talent).map((ct) => ct.talent.tier)
    )

    // Tier prerequisite: must have unlocked something in previous tier (except T1)
    if (talent.tier > 1 && !unlockedTiers.has(talent.tier - 1)) {
      throw new Error(`Debloque un talent du tier ${talent.tier - 1} d'abord`)
    }

    // Binary choice: check no other talent in same tier+spec is already unlocked
    const conflicting = unlockedInSpec.find(
      (ct) => ct.talent && ct.talent.tier === talent.tier && ct.talent.choiceGroup !== talent.choiceGroup
    )
    if (conflicting) {
      throw new Error('Tu as deja choisi un talent a ce tier')
    }

    // Lock spec on first talent unlock
    if (!character.chosenSpec) {
      character.chosenSpec = talent.spec
    }

    // Spend points
    character.talentPoints -= talent.cost
    await character.save()

    return await CharacterTalent.create({
      characterId: character.id,
      talentId: talent.id,
      rank: 1,
      maxRank: 1,
    })
  }

  static async respec(character: Character) {
    const unlocked = await CharacterTalent.query()
      .where('characterId', character.id)
      .preload('talent')

    let refundedPoints = 0
    for (const ct of unlocked) {
      refundedPoints += ct.talent.cost * ct.rank
    }

    await CharacterTalent.query()
      .where('characterId', character.id)
      .delete()

    character.chosenSpec = null
    character.talentPoints += refundedPoints
    character.creditsPerSecond = 0
    await character.save()

    return refundedPoints
  }

  static async syncOfflineCredits(character: Character): Promise<number> {
    const now = Date.now()
    const elapsed = Math.floor((now - character.lastTickAt) / 1000)
    if (elapsed <= 0) {
      return character.unclaimedOfflineCredits || 0
    }

    const cappedSeconds = Math.min(elapsed, 4 * 3600)
    const talentBonuses = await this.getCharacterBonuses(character.id)
    const companionBonuses = await CompanionService.getActiveBonuses(character.id)
    const totalCps = this.computeEffectiveCps(
      character.creditsPerSecond + companionBonuses.cpsBonus,
      talentBonuses
    )
    const offlineCredits = totalCps * cappedSeconds

    if (offlineCredits > 0) {
      character.unclaimedOfflineCredits = (character.unclaimedOfflineCredits || 0) + offlineCredits
    }
    character.lastTickAt = now
    await character.save()

    return character.unclaimedOfflineCredits || 0
  }

  static async claimOfflineCredits(character: Character): Promise<number> {
    const amount = Math.max(0, character.unclaimedOfflineCredits || 0)
    if (amount <= 0) {
      return 0
    }

    character.credits += amount
    character.unclaimedOfflineCredits = 0
    await character.save()

    return amount
  }

  static computeEffectiveCps(baseCps: number, talentBonuses: TalentBonuses): number {
    const flat = baseCps + talentBonuses.cpsFlat
    return Math.floor(flat * (1 + talentBonuses.cpsPercent / 100))
  }

  static computeEffectiveCpc(baseCpc: number, equipBonus: number, talentBonuses: TalentBonuses): number {
    const flat = baseCpc + equipBonus + talentBonuses.cpcFlat
    return Math.floor(flat * (1 + talentBonuses.cpcPercent / 100))
  }

  private static specLabel(spec: string): string {
    const labels: Record<string, string> = {
      hacker: 'Hacker', netrunner: 'Netrunner',
      samurai: 'Street Samurai', chrome_dealer: 'Chrome Dealer',
    }
    return labels[spec] || spec
  }
}
