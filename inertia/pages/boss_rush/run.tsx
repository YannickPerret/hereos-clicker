import { router, usePage, useRemember } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CombatSkillTooltip from '~/components/combat_skill_tooltip'
import GameLayout from '~/components/layout'

interface Props {
  character: {
    id: number
    name: string
    level: number
    hpCurrent: number
    hpMax: number
    attack: number
    defense: number
    credits: number
    critChance: number
    critDamage: number
  }
  run: {
    id: number
    status: string
    currentFloor: number
    bossesDefeated: number
    currentEnemyHp: number
    currentEnemyId: number | null
  }
  season: {
    id: number
    name: string
  } | null
  currentEnemy: {
    id: number
    name: string
    description: string
    hp: number
    attack: number
    defense: number
    critChance: number
    critDamage: number
    tier: number
    icon: string
  }
  combatPreview: {
    player: { attack: number; defense: number }
    enemy: { attack: number; defense: number; isStunned: boolean } | null
  }
  consumables: {
    id: number
    quantity: number
    item: { name: string; effectType: string; effectValue: number }
  }[]
  pendingRewards: {
    credits: number
    xp: number
    items: { name: string; quantity: number }[]
  }
  skills: {
    id: number
    name: string
    description: string
    effectType: string
    effectValue: number
    cooldown: number
    duration: number
    currentCooldown: number
    icon: string
  }[]
  activeEffects: {
    type: string
    value: number
    turnsLeft: number
    sourceCharId: number
    targetType: 'enemy' | 'player'
  }[]
}

interface CombatLogEntry {
  action: string
  damage?: number
  isCrit?: boolean
  enemyHpLeft?: number
  playerHpLeft?: number
  blocked?: boolean
  creditsReward?: number
  xpReward?: number
  loot?: { name: string; rarity: string }[]
  enemyName?: string
  enemyHp?: number
  skillName?: string
  healed?: number
  stolen?: number
  message?: string
  revivedHp?: number
  itemName?: string
}

const TIER_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-cyber-blue',
  3: 'text-cyber-purple',
  4: 'text-cyber-yellow',
}

