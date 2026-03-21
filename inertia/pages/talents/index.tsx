import { router } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface TalentNode {
  id: number
  name: string
  description: string
  spec: string
  tier: number
  choiceGroup: number
  effectType: string
  effectValue: number
  cost: number
  requiresLevel: number
  unlocked: boolean
  canUnlock: boolean
  otherChoicePicked: boolean
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

function TalentCard({
  talent,
  config,
  characterLevel,
  onClick,
}: {
  talent: TalentNode
  config: (typeof SPEC_CONFIG)[string]
  characterLevel: number
  onClick: () => void
}) {
  const isUnlocked = talent.unlocked
  const canUnlock = talent.canUnlock
  const isExcluded = talent.otherChoicePicked

  return (
    <button
      type="button"
      disabled={!canUnlock}
      onClick={canUnlock ? onClick : undefined}
      className={`w-full rounded-lg border p-2.5 text-left transition-all ${
        isUnlocked
          ? `${config.border}/50 ${config.bg}/10`
          : canUnlock
            ? `${config.border}/30 hover:${config.bg}/10 cursor-pointer`
            : isExcluded
              ? 'border-gray-800/30 opacity-25'
              : 'border-gray-800/50 opacity-40'
      }`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className={`text-[10px] font-bold ${isUnlocked ? config.color : canUnlock ? 'text-gray-300' : 'text-gray-700'}`}>
          {talent.name}
        </span>
        {isUnlocked && (
          <span className={`text-[8px] ${config.bg}/20 ${config.color} px-1 py-0.5 rounded uppercase`}>
            actif
          </span>
        )}
      </div>
      <p className="text-[9px] text-gray-600 leading-tight mb-1">{talent.description}</p>
      {!isUnlocked && !isExcluded && (
        <div className="flex items-center gap-2 text-[9px]">
          <span className={canUnlock ? 'text-cyber-purple' : 'text-gray-700'}>{talent.cost} PT</span>
          <span className={characterLevel >= talent.requiresLevel ? 'text-gray-600' : 'text-cyber-red'}>
            LVL {talent.requiresLevel}
          </span>
        </div>
      )}
    </button>
  )
}

export default function Talents(props: Props) {
  const { character } = props
  const { tree, bonuses, hasRespecChip } = props
  const [showRespecConfirm, setShowRespecConfirm] = useState(false)
  const [expandedSpec, setExpandedSpec] = useState<string | null>(props.character.chosenSpec || null)

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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cyber-purple tracking-widest">ARBRE DES TALENTS</h1>
          <p className="text-xs text-gray-600 mt-1">
            {character.chosenSpec
              ? <>Specialisation: <span className={SPEC_CONFIG[character.chosenSpec]?.color}>{SPEC_CONFIG[character.chosenSpec]?.label}</span> — 20 tiers, 2 choix par tier</>
              : 'Choisis ta voie. Une seule spec a la fois. 2 choix par tier.'}
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
          { label: 'Combat', value: `ATK+${bonuses.atkFlat} DEF+${bonuses.defFlat} HP+${bonuses.hpFlat} (+${bonuses.combatPercent}%)`, color: 'text-cyber-red' },
          { label: 'Economie', value: `-${bonuses.shopDiscount}% prix, +${bonuses.lootBonus}% loot, +${bonuses.dungeonCredits}% donjon`, color: 'text-cyber-yellow' },
        ].map((b) => (
          <div key={b.label} className="bg-cyber-dark/50 border border-gray-800 rounded px-3 py-2">
            <div className="text-[10px] text-gray-600 uppercase">{b.label}</div>
            <div className={`text-[10px] font-bold ${b.color}`}>{b.value}</div>
          </div>
        ))}
      </div>

      {/* Spec selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Object.entries(SPEC_CONFIG).map(([spec, config]) => {
          const talents = tree[spec] || []
          const unlockedCount = talents.filter((t) => t.unlocked).length
          const totalTiers = 20
          const isChosenSpec = character.chosenSpec === spec
          const isLockedSpec = character.chosenSpec !== null && character.chosenSpec !== spec
          const isExpanded = expandedSpec === spec

          return (
            <button
              key={spec}
              type="button"
              onClick={() => setExpandedSpec(isExpanded ? null : spec)}
              className={`rounded-lg border p-3 text-left transition-all ${
                isExpanded
                  ? `${config.border}/60 ${config.glow}`
                  : isChosenSpec
                    ? `${config.border}/40 ${config.bg}/5`
                    : isLockedSpec
                      ? 'border-gray-800/30 opacity-40'
                      : `${config.border}/20 hover:${config.border}/40`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${config.color} tracking-widest`}>{config.label}</span>
                {isChosenSpec && (
                  <span className={`text-[8px] ${config.bg}/20 ${config.color} px-1.5 py-0.5 rounded-full uppercase`}>
                    ta spec
                  </span>
                )}
              </div>
              <p className="text-[9px] text-gray-600 mb-2">{config.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 h-1 bg-cyber-black rounded-full overflow-hidden mr-2">
                  <div
                    className={`h-full ${config.bg}/60 transition-all duration-500`}
                    style={{ width: `${(unlockedCount / (totalTiers * 2)) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-600">{unlockedCount}/{totalTiers}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded talent tree */}
      {expandedSpec && tree[expandedSpec] && (() => {
        const config = SPEC_CONFIG[expandedSpec]
        const talents = tree[expandedSpec]
        const isLockedSpec = character.chosenSpec !== null && character.chosenSpec !== expandedSpec

        // Group by tier
        const tiers: Record<number, TalentNode[]> = {}
        for (const t of talents) {
          if (!tiers[t.tier]) tiers[t.tier] = []
          tiers[t.tier].push(t)
        }

        const tierNumbers = Object.keys(tiers).map(Number).sort((a, b) => a - b)

        return (
          <div className={`bg-cyber-dark border rounded-lg p-5 ${config.border}/30 ${config.glow}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-bold ${config.color} tracking-widest`}>
                {config.label} — ARBRE DE TALENTS
              </h2>
              {isLockedSpec && (
                <span className="text-[9px] bg-gray-800 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                  verrouille
                </span>
              )}
            </div>

            <div className="space-y-1">
              {tierNumbers.map((tier) => {
                const tierTalents = tiers[tier].sort((a, b) => a.choiceGroup - b.choiceGroup)
                const choiceA = tierTalents.find((t) => t.choiceGroup === 1)
                const choiceB = tierTalents.find((t) => t.choiceGroup === 2)

                return (
                  <div key={tier} className="relative">
                    {/* Tier connector */}
                    {tier > 1 && (
                      <div className="flex justify-center mb-1">
                        <div className={`w-0.5 h-3 ${
                          tiers[tier - 1]?.some((t) => t.unlocked) ? `${config.bg}/40` : 'bg-gray-800'
                        }`} />
                      </div>
                    )}

                    <div className="flex items-stretch gap-2">
                      {/* Tier badge */}
                      <div className={`flex items-center justify-center w-10 shrink-0 rounded border text-[10px] font-bold ${
                        tierTalents.some((t) => t.unlocked)
                          ? `${config.border}/50 ${config.color}`
                          : 'border-gray-800 text-gray-700'
                      }`}>
                        T{tier}
                      </div>

                      {/* Choice A */}
                      <div className="flex-1 min-w-0">
                        {choiceA && (
                          <TalentCard
                            talent={choiceA}
                            config={config}
                            characterLevel={character.level}
                            onClick={() => router.post('/talents/unlock', { talentId: choiceA.id })}
                          />
                        )}
                      </div>

                      {/* OR divider */}
                      <div className="flex items-center px-1">
                        <span className="text-[8px] text-gray-700 uppercase font-bold">ou</span>
                      </div>

                      {/* Choice B */}
                      <div className="flex-1 min-w-0">
                        {choiceB && (
                          <TalentCard
                            talent={choiceB}
                            config={config}
                            characterLevel={character.level}
                            onClick={() => router.post('/talents/unlock', { talentId: choiceB.id })}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

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
