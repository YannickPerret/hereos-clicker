import { router } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface TalentNode {
  id: number
  name: string
  description: string
  spec: string
  tier: number
  effectType: string
  effectValue: number
  cost: number
  requiresTalentId: number | null
  requiresLevel: number
  unlocked: boolean
  canUnlock: boolean
}

interface Props {
  character: {
    id: number
    name: string
    level: number
    talentPoints: number
    chosenSpec: string | null
  }
  tree: Record<string, TalentNode[]>
  bonuses: Record<string, number>
  hasRespecChip: { inventoryItemId: number } | null
}

const SPEC_CONFIG: Record<string, { label: string; color: string; border: string; bg: string; glow: string; desc: string }> = {
  hacker: {
    label: 'HACKER',
    color: 'text-cyber-green',
    border: 'border-cyber-green',
    bg: 'bg-cyber-green',
    glow: 'shadow-[0_0_20px_rgba(0,255,65,0.15)]',
    desc: 'Puissance de clic brute. Chaque frappe compte.',
  },
  netrunner: {
    label: 'NETRUNNER',
    color: 'text-cyber-blue',
    border: 'border-cyber-blue',
    bg: 'bg-cyber-blue',
    glow: 'shadow-[0_0_20px_rgba(0,240,255,0.15)]',
    desc: 'Revenus passifs. Tes daemons minent pendant que tu dors.',
  },
  samurai: {
    label: 'STREET SAMURAI',
    color: 'text-cyber-red',
    border: 'border-cyber-red',
    bg: 'bg-cyber-red',
    glow: 'shadow-[0_0_20px_rgba(255,0,64,0.15)]',
    desc: 'Combat. Plus fort, plus resistant, plus mortel.',
  },
  chrome_dealer: {
    label: 'CHROME DEALER',
    color: 'text-cyber-yellow',
    border: 'border-cyber-yellow',
    bg: 'bg-cyber-yellow',
    glow: 'shadow-[0_0_20px_rgba(255,255,0,0.15)]',
    desc: 'Economie et loot. Le vrai pouvoir, c\'est l\'argent.',
  },
}

