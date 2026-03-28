import { router } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import CyberpunkAvatar from '~/components/cyberpunk_avatar'
import GameLayout from '~/components/layout'

interface Character {
  id: number
  name: string
  level: number
  xp: number
  hpCurrent: number
  hpMax: number
  attack: number
  defense: number
  credits: number
  creditsPerClick: number
  creditsPerSecond: number
  critChance: number
  critDamage: number
  totalClicks: number
  chosenSpec: string | null
  pvpRating: number
  pvpWins: number
  pvpLosses: number
}

interface EquippedItem {
  id: number
  item: {
    id: number
    name: string
    type: string
    rarity: string
    icon?: string | null
    description: string
    effectType: string | null
    effectValue: number | null
  }
}

interface Talent {
  id: number
  name: string
  spec: string
  tier: number
  effectType: string
  effectValue: number
}

interface Companion {
  id: number
  companionId: number
  name: string
  description: string
  rarity: string
  bonusType: string
  bonusValue: number
  icon: string
  isActive: boolean
  level: number
}

interface Props {
  character: Character
  equippedItems: EquippedItem[]
  talents: Talent[]
  companions: Companion[]
  friendStatus: 'self' | 'none' | 'incoming' | 'outgoing' | 'friend'
}

const SPEC_COLORS: Record<string, { color: string; border: string }> = {
  hacker: { color: 'text-cyber-green', border: 'border-cyber-green/30' },
  netrunner: { color: 'text-cyber-blue', border: 'border-cyber-blue/30' },
  samurai: { color: 'text-cyber-red', border: 'border-cyber-red/30' },
  chrome_dealer: { color: 'text-cyber-yellow', border: 'border-cyber-yellow/30' },
}

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-cyber-green',
  rare: 'text-cyber-blue',
  epic: 'text-cyber-purple',
  legendary: 'text-cyber-yellow',
}

