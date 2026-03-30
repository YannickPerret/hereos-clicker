import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import GameLayout from '~/components/layout'

interface Item {
  id: number
  name: string
  description: string
  type: string
  rarity: string
  effectType: string | null
  effectValue: number | null
}

interface Deal {
  id: number
  slot: number
  stock: number
  heatValue: number
  reputationRequired: number
  requiredSpec: string | null
  requiredSpecLabel: string | null
  featured: boolean
  price: number
  basePrice: number
  heatMarkup: number
  reputationDiscount: number
  talentDiscount: number
  canBuy: boolean
  lockedReason: string | null
  item: Item
}

interface Vendor {
  key: string
  name: string
  tagline: string
  description: string
  specialties: string[]
  reputation: number
  nextMilestone: number | null
  refreshAt: number
  deals: Deal[]
}

interface Cleaner {
  key: string
  name: string
  description: string
  basePrice: number
  heatReduction: number
  price: number
  disabled: boolean
}

interface PlayerListing {
  id: number
  sellerCharacterId: number
  listingType: 'direct' | 'auction'
  status: 'active' | 'sold' | 'expired' | 'cancelled'
  quantityTotal: number
  quantityAvailable: number
  pricePerItem: number | null
  startingBid: number | null
  currentBid: number | null
  bidCount: number
  listingTax: number
  startsAt: number
  endsAt: number
  minNextBid: number | null
  canBuy: boolean
  canBid: boolean
  canCancel: boolean
  isOwnListing: boolean
  isHighestBidder: boolean
  seller: {
    id: number
    name: string
  }
  currentBidder: {
    id: number
    name: string
  } | null
  item: Item
}

interface PlayerInventoryEntry {
  inventoryItemId: number
  quantity: number
  item: Item
}

interface PlayerMarketConfig {
  durationOptions: Array<{
    hours: number
    taxPerItem: number
  }>
  defaultDurationHours: number
}

interface PlayerMarketStats {
  activeListings: number
  directListings: number
  auctionListings: number
}

interface Props {
  character: {
    id: number
    credits: number
    level: number
    chosenSpec: string | null
  }
  profile: {
    heat: number
    heatLabel: string
    heatMarkupPercent: number
    refreshAt: number
    refreshVendorKey: string | null
    refreshVendorName: string | null
    rotationHours: number
  }
  vendors: Vendor[]
  cleaners: Cleaner[]
  playerMarket: {
    config: PlayerMarketConfig
    listings: PlayerListing[]
    myListings: PlayerListing[]
    inventory: PlayerInventoryEntry[]
    stats: PlayerMarketStats
  }
  nightMarketLive: boolean
}

const HEAT_STYLES: Record<string, string> = {
  FROIDE: 'text-cyber-green border-cyber-green/30 bg-cyber-green/10',
  TIEDE: 'text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/10',
  HAUTE: 'text-cyber-orange border-cyber-orange/30 bg-cyber-orange/10',
  BRULE: 'text-cyber-red border-cyber-red/30 bg-cyber-red/10',
}

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-cyber-green',
  rare: 'text-cyber-blue',
  epic: 'text-cyber-pink',
  legendary: 'text-cyber-yellow',
}

const EFFECT_LABELS: Record<string, string> = {
  click_multiplier: 'CPC',
  permanent_click: 'CPC permanent',
  attack_boost: 'ATK',
  defense_boost: 'DEF',
  hp_restore: 'Soin',
  xp_boost: 'XP',
}

function formatEffect(item: Item) {
  if (!item.effectType || item.effectValue === null) return null
  if (item.effectType === 'permanent_click') return `+${item.effectValue}% CPC permanent`
  if (item.effectType === 'hp_restore') return `+${item.effectValue} HP`
  return `+${item.effectValue} ${EFFECT_LABELS[item.effectType] || item.effectType}`
}

