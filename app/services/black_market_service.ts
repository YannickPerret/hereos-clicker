import BlackMarketCatalogEntry from '#models/black_market_catalog_entry'
import BlackMarketCleaner from '#models/black_market_cleaner'
import BlackMarketDeal from '#models/black_market_deal'
import BlackMarketSetting from '#models/black_market_setting'
import Character from '#models/character'
import CharacterBlackMarketProfile from '#models/character_black_market_profile'
import CharacterBlackMarketReputation from '#models/character_black_market_reputation'
import InventoryItem from '#models/inventory_item'
import TalentService from '#services/talent_service'

export type VendorKey = 'ghostline' | 'rook' | 'velvet'

export const BLACK_MARKET_VENDORS: Record<VendorKey, { name: string; tagline: string; description: string; specialties: string[] }> = {
  ghostline: {
    name: 'Ghostline',
    tagline: 'Daemons, spikes, forbidden firmware',
    description: 'A whisper broker who moves black ICE, ghostware, and implants nobody should install twice.',
    specialties: ['Programmes interdits', 'Implants netrunner', 'Upgrades furtifs'],
  },
  rook: {
    name: 'Rook',
    tagline: 'Stolen crates, live weapons, hard chrome',
    description: 'A convoy hijacker turned fixer. If it was locked in a Militech container, Rook can price it.',
    specialties: ['Armes lourdes', 'Blindages corpo', 'Chrome de combat'],
  },
  velvet: {
    name: 'Velvet Circuit',
    tagline: 'Fashion crime, forged IDs, designer contraband',
    description: 'Luxury contraband for runners who want to look expensive while doing illegal things.',
    specialties: ['Vetements rares', 'Stims premium', 'Badges contrefaits'],
  },
}

const DEFAULT_MIN_LEVEL = 12
const DEFAULT_ROTATION_HOURS = 12
const SLOTS_PER_VENDOR = 4

const SPEC_LABELS: Record<string, string> = {
  hacker: 'Hacker',
  netrunner: 'Netrunner',
  samurai: 'Samurai',
  chrome_dealer: 'Chrome Dealer',
}

export default class BlackMarketService {
  private static hashSeed(value: string) {
    let hash = 2166136261

    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }

