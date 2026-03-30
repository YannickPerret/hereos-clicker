import BlackMarketCatalogEntry from '#models/black_market_catalog_entry'
import BlackMarketCleaner from '#models/black_market_cleaner'
import BlackMarketDeal from '#models/black_market_deal'
import BlackMarketPlayerListing from '#models/black_market_player_listing'
import BlackMarketSetting from '#models/black_market_setting'
import Character from '#models/character'
import CharacterBlackMarketProfile from '#models/character_black_market_profile'
import CharacterBlackMarketReputation from '#models/character_black_market_reputation'
import InventoryItem from '#models/inventory_item'
import TalentService from '#services/talent_service'

export type VendorKey = 'ghostline' | 'rook' | 'velvet'

export const BLACK_MARKET_VENDORS: Record<
  VendorKey,
  { name: string; tagline: string; description: string; specialties: string[] }
> = {
  ghostline: {
    name: 'Ghostline',
    tagline: 'Daemons, spikes, forbidden firmware',
    description:
      'A whisper broker who moves black ICE, ghostware, and implants nobody should install twice.',
    specialties: ['Programmes interdits', 'Implants netrunner', 'Upgrades furtifs'],
  },
  rook: {
    name: 'Rook',
    tagline: 'Stolen crates, live weapons, hard chrome',
    description:
      'A convoy hijacker turned fixer. If it was locked in a Militech container, Rook can price it.',
    specialties: ['Armes lourdes', 'Blindages corpo', 'Chrome de combat'],
  },
  velvet: {
    name: 'Velvet Circuit',
    tagline: 'Fashion crime, forged IDs, designer contraband',
    description:
      'Luxury contraband for runners who want to look expensive while doing illegal things.',
    specialties: ['Vetements rares', 'Stims premium', 'Badges contrefaits'],
  },
}