export default function Talents({ character, tree, bonuses, hasRespecChip }: Props) {
  const [showRespecConfirm, setShowRespecConfirm] = useState(false)

  return (
    <GameLayout>
      {/* Respec confirmation modal */}
      {showRespecConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowRespecConfirm(false)}>
          <div className="bg-cyber-dark border border-cyber-red rounded-lg p-6 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-cyber-red tracking-widest mb-3">NEURAL RESPEC</h3>
            <p className="text-xs text-gray-400 mb-4">
              Tous tes talents seront effaces et tes points recuperes.
              Ta specialisation sera debloquee. Le Neural Respec Chip sera consomme.
            </p>
            <p className="text-cyber-yellow text-sm font-bold mb-4">Cette action est irreversible.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRespecConfirm(false)}
                className="flex-1 py-2 text-xs border border-gray-700 text-gray-500 rounded hover:bg-gray-900 transition-all uppercase"
              >
                Annuler
              </button>
              <button
                onClick={() => { router.post('/talents/respec'); setShowRespecConfirm(false) }}
                className="flex-1 py-2 text-xs bg-cyber-red/20 border border-cyber-red text-cyber-red rounded hover:bg-cyber-red/30 transition-all uppercase font-bold"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyber-purple tracking-widest">ARBRE DES TALENTS</h1>
          <p className="text-xs text-gray-600 mt-1">
            {character.chosenSpec
              ? <>Specialisation: <span className={SPEC_CONFIG[character.chosenSpec]?.color}>{SPEC_CONFIG[character.chosenSpec]?.label}</span></>
              : 'Choisis ta voie. Une seule spec a la fois.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasRespecChip && (
            <button
              onClick={() => setShowRespecConfirm(true)}
              className="px-3 py-2 text-[10px] bg-cyber-red/10 border border-cyber-red/40 text-cyber-red rounded hover:bg-cyber-red/20 transition-all uppercase tracking-wider"
            >
              RESPEC
            </button>
          )}
          <div className="bg-cyber-dark border border-cyber-purple/30 rounded-lg px-4 py-2 text-center">
            <div className="text-[10px] text-gray-600 uppercase">Points</div>
            <div className="text-xl font-bold text-cyber-purple">{character.talentPoints}</div>
          </div>
          <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg px-4 py-2 text-center">
            <div className="text-[10px] text-gray-600 uppercase">Niveau</div>
            <div className="text-xl font-bold text-cyber-green">{character.level}</div>
          </div>
        </div>
      </div>

      {/* Active bonuses */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { label: 'CPC Bonus', value: `+${bonuses.cpcFlat} (+${bonuses.cpcPercent}%)`, color: 'text-cyber-green' },
          { label: 'CPS Bonus', value: `+${bonuses.cpsFlat} (+${bonuses.cpsPercent}%)`, color: 'text-cyber-blue' },
          { label: 'Combat', value: `ATK+${bonuses.atkFlat} DEF+${bonuses.defFlat}`, color: 'text-cyber-red' },
          { label: 'Economie', value: `-${bonuses.shopDiscount}% prix, +${bonuses.lootBonus}% loot`, color: 'text-cyber-yellow' },
        ].map((b) => (
          <div key={b.label} className="bg-cyber-dark/50 border border-gray-800 rounded px-3 py-2">
            <div className="text-[10px] text-gray-600 uppercase">{b.label}</div>
            <div className={`text-xs font-bold ${b.color}`}>{b.value}</div>
          </div>
        ))}
      </div>

      {/* Talent Trees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(tree).map(([spec, talents]) => {
          const config = SPEC_CONFIG[spec]
          const unlockedCount = talents.filter((t) => t.unlocked).length
          const isChosenSpec = character.chosenSpec === spec
          const isLockedSpec = character.chosenSpec !== null && character.chosenSpec !== spec

          return (
            <div
              key={spec}
              className={`bg-cyber-dark border rounded-lg p-5 transition-all ${
                isChosenSpec
                  ? `${config.border}/50 ${config.glow}`
                  : isLockedSpec
                    ? 'border-gray-800/30 opacity-40'
                    : `${config.border}/20`
              }`}
            >
              {/* Spec header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-sm font-bold ${config.color} tracking-widest`}>{config.label}</h2>
                  {isChosenSpec && (
                    <span className={`text-[9px] ${config.bg}/20 ${config.color} px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                      ta spec
                    </span>
                  )}
                  {isLockedSpec && (
                    <span className="text-[9px] bg-gray-800 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                      verrouille
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-600">{unlockedCount}/{talents.length}</span>
              </div>
              <p className="text-[10px] text-gray-600 mb-4">{config.desc}</p>

              {/* Progress */}
              <div className="h-1 bg-cyber-black rounded-full mb-4 overflow-hidden">
                <div
                  className={`h-full ${config.bg}/60 transition-all duration-500`}
                  style={{ width: `${(unlockedCount / talents.length) * 100}%` }}
                />
              </div>

              {/* Talent nodes */}
              <div className="space-y-2">
                {talents.map((talent, i) => {
                  const isUnlocked = talent.unlocked
                  const canUnlock = talent.canUnlock

                  return (
                    <div key={talent.id} className="relative">
                      {i > 0 && (
                        <div className={`absolute -top-2 left-6 w-0.5 h-2 ${
                          talents[i - 1].unlocked ? `${config.bg}/40` : 'bg-gray-800'
                        }`} />
                      )}

                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          isUnlocked
                            ? `${config.border}/40 ${config.bg}/5`
                            : canUnlock
                              ? `${config.border}/30 ${config.bg}/5 hover:${config.bg}/10 cursor-pointer`
                              : 'border-gray-800/50 opacity-40'
                        }`}
                        onClick={() => {
                          if (canUnlock) {
                            router.post('/talents/unlock', { talentId: talent.id })
                          }
                        }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${
                          isUnlocked
                            ? `${config.border} ${config.color}`
                            : canUnlock
                              ? `${config.border}/50 ${config.color}/50`
                              : 'border-gray-800 text-gray-700'
                        }`}>
                          T{talent.tier}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isUnlocked ? config.color : !canUnlock ? 'text-gray-700' : 'text-gray-400'}`}>
                              {talent.name}
                            </span>
                            {isUnlocked && (
                              <span className={`text-[9px] ${config.bg}/20 ${config.color} px-1.5 py-0.5 rounded uppercase`}>
                                actif
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-600 truncate">{talent.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          {isUnlocked ? (
                            <span className={`text-[10px] ${config.color}`}>OK</span>
                          ) : (
                            <div>
                              <div className={`text-xs font-bold ${canUnlock ? 'text-cyber-purple' : 'text-gray-700'}`}>
                                {talent.cost} PT
                              </div>
                              <div className="text-[9px] text-gray-700">
                                LVL {talent.requiresLevel}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Respec hint */}
      {character.chosenSpec && !hasRespecChip && (
        <div className="mt-6 text-center">
          <p className="text-[10px] text-gray-700">
            Pour changer de specialisation, achete un <span className="text-cyber-yellow">Neural Respec Chip</span> au shop (50 000 credits).
          </p>
        </div>
      )}
    </GameLayout>
  )
}
