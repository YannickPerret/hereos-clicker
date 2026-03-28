import { router } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

const SPEC_STYLES: Record<string, { color: string; border: string; bg: string; glow: string }> = {
  hacker: {
    color: 'text-cyber-green',
    border: 'border-cyber-green',
    bg: 'bg-cyber-green',
    glow: 'shadow-[0_0_20px_rgba(0,255,65,0.15)]',
  },
  netrunner: {
    color: 'text-cyber-blue',
    border: 'border-cyber-blue',
    bg: 'bg-cyber-blue',
    glow: 'shadow-[0_0_20px_rgba(0,240,255,0.15)]',
  },
  samurai: {
    color: 'text-cyber-red',
    border: 'border-cyber-red',
    bg: 'bg-cyber-red',
    glow: 'shadow-[0_0_20px_rgba(255,0,64,0.15)]',
  },
  chrome_dealer: {
    color: 'text-cyber-yellow',
    border: 'border-cyber-yellow',
    bg: 'bg-cyber-yellow',
    glow: 'shadow-[0_0_20px_rgba(255,255,0,0.15)]',
  },
}

function TalentCard({
  talent,
  config,
  characterLevel,
  onClick,
  t,
}: {
  talent: TalentNode
  config: (typeof SPEC_STYLES)[string]
  characterLevel: number
  onClick: () => void
  t: (key: string) => string
}) {
  const isUnlocked = talent.unlocked
  const canUnlock = talent.canUnlock
  const isExcluded = talent.otherChoicePicked

  return (
    <button
      type="button"
      disabled={!canUnlock}
      onClick={canUnlock ? onClick : undefined}
      className={`w-full rounded-lg border p-3 text-left transition-all ${
        isUnlocked
          ? `${config.border}/50 ${config.bg}/10`
          : canUnlock
            ? `${config.border}/30 hover:${config.bg}/15 cursor-pointer`
            : isExcluded
              ? 'border-gray-800/30 opacity-20'
              : 'border-gray-800/50 opacity-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-bold ${isUnlocked ? config.color : canUnlock ? 'text-white' : 'text-gray-500'}`}>
          {talent.name}
        </span>
        {isUnlocked && (
          <span className={`text-[9px] ${config.bg}/20 ${config.color} px-1.5 py-0.5 rounded uppercase font-bold`}>
            {t('talents:active')}
          </span>
        )}
      </div>
      <p className={`text-[11px] leading-snug mb-1.5 ${isUnlocked ? 'text-gray-300' : canUnlock ? 'text-gray-400' : 'text-gray-600'}`}>{talent.description}</p>
      {!isUnlocked && !isExcluded && (
        <div className="flex items-center gap-3 text-[11px]">
          <span className={`font-bold ${canUnlock ? 'text-cyber-purple' : 'text-gray-600'}`}>{talent.cost} PT</span>
          <span className={`font-medium ${characterLevel >= talent.requiresLevel ? 'text-gray-500' : 'text-cyber-red'}`}>
            LVL {talent.requiresLevel}
          </span>
        </div>
      )}
    </button>
  )
}