const DEFAULT_MIN_LEVEL = 12
const DEFAULT_ROTATION_HOURS = 12
const DEFAULT_PLAYER_LISTING_TAX_PER_ITEM = 2500
const DEFAULT_PLAYER_LISTING_MIN_DURATION_HOURS = 6
const DEFAULT_PLAYER_LISTING_MAX_DURATION_HOURS = 72
const SLOTS_PER_VENDOR = 4
const VENDOR_ORDER = Object.keys(BLACK_MARKET_VENDORS) as VendorKey[]

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

  static async getPlayerListingTaxPerItem() {
    const value = await BlackMarketSetting.query()
      .where('key', 'player_listing_tax_per_item')
      .first()
    return Math.max(
      0,
      Number(value?.value || DEFAULT_PLAYER_LISTING_TAX_PER_ITEM) ||
        DEFAULT_PLAYER_LISTING_TAX_PER_ITEM
    )
  }

  static async getPlayerListingMinDurationHours() {
    const value = await BlackMarketSetting.query()
      .where('key', 'player_listing_min_duration_hours')
      .first()
    return Math.max(
      1,
      Number(value?.value || DEFAULT_PLAYER_LISTING_MIN_DURATION_HOURS) ||
        DEFAULT_PLAYER_LISTING_MIN_DURATION_HOURS
    )
  }

  static async getPlayerListingMaxDurationHours() {
    const minDuration = await this.getPlayerListingMinDurationHours()
    const value = await BlackMarketSetting.query()
      .where('key', 'player_listing_max_duration_hours')
      .first()

    return Math.max(
      minDuration,
      Number(value?.value || DEFAULT_PLAYER_LISTING_MAX_DURATION_HOURS) ||
        DEFAULT_PLAYER_LISTING_MAX_DURATION_HOURS
    )
  }

  static getVendorDefinitions() {
    return BLACK_MARKET_VENDORS
  }

  private static async getVendorRotationWindow(vendorKey: VendorKey, now = Date.now()) {
    const rotationHours = await this.getRotationHours()
    const rotationMs = rotationHours * 60 * 60 * 1000
    const vendorIndex = Math.max(0, VENDOR_ORDER.indexOf(vendorKey))
    const vendorStepMs = rotationMs / VENDOR_ORDER.length
    const shiftedNow = now - vendorIndex * vendorStepMs
    const vendorRotationIndex = Math.floor(shiftedNow / rotationMs)
    const startsAt = vendorRotationIndex * rotationMs + vendorIndex * vendorStepMs

    return {
      rotationKey: vendorRotationIndex * VENDOR_ORDER.length + vendorIndex,
      startsAt,
      endsAt: startsAt + rotationMs,
      rotationHours,
    }
  }

  private static async getAllVendorRotationWindows(now = Date.now()) {
    const windows = await Promise.all(
      VENDOR_ORDER.map(
        async (vendorKey) =>
          [vendorKey, await this.getVendorRotationWindow(vendorKey, now)] as const
      )
    )

    return new Map(windows)
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
      profile.heat = Math.max(0, profile.heat - elapsedHours * 3)
      profile.lastHeatDecayAt = now
      await profile.save()
    }

    return profile
  }

  private static async ensureReputations(characterId: number) {
    const records: CharacterBlackMarketReputation[] = []

    for (const vendorKey of Object.keys(BLACK_MARKET_VENDORS) as VendorKey[]) {
      records.push(
        await CharacterBlackMarketReputation.firstOrCreate(
          { characterId, vendorKey },
          { reputation: 0 }
        )
      )
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

  private static getPriceContext(
    basePrice: number,
    heat: number,
    reputation: number,
    shopDiscount: number
  ) {
    const heatMarkup = this.getHeatState(heat).markupPercent
    const reputationDiscount = Math.min(18, Math.floor(reputation / 5))
    const talentDiscount = Math.min(12, Math.floor(shopDiscount * 0.5))
    const finalMultiplier = Math.max(
      0.55,
      (100 + heatMarkup - reputationDiscount - talentDiscount) / 100
    )
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

  private static getMinimumAuctionBid(listing: BlackMarketPlayerListing) {
    const openingBid = Math.max(1, listing.startingBid || 1)

    if (!listing.currentBid || listing.currentBid <= 0) {
      return openingBid
    }

    return listing.currentBid + Math.max(1, Math.ceil(listing.currentBid * 0.05))
  }

  private static async addInventoryStock(characterId: number, itemId: number, quantity: number) {
    if (quantity <= 0) {
      return
    }

    const existing = await InventoryItem.query()
      .where('characterId', characterId)
      .where('itemId', itemId)
      .where('isEquipped', false)
      .first()

    if (existing) {
      existing.quantity += quantity
      await existing.save()
      return
    }

    await InventoryItem.create({
      characterId,
      itemId,
      quantity,
      isEquipped: false,
    })
  }

  private static async settleExpiredPlayerListings(now = Date.now()) {
    const expiredListings = await BlackMarketPlayerListing.query()
      .where('status', 'active')
      .where('endsAt', '<=', now)
      .orderBy('endsAt', 'asc')
      .orderBy('id', 'asc')

    for (const listing of expiredListings) {
      const seller = await Character.find(listing.sellerCharacterId)

      if (
        listing.listingType === 'auction' &&
        listing.currentBidderCharacterId &&
        (listing.currentBid || 0) > 0
      ) {
        await this.addInventoryStock(
          listing.currentBidderCharacterId,
          listing.itemId,
          listing.quantityAvailable
        )

        if (seller) {
          seller.credits += listing.currentBid || 0
          await seller.save()
        }

        listing.quantityAvailable = 0
        listing.status = 'sold'
        await listing.save()
        continue
      }

      if (seller && listing.quantityAvailable > 0) {
        await this.addInventoryStock(seller.id, listing.itemId, listing.quantityAvailable)
      }

      listing.quantityAvailable = 0
      listing.status = 'expired'
      await listing.save()
    }
  }

  private static async getPlayerMarketState(character: Character) {
    const now = Date.now()
    const [taxPerItem, minDurationHours, maxDurationHours, listings, inventory] = await Promise.all(
      [
        this.getPlayerListingTaxPerItem(),
        this.getPlayerListingMinDurationHours(),
        this.getPlayerListingMaxDurationHours(),
        BlackMarketPlayerListing.query()
          .where('status', 'active')
          .where('endsAt', '>', now)
          .preload('item')
          .preload('seller')
          .preload('currentBidder')
          .orderBy('endsAt', 'asc')
          .orderBy('id', 'desc'),
        InventoryItem.query()
          .where('characterId', character.id)
          .where('quantity', '>', 0)
          .where('isEquipped', false)
          .preload('item')
          .orderBy('quantity', 'desc')
          .orderBy('id', 'asc'),
      ]
    )

    const serializedListings = listings.map((listing) => ({
      id: listing.id,
      sellerCharacterId: listing.sellerCharacterId,
      listingType: listing.listingType,
      status: listing.status,
      quantityTotal: listing.quantityTotal,
      quantityAvailable: listing.quantityAvailable,
      pricePerItem: listing.pricePerItem,
      startingBid: listing.startingBid,
      currentBid: listing.currentBid,
      bidCount: listing.bidCount,
      listingTax: listing.listingTax,
      startsAt: listing.startsAt,
      endsAt: listing.endsAt,
      minNextBid: listing.listingType === 'auction' ? this.getMinimumAuctionBid(listing) : null,
      canBuy:
        listing.listingType === 'direct' &&
        listing.sellerCharacterId !== character.id &&
        listing.quantityAvailable > 0,
      canBid:
        listing.listingType === 'auction' &&
        listing.sellerCharacterId !== character.id &&
        listing.quantityAvailable > 0,
      canCancel:
        listing.sellerCharacterId === character.id &&
        (listing.listingType !== 'auction' || !listing.currentBidderCharacterId),
      isOwnListing: listing.sellerCharacterId === character.id,
      isHighestBidder:
        listing.listingType === 'auction' && listing.currentBidderCharacterId === character.id,
      seller: {
        id: listing.seller.id,
        name: listing.seller.name,
      },
      currentBidder:
        listing.currentBidder && listing.currentBidderCharacterId
          ? {
              id: listing.currentBidder.id,
              name: listing.currentBidder.name,
            }
          : null,
      item: listing.item.serialize(),
    }))

    return {
      config: {
        taxPerItem,
        minDurationHours,
        maxDurationHours,
        defaultDurationHours: Math.min(maxDurationHours, Math.max(minDurationHours, 24)),
      },
      listings: serializedListings,
      myListings: serializedListings.filter(
        (listing) => listing.sellerCharacterId === character.id
      ),
      inventory: inventory.map((entry) => ({
        inventoryItemId: entry.id,
        quantity: entry.quantity,
        item: entry.item.serialize(),
      })),
      stats: {
        activeListings: serializedListings.length,
        directListings: serializedListings.filter((listing) => listing.listingType === 'direct')
          .length,
        auctionListings: serializedListings.filter((listing) => listing.listingType === 'auction')
          .length,
      },
    }
  }

  private static async ensureRotation() {
    const windows = await this.getAllVendorRotationWindows()

    for (const vendorKey of VENDOR_ORDER) {
      const window = windows.get(vendorKey)!
      const existingDeals = await BlackMarketDeal.query()
        .where('vendorKey', vendorKey)
        .where('rotationKey', window.rotationKey)
      const existingKeys = new Set(existingDeals.map((deal) => `${deal.vendorKey}:${deal.slot}`))
      const picks = await this.pickCatalog(window.rotationKey, vendorKey)

      for (const pick of picks) {
        const dealKey = `${vendorKey}:${pick.slot}`
        if (existingKeys.has(dealKey)) continue

        await BlackMarketDeal.create({
          rotationKey: window.rotationKey,
          vendorKey,
          slot: pick.slot,
          itemId: pick.entry.itemId,
          price: pick.entry.basePrice,
          stock: pick.entry.stock,
          heatValue: pick.entry.heatValue,
          reputationRequired: pick.entry.reputationRequired,
          requiredSpec: pick.entry.requiredSpec,
          featured: pick.entry.isFeatured,
          startsAt: window.startsAt,
          endsAt: window.endsAt,
        })
      }
    }
  }

  static async getMarketState(character: Character) {
    await this.settleExpiredPlayerListings()
    await this.ensureRotation()
    await character.refresh()

    const [vendorWindows, profile, reputationMap, talentBonuses, cleaners, playerMarket] =
      await Promise.all([
        this.getAllVendorRotationWindows(),
        this.ensureProfile(character),
        this.ensureReputations(character.id),
        TalentService.getCharacterBonuses(character.id),
        BlackMarketCleaner.query()
          .where('isActive', true)
          .orderBy('sortOrder', 'asc')
          .orderBy('id', 'asc'),
        this.getPlayerMarketState(character),
      ])
    const dealGroups = await Promise.all(
      VENDOR_ORDER.map(async (vendorKey) => {
        const window = vendorWindows.get(vendorKey)!
        return BlackMarketDeal.query()
          .where('vendorKey', vendorKey)
          .where('rotationKey', window.rotationKey)
          .preload('item')
          .orderBy('slot', 'asc')
      })
    )
    const deals = dealGroups.flat()

    const heatState = this.getHeatState(profile.heat)
    const nextRefresh = [...vendorWindows.entries()].sort(
      (left, right) => left[1].endsAt - right[1].endsAt
    )[0]

    const vendors = VENDOR_ORDER.map((vendorKey) => {
      const reputation = reputationMap.get(vendorKey)?.reputation || 0
      const info = BLACK_MARKET_VENDORS[vendorKey]
      const window = vendorWindows.get(vendorKey)!
      const vendorDeals = deals
        .filter((deal) => deal.vendorKey === vendorKey)
        .map((deal) => {
          const price = this.getPriceContext(
            deal.price,
            profile.heat,
            reputation,
            talentBonuses.shopDiscount
          )
          const hasSpecLock = Boolean(
            deal.requiredSpec && deal.requiredSpec !== character.chosenSpec
          )
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
            requiredSpecLabel: deal.requiredSpec
              ? SPEC_LABELS[deal.requiredSpec] || deal.requiredSpec
              : null,
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
        refreshAt: window.endsAt,
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
        refreshAt: nextRefresh?.[1].endsAt || Date.now(),
        refreshVendorKey: nextRefresh?.[0] || null,
        refreshVendorName: nextRefresh ? BLACK_MARKET_VENDORS[nextRefresh[0]].name : null,
        rotationHours: nextRefresh?.[1].rotationHours || (await this.getRotationHours()),
      },
      vendors,
      cleaners: cleaners.map((cleaner) => ({
        ...cleaner.serialize(),
        price: this.getCleanerPrice(cleaner.basePrice, profile.heat),
        disabled: profile.heat <= 0,
      })),
      playerMarket,
      nightMarketLive: vendors.some((vendor) => vendor.deals.some((deal) => deal.featured)),
      rotationKey: nextRefresh?.[1].rotationKey || 0,
    }
  }

  static async buyDeal(character: Character, dealId: number, requestedQuantity: number) {
    await this.ensureRotation()

    const vendorWindows = await this.getAllVendorRotationWindows()
    const quantity = Math.max(1, Math.floor(requestedQuantity || 1))
    const deal = await BlackMarketDeal.query().where('id', dealId).preload('item').firstOrFail()
    const activeWindow = vendorWindows.get(deal.vendorKey as VendorKey)

    if (!activeWindow || deal.rotationKey !== activeWindow.rotationKey) {
      throw new Error('Offer expired')
    }

    const [profile, reputationMap, talentBonuses] = await Promise.all([
      this.ensureProfile(character),
      this.ensureReputations(character.id),
      TalentService.getCharacterBonuses(character.id),
    ])

    const reputationEntry = reputationMap.get(deal.vendorKey as VendorKey)
    const reputation = reputationEntry?.reputation || 0

    if (deal.requiredSpec && deal.requiredSpec !== character.chosenSpec) {
      throw new Error(
        `Cette offre est reservee aux ${SPEC_LABELS[deal.requiredSpec] || deal.requiredSpec}`
      )
    }

    if (reputation < deal.reputationRequired) {
      throw new Error(
        `Reputation ${deal.reputationRequired} requise chez ${BLACK_MARKET_VENDORS[deal.vendorKey as VendorKey].name}`
      )
    }

    if (deal.stock < quantity) {
      throw new Error('Stock insuffisant')
    }

    const price = this.getPriceContext(
      deal.price,
      profile.heat,
      reputation,
      talentBonuses.shopDiscount
    )
    const totalPrice = price.finalPrice * quantity

    if (character.credits < totalPrice) {
      throw new Error('Not enough credits')
    }

    character.credits -= totalPrice
    deal.stock -= quantity

    await this.addInventoryStock(character.id, deal.itemId, quantity)

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

  static async createPlayerListing(
    character: Character,
    inventoryItemId: number,
    requestedQuantity: number,
    listingType: 'direct' | 'auction',
    requestedPrice: number,
    requestedDurationHours: number
  ) {
    await this.settleExpiredPlayerListings()

    const inventoryItem = await InventoryItem.query()
      .where('id', inventoryItemId)
      .where('characterId', character.id)
      .where('isEquipped', false)
      .preload('item')
      .firstOrFail()

    if (inventoryItem.quantity <= 0) {
      throw new Error('Item indisponible')
    }

    const quantity = Math.max(
      1,
      Math.min(inventoryItem.quantity, Math.floor(requestedQuantity || 1))
    )
    const price = Math.max(1, Math.floor(requestedPrice || 1))
    const minDurationHours = await this.getPlayerListingMinDurationHours()
    const maxDurationHours = await this.getPlayerListingMaxDurationHours()
    const durationHours = Math.max(
      minDurationHours,
      Math.min(maxDurationHours, Math.floor(requestedDurationHours || minDurationHours))
    )
    const listingTax = (await this.getPlayerListingTaxPerItem()) * quantity

    if (character.credits < listingTax) {
      throw new Error('Credits insuffisants pour payer la taxe de mise en vente')
    }

    character.credits -= listingTax
    inventoryItem.quantity -= quantity

    if (inventoryItem.quantity <= 0) {
      await inventoryItem.delete()
    } else {
      await inventoryItem.save()
    }

    const now = Date.now()
    const listing = await BlackMarketPlayerListing.create({
      sellerCharacterId: character.id,
      itemId: inventoryItem.itemId,
      listingType,
      quantityTotal: quantity,
      quantityAvailable: quantity,
      pricePerItem: listingType === 'direct' ? price : null,
      startingBid: listingType === 'auction' ? price : null,
      currentBid: null,
      currentBidderCharacterId: null,
      bidCount: 0,
      listingTax,
      status: 'active',
      startsAt: now,
      endsAt: now + durationHours * 60 * 60 * 1000,
    })

    await character.save()

    return {
      listingId: listing.id,
      itemName: inventoryItem.item.name,
      quantity,
      listingType,
      listingTax,
      durationHours,
    }
  }

  static async buyPlayerListing(
    character: Character,
    listingId: number,
    requestedQuantity: number
  ) {
    await this.settleExpiredPlayerListings()

    const listing = await BlackMarketPlayerListing.query()
      .where('id', listingId)
      .where('status', 'active')
      .where('listingType', 'direct')
      .preload('item')
      .preload('seller')
      .firstOrFail()

    if (listing.sellerCharacterId === character.id) {
      throw new Error('Impossible d acheter sa propre annonce')
    }

    if (listing.endsAt <= Date.now()) {
      throw new Error('Annonce expiree')
    }

    const quantity = Math.max(
      1,
      Math.min(listing.quantityAvailable, Math.floor(requestedQuantity || 1))
    )

    if (listing.quantityAvailable < quantity) {
      throw new Error('Quantite indisponible')
    }

    const totalPrice = Math.max(1, listing.pricePerItem || 0) * quantity
    if (character.credits < totalPrice) {
      throw new Error('Not enough credits')
    }

    const seller = await Character.findOrFail(listing.sellerCharacterId)

    character.credits -= totalPrice
    seller.credits += totalPrice
    listing.quantityAvailable -= quantity

    if (listing.quantityAvailable <= 0) {
      listing.quantityAvailable = 0
      listing.status = 'sold'
    }

    await this.addInventoryStock(character.id, listing.itemId, quantity)
    await character.save()
    await seller.save()
    await listing.save()

    return {
      itemName: listing.item.name,
      quantity,
      totalPrice,
      sellerName: listing.seller.name,
    }
  }

  static async placePlayerBid(character: Character, listingId: number, requestedBid: number) {
    await this.settleExpiredPlayerListings()

    const listing = await BlackMarketPlayerListing.query()
      .where('id', listingId)
      .where('status', 'active')
      .where('listingType', 'auction')
      .preload('item')
      .firstOrFail()

    if (listing.sellerCharacterId === character.id) {
      throw new Error('Impossible d encherir sur sa propre annonce')
    }

    if (listing.endsAt <= Date.now()) {
      throw new Error('Enchere terminee')
    }

    const bidAmount = Math.max(1, Math.floor(requestedBid || 1))
    const minimumBid = this.getMinimumAuctionBid(listing)

    if (bidAmount < minimumBid) {
      throw new Error(`Enchere minimale: ${minimumBid} credits`)
    }

    const previousBidAmount = listing.currentBid || 0
    const previousBidderId = listing.currentBidderCharacterId
    const extraRequired =
      previousBidderId === character.id ? bidAmount - previousBidAmount : bidAmount

    if (extraRequired <= 0) {
      throw new Error('Le nouveau montant doit etre superieur a votre enchere actuelle')
    }

    if (character.credits < extraRequired) {
      throw new Error('Not enough credits')
    }

    character.credits -= extraRequired

    if (previousBidderId && previousBidderId !== character.id) {
      const previousBidder = await Character.find(previousBidderId)
      if (previousBidder) {
        previousBidder.credits += previousBidAmount
        await previousBidder.save()
      }
    }

    listing.currentBid = bidAmount
    listing.currentBidderCharacterId = character.id
    listing.bidCount += 1

    await listing.save()
    await character.save()

    return {
      itemName: listing.item.name,
      bidAmount,
      endsAt: listing.endsAt,
    }
  }

  static async cancelPlayerListing(character: Character, listingId: number) {
    await this.settleExpiredPlayerListings()

    const listing = await BlackMarketPlayerListing.query()
      .where('id', listingId)
      .where('sellerCharacterId', character.id)
      .where('status', 'active')
      .preload('item')
      .firstOrFail()

    if (listing.listingType === 'auction' && listing.currentBidderCharacterId) {
      throw new Error('Impossible d annuler une enchere avec une offre en cours')
    }

    if (listing.quantityAvailable > 0) {
      await this.addInventoryStock(character.id, listing.itemId, listing.quantityAvailable)
    }

    const returnedQuantity = listing.quantityAvailable
    listing.quantityAvailable = 0
    listing.status = 'cancelled'
    await listing.save()

    return {
      itemName: listing.item.name,
      returnedQuantity,
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
