import { router } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
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
    rotationHours: number
  }
  vendors: Vendor[]
  cleaners: Cleaner[]
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

const TYPE_LABELS: Record<string, string> = {
  weapon: 'ARME',
  armor: 'ARMURE',
  implant: 'IMPLANT',
  clothes_hair: 'CHEVEUX',
  clothes_face: 'VISAGE',
  clothes_outer: 'HAUT',
  clothes_legs: 'BAS',
  consumable: 'CONSOMMABLE',
  upgrade: 'UPGRADE',
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

function formatTimeRemaining(target: number) {
  const remainingMs = Math.max(0, target - Date.now())
  const totalSeconds = Math.floor(remainingMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export default function BlackMarket({ character, profile, vendors, cleaners, nightMarketLive }: Props) {
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(() => formatTimeRemaining(profile.refreshAt))

  useEffect(() => {
    setTimeLeft(formatTimeRemaining(profile.refreshAt))
    const timer = window.setInterval(() => {
      setTimeLeft(formatTimeRemaining(profile.refreshAt))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [profile.refreshAt])

  const totalDeals = useMemo(() => vendors.reduce((sum, vendor) => sum + vendor.deals.length, 0), [vendors])

  const getQuantity = (dealId: number, stock: number) => {
    const parsed = Number.parseInt(quantities[dealId] ?? '1', 10)
    const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    return Math.max(1, Math.min(stock, quantity))
  }

  const setQuantity = (dealId: number, stock: number, quantity: number) => {
    const next = Math.max(1, Math.min(stock, Math.floor(quantity)))
    setQuantities((current) => ({ ...current, [dealId]: String(next) }))
  }

  const setQuantityInput = (dealId: number, stock: number, value: string) => {
    if (value === '') {
      setQuantities((current) => ({ ...current, [dealId]: '' }))
      return
    }

    const parsed = Number.parseInt(value, 10)
    setQuantity(dealId, stock, Number.isFinite(parsed) ? parsed : 1)
  }

  return (
    <GameLayout>
      <div className="relative overflow-hidden rounded-2xl border border-cyber-red/20 bg-[radial-gradient(circle_at_top_left,rgba(255,58,94,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(0,240,255,0.12),transparent_36%),#0a0a0f] p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-cyber-red">
              <span>Night City Blackline</span>
              {nightMarketLive && (
                <span className="rounded-full border border-cyber-yellow/40 bg-cyber-yellow/10 px-2 py-0.5 text-cyber-yellow">
                  Night Market Live
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black uppercase tracking-[0.28em] text-white">
              Marche Noir
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-400">
              Fixers, chrome vole, vetements de contrebande et offres qui tournent toutes les {profile.rotationHours} heures.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-cyber-yellow/20 bg-cyber-black/60 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Credits</div>
              <div className="mt-1 text-2xl font-bold text-cyber-yellow">
                {character.credits.toLocaleString()}c
              </div>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${HEAT_STYLES[profile.heatLabel] || HEAT_STYLES.FROIDE}`}>
              <div className="text-[10px] uppercase tracking-[0.28em] opacity-80">Chaleur</div>
              <div className="mt-1 text-2xl font-bold">{profile.heat}</div>
              <div className="text-xs opacity-80">
                {profile.heatLabel}
                {profile.heatMarkupPercent > 0 ? ` • +${profile.heatMarkupPercent}% prix` : ' • aucun surcout'}
              </div>
            </div>
            <div className="rounded-xl border border-cyber-blue/20 bg-cyber-black/60 px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500">Refresh</div>
              <div className="mt-1 text-2xl font-bold text-cyber-blue">{timeLeft}</div>
              <div className="text-xs text-gray-500">{totalDeals} offres en rotation</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-2xl border border-cyber-blue/20 bg-cyber-dark/70 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-[0.18em] text-cyber-blue">Protocoles Cleaners</h2>
              <p className="mt-1 text-xs text-gray-500">
                Fais tomber la chaleur avant qu’un fixer commence a te surtaxer.
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Spec active: <span className="text-white">{character.chosenSpec || 'Aucune'}</span></div>
              <div>Les talents shop reduisent aussi une partie des prix ici.</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {cleaners.map((cleaner) => (
              <div key={cleaner.key} className="rounded-xl border border-gray-800 bg-cyber-black/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-cyber-red">{cleaner.name}</h3>
                    <p className="mt-2 text-xs text-gray-500">{cleaner.description}</p>
                  </div>
                  <div className="rounded-full border border-cyber-red/30 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-cyber-red">
                    -{cleaner.heatReduction}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Tarif</span>
                  <span className="font-bold text-cyber-yellow">{cleaner.price.toLocaleString()}c</span>
                </div>

                <button
                  type="button"
                  disabled={cleaner.disabled || character.credits < cleaner.price}
                  onClick={() => router.post('/black-market/clean', { cleanerKey: cleaner.key }, { preserveScroll: true })}
                  className={`mt-4 w-full rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
                    cleaner.disabled
                      ? 'cursor-not-allowed border-gray-800 bg-gray-950 text-gray-700'
                      : character.credits >= cleaner.price
                        ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20'
                        : 'cursor-not-allowed border-cyber-red/20 bg-cyber-red/5 text-cyber-red/40'
                  }`}
                >
                  {cleaner.disabled ? '[ AUCUNE CHALEUR ]' : '[ EFFACER LES TRACES ]'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-cyber-yellow/20 bg-cyber-dark/70 p-5">
          <h2 className="text-lg font-bold uppercase tracking-[0.18em] text-cyber-yellow">Regles Du Reseau</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-400">
            <p>Chaque achat augmente la chaleur. Plus tu chauffes la ville, plus les prix montent.</p>
            <p>Chaque fixer a sa propre reputation. Les grosses pieces demandent du cred reel, pas juste des credits.</p>
            <p>Certains lots sont reserves a une specialisation. Le marche noir aime les profils utiles.</p>
            <p>Le stock repart a zero a chaque rotation. Si tu rates la fenetre, le deal disparait.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {vendors.map((vendor) => (
          <section key={vendor.key} className="rounded-2xl border border-gray-800 bg-cyber-dark/70 p-5">
            <div className="mb-5 flex flex-col gap-4 border-b border-gray-800 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cyber-blue">
                  <span>{vendor.tagline}</span>
                  <span className="rounded-full border border-cyber-blue/30 px-2 py-0.5 text-cyber-blue">
                    REP {vendor.reputation}
                  </span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-[0.18em] text-white">{vendor.name}</h2>
                <p className="mt-2 text-sm text-gray-400">{vendor.description}</p>
              </div>

              <div className="grid gap-2 text-xs text-gray-400">
                <div>
                  Specialites: <span className="text-white">{vendor.specialties.join(' • ')}</span>
                </div>
                <div>
                  Prochain palier: <span className="text-cyber-yellow">{vendor.nextMilestone ? `REP ${vendor.nextMilestone}` : 'max'}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {vendor.deals.map((deal) => {
                const quantity = getQuantity(deal.id, deal.stock)
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
                        Featured
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="text-[10px] uppercase tracking-[0.28em] text-gray-600">
                        Slot {deal.slot} • {TYPE_LABELS[deal.item.type] || deal.item.type}
                      </div>
                      <h3 className={`mt-2 text-lg font-bold ${RARITY_TEXT[deal.item.rarity] || 'text-white'}`}>
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
                        <span>Base</span>
                        <span>{deal.basePrice.toLocaleString()}c</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Prix reel</span>
                        <span className="font-bold text-cyber-yellow">{deal.price.toLocaleString()}c</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Stock</span>
                        <span>{deal.stock}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Chaleur</span>
                        <span className="text-cyber-red">+{deal.heatValue}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500">
                        <span>Rep requise</span>
                        <span>{deal.reputationRequired}</span>
                      </div>
                      {deal.requiredSpecLabel && (
                        <div className="flex items-center justify-between text-gray-500">
                          <span>Spec</span>
                          <span>{deal.requiredSpecLabel}</span>
                        </div>
                      )}
                      {(deal.heatMarkup > 0 || deal.reputationDiscount > 0 || deal.talentDiscount > 0) && (
                        <div className="rounded-lg border border-gray-800 bg-cyber-dark/60 px-3 py-2 text-[11px] text-gray-500">
                          <div>Heat: +{deal.heatMarkup}%</div>
                          <div>Fixer rep: -{deal.reputationDiscount}%</div>
                          <div>Talents: -{deal.talentDiscount}%</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(deal.id, deal.stock, quantity - 1)}
                          disabled={quantity <= 1 || deal.stock <= 1}
                          className="h-9 w-9 rounded border border-gray-700 bg-cyber-dark text-sm font-bold text-gray-300 transition hover:border-cyber-blue/50 hover:text-cyber-blue disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={deal.stock}
                          value={quantities[deal.id] ?? '1'}
                          onChange={(event) => setQuantityInput(deal.id, deal.stock, event.target.value)}
                          className="h-9 flex-1 rounded border border-gray-800 bg-cyber-dark px-3 text-center text-sm font-bold text-white focus:border-cyber-blue/50 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(deal.id, deal.stock, quantity + 1)}
                          disabled={quantity >= deal.stock}
                          className="h-9 w-9 rounded border border-gray-700 bg-cyber-dark text-sm font-bold text-gray-300 transition hover:border-cyber-blue/50 hover:text-cyber-blue disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-gray-600">
                        <span>Quantite {quantity}</span>
                        <span>Total {totalPrice.toLocaleString()}c</span>
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
                      onClick={() => router.post(`/black-market/deals/${deal.id}/buy`, { quantity }, { preserveScroll: true })}
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
    </GameLayout>
  )
}
