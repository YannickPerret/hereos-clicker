import { router, usePage, useRemember } from '@inertiajs/react'
import { useState, useEffect, useMemo, useRef } from 'react'
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
    currentEnemyHp: number
    currentEnemyId: number | null
    enemiesDefeated: number
    dungeonFloorId: number
    partyId: number | null
    currentTurnId: number | null
    turnDeadline: number | null
    afkPenalties?: string
  }
  floor: { name: string; floorNumber: number }
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
  } | null
  combatPreview: {
    player: {
      attack: number
      defense: number
    }
    enemy: {
      attack: number
      defense: number
      isStunned: boolean
    } | null
  }
  consumables: {
    id: number
    quantity: number
    item: { name: string; effectType: string; effectValue: number }
  }[]
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
  newLevel?: number
  bossName?: string
  enemyName?: string
  enemyHp?: number
  defenderId?: number
  defenderName?: string
  skillName?: string
  healed?: number
  stolen?: number
  message?: string
  auto?: boolean
  characterName?: string
  characterId?: number
  afkCount?: number
  nextTurnSeconds?: number
  creditsLost?: number
  revivedHp?: number
  itemName?: string
}

const TIER_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-cyber-blue',
  3: 'text-cyber-purple',
  4: 'text-cyber-yellow',
}

function parseAfkPenalties(raw?: string) {
  if (!raw) return {}

  try {
    return JSON.parse(raw) as Record<string, number>
  } catch {
    return {}
  }
}

function summarizeRewards(log: CombatLogEntry[]) {
  const lootCounts = new Map<string, number>()
  let credits = 0
  let xp = 0

  for (const entry of log) {
    if (entry.action !== 'enemy_defeated') continue

    credits += entry.creditsReward || 0
    xp += entry.xpReward || 0

    for (const loot of entry.loot || []) {
      lootCounts.set(loot.name, (lootCounts.get(loot.name) || 0) + 1)
    }
  }

  return {
    credits,
    xp,
    items: Array.from(lootCounts.entries()).map(([name, quantity]) => ({
      name,
      quantity,
    })),
  }
}

function isNearLogBottom(element: HTMLDivElement, threshold = 32) {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
}

function useAutoFollowLog(entryCount: number) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true)
  const [hasUnseenEntries, setHasUnseenEntries] = useState(false)

  const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current
    if (!container) return

    const top = container.scrollHeight
    if (behavior === 'smooth') {
      container.scrollTo({ top, behavior })
    } else {
      container.scrollTop = top
    }
    setIsPinnedToBottom(true)
    setHasUnseenEntries(false)
  }

  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return

    const atBottom = isNearLogBottom(container)
    setIsPinnedToBottom(atBottom)
    if (atBottom) {
      setHasUnseenEntries(false)
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    if (isPinnedToBottom) {
      window.requestAnimationFrame(() => {
        scrollToLatest(entryCount <= 1 ? 'auto' : 'smooth')
      })
      return
    }

    setHasUnseenEntries(true)
  }, [entryCount, isPinnedToBottom])

  return {
    containerRef,
    hasUnseenEntries,
    handleScroll,
    scrollToLatest,
  }
}

