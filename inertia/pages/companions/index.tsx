import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import GameLayout from '~/components/layout'

interface OwnedCompanion {
  id: number
  companionId: number
  name: string
  description: string
  rarity: string
  bonusType: string
  bonusValue: number
  baseValue: number
  icon: string
  isActive: boolean
  level: number
  xp: number
  nextBonusValue: number
  upgradePrice: number
}

interface ShopCompanion {
  id: number
  name: string
  description: string
  rarity: string
  bonusType: string
  bonusValue: number
  icon: string
  basePrice: number
}

interface Props {
  character: { id: number; name: string; credits: number }
  owned: OwnedCompanion[]
  shop: ShopCompanion[]
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-700 text-gray-400',
  uncommon: 'border-cyber-green/30 text-cyber-green',
  rare: 'border-cyber-blue/30 text-cyber-blue',
  epic: 'border-cyber-purple/30 text-cyber-purple',
  legendary: 'border-cyber-yellow/30 text-cyber-yellow',
}

// BONUS_LABELS moved inside component to use t()

export default function Companions({ character, owned, shop }: Props) {
  const { t } = useTranslation(['companions', 'common'])
  const active = owned.find((c) => c.isActive)
  const companionActionOptions = {
    preserveScroll: true,
    preserveState: true,
    only: ['character', 'owned', 'shop', 'errors', 'success'],
  } as const

  const BONUS_LABELS: Record<string, string> = {
    cpc_flat: t('companions:bonusTypes.cpc'),
    cps_flat: t('companions:bonusTypes.cps'),
    atk_flat: t('companions:bonusTypes.attack'),
    def_flat: t('companions:bonusTypes.defense'),
    crit_chance: t('companions:bonusTypes.critChance'),
    hp_flat: t('companions:bonusTypes.maxHp'),
    loot_bonus: t('companions:bonusTypes.lootBonus'),
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-cyber-pink tracking-widest">
            {t('companions:title')}
          </h1>
          <span className="text-xs text-cyber-yellow">{character.credits.toLocaleString()}c</span>
        </div>

        {/* Active Companion */}
        {active && (
          <div
            className={`bg-cyber-dark border rounded-lg p-4 mb-6 ${RARITY_COLORS[active.rarity]}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{active.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">{active.name}</div>
                  <div className="text-[10px] text-gray-600">{active.description}</div>
                  <div className="text-xs mt-1">
                    <span className="text-cyber-green">
                      +{active.bonusValue} {BONUS_LABELS[active.bonusType]}
                    </span>
                    <span className="text-gray-700 ml-2">LVL {active.level}</span>
                  </div>
                  <div className="text-[10px] mt-1 text-gray-500">
                    {t('companions:nextTier', { value: active.nextBonusValue, price: active.upgradePrice.toLocaleString() })}
                  </div>
                </div>
              </div>
              <div className="text-[10px] bg-cyber-green/20 text-cyber-green px-2 py-1 rounded border border-cyber-green/30">
                {t('companions:active')}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Owned */}
          <div>
            <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-3">
              {t('companions:yourCompanions', { count: owned.length })}
            </h2>
            <div className="space-y-2">
              {owned.length === 0 ? (
                <div className="text-xs text-gray-700 italic text-center py-8">
                  {t('companions:noCompanions')}
                </div>
              ) : (
                owned.map((c) => (
                  <div
                    key={c.id}
                    className={`bg-cyber-dark border rounded-lg p-3 ${RARITY_COLORS[c.rarity]}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{c.name}</div>
                          <div className="text-[10px] text-gray-600">
                            +{c.bonusValue} {BONUS_LABELS[c.bonusType]} • LVL {c.level}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {t('companions:nextLevel', { value: c.nextBonusValue, price: c.upgradePrice.toLocaleString() })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {c.isActive ? (
                          <button
                            onClick={() =>
                              router.post(
                                `/companions/${c.id}/deactivate`,
                                {},
                                companionActionOptions
                              )
                            }
                            className="text-[10px] px-2 py-1 rounded border border-gray-700 text-gray-500 hover:text-gray-400"
                          >
                            {t('companions:deactivate')}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              router.post(
                                `/companions/${c.id}/activate`,
                                {},
                                companionActionOptions
                              )
                            }
                            className="text-[10px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10"
                          >
                            {t('companions:activate')}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            router.post(
                              `/companions/${c.id}/upgrade`,
                              {},
                              companionActionOptions
                            )
                          }
                          disabled={character.credits < c.upgradePrice}
                          className={`text-[10px] px-2 py-1 rounded border font-bold ${
                            character.credits >= c.upgradePrice
                              ? 'border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10'
                              : 'border-gray-800 text-gray-700 cursor-not-allowed'
                          }`}
                        >
                          {t('companions:upgrade', { price: c.upgradePrice.toLocaleString() })}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-3">
              {t('companions:shopSection', { count: shop.length })}
            </h2>
            <div className="space-y-2">
              {shop.map((c) => {
                const canAfford = character.credits >= c.basePrice
                return (
                  <div
                    key={c.id}
                    className={`bg-cyber-dark border rounded-lg p-3 ${RARITY_COLORS[c.rarity]}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{c.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-white">{c.name}</div>
                          <div className="text-[10px] text-gray-600">{c.description}</div>
                          <div className="text-[10px] text-cyber-green mt-0.5">
                            +{c.bonusValue} {BONUS_LABELS[c.bonusType]}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          router.post(`/companions/${c.id}/buy`, {}, companionActionOptions)
                        }
                        disabled={!canAfford}
                        className={`text-[10px] px-3 py-1.5 rounded border font-bold ${
                          canAfford
                            ? 'border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10'
                            : 'border-gray-800 text-gray-700 cursor-not-allowed'
                        }`}
                      >
                        {c.basePrice.toLocaleString()}c
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