function formatTimeRemaining(target: number, now: number) {
  const remainingMs = Math.max(0, target - now)
  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatCredits(value: number) {
  return `${value.toLocaleString()}c`
}

export default function BlackMarket({
  character,
  profile,
  vendors,
  cleaners,
  playerMarket,
  nightMarketLive,
}: Props) {
  const { t } = useTranslation(['shop', 'common'])
  const [vendorQuantities, setVendorQuantities] = useState<Record<number, string>>({})
  const [listingQuantities, setListingQuantities] = useState<Record<number, string>>({})
  const [bidAmounts, setBidAmounts] = useState<Record<number, string>>({})
  const [playerFilter, setPlayerFilter] = useState<'all' | 'direct' | 'auction'>('all')
  const [clock, setClock] = useState(() => Date.now())
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'fixers' | 'players'>(() => {
    if (typeof window === 'undefined') return 'fixers'
    return window.localStorage.getItem('blackMarketTab') === 'players' ? 'players' : 'fixers'
  })
  const [listingForm, setListingForm] = useState(() => ({
    inventoryItemId: playerMarket.inventory[0]?.inventoryItemId || 0,
    listingType: 'direct' as 'direct' | 'auction',
    quantity: '1',
    price: '1',
    durationHours: String(playerMarket.config.defaultDurationHours),
  }))

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('blackMarketTab', activeTab)
    }
  }, [activeTab])

  useEffect(() => {
    const selectedStillExists = playerMarket.inventory.some(
      (entry) => entry.inventoryItemId === listingForm.inventoryItemId
    )

    if (!selectedStillExists) {
      setListingForm((current) => ({
        ...current,
        inventoryItemId: playerMarket.inventory[0]?.inventoryItemId || 0,
      }))
    }
  }, [listingForm.inventoryItemId, playerMarket.inventory])

  const totalDeals = useMemo(
    () => vendors.reduce((sum, vendor) => sum + vendor.deals.length, 0),
    [vendors]
  )

  const selectedInventoryEntry = useMemo(
    () =>
      playerMarket.inventory.find(
        (entry) => entry.inventoryItemId === listingForm.inventoryItemId
      ) || null,
    [listingForm.inventoryItemId, playerMarket.inventory]
  )

  const selectedDurationOption = useMemo(() => {
    const parsed = Number.parseInt(listingForm.durationHours, 10)
    const duration =
      Number.isFinite(parsed) && parsed > 0 ? parsed : playerMarket.config.defaultDurationHours

    return (
      playerMarket.config.durationOptions.find((option) => option.hours === duration) ||
      playerMarket.config.durationOptions.find(
        (option) => option.hours === playerMarket.config.defaultDurationHours
      ) ||
      playerMarket.config.durationOptions[0]
    )
  }, [listingForm.durationHours, playerMarket.config])

  const listingQuantity = useMemo(() => {
    const parsed = Number.parseInt(listingForm.quantity, 10)
    const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    return Math.max(1, Math.min(selectedInventoryEntry?.quantity || 1, quantity))
  }, [listingForm.quantity, selectedInventoryEntry])

  const listingPrice = useMemo(() => {
    const parsed = Number.parseInt(listingForm.price, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  }, [listingForm.price])

  const listingDurationHours = useMemo(() => {
    return selectedDurationOption?.hours || playerMarket.config.defaultDurationHours
  }, [playerMarket.config.defaultDurationHours, selectedDurationOption])

  const listingTax = listingQuantity * (selectedDurationOption?.taxPerItem || 0)
  const canCreateListing =
    !!selectedInventoryEntry &&
    listingQuantity > 0 &&
    listingPrice > 0 &&
    character.credits >= listingTax

  const filteredListings = useMemo(() => {
    if (playerFilter === 'all') {
      return playerMarket.listings
    }

    return playerMarket.listings.filter((listing) => listing.listingType === playerFilter)
  }, [playerFilter, playerMarket.listings])

  const getVendorQuantity = (dealId: number, stock: number) => {
    const parsed = Number.parseInt(vendorQuantities[dealId] ?? '1', 10)
    const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    return Math.max(1, Math.min(stock, quantity))
  }

  const setVendorQuantity = (dealId: number, stock: number, quantity: number) => {
    const next = Math.max(1, Math.min(stock, Math.floor(quantity)))
    setVendorQuantities((current) => ({ ...current, [dealId]: String(next) }))
  }

  const setVendorQuantityInput = (dealId: number, stock: number, value: string) => {
    if (value === '') {
      setVendorQuantities((current) => ({ ...current, [dealId]: '' }))
      return
    }

    const parsed = Number.parseInt(value, 10)
    setVendorQuantity(dealId, stock, Number.isFinite(parsed) ? parsed : 1)
  }

  const getListingQuantity = (listingId: number, stock: number) => {
    const parsed = Number.parseInt(listingQuantities[listingId] ?? '1', 10)
    const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    return Math.max(1, Math.min(stock, quantity))
  }

  const setListingQuantity = (listingId: number, stock: number, quantity: number) => {
    const next = Math.max(1, Math.min(stock, Math.floor(quantity)))
    setListingQuantities((current) => ({ ...current, [listingId]: String(next) }))
  }

  const setListingQuantityInput = (listingId: number, stock: number, value: string) => {
    if (value === '') {
      setListingQuantities((current) => ({ ...current, [listingId]: '' }))
      return
    }

    const parsed = Number.parseInt(value, 10)
    setListingQuantity(listingId, stock, Number.isFinite(parsed) ? parsed : 1)
  }

  const getBidAmount = (listing: PlayerListing) => {
    const fallback = listing.minNextBid || listing.startingBid || 1
    const parsed = Number.parseInt(bidAmounts[listing.id] ?? String(fallback), 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  return (
    <GameLayout>
      <div className="mb-6 rounded-2xl border border-cyber-red/20 bg-[radial-gradient(circle_at_top_left,rgba(255,58,94,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(0,240,255,0.12),transparent_36%),#0a0a0f] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-cyber-red">
              <span>{t('shop:blackMarket.header')}</span>
              {nightMarketLive && (
                <span className="rounded-full border border-cyber-yellow/40 bg-cyber-yellow/10 px-2 py-0.5 text-cyber-yellow">
                  {t('shop:blackMarket.live')}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black uppercase tracking-[0.28em] text-white">
              {t('shop:blackMarket.title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-400">
              {t('shop:blackMarket.description', { hours: profile.rotationHours })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-cyber-yellow/20 bg-cyber-black/60 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500">
                {t('shop:blackMarket.credits')}
              </div>
              <div className="mt-1 text-2xl font-bold text-cyber-yellow">
                {formatCredits(character.credits)}
              </div>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${HEAT_STYLES[profile.heatLabel] || HEAT_STYLES.FROIDE}`}
            >
              <div className="text-[10px] uppercase tracking-[0.28em] opacity-80">
                {t('shop:blackMarket.heat')}
              </div>
              <div className="mt-1 text-2xl font-bold">{profile.heat}</div>
              <div className="text-xs opacity-80">
                {profile.heatLabel}
                {profile.heatMarkupPercent > 0
                  ? ` • +${profile.heatMarkupPercent}% prix`
                  : ` • ${t('shop:blackMarket.noMarkup')}`}
              </div>
            </div>
            <div className="rounded-xl border border-cyber-blue/20 bg-cyber-black/60 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500">
                {t('shop:blackMarket.nextRefresh')}
              </div>
              <div className="mt-1 text-2xl font-bold text-cyber-blue">
                {formatTimeRemaining(profile.refreshAt, clock)}
              </div>
              {profile.refreshVendorName && (
                <div className="text-xs text-gray-500">
                  {t('shop:blackMarket.nextTrader', { name: profile.refreshVendorName })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('fixers')}
          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] transition ${
            activeTab === 'fixers'
              ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red'
              : 'border-gray-800 bg-cyber-dark/70 text-gray-400 hover:border-cyber-red/20 hover:text-cyber-red'
          }`}
        >
          {t('shop:blackMarket.fixerTab', { count: totalDeals })}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('players')}
          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] transition ${
            activeTab === 'players'
              ? 'border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue'
              : 'border-gray-800 bg-cyber-dark/70 text-gray-400 hover:border-cyber-blue/20 hover:text-cyber-blue'
          }`}
        >
          {t('shop:blackMarket.playerTab', { count: playerMarket.stats.activeListings })}
        </button>
      </div>

      {activeTab === 'fixers' ? (
        <>
          <div className="mb-8 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-2xl border border-cyber-blue/20 bg-cyber-dark/70 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-[0.18em] text-cyber-blue">
                    {t('shop:blackMarket.cleaners')}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">{t('shop:blackMarket.cleanersDesc')}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>
                    {t('shop:blackMarket.activeSpec', {
                      spec: character.chosenSpec || t('shop:blackMarket.noSpec'),
                    })}
                  </div>
                  <div>{t('shop:blackMarket.talentDiscount')}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {cleaners.map((cleaner) => (
                  <div
                    key={cleaner.key}
                    className="rounded-xl border border-gray-800 bg-cyber-black/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-cyber-red">
                          {cleaner.name}
                        </h3>
                        <p className="mt-2 text-xs text-gray-500">{cleaner.description}</p>
                      </div>
                      <div className="rounded-full border border-cyber-red/30 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-cyber-red">
                        -{cleaner.heatReduction}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-gray-500">{t('shop:blackMarket.price')}</span>
                      <span className="font-bold text-cyber-yellow">
                        {formatCredits(cleaner.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={cleaner.disabled || character.credits < cleaner.price}
                      onClick={() =>
                        router.post(
                          '/black-market/clean',
                          { cleanerKey: cleaner.key },
                          { preserveScroll: true }
                        )
                      }
                      className={`mt-4 w-full rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                        cleaner.disabled
                          ? 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-700'
                          : character.credits >= cleaner.price
                            ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20'
                            : 'cursor-not-allowed border-cyber-red/20 bg-cyber-red/5 text-cyber-red/40'
                      }`}
                    >
                      {cleaner.disabled
                        ? `[ ${t('shop:blackMarket.noHeat')} ]`
                        : `[ ${t('shop:blackMarket.cleanTraces')} ]`}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyber-yellow/20 bg-cyber-dark/70 p-5">
              <h2 className="text-lg font-bold uppercase tracking-[0.18em] text-cyber-yellow">
                {t('shop:blackMarket.rules')}
              </h2>
              <div className="mt-4 space-y-3 text-sm text-gray-400">
                <p>{t('shop:blackMarket.rule1')}</p>
                <p>{t('shop:blackMarket.rule2')}</p>
                <p>{t('shop:blackMarket.rule3')}</p>
                <p>{t('shop:blackMarket.rule4')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {vendors.map((vendor) => (
              <section
                key={vendor.key}
                className="rounded-2xl border border-gray-800 bg-cyber-dark/70 p-5"
              >
                <div className="mb-5 flex flex-col gap-4 border-b border-gray-800 pb-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cyber-blue">
                      <span>{vendor.tagline}</span>
                      <span className="rounded-full border border-cyber-blue/30 px-2 py-0.5 text-cyber-blue">
                        {t('shop:blackMarket.rep', { n: vendor.reputation })}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">
                      {vendor.name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">{vendor.description}</p>
                  </div>

                  <div className="grid gap-2 text-xs text-gray-400">
                    <div>
                      {t('shop:blackMarket.specialties', { list: vendor.specialties.join(' • ') })}
                    </div>
                    <div>
                      {vendor.nextMilestone
                        ? t('shop:blackMarket.nextMilestone', { milestone: vendor.nextMilestone })
                        : t('shop:blackMarket.nextMilestoneMax')}
                    </div>
                    <div>
                      {t('shop:blackMarket.traderRefresh', {
                        time: formatTimeRemaining(vendor.refreshAt, clock),
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  {vendor.deals.map((deal) => {
                    const quantity = getVendorQuantity(deal.id, deal.stock)
                    const totalPrice = deal.price * quantity
                    const canAfford = character.credits >= totalPrice
                    const effect = formatEffect(deal.item)

                    return (
                      <div
                        key={deal.id}
                        className="relative rounded-xl border border-gray-800 bg-cyber-black/80 p-4"
                      >
                        {deal.featured && (
                          <div className="absolute right-3 top-3 rounded-full border border-cyber-yellow/30 bg-cyber-yellow/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-cyber-yellow">
                            {t('shop:blackMarket.featured')}
                          </div>
                        )}

                        <div className="mb-3">
                          <div className="text-[10px] uppercase tracking-[0.28em] text-gray-600">
                            {t('shop:blackMarket.slot', {
                              n: deal.slot,
                              type: t(`common:types.${deal.item.type}`),
                            })}
                          </div>
                          <h3
                            className={`mt-2 text-lg font-bold ${RARITY_TEXT[deal.item.rarity] || 'text-white'}`}
                          >
                            {deal.item.name}
                          </h3>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gray-500">
                            {deal.item.rarity}
                          </div>
                        </div>

                        <p className="min-h-16 text-sm text-gray-400">{deal.item.description}</p>

                        {effect && (
                          <div className="mt-3 rounded-lg border border-cyber-green/20 bg-cyber-green/10 px-3 py-2 text-xs text-cyber-green">
                            {effect}
                          </div>
                        )}

                        <div className="mt-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-gray-500">
                            <span>{t('shop:blackMarket.basePrice')}</span>
                            <span>{formatCredits(deal.basePrice)}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-500">
                            <span>{t('shop:blackMarket.realPrice')}</span>
                            <span className="font-bold text-cyber-yellow">
                              {formatCredits(deal.price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-gray-500">
                            <span>{t('shop:blackMarket.stockLabel')}</span>
                            <span>{deal.stock}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-500">
                            <span>{t('shop:blackMarket.heatLabel')}</span>
                            <span className="text-cyber-red">+{deal.heatValue}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-500">
                            <span>{t('shop:blackMarket.reqRep')}</span>
                            <span>{deal.reputationRequired}</span>
                          </div>
                          {deal.requiredSpecLabel && (
                            <div className="flex items-center justify-between text-gray-500">
                              <span>{t('shop:blackMarket.specLabel')}</span>
                              <span>{deal.requiredSpecLabel}</span>
                            </div>
                          )}
                          {(deal.heatMarkup > 0 ||
                            deal.reputationDiscount > 0 ||
                            deal.talentDiscount > 0) && (
                            <div className="rounded-lg border border-gray-800 bg-cyber-dark/60 px-3 py-2 text-[11px] text-gray-500">
                              <div>{t('shop:blackMarket.heatMarkup', { n: deal.heatMarkup })}</div>
                              <div>
                                {t('shop:blackMarket.fixerDiscount', {
                                  n: deal.reputationDiscount,
                                })}
                              </div>
                              <div>
                                {t('shop:blackMarket.talentDiscountLabel', {
                                  n: deal.talentDiscount,
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setVendorQuantity(deal.id, deal.stock, quantity - 1)}
                              disabled={quantity <= 1 || deal.stock <= 1}
                              className="h-9 w-9 rounded border border-gray-700 bg-cyber-dark text-sm font-bold text-gray-300 transition hover:border-cyber-blue/50 hover:text-cyber-blue disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={deal.stock}
                              value={vendorQuantities[deal.id] ?? '1'}
                              onChange={(event) =>
                                setVendorQuantityInput(deal.id, deal.stock, event.target.value)
                              }
                              className="h-9 flex-1 rounded border border-gray-800 bg-cyber-dark px-3 text-center text-sm font-bold text-white focus:border-cyber-blue/50 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setVendorQuantity(deal.id, deal.stock, quantity + 1)}
                              disabled={quantity >= deal.stock}
                              className="h-9 w-9 rounded border border-gray-700 bg-cyber-dark text-sm font-bold text-gray-300 transition hover:border-cyber-blue/50 hover:text-cyber-blue disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-gray-600">
                            <span>{t('shop:blackMarket.quantityLabel', { n: quantity })}</span>
                            <span>
                              {t('shop:blackMarket.totalLabel', {
                                price: totalPrice.toLocaleString(),
                              })}
                            </span>
                          </div>
                        </div>

                        {deal.lockedReason && (
                          <div className="mt-4 rounded-lg border border-cyber-red/20 bg-cyber-red/10 px-3 py-2 text-xs text-cyber-red">
                            {deal.lockedReason}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={!deal.canBuy || !canAfford}
                          onClick={() =>
                            router.post(
                              `/black-market/deals/${deal.id}/buy`,
                              { quantity },
                              { preserveScroll: true }
                            )
                          }
                          className={`mt-4 w-full rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                            !deal.canBuy
                              ? 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-700'
                              : canAfford
                                ? 'border-cyber-yellow/40 bg-cyber-yellow/10 text-cyber-yellow hover:bg-cyber-yellow/20'
                                : 'cursor-not-allowed border-cyber-red/20 bg-cyber-red/5 text-cyber-red/40'
                          }`}
                        >
                          {!deal.canBuy
                            ? '[ VERROUILLE ]'
                            : canAfford
                              ? `[ ACHETER x${quantity} ]`
                              : '[ FONDS INSUFFISANTS ]'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-800 bg-cyber-dark/70 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-gray-800 bg-cyber-black/60 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                    {t('shop:blackMarket.activeListingsStat')}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {playerMarket.stats.activeListings}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-cyber-black/60 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                    {t('shop:blackMarket.directListingsStat')}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-cyber-yellow">
                    {playerMarket.stats.directListings}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-cyber-black/60 px-4 py-3">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                    {t('shop:blackMarket.auctionListingsStat')}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-cyber-red">
                    {playerMarket.stats.auctionListings}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 lg:items-end">
                <button
                  type="button"
                  disabled={playerMarket.inventory.length === 0}
                  onClick={() => setIsSellModalOpen(true)}
                  className={`rounded-lg border px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] ${
                    playerMarket.inventory.length > 0
                      ? 'border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20'
                      : 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-700'
                  }`}
                >
                  {t('shop:blackMarket.sellItemButton')}
                </button>
                {playerMarket.inventory.length === 0 && (
                  <div className="text-xs text-gray-500">
                    {t('shop:blackMarket.noSellableItems')}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-cyber-dark/70 p-5">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-[0.18em] text-white">
                  {t('shop:blackMarket.marketFeed')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('shop:blackMarket.marketFeedDesc')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'direct', 'auction'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setPlayerFilter(filter)}
                    className={`rounded-full border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] ${
                      playerFilter === filter
                        ? 'border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue'
                        : 'border-gray-800 bg-cyber-black text-gray-400'
                    }`}
                  >
                    {t(`shop:blackMarket.filter.${filter}`)}
                  </button>
                ))}
              </div>
            </div>

            {filteredListings.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-cyber-black/60 p-4 text-sm text-gray-500">
                {t('shop:blackMarket.noPlayerListings')}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredListings.map((listing) => {
                  const effect = formatEffect(listing.item)
                  const directQuantity = getListingQuantity(listing.id, listing.quantityAvailable)
                  const totalDirectPrice = directQuantity * Math.max(1, listing.pricePerItem || 0)
                  const bidAmount = getBidAmount(listing)
                  const canAffordDirect = character.credits >= totalDirectPrice
                  const requiredBidCredits =
                    listing.isHighestBidder && listing.currentBid
                      ? Math.max(0, bidAmount - listing.currentBid)
                      : bidAmount
                  const canAffordBid = character.credits >= requiredBidCredits

                  return (
                    <article
                      key={listing.id}
                      className="rounded-xl border border-gray-800 bg-cyber-black/80 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-gray-500">
                            <span>{t(`common:types.${listing.item.type}`)}</span>
                            <span
                              className={`rounded-full border px-2 py-0.5 ${
                                listing.listingType === 'direct'
                                  ? 'border-cyber-yellow/30 text-cyber-yellow'
                                  : 'border-cyber-red/30 text-cyber-red'
                              }`}
                            >
                              {listing.listingType === 'direct'
                                ? t('shop:blackMarket.directSale')
                                : t('shop:blackMarket.auctionSale')}
                            </span>
                            {listing.isOwnListing && (
                              <span className="rounded-full border border-cyber-blue/30 px-2 py-0.5 text-cyber-blue">
                                {t('shop:blackMarket.ownListing')}
                              </span>
                            )}
                            {listing.isHighestBidder && (
                              <span className="rounded-full border border-cyber-green/30 px-2 py-0.5 text-cyber-green">
                                {t('shop:blackMarket.topBid')}
                              </span>
                            )}
                          </div>
                          <h3
                            className={`mt-2 text-lg font-bold ${RARITY_TEXT[listing.item.rarity] || 'text-white'}`}
                          >
                            {listing.item.name}
                          </h3>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div>{t('shop:blackMarket.endsIn')}</div>
                          <div className="mt-1 font-bold text-cyber-blue">
                            {formatTimeRemaining(listing.endsAt, clock)}
                          </div>
                        </div>
                      </div>

                      <p className="min-h-16 text-sm text-gray-400">{listing.item.description}</p>

                      {effect && (
                        <div className="mt-3 rounded-lg border border-cyber-green/20 bg-cyber-green/10 px-3 py-2 text-xs text-cyber-green">
                          {effect}
                        </div>
                      )}

                      <div className="mt-4 space-y-2 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>{t('shop:blackMarket.seller')}</span>
                          <span>{listing.seller.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{t('shop:blackMarket.stackSize')}</span>
                          <span>x{listing.quantityTotal}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>{t('shop:blackMarket.remainingStock')}</span>
                          <span>x{listing.quantityAvailable}</span>
                        </div>
                        {listing.listingType === 'direct' ? (
                          <div className="flex items-center justify-between">
                            <span>{t('shop:blackMarket.pricePerItem')}</span>
                            <span className="font-bold text-cyber-yellow">
                              {formatCredits(listing.pricePerItem || 0)}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <span>{t('shop:blackMarket.startingBid')}</span>
                              <span>{formatCredits(listing.startingBid || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t('shop:blackMarket.currentBid')}</span>
                              <span className="font-bold text-cyber-yellow">
                                {formatCredits(listing.currentBid || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t('shop:blackMarket.bidCount')}</span>
                              <span>{listing.bidCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>{t('shop:blackMarket.nextBid')}</span>
                              <span>
                                {formatCredits(listing.minNextBid || listing.startingBid || 0)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {listing.listingType === 'direct' ? (
                        <>
                          <div className="mt-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setListingQuantity(
                                    listing.id,
                                    listing.quantityAvailable,
                                    directQuantity - 1
                                  )
                                }
                                disabled={directQuantity <= 1 || listing.quantityAvailable <= 1}
                                className="h-9 w-9 rounded border border-gray-700 bg-cyber-dark text-sm font-bold text-gray-300 transition hover:border-cyber-blue/50 hover:text-cyber-blue disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={listing.quantityAvailable}
                                value={listingQuantities[listing.id] ?? '1'}
                                onChange={(event) =>
                                  setListingQuantityInput(
                                    listing.id,
                                    listing.quantityAvailable,
                                    event.target.value
                                  )
                                }
                                className="h-9 flex-1 rounded border border-gray-800 bg-cyber-dark px-3 text-center text-sm font-bold text-white focus:border-cyber-blue/50 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setListingQuantity(
                                    listing.id,
                                    listing.quantityAvailable,
                                    listing.quantityAvailable
                                  )
                                }
                                className="rounded border border-gray-700 bg-cyber-dark px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300 hover:border-cyber-yellow/50 hover:text-cyber-yellow"
                              >
                                {t('shop:blackMarket.buyAll')}
                              </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-gray-600">
                              <span>
                                {t('shop:blackMarket.quantityLabel', { n: directQuantity })}
                              </span>
                              <span>
                                {t('shop:blackMarket.totalLabel', {
                                  price: totalDirectPrice.toLocaleString(),
                                })}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!listing.canBuy || !canAffordDirect}
                            onClick={() =>
                              router.post(
                                `/black-market/listings/${listing.id}/buy`,
                                { quantity: directQuantity },
                                { preserveScroll: true }
                              )
                            }
                            className={`mt-4 w-full rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                              !listing.canBuy
                                ? 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-700'
                                : canAffordDirect
                                  ? 'border-cyber-yellow/40 bg-cyber-yellow/10 text-cyber-yellow hover:bg-cyber-yellow/20'
                                  : 'cursor-not-allowed border-cyber-red/20 bg-cyber-red/5 text-cyber-red/40'
                            }`}
                          >
                            {listing.isOwnListing
                              ? t('shop:blackMarket.listingOwned')
                              : canAffordDirect
                                ? t('shop:blackMarket.buyDirect', { n: directQuantity })
                                : t('shop:blackMarket.insufficientFunds')}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="mt-4 rounded-lg border border-gray-800 bg-cyber-dark/60 px-3 py-2 text-xs text-gray-500">
                            {t('shop:blackMarket.auctionLotNote', { n: listing.quantityTotal })}
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <input
                              type="number"
                              min={listing.minNextBid || listing.startingBid || 1}
                              value={
                                bidAmounts[listing.id] ??
                                String(listing.minNextBid || listing.startingBid || 1)
                              }
                              onChange={(event) =>
                                setBidAmounts((current) => ({
                                  ...current,
                                  [listing.id]: event.target.value,
                                }))
                              }
                              className="h-10 flex-1 rounded border border-gray-800 bg-cyber-dark px-3 text-sm font-bold text-white focus:border-cyber-red/50 focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={!listing.canBid || !canAffordBid}
                              onClick={() =>
                                router.post(
                                  `/black-market/listings/${listing.id}/bid`,
                                  { bidAmount },
                                  { preserveScroll: true }
                                )
                              }
                              className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                                !listing.canBid
                                  ? 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-700'
                                  : canAffordBid
                                    ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20'
                                    : 'cursor-not-allowed border-cyber-red/20 bg-cyber-red/5 text-cyber-red/40'
                              }`}
                            >
                              {listing.isOwnListing
                                ? t('shop:blackMarket.listingOwned')
                                : t('shop:blackMarket.bidAction')}
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-800 bg-cyber-dark/70 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-[0.18em] text-white">
                  {t('shop:blackMarket.myListings')}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{t('shop:blackMarket.myListingsDesc')}</p>
              </div>
            </div>

            {playerMarket.myListings.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-cyber-black/60 p-4 text-sm text-gray-500">
                {t('shop:blackMarket.noOwnListings')}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {playerMarket.myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="rounded-xl border border-gray-800 bg-cyber-black/80 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                          {listing.listingType === 'direct'
                            ? t('shop:blackMarket.directSale')
                            : t('shop:blackMarket.auctionSale')}
                        </div>
                        <h3
                          className={`mt-2 text-lg font-bold ${RARITY_TEXT[listing.item.rarity] || 'text-white'}`}
                        >
                          {listing.item.name}
                        </h3>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div>{t('shop:blackMarket.endsIn')}</div>
                        <div className="mt-1 font-bold text-cyber-blue">
                          {formatTimeRemaining(listing.endsAt, clock)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>{t('shop:blackMarket.stackSize')}</span>
                        <span>x{listing.quantityTotal}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('shop:blackMarket.remainingStock')}</span>
                        <span>x{listing.quantityAvailable}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t('shop:blackMarket.listingTax')}</span>
                        <span>{formatCredits(listing.listingTax)}</span>
                      </div>
                      {listing.listingType === 'direct' ? (
                        <div className="flex items-center justify-between">
                          <span>{t('shop:blackMarket.pricePerItem')}</span>
                          <span>{formatCredits(listing.pricePerItem || 0)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span>{t('shop:blackMarket.currentBid')}</span>
                            <span>{formatCredits(listing.currentBid || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>{t('shop:blackMarket.highestBidder')}</span>
                            <span>{listing.currentBidder?.name || t('shop:blackMarket.none')}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!listing.canCancel}
                      onClick={() =>
                        router.post(
                          `/black-market/listings/${listing.id}/cancel`,
                          {},
                          { preserveScroll: true }
                        )
                      }
                      className={`mt-4 w-full rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                        listing.canCancel
                          ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20'
                          : 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-700'
                      }`}
                    >
                      {listing.canCancel
                        ? t('shop:blackMarket.cancelListing')
                        : t('shop:blackMarket.cannotCancelBid')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {isSellModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setIsSellModalOpen(false)}
            >
              <div
                className="w-full max-w-3xl rounded-2xl border border-cyber-blue/20 bg-cyber-dark p-5 shadow-[0_0_60px_rgba(0,240,255,0.12)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold uppercase tracking-[0.18em] text-cyber-blue">
                      {t('shop:blackMarket.playerExchangeTitle')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('shop:blackMarket.playerExchangeDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSellModalOpen(false)}
                    className="rounded-lg border border-gray-800 bg-cyber-black px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400 hover:border-cyber-blue/30 hover:text-cyber-blue"
                  >
                    {t('shop:blackMarket.closeModal')}
                  </button>
                </div>

                {playerMarket.inventory.length > 0 ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.22em] text-gray-500">
                          {t('shop:blackMarket.sellFromInventory')}
                        </label>
                        <select
                          value={listingForm.inventoryItemId}
                          onChange={(event) =>
                            setListingForm((current) => ({
                              ...current,
                              inventoryItemId: Number(event.target.value),
                            }))
                          }
                          className="w-full rounded-lg border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/40 focus:outline-none"
                        >
                          {playerMarket.inventory.map((entry) => (
                            <option key={entry.inventoryItemId} value={entry.inventoryItemId}>
                              {entry.item.name} x{entry.quantity}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.22em] text-gray-500">
                          {t('shop:blackMarket.saleMode')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setListingForm((current) => ({ ...current, listingType: 'direct' }))
                            }
                            className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                              listingForm.listingType === 'direct'
                                ? 'border-cyber-yellow/40 bg-cyber-yellow/10 text-cyber-yellow'
                                : 'border-gray-800 bg-cyber-black text-gray-400'
                            }`}
                          >
                            {t('shop:blackMarket.directSale')}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setListingForm((current) => ({ ...current, listingType: 'auction' }))
                            }
                            className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
                              listingForm.listingType === 'auction'
                                ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red'
                                : 'border-gray-800 bg-cyber-black text-gray-400'
                            }`}
                          >
                            {t('shop:blackMarket.auctionSale')}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.22em] text-gray-500">
                          {t('shop:blackMarket.stackQuantity')}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={selectedInventoryEntry?.quantity || 1}
                          value={listingForm.quantity}
                          onChange={(event) =>
                            setListingForm((current) => ({
                              ...current,
                              quantity: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/40 focus:outline-none"
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          {t('shop:blackMarket.availableStack', {
                            n: selectedInventoryEntry?.quantity || 0,
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.22em] text-gray-500">
                          {listingForm.listingType === 'direct'
                            ? t('shop:blackMarket.pricePerItem')
                            : t('shop:blackMarket.startingBid')}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={listingForm.price}
                          onChange={(event) =>
                            setListingForm((current) => ({ ...current, price: event.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-[10px] uppercase tracking-[0.22em] text-gray-500">
                          {t('shop:blackMarket.durationHours')}
                        </label>
                        <select
                          value={listingForm.durationHours}
                          onChange={(event) =>
                            setListingForm((current) => ({
                              ...current,
                              durationHours: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/40 focus:outline-none"
                        >
                          {playerMarket.config.durationOptions.map((option) => (
                            <option key={option.hours} value={option.hours}>
                              {t('shop:blackMarket.durationOptionLabel', {
                                hours: option.hours,
                                tax: option.taxPerItem.toLocaleString(),
                              })}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-xl border border-gray-800 bg-cyber-black/70 px-4 py-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{t('shop:blackMarket.taxPreview')}</span>
                          <span className="font-bold text-cyber-yellow">
                            {formatCredits(listingTax)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>{t('shop:blackMarket.saleDuration')}</span>
                          <span>
                            {t('shop:blackMarket.hoursValue', { n: listingDurationHours })}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {listingForm.listingType === 'direct'
                            ? t('shop:blackMarket.partialPurchaseEnabled')
                            : t('shop:blackMarket.auctionLotNote', { n: listingQuantity })}
                        </div>
                      </div>
                    </div>

                    {selectedInventoryEntry && (
                      <div className="mt-4 rounded-xl border border-gray-800 bg-cyber-black/70 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.22em] text-gray-500">
                              {t(`common:types.${selectedInventoryEntry.item.type}`)}
                            </div>
                            <div
                              className={`mt-1 text-lg font-bold ${RARITY_TEXT[selectedInventoryEntry.item.rarity] || 'text-white'}`}
                            >
                              {selectedInventoryEntry.item.name}
                            </div>
                            <p className="mt-2 text-sm text-gray-400">
                              {selectedInventoryEntry.item.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!canCreateListing}
                            onClick={() =>
                              router.post(
                                '/black-market/listings',
                                {
                                  inventoryItemId: listingForm.inventoryItemId,
                                  quantity: listingQuantity,
                                  listingType: listingForm.listingType,
                                  price: listingPrice,
                                  durationHours: listingDurationHours,
                                },
                                { preserveScroll: true }
                              )
                            }
                            className={`rounded-lg border px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] ${
                              canCreateListing
                                ? 'border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20'
                                : 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-700'
                            }`}
                          >
                            {canCreateListing
                              ? t('shop:blackMarket.createListing')
                              : t('shop:blackMarket.insufficientListingFunds')}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-gray-800 bg-cyber-black/60 p-4 text-sm text-gray-500">
                    {t('shop:blackMarket.noSellableItems')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </GameLayout>
  )
}