export default function PublicProfile({
  character,
  equippedItems,
  talents,
  companions,
  friendStatus,
}: Props) {
  const { t } = useTranslation(['profile', 'common', 'companions'])
  const specColors = character.chosenSpec ? SPEC_COLORS[character.chosenSpec] : null
  const equipmentSlots = [
    'weapon',
    'armor',
    'implant',
    'clothes_hair',
    'clothes_face',
    'clothes_outer',
    'clothes_legs',
  ] as const

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-gray-600">
              {t('publicProfile')}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-widest text-cyber-blue">
              {character.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {friendStatus === 'none' && (
              <button
                type="button"
                onClick={() =>
                  router.post(
                    '/friends/request',
                    { characterName: character.name },
                    { preserveScroll: true }
                  )
                }
                className="rounded border border-cyber-green/30 bg-cyber-green/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-green transition hover:bg-cyber-green/20"
              >
                {t('addFriend')}
              </button>
            )}
            {friendStatus === 'incoming' && (
              <div className="rounded border border-cyber-orange/30 bg-cyber-orange/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-orange">
                {t('incomingRequest')}
              </div>
            )}
            {friendStatus === 'outgoing' && (
              <div className="rounded border border-cyber-blue/30 bg-cyber-blue/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-blue">
                {t('sentRequest')}
              </div>
            )}
            {friendStatus === 'friend' && (
              <div className="rounded border border-cyber-green/30 bg-cyber-green/10 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-green">
                {t('alreadyFriend')}
              </div>
            )}
            <button
              type="button"
              onClick={() => router.visit('/play')}
              className="rounded border border-gray-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-500 transition hover:border-gray-600 hover:text-white"
            >
              {t('back')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-lg border border-cyber-pink/20 bg-cyber-dark p-4">
              <CyberpunkAvatar
                name={character.name}
                chosenSpec={character.chosenSpec}
                equippedItems={equippedItems}
              />
            </div>

            <div className="rounded-lg border border-cyber-blue/20 bg-cyber-dark p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                  {t('specialization')}
                </span>
                {specColors && character.chosenSpec ? (
                  <span
                    className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${specColors.color} ${specColors.border}`}
                  >
                    {t(`common:specs.${character.chosenSpec}`)}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-widest text-gray-600">
                    {t('none')}
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common:stats.level')}</span>
                  <span className="text-cyber-green">LVL {character.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common:stats.hp')}</span>
                  <span className="text-cyber-red">
                    {character.hpCurrent}/{character.hpMax}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common:stats.atk')}</span>
                  <span className="text-cyber-red">{character.attack}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common:stats.def')}</span>
                  <span className="text-cyber-blue">{character.defense}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common:stats.cpc')}</span>
                  <span className="text-cyber-pink">{character.creditsPerClick}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common:stats.cps')}</span>
                  <span className="text-cyber-purple">{character.creditsPerSecond}/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common:stats.crit')}</span>
                  <span className="text-cyber-yellow">{character.critChance}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('common:stats.critDmg')}</span>
                  <span className="text-cyber-yellow">{character.critDamage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ELO</span>
                  <span className="text-cyber-yellow">{character.pvpRating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PvP</span>
                  <span className="text-white">
                    {character.pvpWins}W / {character.pvpLosses}L
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Clicks</span>
                  <span className="text-cyber-pink">{character.totalClicks.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-cyber-purple/20 bg-cyber-dark p-4">
              <h2 className="mb-3 text-sm uppercase tracking-widest text-cyber-purple">
                {t('equipment')}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {equipmentSlots.map((type) => {
                  const entry = equippedItems.find((item) => item.item.type === type) || null

                  return (
                    <div
                      key={type}
                      className="rounded-lg border border-gray-800 bg-cyber-black/40 p-3"
                    >
                      <div className="mb-1 text-[10px] uppercase tracking-widest text-gray-600">
                        {t(`common:types.${type}`)}
                      </div>
                      {entry ? (
                        <>
                          <div
                            className={`text-sm font-bold ${RARITY_TEXT[entry.item.rarity] || 'text-white'}`}
                          >
                            {entry.item.name}
                          </div>
                          <div className="mt-1 text-[10px] text-gray-500 line-clamp-2">
                            {entry.item.description}
                          </div>
                          {entry.item.effectType && entry.item.effectValue !== null && (
                            <div className="mt-2 text-[10px] text-cyber-green">
                              {t(`common:effects.${entry.item.effectType}`, { defaultValue: entry.item.effectType })}: +
                              {entry.item.effectValue}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-700">{t('emptySlot')}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-cyber-green/20 bg-cyber-dark p-4">
              <h2 className="mb-3 text-sm uppercase tracking-widest text-cyber-green">
                {t('unlockedTalents')}
              </h2>
              {talents.length === 0 ? (
                <div className="text-sm text-gray-600">{t('noTalents')}</div>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {talents
                    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
                    .map((talent) => (
                      <div
                        key={talent.id}
                        className="rounded border border-gray-800 bg-cyber-black/30 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-white">{talent.name}</div>
                          <div className="text-[10px] uppercase tracking-widest text-gray-600">
                            T{talent.tier}
                          </div>
                        </div>
                        <div className="mt-1 text-[10px] text-gray-500 uppercase tracking-widest">
                          {t(`common:specs.${talent.spec}`, { defaultValue: talent.spec })}
                        </div>
                        <div className="mt-2 text-[10px] text-cyber-green">
                          {talent.effectType}: +{talent.effectValue}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-cyber-pink/20 bg-cyber-dark p-4">
              <h2 className="mb-3 text-sm uppercase tracking-widest text-cyber-pink">
                {t('dronesCompanions')}
              </h2>
              {companions.length === 0 ? (
                <div className="text-sm text-gray-600">{t('companions:noCompanions')}</div>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {companions
                    .sort(
                      (a, b) =>
                        Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)
                    )
                    .map((companion) => (
                      <div
                        key={companion.id}
                        className="rounded border border-gray-800 bg-cyber-black/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <div className="text-xl leading-none">{companion.icon}</div>
                            <div>
                              <div className="text-xs font-bold text-white">{companion.name}</div>
                              <div className="mt-1 text-[10px] text-gray-500 line-clamp-2">
                                {companion.description}
                              </div>
                              <div className="mt-2 text-[10px] text-cyber-green">
                                +{companion.bonusValue}{' '}
                                {companion.bonusType}
                              </div>
                              <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-600">
                                LVL {companion.level}
                              </div>
                            </div>
                          </div>
                          {companion.isActive && (
                            <div className="rounded border border-cyber-green/30 bg-cyber-green/10 px-2 py-1 text-[10px] uppercase tracking-widest text-cyber-green">
                              {t('companions:active')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