    return Math.abs(hash >>> 0)
  }

  static async getMinLevel() {
    const value = await BlackMarketSetting.query().where('key', 'min_level').first()
    return Math.max(1, Number(value?.value || DEFAULT_MIN_LEVEL) || DEFAULT_MIN_LEVEL)
  }

  static async getRotationHours() {
    const value = await BlackMarketSetting.query().where('key', 'rotation_hours').first()
    return Math.max(1, Number(value?.value || DEFAULT_ROTATION_HOURS) || DEFAULT_ROTATION_HOURS)
  }

  static getVendorDefinitions() {
    return BLACK_MARKET_VENDORS
  }

  private static async getRotationWindow(now = Date.now()) {
    const rotationHours = await this.getRotationHours()
    const rotationMs = rotationHours * 60 * 60 * 1000
    const rotationKey = Math.floor(now / rotationMs)

    return {
      rotationKey,
      startsAt: rotationKey * rotationMs,
      endsAt: (rotationKey + 1) * rotationMs,
      rotationHours,
    }
  }

  private static getHeatState(heat: number) {
    if (heat >= 120) return { label: 'BRULE', markupPercent: 35, tone: 'text-cyber-red' }
    if (heat >= 80) return { label: 'HAUTE', markupPercent: 20, tone: 'text-cyber-orange' }
    if (heat >= 40) return { label: 'TIEDE', markupPercent: 10, tone: 'text-cyber-yellow' }
    return { label: 'FROIDE', markupPercent: 0, tone: 'text-cyber-green' }
  }

  private static async ensureProfile(character: Character) {
    const now = Date.now()
    const profile = await CharacterBlackMarketProfile.firstOrCreate(
      { characterId: character.id },
      { heat: 0, lastHeatDecayAt: now }
    )

    const lastDecayAt = Number(profile.lastHeatDecayAt) || now
    const elapsedHours = Math.floor((now - lastDecayAt) / (60 * 60 * 1000))

    if (elapsedHours > 0) {
      profile.heat = Math.max(0, profile.heat - (elapsedHours * 3))
      profile.lastHeatDecayAt = now
      await profile.save()
    }

    return profile
  }

  private static async ensureReputations(characterId: number) {
    const records: CharacterBlackMarketReputation[] = []

    for (const vendorKey of Object.keys(BLACK_MARKET_VENDORS) as VendorKey[]) {
      records.push(await CharacterBlackMarketReputation.firstOrCreate(
        { characterId, vendorKey },
        { reputation: 0 }
      ))
    }

    return new Map(records.map((record) => [record.vendorKey as VendorKey, record]))
  }

  private static async pickCatalog(rotationKey: number, vendorKey: VendorKey) {
    const entries = await BlackMarketCatalogEntry.query()
      .where('vendorKey', vendorKey)
      .where('isActive', true)
      .preload('item')
      .orderBy('sortOrder', 'asc')
      .orderBy('id', 'asc')

    return entries
      .map((entry) => ({
        entry,
        weight: this.hashSeed(`${rotationKey}:${vendorKey}:${entry.itemId}:${entry.sortOrder}`),
      }))
      .sort((left, right) => left.weight - right.weight)
      .slice(0, SLOTS_PER_VENDOR)
      .map((picked, index) => ({ entry: picked.entry, slot: index + 1 }))
  }

  private static getPriceContext(basePrice: number, heat: number, reputation: number, shopDiscount: number) {
    const heatMarkup = this.getHeatState(heat).markupPercent
    const reputationDiscount = Math.min(18, Math.floor(reputation / 5))
    const talentDiscount = Math.min(12, Math.floor(shopDiscount * 0.5))
    const finalMultiplier = Math.max(0.55, (100 + heatMarkup - reputationDiscount - talentDiscount) / 100)
    const finalPrice = Math.max(1000, Math.floor(basePrice * finalMultiplier))

    return {
      finalPrice,
      heatMarkup,
      reputationDiscount,
      talentDiscount,
    }
  }

  private static getCleanerPrice(basePrice: number, heat: number) {
    return Math.max(basePrice, Math.floor(basePrice * (1 + Math.max(0, heat - 30) / 300)))
  }

  private static getRepMilestones() {
    return [5, 12, 20, 35]
  }

  private static async ensureRotation() {
    const { rotationKey, startsAt, endsAt } = await this.getRotationWindow()
    const existingDeals = await BlackMarketDeal.query().where('rotationKey', rotationKey)
    const existingKeys = new Set(existingDeals.map((deal) => `${deal.vendorKey}:${deal.slot}`))

    for (const vendorKey of Object.keys(BLACK_MARKET_VENDORS) as VendorKey[]) {
      const picks = await this.pickCatalog(rotationKey, vendorKey)

      for (const pick of picks) {
        const dealKey = `${vendorKey}:${pick.slot}`
        if (existingKeys.has(dealKey)) continue

        await BlackMarketDeal.create({
          rotationKey,
          vendorKey,
          slot: pick.slot,
          itemId: pick.entry.itemId,
          price: pick.entry.basePrice,
          stock: pick.entry.stock,
          heatValue: pick.entry.heatValue,
          reputationRequired: pick.entry.reputationRequired,
          requiredSpec: pick.entry.requiredSpec,
          featured: pick.entry.isFeatured,
          startsAt,
          endsAt,
        })
      }
    }
  }

  static async getMarketState(character: Character) {
    await this.ensureRotation()

    const [{ rotationKey, endsAt, rotationHours }, profile, reputationMap, talentBonuses, deals, cleaners] = await Promise.all([
      this.getRotationWindow(),
      this.ensureProfile(character),
      this.ensureReputations(character.id),
      TalentService.getCharacterBonuses(character.id),
      (async () => {
        const { rotationKey } = await this.getRotationWindow()
        return BlackMarketDeal.query().where('rotationKey', rotationKey).preload('item').orderBy('vendorKey', 'asc').orderBy('slot', 'asc')
      })(),
      BlackMarketCleaner.query().where('isActive', true).orderBy('sortOrder', 'asc').orderBy('id', 'asc'),
    ])

    const heatState = this.getHeatState(profile.heat)
    const vendors = (Object.keys(BLACK_MARKET_VENDORS) as VendorKey[]).map((vendorKey) => {
      const reputation = reputationMap.get(vendorKey)?.reputation || 0
      const info = BLACK_MARKET_VENDORS[vendorKey]
      const vendorDeals = deals
        .filter((deal) => deal.vendorKey === vendorKey)
        .map((deal) => {
          const price = this.getPriceContext(deal.price, profile.heat, reputation, talentBonuses.shopDiscount)
          const hasSpecLock = Boolean(deal.requiredSpec && deal.requiredSpec !== character.chosenSpec)
          const missingRep = Math.max(0, deal.reputationRequired - reputation)
          const lockedReason = hasSpecLock
            ? `Reserve ${SPEC_LABELS[deal.requiredSpec || ''] || deal.requiredSpec}`
            : missingRep > 0
              ? `Reputation ${deal.reputationRequired} requise`
              : null

          return {
            id: deal.id,
            slot: deal.slot,
            stock: deal.stock,
            heatValue: deal.heatValue,
            reputationRequired: deal.reputationRequired,
            requiredSpec: deal.requiredSpec,
            requiredSpecLabel: deal.requiredSpec ? (SPEC_LABELS[deal.requiredSpec] || deal.requiredSpec) : null,
            featured: deal.featured,
            price: price.finalPrice,
            basePrice: deal.price,
            heatMarkup: price.heatMarkup,
            reputationDiscount: price.reputationDiscount,
            talentDiscount: price.talentDiscount,
            canBuy: !lockedReason && deal.stock > 0,
            lockedReason,
            item: deal.item.serialize(),
          }
        })

      return {
        key: vendorKey,
        ...info,
        reputation,
        nextMilestone: this.getRepMilestones().find((value) => value > reputation) || null,
        deals: vendorDeals,
      }
    })

    return {
      character: {
        id: character.id,
        credits: character.credits,
        level: character.level,
        chosenSpec: character.chosenSpec,
      },
      profile: {
        heat: profile.heat,
        heatLabel: heatState.label,
        heatTone: heatState.tone,
        heatMarkupPercent: heatState.markupPercent,
        refreshAt: endsAt,
        rotationHours,
      },
      vendors,
      cleaners: cleaners.map((cleaner) => ({
        ...cleaner.serialize(),
        price: this.getCleanerPrice(cleaner.basePrice, profile.heat),
        disabled: profile.heat <= 0,
      })),
      nightMarketLive: vendors.some((vendor) => vendor.deals.some((deal) => deal.featured)),
      rotationKey,
    }
  }

  static async buyDeal(character: Character, dealId: number, requestedQuantity: number) {
    await this.ensureRotation()

    const { rotationKey } = await this.getRotationWindow()
    const quantity = Math.max(1, Math.floor(requestedQuantity || 1))
    const deal = await BlackMarketDeal.query()
      .where('id', dealId)
      .where('rotationKey', rotationKey)
      .preload('item')
      .firstOrFail()

    const [profile, reputationMap, talentBonuses] = await Promise.all([
      this.ensureProfile(character),
      this.ensureReputations(character.id),
      TalentService.getCharacterBonuses(character.id),
    ])

    const reputationEntry = reputationMap.get(deal.vendorKey as VendorKey)
    const reputation = reputationEntry?.reputation || 0

    if (deal.requiredSpec && deal.requiredSpec !== character.chosenSpec) {
      throw new Error(`Cette offre est reservee aux ${SPEC_LABELS[deal.requiredSpec] || deal.requiredSpec}`)
    }

    if (reputation < deal.reputationRequired) {
      throw new Error(`Reputation ${deal.reputationRequired} requise chez ${BLACK_MARKET_VENDORS[deal.vendorKey as VendorKey].name}`)
    }

    if (deal.stock < quantity) {
      throw new Error('Stock insuffisant')
    }

    const price = this.getPriceContext(deal.price, profile.heat, reputation, talentBonuses.shopDiscount)
    const totalPrice = price.finalPrice * quantity

    if (character.credits < totalPrice) {
      throw new Error('Not enough credits')
    }

    character.credits -= totalPrice
    deal.stock -= quantity

    const existing = await InventoryItem.query()
      .where('characterId', character.id)
      .where('itemId', deal.itemId)
      .first()

    if (existing) {
      existing.quantity += quantity
      await existing.save()
    } else {
      await InventoryItem.create({
        characterId: character.id,
        itemId: deal.itemId,
        quantity,
        isEquipped: false,
      })
    }

    const heatGain = deal.heatValue * quantity
    profile.heat = Math.min(150, profile.heat + heatGain)
    profile.lastHeatDecayAt = Date.now()

    const reputationGain = Math.max(1, Math.floor(totalPrice / 180000)) + Math.max(0, quantity - 1)
    if (reputationEntry) {
      reputationEntry.reputation = Math.min(100, reputationEntry.reputation + reputationGain)
      await reputationEntry.save()
    }

    await deal.save()
    await profile.save()
    await character.save()

    return {
      itemName: deal.item.name,
      quantity,
      totalPrice,
      heatGain,
      reputationGain,
      vendorName: BLACK_MARKET_VENDORS[deal.vendorKey as VendorKey].name,
    }
  }

  static async cleanHeat(character: Character, cleanerKey: string) {
    const cleaner = await BlackMarketCleaner.query()
      .where('key', cleanerKey)
      .where('isActive', true)
      .first()

    if (!cleaner) {
      throw new Error('Cleaner introuvable')
    }

    const profile = await this.ensureProfile(character)
    if (profile.heat <= 0) {
      throw new Error('Aucune chaleur a nettoyer')
    }

    const price = this.getCleanerPrice(cleaner.basePrice, profile.heat)
    if (character.credits < price) {
      throw new Error('Not enough credits')
    }

    character.credits -= price
    profile.heat = Math.max(0, profile.heat - cleaner.heatReduction)
    profile.lastHeatDecayAt = Date.now()

    await profile.save()
    await character.save()

    return {
      cleanerName: cleaner.name,
      price,
      heatReduced: cleaner.heatReduction,
      remainingHeat: profile.heat,
    }
  }
}