function CombatLog({ log }: { log: CombatLogEntry[] }) {
  const { t } = useTranslation(['dungeon', 'boss_rush'])

  if (!log.length) return null

  return (
    <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
      <h3 className="mb-3 text-[10px] uppercase tracking-widest text-gray-600">
        {t('dungeon:combatLog')}
      </h3>
      <div className="max-h-[32rem] space-y-1 overflow-y-auto pr-1">
        {log.map((entry, i) => {
          switch (entry.action) {
            case 'player_attack':
              return (
                <div key={i} className={`rounded p-2 text-xs ${entry.isCrit ? 'border border-cyber-yellow/30 bg-cyber-yellow/10' : 'bg-cyber-blue/5'}`}>
                  <span className="text-cyber-blue">{t('dungeon:youAttack')}</span>
                  <span className="ml-1 font-bold text-white">-{entry.damage} HP</span>
                  {entry.isCrit && <span className="ml-2 font-bold text-cyber-yellow">{t('dungeon:critical')}</span>}
                </div>
              )
            case 'enemy_attack':
              return (
                <div key={i} className={`rounded p-2 text-xs ${entry.blocked ? 'border border-cyber-blue/30 bg-cyber-blue/10' : 'bg-cyber-red/5'}`}>
                  <span className="text-cyber-red">{t('dungeon:enemyAttacks')}</span>
                  {entry.blocked ? (
                    <span className="ml-1 font-bold text-cyber-blue">{t('dungeon:blockedByShield')}</span>
                  ) : (
                    <span className="ml-1 font-bold text-white">-{entry.damage} HP</span>
                  )}
                </div>
              )
            case 'enemy_defeated':
              return (
                <div key={i} className="rounded border border-cyber-green/30 bg-cyber-green/10 p-2 text-xs">
                  <span className="font-bold text-cyber-green">{t('boss_rush:victoryLabel')}</span>
                  <span className="ml-2 text-cyber-yellow">+{entry.creditsReward}c</span>
                  <span className="ml-2 text-cyber-blue">+{entry.xpReward} XP</span>
                </div>
              )
            case 'new_enemy':
              return (
                <div key={i} className="rounded bg-gray-800 p-2 text-xs">
                  <span className="text-gray-400">{t('dungeon:newEnemy')}</span>
                  <span className="text-white">{entry.enemyName}</span>
                  <span className="ml-1 text-gray-600">({entry.enemyHp} HP)</span>
                </div>
              )
            case 'skill_use':
              return (
                <div key={i} className="rounded border border-cyber-purple/30 bg-cyber-purple/10 p-2 text-xs">
                  <span className="font-bold text-cyber-purple">{entry.skillName}</span>
                  {entry.damage !== undefined && <span className="ml-1 font-bold text-white">-{entry.damage} HP</span>}
                  {entry.healed !== undefined && <span className="ml-1 font-bold text-cyber-green">+{entry.healed} HP</span>}
                  {entry.stolen !== undefined && <span className="ml-1 text-cyber-yellow">+{entry.stolen}c</span>}
                  {entry.message && <span className="ml-1 text-gray-400">{entry.message}</span>}
                </div>
              )
            case 'skill_effect':
              return (
                <div key={i} className="rounded bg-cyber-orange/10 p-2 text-xs text-cyber-orange">
                  {entry.message}
                </div>
              )
            case 'enemy_stunned':
              return (
                <div key={i} className="rounded bg-cyber-yellow/10 p-2 text-xs text-cyber-yellow">
                  {t('dungeon:enemyStunned')}
                </div>
              )
            case 'item_use':
              return (
                <div key={i} className="rounded border border-cyber-green/30 bg-cyber-green/10 p-2 text-xs">
                  <span className="font-bold text-cyber-green">{t('dungeon:consumable', { name: entry.itemName || 'Item' })}</span>
                  {entry.healed !== undefined && <span className="ml-2 font-bold text-white">+{entry.healed} HP</span>}
                  {entry.message && <span className="ml-2 text-gray-400">{entry.message}</span>}
                </div>
              )
            case 'defeat':
              return (
                <div key={i} className="rounded border border-cyber-red/50 bg-cyber-red/20 p-2 text-center text-xs">
                  <span className="font-bold tracking-widest text-cyber-red">{t('dungeon:defeat')}</span>
                  {entry.revivedHp !== undefined && <span className="ml-2 text-gray-300">{t('dungeon:returnedToHp', { hp: entry.revivedHp })}</span>}
                </div>
              )
            case 'fled':
              return (
                <div key={i} className="rounded border border-gray-700 bg-gray-900/60 p-2 text-center text-xs text-gray-400">
                  {t('dungeon:fled')}
                </div>
              )
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}

export default function BossRushRun({
  character,
  run: initialRun,
  season,
  currentEnemy: initialEnemy,
  combatPreview,
  consumables,
  pendingRewards: initialPendingRewards,
  skills = [],
  activeEffects: initialEffects = [],
}: Props) {
  const { t } = useTranslation(['boss_rush', 'dungeon'])
  const { combatLog } = usePage().props as any
  const [playerCharacter, setPlayerCharacter] = useState(character)
  const [run, setRun] = useState(initialRun)
  const [enemy, setEnemy] = useState(initialEnemy)
  const [preview, setPreview] = useState(combatPreview)
  const [pendingRewards, setPendingRewards] = useState(initialPendingRewards)
  const [soloLog, setSoloLog] = useRemember<CombatLogEntry[]>(
    Array.isArray(combatLog) ? (combatLog as CombatLogEntry[]) : [],
    `boss-rush-run-log:${initialRun.id}`
  )
  const lastSoloFlashRef = useRef<string | null>(null)
  const isOver = run.status !== 'in_progress'
  const combatActionOptions = {
    preserveScroll: true,
    preserveState: true,
    only: ['character', 'run', 'currentEnemy', 'combatPreview', 'consumables', 'skills', 'activeEffects', 'pendingRewards', 'combatLog', 'errors', 'success'],
  } as const

  useEffect(() => {
    setPlayerCharacter(character)
    setRun(initialRun)
    setEnemy(initialEnemy)
    setPreview(combatPreview)
    setPendingRewards(initialPendingRewards)
  }, [character, initialRun, initialEnemy, combatPreview, initialPendingRewards])

  useEffect(() => {
    if (!Array.isArray(combatLog) || combatLog.length === 0) return
    const signature = JSON.stringify(combatLog)
    if (lastSoloFlashRef.current === signature) return
    setSoloLog((current) => [...current, ...combatLog])
    lastSoloFlashRef.current = signature
  }, [combatLog, setSoloLog])

  return (
    <GameLayout>
      <div className="mb-4 text-center">
        <div className="text-[10px] uppercase tracking-[0.32em] text-cyber-purple">
          {season?.name || t('boss_rush:title')}
        </div>
        <div className="mt-2 text-xl font-black tracking-widest text-white">
          {t('boss_rush:currentFloor')} #{run.currentFloor}
        </div>
        <div className="mt-1 text-xs uppercase tracking-widest text-gray-600">
          {t('boss_rush:bossesKilled')}: {run.bossesDefeated}
        </div>
      </div>

      {isOver && (
        <div className="mx-auto mb-6 max-w-md rounded-lg border border-cyber-purple/30 bg-cyber-dark p-8 text-center">
          <h2 className={`mb-4 text-3xl font-bold tracking-widest ${run.status === 'defeat' ? 'text-cyber-red' : 'text-cyber-blue'}`}>
            {run.status === 'defeat' ? t('dungeon:defeat') : t('dungeon:fled')}
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            {run.status === 'defeat' ? t('boss_rush:defeatMessage') : t('boss_rush:fledMessage')}
          </p>
          <div className="mb-6 rounded-lg border border-cyber-purple/20 bg-cyber-black/40 p-4 text-left">
            <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-cyber-purple">
              {t('boss_rush:runSummary')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border border-cyber-yellow/20 bg-cyber-yellow/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-gray-600">
                  {t('boss_rush:bestFloor')}
                </div>
                <div className="mt-1 text-lg font-bold text-cyber-yellow">{run.bossesDefeated}</div>
              </div>
              <div className="rounded border border-cyber-blue/20 bg-cyber-blue/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-gray-600">
                  {t('dungeon:credits')}
                </div>
                <div className="mt-1 text-lg font-bold text-cyber-blue">+{pendingRewards.credits}</div>
              </div>
            </div>
            <div className="mt-3 rounded border border-cyber-pink/20 bg-cyber-pink/5 px-3 py-3">
              <div className="text-[10px] uppercase tracking-widest text-gray-600">
                {t('dungeon:items')}
              </div>
              {pendingRewards.items.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingRewards.items.map((item) => (
                    <div key={item.name} className="rounded border border-cyber-pink/30 bg-cyber-pink/10 px-2 py-1 text-xs text-cyber-pink">
                      {item.quantity > 1 ? `${item.quantity}x ` : ''}
                      {item.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-600">{t('dungeon:noItems')}</div>
              )}
            </div>
          </div>
          <button
            onClick={() => router.visit('/boss-rush')}
            className="rounded border border-cyber-blue/40 bg-cyber-blue/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-cyber-blue transition hover:bg-cyber-blue/20"
          >
            {t('boss_rush:return')}
          </button>
        </div>
      )}

      {!isOver && enemy && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-cyber-blue/30 bg-cyber-dark p-5">
              <h3 className="mb-3 text-center text-sm font-bold tracking-widest text-cyber-blue">
                {playerCharacter.name}
              </h3>
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>HP</span>
                  <span>{playerCharacter.hpCurrent}/{playerCharacter.hpMax}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full border border-cyber-green/20 bg-cyber-black">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-500"
                    style={{ width: `${(playerCharacter.hpCurrent / playerCharacter.hpMax) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-600">ATK</div>
                  <div className="font-bold text-cyber-red">{preview.player.attack}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">DEF</div>
                  <div className="font-bold text-cyber-blue">{preview.player.defense}</div>
                </div>
              </div>
              <div className="mt-3 rounded border border-cyber-yellow/20 bg-cyber-yellow/5 px-3 py-2 text-xs">
                <div className="uppercase tracking-widest text-gray-600">{t('dungeon:rewards')}</div>
                <div className="mt-1 text-cyber-yellow">+{pendingRewards.credits}c</div>
                <div className="text-cyber-blue">+{pendingRewards.xp} XP</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="text-4xl font-bold tracking-widest text-cyber-pink">VS</div>
              <div className="w-full space-y-2">
                <button
                  onClick={() => router.post(`/boss-rush/run/${run.id}/attack`, {}, combatActionOptions)}
                  className="w-full rounded border border-cyber-red bg-cyber-red/20 py-3 text-sm font-bold uppercase tracking-widest text-cyber-red transition hover:bg-cyber-red/30"
                >
                  {t('dungeon:attack')}
                </button>

                {skills.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-center text-[9px] uppercase tracking-widest text-cyber-purple">
                      {t('dungeon:programs')}
                    </div>
                    {skills.map((skill) => {
                      const disabled = skill.currentCooldown > 0
                      return (
                        <CombatSkillTooltip key={skill.id} skill={skill}>
                          <button
                            onClick={() => !disabled && router.post(`/boss-rush/run/${run.id}/skill`, { skillId: skill.id }, combatActionOptions)}
                            disabled={disabled}
                            className={`relative w-full rounded border py-2 text-xs transition-all ${
                              disabled
                                ? 'cursor-not-allowed border-gray-800 bg-gray-900/50 text-gray-700'
                                : 'border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/20'
                            }`}
                          >
                            <span className="font-bold">{skill.name}</span>
                            {skill.currentCooldown > 0 ? (
                              <span className="ml-2 text-[10px] text-gray-600">({skill.currentCooldown}t)</span>
                            ) : (
                              <span className="ml-1 text-[10px] text-gray-600">CD:{skill.cooldown}</span>
                            )}
                          </button>
                        </CombatSkillTooltip>
                      )
                    })}
                  </div>
                )}

                {initialEffects.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="text-center text-[9px] uppercase tracking-widest text-gray-600">
                      {t('dungeon:activeEffectsLabel')}
                    </div>
                    {initialEffects.map((eff, i) => (
                      <div
                        key={i}
                        className={`rounded border px-2 py-1 text-[10px] ${
                          eff.targetType === 'enemy'
                            ? 'border-cyber-red/20 bg-cyber-red/5 text-cyber-red'
                            : 'border-cyber-green/20 bg-cyber-green/5 text-cyber-green'
                        }`}
                      >
                        {eff.type === 'debuff_def' && t('dungeon:debuffDef', { value: eff.value })}
                        {eff.type === 'debuff_atk' && t('dungeon:debuffAtk', { value: eff.value })}
                        {eff.type === 'dot' && t('dungeon:dot', { value: eff.value })}
                        {eff.type === 'turret' && t('dungeon:turret', { value: eff.value })}
                        {eff.type === 'stun' && t('dungeon:stun')}
                        {eff.type === 'shield' && t('dungeon:shield')}
                        {eff.type === 'guaranteed_crit' && t('dungeon:guaranteedCrit')}
                        {eff.type === 'buff_all' && t('dungeon:buffAll', { value: eff.value })}
                        <span className="ml-1 text-gray-600">({eff.turnsLeft}t)</span>
                      </div>
                    ))}
                  </div>
                )}

                {consumables.length > 0 && (
                  <div className="space-y-1">
                    {consumables.slice(0, 3).map((consumable) => (
                      <button
                        key={consumable.id}
                        onClick={() =>
                          router.post(
                            `/boss-rush/run/${run.id}/use-item`,
                            { inventoryItemId: consumable.id },
                            combatActionOptions
                          )
                        }
                        className="w-full rounded border border-cyber-green/30 bg-cyber-green/10 py-2 text-xs text-cyber-green transition hover:bg-cyber-green/20"
                      >
                        {consumable.item.name} (x{consumable.quantity}) +{consumable.item.effectValue}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => router.post(`/boss-rush/run/${run.id}/flee`, {}, combatActionOptions)}
                  className="w-full rounded border border-gray-700 bg-gray-900 py-2 text-xs uppercase tracking-widest text-gray-500 transition hover:bg-gray-800 hover:text-gray-400"
                >
                  {t('dungeon:flee')}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-cyber-red/30 bg-cyber-dark p-5">
              <div className="mb-2 flex items-start justify-between">
                <h3 className={`text-sm font-bold ${TIER_COLORS[enemy.tier] || 'text-gray-400'}`}>
                  {enemy.name}
                </h3>
                <span className="rounded bg-cyber-red/20 px-2 py-0.5 text-[10px] text-cyber-red">
                  T{enemy.tier}
                </span>
              </div>
              <div className="mb-4 flex justify-center">
                <img
                  src={`/images/enemies/${enemy.icon}.svg`}
                  alt={enemy.name}
                  className="h-24 w-24 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.dataset.fallbackApplied === '1') {
                      target.style.display = 'none'
                      return
                    }
                    target.dataset.fallbackApplied = '1'
                    target.src = '/images/enemies/default.svg'
                  }}
                />
              </div>
              <p className="mb-3 text-[10px] text-gray-600">{enemy.description}</p>
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>HP</span>
                  <span>{run.currentEnemyHp}/{enemy.hp}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full border border-cyber-red/20 bg-cyber-black">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-red to-cyber-orange transition-all duration-500"
                    style={{ width: `${(run.currentEnemyHp / enemy.hp) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-600">ATK</div>
                  <div className="font-bold text-cyber-red">{preview.enemy?.attack ?? enemy.attack}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">DEF</div>
                  <div className="font-bold text-cyber-blue">{preview.enemy?.defense ?? enemy.defense}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-800 pt-2 text-xs">
                <div className="text-center">
                  <div className="text-gray-600">CRIT%</div>
                  <div className="font-bold text-cyber-yellow">{enemy.critChance}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">CRIT DMG</div>
                  <div className="font-bold text-cyber-yellow">{enemy.critDamage}%</div>
                </div>
              </div>
            </div>
          </div>

          <CombatLog log={soloLog} />
        </div>
      )}
    </GameLayout>
  )
}
