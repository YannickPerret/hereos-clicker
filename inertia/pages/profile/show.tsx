import { router } from '@inertiajs/react'
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

interface Props {
  character: Character
  equippedItems: EquippedItem[]
  talents: Talent[]
}

const SPEC_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  hacker: { label: 'HACKER', color: 'text-cyber-green', border: 'border-cyber-green/30' },
  netrunner: { label: 'NETRUNNER', color: 'text-cyber-blue', border: 'border-cyber-blue/30' },
  samurai: { label: 'STREET SAMURAI', color: 'text-cyber-red', border: 'border-cyber-red/30' },
  chrome_dealer: { label: 'CHROME DEALER', color: 'text-cyber-yellow', border: 'border-cyber-yellow/30' },
}

const TYPE_LABELS: Record<string, string> = {
  weapon: 'ARME',
  armor: 'ARMURE',
  implant: 'IMPLANT',
}

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-cyber-green',
  rare: 'text-cyber-blue',
  epic: 'text-cyber-purple',
  legendary: 'text-cyber-yellow',
}

const EFFECT_LABELS: Record<string, string> = {
  attack_boost: 'ATK',
  defense_boost: 'DEF',
  click_multiplier: 'CPC',
  permanent_click: 'CPC',
  hp_restore: 'HP',
  xp_boost: 'XP',
}

export default function PublicProfile({ character, equippedItems, talents }: Props) {
  const spec = character.chosenSpec ? SPEC_CONFIG[character.chosenSpec] : null
  const equippedByType = {
    weapon: equippedItems.find((entry) => entry.item.type === 'weapon') || null,
    armor: equippedItems.find((entry) => entry.item.type === 'armor') || null,
    implant: equippedItems.find((entry) => entry.item.type === 'implant') || null,
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-gray-600">Profil Public</div>
            <h1 className="mt-2 text-2xl font-bold tracking-widest text-cyber-blue">{character.name}</h1>
          </div>
          <button
            type="button"
            onClick={() => router.visit('/play')}
            className="rounded border border-gray-800 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-500 transition hover:border-gray-600 hover:text-white"
          >
            Retour
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-lg border border-cyber-blue/20 bg-cyber-dark p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Specialisation</span>
                {spec ? (
                  <span className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${spec.color} ${spec.border}`}>
                    {spec.label}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-widest text-gray-600">Aucune</span>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Niveau</span><span className="text-cyber-green">LVL {character.level}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">HP</span><span className="text-cyber-red">{character.hpCurrent}/{character.hpMax}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ATK</span><span className="text-cyber-red">{character.attack}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">DEF</span><span className="text-cyber-blue">{character.defense}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CPC</span><span className="text-cyber-pink">{character.creditsPerClick}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CPS</span><span className="text-cyber-purple">{character.creditsPerSecond}/s</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Crit%</span><span className="text-cyber-yellow">{character.critChance}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Crit Dmg</span><span className="text-cyber-yellow">{character.critDamage}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ELO</span><span className="text-cyber-yellow">{character.pvpRating}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">PvP</span><span className="text-white">{character.pvpWins}W / {character.pvpLosses}L</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Clicks</span><span className="text-cyber-pink">{character.totalClicks.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-cyber-purple/20 bg-cyber-dark p-4">
              <h2 className="mb-3 text-sm uppercase tracking-widest text-cyber-purple">Equipement</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(['weapon', 'armor', 'implant'] as const).map((type) => {
                  const entry = equippedByType[type]

                  return (
                    <div key={type} className="rounded-lg border border-gray-800 bg-cyber-black/40 p-3">
                      <div className="mb-1 text-[10px] uppercase tracking-widest text-gray-600">{TYPE_LABELS[type]}</div>
                      {entry ? (
                        <>
                          <div className={`text-sm font-bold ${RARITY_TEXT[entry.item.rarity] || 'text-white'}`}>
                            {entry.item.name}
                          </div>
                          <div className="mt-1 text-[10px] text-gray-500 line-clamp-2">{entry.item.description}</div>
                          {entry.item.effectType && entry.item.effectValue !== null && (
                            <div className="mt-2 text-[10px] text-cyber-green">
                              {EFFECT_LABELS[entry.item.effectType] || entry.item.effectType}: +{entry.item.effectValue}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-700">[ Vide ]</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-cyber-green/20 bg-cyber-dark p-4">
              <h2 className="mb-3 text-sm uppercase tracking-widest text-cyber-green">Talents Debloques</h2>
              {talents.length === 0 ? (
                <div className="text-sm text-gray-600">Aucun talent debloque.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {talents
                    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
                    .map((talent) => (
                      <div key={talent.id} className="rounded border border-gray-800 bg-cyber-black/30 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-white">{talent.name}</div>
                          <div className="text-[10px] uppercase tracking-widest text-gray-600">T{talent.tier}</div>
                        </div>
                        <div className="mt-1 text-[10px] text-gray-500 uppercase tracking-widest">
                          {SPEC_CONFIG[talent.spec]?.label || talent.spec}
                        </div>
                        <div className="mt-2 text-[10px] text-cyber-green">
                          {talent.effectType}: +{talent.effectValue}
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
