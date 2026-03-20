import { router, usePage } from '@inertiajs/react'
import { useState, useEffect, useRef } from 'react'
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
  consumables: { id: number; quantity: number; item: { name: string; effectType: string; effectValue: number } }[]
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
  creditsReward?: number
  xpReward?: number
  loot?: { name: string; rarity: string }[]
  newLevel?: number
  bossName?: string
  enemyName?: string
  enemyHp?: number
}

const TIER_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-cyber-blue',
  3: 'text-cyber-purple',
  4: 'text-cyber-yellow',
}

function CombatLog({ log }: { log: CombatLogEntry[] }) {
  if (!log || log.length === 0) return null

  return (
    <div className="max-w-md mx-auto mb-4 space-y-1">
      {log.map((entry, i) => {
        switch (entry.action) {
          case 'player_attack':
            return (
              <div key={i} className={`text-xs p-2 rounded ${entry.isCrit ? 'bg-cyber-yellow/10 border border-cyber-yellow/30' : 'bg-cyber-blue/5'}`}>
                <span className="text-cyber-blue">Tu attaques</span>
                <span className="text-white font-bold ml-1">-{entry.damage} HP</span>
                {entry.isCrit && <span className="text-cyber-yellow font-bold ml-2 animate-pulse">CRITIQUE!</span>}
              </div>
            )
          case 'enemy_attack':
            return (
              <div key={i} className={`text-xs p-2 rounded ${entry.blocked ? 'bg-cyber-blue/10 border border-cyber-blue/30' : entry.isCrit ? 'bg-cyber-red/20 border border-cyber-red/50' : 'bg-cyber-red/5'}`}>
                <span className="text-cyber-red">L'ennemi attaque</span>
                {entry.blocked
                  ? <span className="text-cyber-blue font-bold ml-1">BLOQUE PAR LE BOUCLIER!</span>
                  : <>
                      <span className="text-white font-bold ml-1">-{entry.damage} HP</span>
                      {entry.isCrit && <span className="text-cyber-red font-bold ml-2 animate-pulse">CRITIQUE!</span>}
                    </>
                }
              </div>
            )
          case 'enemy_defeated':
            return (
              <div key={i} className="text-xs p-2 rounded bg-cyber-green/10 border border-cyber-green/30">
                <span className="text-cyber-green font-bold">Ennemi vaincu!</span>
                <span className="text-cyber-yellow ml-2">+{entry.creditsReward}c</span>
                <span className="text-cyber-blue ml-2">+{entry.xpReward} XP</span>
                {entry.loot && entry.loot.length > 0 && (
                  <span className="text-cyber-pink ml-2">
                    Loot: {entry.loot.map((l) => l.name).join(', ')}
                  </span>
                )}
              </div>
            )
          case 'level_up':
            return (
              <div key={i} className="text-xs p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                <span className="text-cyber-purple font-bold">LEVEL UP!</span>
                <span className="text-white ml-2">Niveau {entry.newLevel}</span>
              </div>
            )
          case 'boss_spawn':
            return (
              <div key={i} className="text-xs p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/50">
                <span className="text-cyber-yellow font-bold">BOSS: {entry.bossName}</span>
              </div>
            )
          case 'new_enemy':
            return (
              <div key={i} className="text-xs p-2 rounded bg-gray-800">
                <span className="text-gray-400">Nouvel ennemi: </span>
                <span className="text-white">{entry.enemyName}</span>
                <span className="text-gray-600 ml-1">({entry.enemyHp} HP)</span>
              </div>
            )
          case 'skill_use':
            return (
              <div key={i} className="text-xs p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30">
                <span className="text-cyber-purple font-bold">{entry.skillName}</span>
                {entry.damage && <span className="text-white font-bold ml-1">-{entry.damage} HP</span>}
                {entry.isCrit && <span className="text-cyber-yellow font-bold ml-1">CRIT!</span>}
                {entry.healed && <span className="text-cyber-green font-bold ml-1">+{entry.healed} HP</span>}
                {entry.stolen && <span className="text-cyber-yellow ml-1">+{entry.stolen}c voles</span>}
                {entry.message && !entry.damage && !entry.healed && <span className="text-gray-400 ml-1">{entry.message}</span>}
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
                <span className="text-cyber-yellow">L'ennemi est paralyse!</span>
              </div>
            )
          case 'victory':
            return (
              <div key={i} className="text-xs p-2 rounded bg-cyber-green/20 border border-cyber-green/50 text-center">
                <span className="text-cyber-green font-bold tracking-widest">VICTOIRE</span>
              </div>
            )
          case 'defeat':
            return (
              <div key={i} className="text-xs p-2 rounded bg-cyber-red/20 border border-cyber-red/50 text-center">
                <span className="text-cyber-red font-bold tracking-widest">DEFAITE</span>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

export default function DungeonRun({ character, run: initialRun, floor, currentEnemy: initialEnemy, consumables, skills = [], activeEffects: initialEffects = [] }: Props) {
  const [run, setRun] = useState(initialRun)
  const [enemy, setEnemy] = useState(initialEnemy)
  const [partyMembers, setPartyMembers] = useState<{ id: number; name: string; level: number; hpCurrent: number; hpMax: number }[]>([])
  const [groupLog, setGroupLog] = useState<any[]>([])
  const [turnTimer, setTurnTimer] = useState<number | null>(null)
  const isOver = run.status !== 'in_progress'
  const { combatLog } = usePage().props as any
  const isGroupRun = !!run.partyId
  const isMyTurn = !run.partyId || run.currentTurnId === character.id

  // Sync from Inertia props
  useEffect(() => {
    setRun(initialRun)
    setEnemy(initialEnemy)
  }, [initialRun, initialEnemy])

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
        setRun(data.run)
        setEnemy(data.currentEnemy)
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
    return () => { active = false; clearInterval(poll) }
  }, [run.id, isGroupRun])

  return (
    <GameLayout>
      {/* Floor info */}
      <div className="text-center mb-4">
        <div className="text-xs text-gray-600 uppercase tracking-widest">
          F{floor.floorNumber} - {floor.name}
        </div>
        <div className="text-xs text-gray-700">
          Ennemis vaincus: {run.enemiesDefeated}/3
        </div>
      </div>

      {/* Turn indicator for group */}
      {isGroupRun && !isOver && (
        <div className="text-center mb-4">
          <span className={`text-xs px-4 py-1.5 rounded-full border ${
            isMyTurn
              ? 'bg-cyber-green/10 border-cyber-green/50 text-cyber-green'
              : 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'
          }`}>
            {isMyTurn ? 'TON TOUR — ATTAQUE!' : `Tour de ${partyMembers.find((m) => m.id === run.currentTurnId)?.name || '...'}...`}
            {turnTimer !== null && (
              <span className={`ml-2 font-bold ${turnTimer <= 5 ? 'text-cyber-red animate-pulse' : ''}`}>
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
            <div key={m.id} className={`text-center px-3 py-1.5 rounded border text-xs ${
              m.id === run.currentTurnId
                ? 'border-cyber-yellow/50 bg-cyber-yellow/10'
                : m.id === character.id
                  ? 'border-cyber-blue/30 bg-cyber-blue/5'
                  : 'border-gray-800'
            }`}>
              <div className="text-white font-bold">{m.name}</div>
              <div className="text-[10px] text-gray-500">LVL {m.level}</div>
              <div className="text-[10px] text-cyber-green">{m.hpCurrent}/{m.hpMax} HP</div>
            </div>
          ))}
        </div>
      )}

      {/* Combat Log (solo only — group log is at the bottom) */}
      {!isGroupRun && <CombatLog log={combatLog} />}

      {/* Victory/Defeat Overlay */}
      {isOver && (
        <div className="bg-cyber-dark border rounded-lg p-8 text-center mb-6 max-w-md mx-auto"
          style={{ borderColor: run.status === 'victory' ? '#00ff41' : run.status === 'defeat' ? '#ff0040' : '#666' }}
        >
          <h2 className={`text-3xl font-bold mb-4 tracking-widest ${
            run.status === 'victory' ? 'text-cyber-green' : run.status === 'defeat' ? 'text-cyber-red' : 'text-gray-400'
          }`}>
            {run.status === 'victory' ? 'VICTOIRE' : run.status === 'defeat' ? 'DEFAITE' : 'FUITE'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {run.status === 'victory'
              ? 'Tu as nettoye cet etage. Le loot a ete ajoute a ton inventaire.'
              : run.status === 'defeat'
                ? 'Tes implants t\'ont ramene. Tu perds le loot non recupere.'
                : 'Tu t\'es echappe. Pas de honte a survivre.'}
          </p>
          <button
            onClick={() => router.visit(run.partyId ? '/party' : '/dungeon')}
            className="px-6 py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all"
          >
            [ {run.partyId ? 'RETOUR AU GROUPE' : 'RETOUR'} ]
          </button>
        </div>
      )}

      {/* Combat Arena */}
      {!isOver && enemy && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Player */}
          <div className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-5">
            <h3 className="text-cyber-blue font-bold text-center mb-3 tracking-widest text-sm">
              {character.name}
            </h3>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>HP</span>
                <span>{character.hpCurrent}/{character.hpMax}</span>
              </div>
              <div className="h-4 bg-cyber-black rounded-full overflow-hidden border border-cyber-green/20">
                <div
                  className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-500"
                  style={{ width: `${(character.hpCurrent / character.hpMax) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className="text-center">
                <div className="text-gray-600">ATK</div>
                <div className="text-cyber-red font-bold">{character.attack}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">DEF</div>
                <div className="text-cyber-blue font-bold">{character.defense}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-800 pt-2">
              <div className="text-center">
                <div className="text-gray-600">CRIT%</div>
                <div className="text-cyber-yellow font-bold">{character.critChance}%</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">CRIT DMG</div>
                <div className="text-cyber-yellow font-bold">{character.critDamage}%</div>
              </div>
            </div>
          </div>

          {/* VS + Actions */}
          <div className="flex flex-col items-center gap-4">
            <div className="text-4xl font-bold text-cyber-pink neon-text-pink tracking-widest">VS</div>

            <div className="space-y-2 w-full">
              <button
                onClick={() => router.post(`/dungeon/run/${run.id}/attack`)}
                disabled={isGroupRun && !isMyTurn}
                className={`w-full py-3 border font-bold uppercase tracking-widest rounded transition-all text-sm ${
                  isGroupRun && !isMyTurn
                    ? 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed'
                    : 'bg-cyber-red/20 border-cyber-red text-cyber-red hover:bg-cyber-red/30'
                } ${isMyTurn && isGroupRun ? 'animate-pulse' : ''}`}
              >
                {isGroupRun && !isMyTurn ? '[ EN ATTENTE... ]' : '[ ATTAQUER ]'}
              </button>

              {/* Combat Skills */}
              {skills.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[9px] text-cyber-purple uppercase tracking-widest text-center">Programmes</div>
                  {skills.map((skill) => {
                    const onCooldown = skill.currentCooldown > 0
                    const disabled = onCooldown || (isGroupRun && !isMyTurn)
                    return (
                      <button
                        key={skill.id}
                        onClick={() => !disabled && router.post(`/dungeon/run/${run.id}/skill`, { skillId: skill.id })}
                        disabled={disabled}
                        title={skill.description}
                        className={`w-full py-2 border rounded text-xs transition-all relative ${
                          disabled
                            ? 'bg-gray-900/50 border-gray-800 text-gray-700 cursor-not-allowed'
                            : 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/20'
                        }`}
                      >
                        <span className="font-bold">{skill.name}</span>
                        {onCooldown && (
                          <span className="ml-2 text-[10px] text-gray-600">({skill.currentCooldown} tours)</span>
                        )}
                        {!onCooldown && (
                          <span className="ml-1 text-[10px] text-gray-600">CD:{skill.cooldown}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Active Effects */}
              {initialEffects.length > 0 && (
                <div className="space-y-0.5">
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest text-center">Effets actifs</div>
                  {initialEffects.map((eff, i) => (
                    <div key={i} className={`text-[10px] px-2 py-1 rounded border ${
                      eff.targetType === 'enemy'
                        ? 'border-cyber-red/20 text-cyber-red bg-cyber-red/5'
                        : 'border-cyber-green/20 text-cyber-green bg-cyber-green/5'
                    }`}>
                      {eff.type === 'debuff_def' && `DEF ennemi -${eff.value}%`}
                      {eff.type === 'debuff_atk' && `ATK ennemi -${eff.value}%`}
                      {eff.type === 'dot' && `Saignement ${eff.value}/tour`}
                      {eff.type === 'turret' && `Tourelle ${eff.value}/tour`}
                      {eff.type === 'stun' && 'Ennemi paralyse'}
                      {eff.type === 'shield' && 'Bouclier actif'}
                      {eff.type === 'guaranteed_crit' && 'Crit garanti'}
                      {eff.type === 'buff_atk' && `ATK +${eff.value}%`}
                      {eff.type === 'buff_def' && `DEF +${eff.value}%`}
                      {eff.type === 'buff_all' && `ATK/DEF +${eff.value}%`}
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
                      onClick={() => router.post(`/dungeon/run/${run.id}/use-item`, { inventoryItemId: c.id })}
                      className="w-full py-2 bg-cyber-green/10 border border-cyber-green/30 text-cyber-green rounded hover:bg-cyber-green/20 transition-all text-xs"
                    >
                      {c.item.name} (x{c.quantity}) +{c.item.effectValue} {c.item.effectType === 'hp_restore' ? 'HP' : ''}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => router.post(`/dungeon/run/${run.id}/flee`)}
                className="w-full py-2 bg-gray-900 border border-gray-700 text-gray-500 uppercase tracking-widest rounded hover:bg-gray-800 hover:text-gray-400 transition-all text-xs"
              >
                [ FUIR ]
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
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <p className="text-[10px] text-gray-600 mb-3">{enemy.description}</p>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>HP</span>
                <span>{run.currentEnemyHp}/{enemy.hp}</span>
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
                <div className="text-cyber-red font-bold">{enemy.attack}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">DEF</div>
                <div className="text-cyber-blue font-bold">{enemy.defense}</div>
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
      )}

      {/* Group combat log + turn order (bottom) */}
      {isGroupRun && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Turn order */}
          <div className="bg-cyber-dark border border-cyber-purple/30 rounded-lg p-4">
            <h3 className="text-[10px] text-cyber-purple uppercase tracking-widest mb-3">Ordre de tour</h3>
            <div className="space-y-2">
              {partyMembers.map((m) => (
                <div key={m.id} className={`flex items-center justify-between p-2 rounded border text-xs ${
                  m.id === run.currentTurnId
                    ? 'border-cyber-yellow/50 bg-cyber-yellow/10'
                    : 'border-gray-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {m.id === run.currentTurnId && <span className="text-cyber-yellow animate-pulse">▶</span>}
                    <span className={m.id === character.id ? 'text-cyber-blue font-bold' : 'text-white'}>
                      {m.name}
                    </span>
                  </div>
                  <span className="text-cyber-green text-[10px]">{m.hpCurrent}/{m.hpMax}</span>
                </div>
              ))}
              {/* Enemy turn indicator */}
              <div className="flex items-center justify-between p-2 rounded border border-cyber-red/30 bg-cyber-red/5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-cyber-red">☠</span>
                  <span className="text-cyber-red">{enemy?.name || 'Ennemi'}</span>
                </div>
                <span className="text-[10px] text-gray-600">auto</span>
              </div>
            </div>
            {turnTimer !== null && !isOver && (
              <div className="mt-3 text-center">
                <div className="text-[10px] text-gray-600 mb-1">Temps restant</div>
                <div className={`text-2xl font-bold ${turnTimer <= 5 ? 'text-cyber-red animate-pulse' : 'text-cyber-yellow'}`}>
                  {turnTimer}s
                </div>
              </div>
            )}
          </div>

          {/* Combat log */}
          <div className="md:col-span-2 bg-cyber-dark border border-gray-800 rounded-lg p-4">
            <h3 className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Combat Log</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {groupLog.length === 0 ? (
                <div className="text-gray-700 text-xs text-center py-4">En attente de la premiere action...</div>
              ) : (
                groupLog.map((entry: any, i: number) => (
                  <div key={i} className={`text-xs p-2 rounded ${
                    entry.action === 'player_attack'
                      ? entry.isCrit ? 'bg-cyber-yellow/10 border border-cyber-yellow/20' : entry.characterId === character.id ? 'bg-cyber-blue/5' : 'bg-cyber-purple/5'
                      : entry.action === 'enemy_attack'
                        ? 'bg-cyber-red/5'
                        : entry.action === 'enemy_defeated' ? 'bg-cyber-green/10'
                        : entry.action === 'victory' ? 'bg-cyber-green/20 border border-cyber-green/30'
                        : entry.action === 'defeat' ? 'bg-cyber-red/20 border border-cyber-red/30'
                        : 'bg-cyber-black/30'
                  }`}>
                    {entry.action === 'player_attack' && (
                      <>
                        <span className={`font-bold ${entry.characterId === character.id ? 'text-cyber-blue' : 'text-cyber-purple'}`}>
                          {entry.characterName}
                        </span>
                        <span className="text-gray-500 ml-1">frappe</span>
                        <span className="text-white font-bold ml-1">-{entry.damage}</span>
                        {entry.isCrit && <span className="text-cyber-yellow font-bold ml-1">CRIT!</span>}
                        {entry.auto && <span className="text-gray-600 ml-1">(auto)</span>}
                        <span className="text-gray-700 ml-2">({entry.enemyHpLeft} HP restants)</span>
                      </>
                    )}
                    {entry.action === 'enemy_attack' && (
                      <>
                        <span className="text-cyber-red font-bold">{enemy?.name || 'Ennemi'}</span>
                        <span className="text-gray-500 ml-1">frappe</span>
                        <span className="text-white font-bold ml-1">-{entry.damage}</span>
                        {entry.isCrit && <span className="text-cyber-red font-bold ml-1">CRIT!</span>}
                      </>
                    )}
                    {entry.action === 'enemy_defeated' && (
                      <span className="text-cyber-green font-bold">Ennemi vaincu! +{entry.creditsReward}c +{entry.xpReward} XP</span>
                    )}
                    {entry.action === 'new_enemy' && (
                      <span className="text-gray-400">Nouvel ennemi: <span className="text-white">{entry.enemyName}</span> ({entry.enemyHp} HP)</span>
                    )}
                    {entry.action === 'boss_spawn' && (
                      <span className="text-cyber-yellow font-bold">BOSS: {entry.bossName}</span>
                    )}
                    {entry.action === 'skill_use' && (
                      <>
                        <span className={`font-bold ${entry.characterId === character.id ? 'text-cyber-blue' : 'text-cyber-purple'}`}>
                          {entry.characterName}
                        </span>
                        <span className="text-cyber-purple font-bold ml-1">[{entry.skillName}]</span>
                        {entry.damage && <span className="text-white font-bold ml-1">-{entry.damage}</span>}
                        {entry.isCrit && <span className="text-cyber-yellow ml-1">CRIT!</span>}
                        {entry.healed && <span className="text-cyber-green ml-1">+{entry.healed} HP</span>}
                        {entry.stolen && <span className="text-cyber-yellow ml-1">+{entry.stolen}c</span>}
                        {entry.message && !entry.damage && !entry.healed && <span className="text-gray-500 ml-1">{entry.message}</span>}
                      </>
                    )}
                    {entry.action === 'skill_effect' && (
                      <span className="text-cyber-orange">{entry.message}</span>
                    )}
                    {entry.action === 'enemy_stunned' && (
                      <span className="text-cyber-yellow">L'ennemi est paralyse!</span>
                    )}
                    {entry.action === 'level_up' && (
                      <span className="text-cyber-purple font-bold">LEVEL UP! Niveau {entry.newLevel}</span>
                    )}
                    {entry.action === 'victory' && (
                      <span className="text-cyber-green font-bold tracking-widest">VICTOIRE!</span>
                    )}
                    {entry.action === 'defeat' && (
                      <span className="text-cyber-red font-bold tracking-widest">DEFAITE</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  )
}