function CombatLog({ log, className = '' }: { log: CombatLogEntry[]; className?: string }) {
  const { t } = useTranslation(['dungeon', 'common'])

  if (!log || log.length === 0) return null

  const { containerRef, hasUnseenEntries, handleScroll, scrollToLatest } = useAutoFollowLog(
    log.length
  )

  return (
    <div className={`relative bg-cyber-dark border border-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">{t('dungeon:combatLog')}</h3>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="space-y-1 max-h-[32rem] overflow-y-auto pr-1"
      >
        {log.map((entry, i) => {
          switch (entry.action) {
            case 'player_attack':
              return (
                <div
                  key={i}
                  className={`text-xs p-2 rounded ${entry.isCrit ? 'bg-cyber-yellow/10 border border-cyber-yellow/30' : 'bg-cyber-blue/5'}`}
                >
                  <span className="text-cyber-blue">{t('dungeon:youAttack')}</span>
                  <span className="text-white font-bold ml-1">-{entry.damage} HP</span>
                  {entry.isCrit && (
                    <span className="text-cyber-yellow font-bold ml-2 animate-pulse">
                      {t('dungeon:critical')}
                    </span>
                  )}
                </div>
              )
            case 'player_afk':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-orange/10 border border-cyber-orange/40"
                >
                  <span className="text-cyber-orange font-bold">
                    {t('dungeon:playerAfk', { name: entry.characterName || 'Un joueur' })}
                  </span>
                  <span className="text-gray-400 ml-1">
                    {t('dungeon:turnLimit', { seconds: entry.nextTurnSeconds || 5 })}
                  </span>
                </div>
              )
            case 'enemy_attack':
              return (
                <div
                  key={i}
                  className={`text-xs p-2 rounded ${entry.blocked ? 'bg-cyber-blue/10 border border-cyber-blue/30' : entry.isCrit ? 'bg-cyber-red/20 border border-cyber-red/50' : 'bg-cyber-red/5'}`}
                >
                  <span className="text-cyber-red">
                    {entry.defenderName ? t('dungeon:enemyAttacksTarget', { name: entry.defenderName }) : t('dungeon:enemyAttacks')}
                  </span>
                  {entry.blocked ? (
                    <span className="text-cyber-blue font-bold ml-1">{t('dungeon:blockedByShield')}</span>
                  ) : (
                    <>
                      <span className="text-white font-bold ml-1">-{entry.damage} HP</span>
                      {entry.isCrit && (
                        <span className="text-cyber-red font-bold ml-2 animate-pulse">
                          {t('dungeon:critical')}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )
            case 'party_member_down':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-orange/10 border border-cyber-orange/40"
                >
                  <span className="text-cyber-orange font-bold">
                    {t('dungeon:memberDown', { name: entry.defenderName || 'Un membre du groupe' })}
                  </span>
                </div>
              )
            case 'enemy_defeated':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-green/10 border border-cyber-green/30"
                >
                  <span className="text-cyber-green font-bold">{t('dungeon:enemyDefeated')}</span>
                  <span className="text-cyber-yellow ml-2">+{entry.creditsReward}c</span>
                  <span className="text-cyber-blue ml-2">+{entry.xpReward} XP</span>
                  {entry.loot && entry.loot.length > 0 && (
                    <span className="text-cyber-pink ml-2">
                      {t('dungeon:loot', { items: entry.loot.map((l) => l.name).join(', ') })}
                    </span>
                  )}
                </div>
              )
            case 'level_up':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30"
                >
                  <span className="text-cyber-purple font-bold">{t('dungeon:levelUp')}</span>
                  <span className="text-white ml-2">{t('dungeon:newLevel', { n: entry.newLevel })}</span>
                </div>
              )
            case 'boss_spawn':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/50"
                >
                  <span className="text-cyber-yellow font-bold">{t('dungeon:bossSpawn', { name: entry.bossName })}</span>
                </div>
              )
            case 'new_enemy':
              return (
                <div key={i} className="text-xs p-2 rounded bg-gray-800">
                  <span className="text-gray-400">{t('dungeon:newEnemy')}</span>
                  <span className="text-white">{entry.enemyName}</span>
                  <span className="text-gray-600 ml-1">({entry.enemyHp} HP)</span>
                </div>
              )
            case 'skill_use':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30"
                >
                  <span className="text-cyber-purple font-bold">{entry.skillName}</span>
                  {entry.damage && (
                    <span className="text-white font-bold ml-1">-{entry.damage} HP</span>
                  )}
                  {entry.isCrit && <span className="text-cyber-yellow font-bold ml-1">CRIT!</span>}
                  {entry.healed && (
                    <span className="text-cyber-green font-bold ml-1">+{entry.healed} HP</span>
                  )}
                  {entry.stolen && (
                    <span className="text-cyber-yellow ml-1">{t('dungeon:stolenCredits', { amount: entry.stolen })}</span>
                  )}
                  {entry.message && !entry.damage && !entry.healed && (
                    <span className="text-gray-400 ml-1">{entry.message}</span>
                  )}
                </div>
              )
            case 'skill_effect':
              return (
                <div key={i} className="text-xs p-2 rounded bg-cyber-orange/10">
                  <span className="text-cyber-orange">{entry.message}</span>
                </div>
              )
            case 'enemy_stunned':
              return (
                <div key={i} className="text-xs p-2 rounded bg-cyber-yellow/10">
                  <span className="text-cyber-yellow">{t('dungeon:enemyStunned')}</span>
                </div>
              )
            case 'item_use':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-green/10 border border-cyber-green/30"
                >
                  <span className="text-cyber-green font-bold">
                    {t('dungeon:consumable', { name: entry.itemName || 'Objet' })}
                  </span>
                  {entry.healed !== undefined && (
                    <span className="text-white font-bold ml-2">+{entry.healed} HP</span>
                  )}
                  {entry.playerHpLeft !== undefined && (
                    <span className="text-gray-400 ml-2">({entry.playerHpLeft} HP)</span>
                  )}
                  {entry.message && entry.healed === undefined && (
                    <span className="text-gray-400 ml-2">{entry.message}</span>
                  )}
                </div>
              )
            case 'victory':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-center"
                >
                  <span className="text-cyber-green font-bold tracking-widest">{t('dungeon:victory')}</span>
                </div>
              )
            case 'defeat':
              return (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-cyber-red/20 border border-cyber-red/50 text-center"
                >
                  <span className="text-cyber-red font-bold tracking-widest">{t('dungeon:defeat')}</span>
                  {(entry.creditsLost !== undefined || entry.revivedHp !== undefined) && (
                    <span className="ml-2 text-gray-300">
                      {entry.creditsLost !== undefined && `-${entry.creditsLost}c`}
                      {entry.creditsLost !== undefined && entry.revivedHp !== undefined && ' • '}
                      {entry.revivedHp !== undefined && t('dungeon:returnedToHp', { hp: entry.revivedHp })}
                    </span>
                  )}
                </div>
              )
            default:
              return null
          }
        })}
      </div>
      {hasUnseenEntries && (
        <button
          type="button"
          onClick={() => scrollToLatest()}
          className="absolute bottom-4 right-4 rounded border border-cyber-blue/40 bg-cyber-blue/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyber-blue transition hover:bg-cyber-blue/20"
        >
          {t('dungeon:latestAction')}
        </button>
      )}
    </div>
  )
}

export default function DungeonRun({
  character,
  run: initialRun,
  floor,
  currentEnemy: initialEnemy,
  combatPreview,
  consumables,
  skills = [],
  activeEffects: initialEffects = [],
}: Props) {
  const { t } = useTranslation(['dungeon', 'common'])
  const { combatLog } = usePage().props as any
  const [playerCharacter, setPlayerCharacter] = useState(character)
  const [run, setRun] = useState(initialRun)
  const [enemy, setEnemy] = useState(initialEnemy)
  const [preview, setPreview] = useState(combatPreview)
  const [partyMembers, setPartyMembers] = useState<
    { id: number; name: string; level: number; hpCurrent: number; hpMax: number }[]
  >([])
  const [groupLog, setGroupLog] = useState<any[]>([])
  const [soloLog, setSoloLog] = useRemember<CombatLogEntry[]>(
    Array.isArray(combatLog) ? (combatLog as CombatLogEntry[]) : [],
    `dungeon-run-log:${initialRun.id}`
  )
  const [turnTimer, setTurnTimer] = useState<number | null>(null)
  const isOver = run.status !== 'in_progress'
  const isGroupRun = !!run.partyId
  const isMyTurn = !run.partyId || run.currentTurnId === playerCharacter.id
  const isCharacterKo = playerCharacter.hpCurrent <= 0
  const afkPenalties = parseAfkPenalties(run.afkPenalties)
  const currentTurnIsAfk =
    run.currentTurnId !== null && (afkPenalties[String(run.currentTurnId)] || 0) > 0
  const lastSoloFlashRef = useRef<string | null>(null)
  const previousRunIdRef = useRef(initialRun.id)
  const groupLogScroll = useAutoFollowLog(groupLog.length)
  const combatActionOptions = {
    preserveScroll: true,
    preserveState: true,
    only: [
      'character',
      'run',
      'currentEnemy',
      'combatPreview',
      'consumables',
      'skills',
      'activeEffects',
      'combatLog',
      'errors',
      'success',
    ],
  } as const
  const rewardSummary = useMemo(
    () => summarizeRewards(isGroupRun ? groupLog : soloLog),
    [groupLog, isGroupRun, soloLog]
  )

  // Sync from Inertia props
  useEffect(() => {
    setPlayerCharacter(character)
    setRun(initialRun)
    setEnemy(initialEnemy)
    setPreview(combatPreview)
  }, [character, initialRun, initialEnemy, combatPreview])

  useEffect(() => {
    if (previousRunIdRef.current === initialRun.id) return

    previousRunIdRef.current = initialRun.id
    setSoloLog([])
    lastSoloFlashRef.current = null
  }, [initialRun.id, setSoloLog])

  useEffect(() => {
    if (!Array.isArray(combatLog) || combatLog.length === 0 || isGroupRun) return

    const signature = JSON.stringify(combatLog)
    if (lastSoloFlashRef.current === signature) return

    setSoloLog((current) => [...current, ...combatLog])
    lastSoloFlashRef.current = signature
  }, [combatLog, isGroupRun, setSoloLog])

  // Poll run state for group dungeons
  useEffect(() => {
    if (!isGroupRun) return
    let active = true
    const pollFn = async () => {
      if (!active) return
      try {
        const res = await fetch(`/dungeon/run/${run.id}/state`)
        if (!res.ok) return
        const data = await res.json()
        if (data.character) setPlayerCharacter(data.character)
        setRun(data.run)
        setEnemy(data.currentEnemy)
        setPreview(data.combatPreview)
        setGroupLog(data.run.combatLog || [])
        if (data.partyMembers) setPartyMembers(data.partyMembers)
        // Calculate turn timer
        if (data.run.turnDeadline && data.run.status === 'in_progress') {
          const remaining = Math.max(0, Math.ceil((data.run.turnDeadline - Date.now()) / 1000))
          setTurnTimer(remaining)
        } else {
          setTurnTimer(null)
        }
      } catch {}
    }
    pollFn()
    const poll = setInterval(pollFn, 1500)
    return () => {
      active = false
      clearInterval(poll)
    }
  }, [run.id, isGroupRun])

  return (
    <GameLayout>
      {/* Floor info */}
      <div className="text-center mb-4">
        <div className="text-xs text-gray-600 uppercase tracking-widest">
          F{floor.floorNumber} - {floor.name}
        </div>
        <div className="text-xs text-gray-700">{t('dungeon:enemiesDefeatedCount', { current: run.enemiesDefeated, total: 3 })}</div>
      </div>

      {/* Turn indicator for group */}
      {isGroupRun && !isOver && (
        <div className="text-center mb-4">
          <span
            className={`text-xs px-4 py-1.5 rounded-full border ${
              isMyTurn
                ? 'bg-cyber-green/10 border-cyber-green/50 text-cyber-green'
                : 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'
            }`}
          >
            {isMyTurn
              ? t('dungeon:yourTurnAttack')
              : t('dungeon:turnOf', { name: partyMembers.find((m) => m.id === run.currentTurnId)?.name || '...' })}
            {currentTurnIsAfk && (
              <span className="ml-2 rounded-full border border-cyber-orange/40 bg-cyber-orange/10 px-2 py-0.5 text-[10px] font-bold text-cyber-orange">
                AFK 5S
              </span>
            )}
            {turnTimer !== null && (
              <span
                className={`ml-2 font-bold ${turnTimer <= 5 ? 'text-cyber-red animate-pulse' : ''}`}
              >
                {turnTimer}s
              </span>
            )}
          </span>
        </div>
      )}

      {/* Party members for group run */}
      {isGroupRun && partyMembers.length > 0 && !isOver && (
        <div className="flex justify-center gap-3 mb-4">
          {partyMembers.map((m) => (
            <div
              key={m.id}
              className={`text-center px-3 py-1.5 rounded border text-xs ${
                m.id === run.currentTurnId
                  ? 'border-cyber-yellow/50 bg-cyber-yellow/10'
                  : m.id === playerCharacter.id
                    ? 'border-cyber-blue/30 bg-cyber-blue/5'
                    : 'border-gray-800'
              }`}
            >
              <div className={`font-bold ${m.hpCurrent <= 0 ? 'text-cyber-red' : 'text-white'}`}>
                {m.name}
                {m.hpCurrent <= 0 && <span className="ml-1 text-cyber-red">KO</span>}
                {(afkPenalties[String(m.id)] || 0) > 0 && (
                  <span className="ml-2 rounded border border-cyber-orange/40 bg-cyber-orange/10 px-1.5 py-0.5 text-[9px] font-bold text-cyber-orange">
                    AFK
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-500">LVL {m.level}</div>
              <div
                className={`text-[10px] ${m.hpCurrent <= 0 ? 'text-cyber-red' : 'text-cyber-green'}`}
              >
                {m.hpCurrent}/{m.hpMax} HP
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Victory/Defeat Overlay */}
      {isOver && (
        <div
          className="bg-cyber-dark border rounded-lg p-8 text-center mb-6 max-w-md mx-auto"
          style={{
            borderColor:
              run.status === 'victory' ? '#00ff41' : run.status === 'defeat' ? '#ff0040' : '#666',
          }}
        >
          <h2
            className={`text-3xl font-bold mb-4 tracking-widest ${
              run.status === 'victory'
                ? 'text-cyber-green'
                : run.status === 'defeat'
                  ? 'text-cyber-red'
                  : 'text-gray-400'
            }`}
          >
            {run.status === 'victory' ? t('dungeon:victory') : run.status === 'defeat' ? t('dungeon:defeat') : t('dungeon:fled')}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {run.status === 'victory'
              ? t('dungeon:victoryMessage')
              : run.status === 'defeat'
                ? t('dungeon:defeatMessageLong')
                : t('dungeon:fledMessage')}
          </p>
          {run.status === 'victory' && (
            <div className="mb-6 rounded-lg border border-cyber-green/20 bg-cyber-black/40 p-4 text-left">
              <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-cyber-green">
                {t('dungeon:rewards')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-cyber-yellow/20 bg-cyber-yellow/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-gray-600">{t('dungeon:credits')}</div>
                  <div className="mt-1 text-lg font-bold text-cyber-yellow">
                    +{rewardSummary.credits}
                  </div>
                </div>
                <div className="rounded border border-cyber-blue/20 bg-cyber-blue/5 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-gray-600">{t('dungeon:xp')}</div>
                  <div className="mt-1 text-lg font-bold text-cyber-blue">+{rewardSummary.xp}</div>
                </div>
              </div>
              <div className="mt-3 rounded border border-cyber-pink/20 bg-cyber-pink/5 px-3 py-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-600">{t('dungeon:items')}</div>
                {rewardSummary.items.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rewardSummary.items.map((item) => (
                      <div
                        key={item.name}
                        className="rounded border border-cyber-pink/30 bg-cyber-pink/10 px-2 py-1 text-xs text-cyber-pink"
                      >
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
          )}
          <button
            onClick={() => router.visit(run.partyId ? '/party' : '/dungeon')}
            className="px-6 py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all"
          >
            {run.partyId ? t('dungeon:returnToGroup') : t('dungeon:return')}
          </button>
        </div>
      )}

      {/* Combat Arena */}
      {!isOver && enemy && (
        <div
          className={`grid grid-cols-1 gap-6 items-start ${isGroupRun ? '' : 'xl:grid-cols-[minmax(0,1fr)_22rem]'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Player */}
            <div className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-5">
              <h3 className="text-cyber-blue font-bold text-center mb-3 tracking-widest text-sm">
                {playerCharacter.name}
              </h3>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>HP</span>
                  <span>
                    {playerCharacter.hpCurrent}/{playerCharacter.hpMax}
                  </span>
                </div>
                <div className="h-4 bg-cyber-black rounded-full overflow-hidden border border-cyber-green/20">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-500"
                    style={{
                      width: `${(playerCharacter.hpCurrent / playerCharacter.hpMax) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="text-center">
                  <div className="text-gray-600">ATK</div>
                  <div className="text-cyber-red font-bold">{preview.player.attack}</div>
                  {preview.player.attack !== playerCharacter.attack && (
                    <div className="text-[10px] text-gray-600">base {playerCharacter.attack}</div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-gray-600">DEF</div>
                  <div className="text-cyber-blue font-bold">{preview.player.defense}</div>
                  {preview.player.defense !== playerCharacter.defense && (
                    <div className="text-[10px] text-gray-600">base {playerCharacter.defense}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-800 pt-2">
                <div className="text-center">
                  <div className="text-gray-600">CRIT%</div>
                  <div className="text-cyber-yellow font-bold">{playerCharacter.critChance}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">CRIT DMG</div>
                  <div className="text-cyber-yellow font-bold">{playerCharacter.critDamage}%</div>
                </div>
              </div>
              {isCharacterKo && isGroupRun && (
                <div className="mt-3 rounded border border-cyber-red/30 bg-cyber-red/10 px-3 py-2 text-[11px] text-cyber-red">
                  {t('dungeon:koMessage')}
                </div>
              )}
            </div>

            {/* VS + Actions */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-4xl font-bold text-cyber-pink neon-text-pink tracking-widest">
                VS
              </div>

              <div className="space-y-2 w-full">
                <button
                  onClick={() => router.post(`/dungeon/run/${run.id}/attack`, {}, combatActionOptions)}
                  disabled={(isGroupRun && !isMyTurn) || isCharacterKo}
                  className={`w-full py-3 border font-bold uppercase tracking-widest rounded transition-all text-sm ${
                    (isGroupRun && !isMyTurn) || isCharacterKo
                      ? 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-cyber-red/20 border-cyber-red text-cyber-red hover:bg-cyber-red/30'
                  } ${isMyTurn && isGroupRun ? 'animate-pulse' : ''}`}
                >
                  {isCharacterKo
                    ? t('dungeon:ko')
                    : isGroupRun && !isMyTurn
                      ? t('dungeon:waiting')
                      : t('dungeon:attack')}
                </button>

                {/* Combat Skills */}
                {skills.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[9px] text-cyber-purple uppercase tracking-widest text-center">
                      {t('dungeon:programs')}
                    </div>
                    {skills.map((skill) => {
                      const onCooldown = skill.currentCooldown > 0
                      const disabled = onCooldown || (isGroupRun && !isMyTurn) || isCharacterKo
                      return (
                        <CombatSkillTooltip key={skill.id} skill={skill}>
                          <button
                            onClick={() =>
                              !disabled &&
                              router.post(
                                `/dungeon/run/${run.id}/skill`,
                                { skillId: skill.id },
                                combatActionOptions
                              )
                            }
                            disabled={disabled}
                            className={`w-full py-2 border rounded text-xs transition-all relative ${
                              disabled
                                ? 'bg-gray-900/50 border-gray-800 text-gray-700 cursor-not-allowed'
                                : 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/20'
                            }`}
                          >
                            <span className="font-bold">{skill.name}</span>
                            {onCooldown && (
                              <span className="ml-2 text-[10px] text-gray-600">
                                ({skill.currentCooldown} tours)
                              </span>
                            )}
                            {!onCooldown && (
                              <span className="ml-1 text-[10px] text-gray-600">
                                CD:{skill.cooldown}
                              </span>
                            )}
                          </button>
                        </CombatSkillTooltip>
                      )
                    })}
                  </div>
                )}

                {/* Active Effects */}
                {initialEffects.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="text-[9px] text-gray-600 uppercase tracking-widest text-center">
                      {t('dungeon:activeEffectsLabel')}
                    </div>
                    {initialEffects.map((eff, i) => (
                      <div
                        key={i}
                        className={`text-[10px] px-2 py-1 rounded border ${
                          eff.targetType === 'enemy'
                            ? 'border-cyber-red/20 text-cyber-red bg-cyber-red/5'
                            : 'border-cyber-green/20 text-cyber-green bg-cyber-green/5'
                        }`}
                      >
                        {eff.type === 'debuff_def' && t('dungeon:debuffDef', { value: eff.value })}
                        {eff.type === 'debuff_atk' && t('dungeon:debuffAtk', { value: eff.value })}
                        {eff.type === 'dot' && t('dungeon:dot', { value: eff.value })}
                        {eff.type === 'turret' && t('dungeon:turret', { value: eff.value })}
                        {eff.type === 'stun' && t('dungeon:stun')}
                        {eff.type === 'shield' && t('dungeon:shield')}
                        {eff.type === 'guaranteed_crit' && t('dungeon:guaranteedCrit')}
                        {eff.type === 'buff_atk' && t('dungeon:buffAtk', { value: eff.value })}
                        {eff.type === 'buff_def' && t('dungeon:buffDef', { value: eff.value })}
                        {eff.type === 'buff_all' && t('dungeon:buffAll', { value: eff.value })}
                        <span className="text-gray-600 ml-1">({eff.turnsLeft}t)</span>
                      </div>
                    ))}
                  </div>
                )}

                {consumables.length > 0 && (
                  <div className="space-y-1">
                    {consumables.slice(0, 3).map((c) => (
                      <button
                        key={c.id}
                        onClick={() =>
                          router.post(
                            `/dungeon/run/${run.id}/use-item`,
                            { inventoryItemId: c.id },
                            combatActionOptions
                          )
                        }
                        disabled={isCharacterKo}
                        className={`w-full py-2 rounded transition-all text-xs ${
                          isCharacterKo
                            ? 'bg-gray-900 border border-gray-800 text-gray-700 cursor-not-allowed'
                            : 'bg-cyber-green/10 border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/20'
                        }`}
                      >
                        {c.item.name} (x{c.quantity}) +{c.item.effectValue}{' '}
                        {c.item.effectType === 'hp_restore' ? 'HP' : ''}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => router.post(`/dungeon/run/${run.id}/flee`, {}, combatActionOptions)}
                  className="w-full py-2 bg-gray-900 border border-gray-700 text-gray-500 uppercase tracking-widest rounded hover:bg-gray-800 hover:text-gray-400 transition-all text-xs"
                >
                  {t('dungeon:flee')}
                </button>
              </div>
            </div>

            {/* Enemy */}
            <div className="bg-cyber-dark border border-cyber-red/30 rounded-lg p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-bold text-sm ${TIER_COLORS[enemy.tier] || 'text-gray-400'}`}>
                  {enemy.name}
                </h3>
                <span className="text-[10px] bg-cyber-red/20 text-cyber-red px-2 py-0.5 rounded">
                  T{enemy.tier}
                </span>
              </div>

              <div className="flex justify-center mb-4">
                <img
                  src={`/images/enemies/${enemy.icon}.svg`}
                  alt={enemy.name}
                  className="w-24 h-24 object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>

              <p className="text-[10px] text-gray-600 mb-3">{enemy.description}</p>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>HP</span>
                  <span>
                    {run.currentEnemyHp}/{enemy.hp}
                  </span>
                </div>
                <div className="h-4 bg-cyber-black rounded-full overflow-hidden border border-cyber-red/20">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-red to-cyber-orange transition-all duration-500"
                    style={{ width: `${(run.currentEnemyHp / enemy.hp) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="text-center">
                  <div className="text-gray-600">ATK</div>
                  <div className="text-cyber-red font-bold">
                    {preview.enemy?.attack ?? enemy.attack}
                  </div>
                  {preview.enemy && preview.enemy.attack !== enemy.attack && (
                    <div className="text-[10px] text-gray-600">base {enemy.attack}</div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-gray-600">DEF</div>
                  <div className="text-cyber-blue font-bold">
                    {preview.enemy?.defense ?? enemy.defense}
                  </div>
                  {preview.enemy && preview.enemy.defense !== enemy.defense && (
                    <div className="text-[10px] text-gray-600">base {enemy.defense}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-800 pt-2">
                <div className="text-center">
                  <div className="text-gray-600">CRIT%</div>
                  <div className="text-cyber-yellow font-bold">{enemy.critChance}%</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">CRIT DMG</div>
                  <div className="text-cyber-yellow font-bold">{enemy.critDamage}%</div>
                </div>
              </div>
            </div>
          </div>

          {!isGroupRun && <CombatLog log={soloLog} className="xl:sticky xl:top-24" />}
        </div>
      )}

      {/* Group combat log + turn order (bottom) */}
      {isGroupRun && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Turn order */}
          <div className="bg-cyber-dark border border-cyber-purple/30 rounded-lg p-4">
            <h3 className="text-[10px] text-cyber-purple uppercase tracking-widest mb-3">
              {t('dungeon:turnOrder')}
            </h3>
            <div className="space-y-2">
              {partyMembers.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-2 rounded border text-xs ${
                    m.id === run.currentTurnId
                      ? 'border-cyber-yellow/50 bg-cyber-yellow/10'
                      : 'border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {m.id === run.currentTurnId && (
                      <span className="text-cyber-yellow animate-pulse">▶</span>
                    )}
                    <span
                      className={
                        m.id === playerCharacter.id ? 'text-cyber-blue font-bold' : 'text-white'
                      }
                    >
                      {m.name}
                    </span>
                    {(afkPenalties[String(m.id)] || 0) > 0 && (
                      <span className="rounded border border-cyber-orange/40 bg-cyber-orange/10 px-1.5 py-0.5 text-[9px] font-bold text-cyber-orange">
                        AFK
                      </span>
                    )}
                  </div>
                  <span className="text-cyber-green text-[10px]">
                    {m.hpCurrent}/{m.hpMax}
                  </span>
                </div>
              ))}
              {/* Enemy turn indicator */}
              <div className="flex items-center justify-between p-2 rounded border border-cyber-red/30 bg-cyber-red/5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-cyber-red">☠</span>
                  <span className="text-cyber-red">{enemy?.name || t('dungeon:enemy')}</span>
                </div>
                <span className="text-[10px] text-gray-600">auto</span>
              </div>
            </div>
            {turnTimer !== null && !isOver && (
              <div className="mt-3 text-center">
                <div className="text-[10px] text-gray-600 mb-1">{t('dungeon:timeRemaining')}</div>
                <div
                  className={`text-2xl font-bold ${turnTimer <= 5 ? 'text-cyber-red animate-pulse' : 'text-cyber-yellow'}`}
                >
                  {turnTimer}s
                </div>
              </div>
            )}
          </div>

          {/* Combat log */}
          <div className="relative md:col-span-2 bg-cyber-dark border border-gray-800 rounded-lg p-4">
            <h3 className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">{t('dungeon:combatLog')}</h3>
            <div
              ref={groupLogScroll.containerRef}
              onScroll={groupLogScroll.handleScroll}
              className="space-y-1 max-h-64 overflow-y-auto pr-1"
            >
              {groupLog.length === 0 ? (
                <div className="text-gray-700 text-xs text-center py-4">
                  {t('dungeon:waitingFirstAction')}
                </div>
              ) : (
                groupLog.map((entry: any, i: number) => (
                  <div
                    key={i}
                    className={`text-xs p-2 rounded ${
                      entry.action === 'player_attack'
                        ? entry.isCrit
                          ? 'bg-cyber-yellow/10 border border-cyber-yellow/20'
                          : entry.characterId === playerCharacter.id
                            ? 'bg-cyber-blue/5'
                            : 'bg-cyber-purple/5'
                        : entry.action === 'enemy_attack'
                          ? 'bg-cyber-red/5'
                          : entry.action === 'enemy_defeated'
                            ? 'bg-cyber-green/10'
                            : entry.action === 'victory'
                              ? 'bg-cyber-green/20 border border-cyber-green/30'
                              : entry.action === 'defeat'
                                ? 'bg-cyber-red/20 border border-cyber-red/30'
                                : 'bg-cyber-black/30'
                    }`}
                  >
                    {entry.action === 'player_attack' && (
                      <>
                        <span
                          className={`font-bold ${entry.characterId === playerCharacter.id ? 'text-cyber-blue' : 'text-cyber-purple'}`}
                        >
                          {entry.characterName}
                        </span>
                        <span className="text-gray-500 ml-1">{t('dungeon:strikes')}</span>
                        <span className="text-white font-bold ml-1">-{entry.damage}</span>
                        {entry.isCrit && (
                          <span className="text-cyber-yellow font-bold ml-1">{t('dungeon:critical')}</span>
                        )}
                        {entry.auto && <span className="text-gray-600 ml-1">(auto)</span>}
                        <span className="text-gray-700 ml-2">
                          {t('dungeon:hpRemaining', { hp: entry.enemyHpLeft })}
                        </span>
                      </>
                    )}
                    {entry.action === 'player_afk' && (
                      <>
                        <span className="text-cyber-orange font-bold">{entry.characterName}</span>
                        <span className="text-gray-500 ml-1">{t('dungeon:wentAfk')}</span>
                        <span className="text-cyber-orange ml-1">
                          {t('dungeon:nextTurnsAt', { seconds: entry.nextTurnSeconds || 5 })}
                        </span>
                      </>
                    )}
                    {entry.action === 'item_use' && (
                      <>
                        <span
                          className={`font-bold ${entry.characterId === playerCharacter.id ? 'text-cyber-blue' : 'text-cyber-purple'}`}
                        >
                          {entry.characterName}
                        </span>
                        <span className="text-gray-500 ml-1">{t('dungeon:uses')}</span>
                        <span className="text-cyber-green ml-1">{entry.itemName || 'un objet'}</span>
                        {entry.healed !== undefined && (
                          <span className="text-white font-bold ml-1">+{entry.healed} HP</span>
                        )}
                        {entry.message && entry.healed === undefined && (
                          <span className="text-gray-400 ml-1">{entry.message}</span>
                        )}
                      </>
                    )}
                    {entry.action === 'enemy_attack' && (
                      <>
                        <span className="text-cyber-red font-bold">{enemy?.name || t('dungeon:enemy')}</span>
                        <span className="text-gray-500 ml-1">{t('dungeon:strikes')}</span>
                        <span className="text-white font-bold ml-1">-{entry.damage}</span>
                        {entry.isCrit && (
                          <span className="text-cyber-red font-bold ml-1">{t('dungeon:critical')}</span>
                        )}
                      </>
                    )}
                    {entry.action === 'enemy_defeated' && (
                      <span className="text-cyber-green font-bold">
                        {t('dungeon:enemyDefeated')} +{entry.creditsReward}c +{entry.xpReward} XP
                      </span>
                    )}
                    {entry.action === 'new_enemy' && (
                      <span className="text-gray-400">
                        {t('dungeon:newEnemy')}<span className="text-white">{entry.enemyName}</span> (
                        {entry.enemyHp} HP)
                      </span>
                    )}
                    {entry.action === 'boss_spawn' && (
                      <span className="text-cyber-yellow font-bold">{t('dungeon:bossSpawn', { name: entry.bossName })}</span>
                    )}
                    {entry.action === 'skill_use' && (
                      <>
                        <span
                          className={`font-bold ${entry.characterId === playerCharacter.id ? 'text-cyber-blue' : 'text-cyber-purple'}`}
                        >
                          {entry.characterName}
                        </span>
                        <span className="text-cyber-purple font-bold ml-1">
                          [{entry.skillName}]
                        </span>
                        {entry.damage && (
                          <span className="text-white font-bold ml-1">-{entry.damage}</span>
                        )}
                        {entry.isCrit && <span className="text-cyber-yellow ml-1">{t('dungeon:critical')}</span>}
                        {entry.healed && (
                          <span className="text-cyber-green ml-1">+{entry.healed} HP</span>
                        )}
                        {entry.stolen && (
                          <span className="text-cyber-yellow ml-1">+{entry.stolen}c</span>
                        )}
                        {entry.message && !entry.damage && !entry.healed && (
                          <span className="text-gray-500 ml-1">{entry.message}</span>
                        )}
                      </>
                    )}
                    {entry.action === 'skill_effect' && (
                      <span className="text-cyber-orange">{entry.message}</span>
                    )}
                    {entry.action === 'enemy_stunned' && (
                      <span className="text-cyber-yellow">{t('dungeon:enemyStunned')}</span>
                    )}
                    {entry.action === 'level_up' && (
                      <span className="text-cyber-purple font-bold">
                        {t('dungeon:levelUp')} {t('dungeon:newLevel', { n: entry.newLevel })}
                      </span>
                    )}
                    {entry.action === 'victory' && (
                      <span className="text-cyber-green font-bold tracking-widest">{t('dungeon:victory')}!</span>
                    )}
                    {entry.action === 'defeat' && (
                      <span className="text-cyber-red font-bold tracking-widest">
                        {t('dungeon:defeat')}
                        {entry.creditsLost !== undefined && ` -${entry.creditsLost}c`}
                        {entry.revivedHp !== undefined && ` ${t('dungeon:returnedToHp', { hp: entry.revivedHp })}`}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
            {groupLogScroll.hasUnseenEntries && (
              <button
                type="button"
                onClick={() => groupLogScroll.scrollToLatest()}
                className="absolute bottom-4 right-4 rounded border border-cyber-blue/40 bg-cyber-blue/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyber-blue transition hover:bg-cyber-blue/20"
              >
                {t('dungeon:latestAction')}
              </button>
            )}
          </div>
        </div>
      )}
    </GameLayout>
  )
}