export default function Talents(props: Props) {
  const { t } = useTranslation(['talents', 'common'])
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
            <h3 className="text-lg font-bold text-cyber-red tracking-widest mb-3">{t('talents:respecTitle')}</h3>
            <p className="text-xs text-gray-400 mb-4">
              {t('talents:respecMessage')}
            </p>
            <p className="text-cyber-yellow text-sm font-bold mb-4">{t('talents:respecWarning')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRespecConfirm(false)}
                className="flex-1 py-2 text-xs border border-gray-700 text-gray-500 rounded hover:bg-gray-900 transition-all uppercase"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={() => { router.post('/talents/respec'); setShowRespecConfirm(false) }}
                className="flex-1 py-2 text-xs bg-cyber-red/20 border border-cyber-red text-cyber-red rounded hover:bg-cyber-red/30 transition-all uppercase font-bold"
              >
                {t('common:confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cyber-purple tracking-widest">{t('talents:title')}</h1>
          <p className="text-xs text-gray-600 mt-1">
            {character.chosenSpec
              ? <>{ t('talents:specInfo', { spec: t(`talents:specs.${character.chosenSpec}.label`) }) }</>
              : t('talents:intro')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasRespecChip && (
            <button
              onClick={() => setShowRespecConfirm(true)}
              className="px-3 py-2 text-[10px] bg-cyber-red/10 border border-cyber-red/40 text-cyber-red rounded hover:bg-cyber-red/20 transition-all uppercase tracking-wider"
            >
              {t('talents:respec')}
            </button>
          )}
          <div className="bg-cyber-dark border border-cyber-purple/30 rounded-lg px-4 py-2 text-center">
            <div className="text-[10px] text-gray-600 uppercase">{t('talents:points')}</div>
            <div className="text-xl font-bold text-cyber-purple">{character.talentPoints}</div>
          </div>
          <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg px-4 py-2 text-center">
            <div className="text-[10px] text-gray-600 uppercase">{t('talents:level')}</div>
            <div className="text-xl font-bold text-cyber-green">{character.level}</div>
          </div>
        </div>
      </div>

      {/* Active bonuses */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { label: t('talents:cpcBonus'), value: `+${bonuses.cpcFlat} (+${bonuses.cpcPercent}%)`, color: 'text-cyber-green' },
          { label: t('talents:cpsBonus'), value: `+${bonuses.cpsFlat} (+${bonuses.cpsPercent}%)`, color: 'text-cyber-blue' },
          { label: t('talents:combat'), value: `ATK+${bonuses.atkFlat} DEF+${bonuses.defFlat} HP+${bonuses.hpFlat} (+${bonuses.combatPercent}%)`, color: 'text-cyber-red' },
          { label: t('talents:economy'), value: `-${bonuses.shopDiscount}% prix, +${bonuses.lootBonus}% loot, +${bonuses.dungeonCredits}% donjon`, color: 'text-cyber-yellow' },
        ].map((b) => (
          <div key={b.label} className="bg-cyber-dark/50 border border-gray-800 rounded px-3 py-2">
            <div className="text-[11px] text-gray-400 uppercase tracking-wider">{b.label}</div>
            <div className={`text-xs font-bold ${b.color}`}>{b.value}</div>
          </div>
        ))}
      </div>

      {/* Spec selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Object.entries(SPEC_STYLES).map(([spec, config]) => {
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
                <span className={`text-sm font-bold ${config.color} tracking-widest`}>{t(`talents:specs.${spec}.label`)}</span>
                {isChosenSpec && (
                  <span className={`text-[9px] ${config.bg}/20 ${config.color} px-2 py-0.5 rounded-full uppercase font-bold`}>
                    {t('talents:yourSpec')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mb-2">{t(`talents:specs.${spec}.description`)}</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 h-1.5 bg-cyber-black rounded-full overflow-hidden mr-2">
                  <div
                    className={`h-full ${config.bg}/60 transition-all duration-500`}
                    style={{ width: `${(unlockedCount / (totalTiers * 2)) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-medium">{unlockedCount}/{totalTiers}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded talent tree */}
      {expandedSpec && tree[expandedSpec] && (() => {
        const config = SPEC_STYLES[expandedSpec]
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
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-base font-bold ${config.color} tracking-widest`}>
                {t('talents:specTreeTitle', { spec: t(`talents:specs.${expandedSpec}.label`) })}
              </h2>
              {isLockedSpec && (
                <span className="text-[9px] bg-gray-800 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                  {t('talents:locked')}
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
                      <div className="flex justify-center my-1">
                        <div className={`w-0.5 h-4 ${
                          tiers[tier - 1]?.some((t) => t.unlocked) ? `${config.bg}/50` : 'bg-gray-800'
                        }`} />
                      </div>
                    )}

                    <div className="flex items-stretch gap-2">
                      {/* Tier badge */}
                      <div className={`flex items-center justify-center w-12 shrink-0 rounded-lg border text-xs font-bold ${
                        tierTalents.some((t) => t.unlocked)
                          ? `${config.border}/60 ${config.color} ${config.bg}/10`
                          : 'border-gray-700 text-gray-500'
                      }`}>
                        {t('talents:tier', { n: tier })}
                      </div>

                      {/* Choice A */}
                      <div className="flex-1 min-w-0">
                        {choiceA && (
                          <TalentCard
                            talent={choiceA}
                            config={config}
                            characterLevel={character.level}
                            onClick={() => router.post('/talents/unlock', { talentId: choiceA.id })}
                            t={t}
                          />
                        )}
                      </div>

                      {/* OR divider */}
                      <div className="flex items-center px-1">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-px h-3 bg-gray-700" />
                          <span className={`text-[10px] font-bold uppercase ${
                            tierTalents.some((t) => t.canUnlock) ? 'text-gray-400' : 'text-gray-600'
                          }`}>{t('talents:or')}</span>
                          <div className="w-px h-3 bg-gray-700" />
                        </div>
                      </div>

                      {/* Choice B */}
                      <div className="flex-1 min-w-0">
                        {choiceB && (
                          <TalentCard
                            talent={choiceB}
                            config={config}
                            characterLevel={character.level}
                            onClick={() => router.post('/talents/unlock', { talentId: choiceB.id })}
                            t={t}
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
            {t('talents:respecHint')}
          </p>
        </div>
      )}
    </GameLayout>
  )
}
