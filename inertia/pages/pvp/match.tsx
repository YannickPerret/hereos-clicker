import { router, usePage } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import GameLayout from '~/components/layout'

interface Fighter {
  id: number
  name: string
  level: number
  attack: number
  defense: number
  critChance: number
  critDamage: number
  pvpRating: number
}

interface Skill {
  id: number
  name: string
  description: string
  effectType: string
  effectValue: number
  cooldown: number
  duration: number
  currentCooldown: number
  icon: string
}

interface ActiveEffect {
  type: string
  value: number
  turnsLeft: number
  sourceCharId: number
  targetCharId: number
}

interface LogEntry {
  action?: string
  round?: number
  attackerId: number
  attackerName: string
  defenderId: number
  defenderName: string
  damage?: number
  blocked?: boolean
  isCrit?: boolean
  forfeit?: boolean
  skillName?: string
  message?: string
  healed?: number
  dot?: number
  stun?: boolean
  challengerHp: number
  defenderHp: number
}

interface MatchState {
  id: number
  status: string
  challengerHp: number
  challengerHpMax: number
  defenderHp: number
  defenderHpMax: number
  currentTurnId: number | null
  winnerId: number | null
  ratingChange: number
  log: LogEntry[]
}

interface Props {
  myId: number
  match: MatchState
  challenger: Fighter
  defender: Fighter | null
  skills: Skill[]
  activeEffects: ActiveEffect[]
}

function effectLabel(effect: ActiveEffect) {
  switch (effect.type) {
    case 'debuff_def':
      return `DEF -${effect.value}%`
    case 'debuff_atk':
      return `ATK -${effect.value}%`
    case 'dot':
      return `DOT ${effect.value}/tour`
    case 'turret':
      return `Tourelle ${effect.value}/tour`
    case 'stun':
      return 'Stun'
    case 'shield':
      return 'Bouclier'
    case 'guaranteed_crit':
      return 'Crit garanti'
    case 'buff_atk':
      return `ATK +${effect.value}%`
    case 'buff_def':
      return `DEF +${effect.value}%`
    case 'buff_all':
      return `ATK/DEF +${effect.value}%`
    default:
      return effect.type
  }
}

function LogLine({ entry, myId }: { entry: LogEntry; myId: number }) {
  const actorClass = entry.attackerId === myId ? 'text-cyber-blue' : 'text-cyber-red'

  switch (entry.action) {
    case 'skill_use':
      return (
        <div className="text-xs p-2 rounded bg-cyber-purple/10 border border-cyber-purple/30">
          <span className={actorClass}>{entry.attackerName}</span>
          <span className="text-cyber-purple font-bold ml-1">[{entry.skillName}]</span>
          {entry.blocked
            ? <span className="text-cyber-blue font-bold ml-1">BLOQUE</span>
            : entry.damage
              ? <span className="text-white font-bold ml-1">-{entry.damage}</span>
              : null}
          {entry.healed ? <span className="text-cyber-green font-bold ml-1">+{entry.healed} HP</span> : null}
          {entry.isCrit ? <span className="text-cyber-yellow font-bold ml-1">CRIT!</span> : null}
          {entry.dot ? <span className="text-cyber-orange ml-1">DOT {entry.dot}</span> : null}
          {entry.stun ? <span className="text-cyber-yellow ml-1">STUN</span> : null}
          {entry.message && !entry.damage && !entry.healed ? <span className="text-gray-400 ml-1">{entry.message}</span> : null}
        </div>
      )
    case 'skill_effect':
      return (
        <div className="text-xs p-2 rounded bg-cyber-orange/10 border border-cyber-orange/20">
          <span className={actorClass}>{entry.attackerName}</span>
          <span className="text-cyber-orange ml-1">{entry.message}</span>
          {entry.blocked ? <span className="text-cyber-blue ml-1">BLOQUE</span> : null}
        </div>
      )
    case 'stunned':
      return (
        <div className="text-xs p-2 rounded bg-cyber-yellow/10 border border-cyber-yellow/30">
          <span className="text-cyber-yellow">{entry.message}</span>
        </div>
      )
    case 'forfeit':
      return (
        <div className="text-xs p-2 rounded bg-cyber-red/10 border border-cyber-red/30">
          <span className={actorClass}>{entry.attackerName}</span>
          <span className="text-gray-400 ml-1">abandonne le match</span>
        </div>
      )
    case 'player_attack':
    default:
      return (
        <div className={`text-xs p-2 rounded ${
          entry.blocked
            ? 'bg-cyber-blue/10 border border-cyber-blue/20'
            : entry.isCrit
              ? 'bg-cyber-yellow/10 border border-cyber-yellow/20'
              : entry.attackerId === myId
                ? 'bg-cyber-blue/5'
                : 'bg-cyber-red/5'
        }`}>
          <span className={actorClass}>{entry.attackerName}</span>
          {entry.forfeit ? (
            <span className="text-gray-500 ml-1">a abandonne</span>
          ) : entry.blocked ? (
            <span className="text-cyber-blue font-bold ml-1">attaque bloquee</span>
          ) : (
            <>
              <span className="text-gray-500 ml-1">frappe</span>
              <span className="text-white font-bold ml-1">-{entry.damage}</span>
              {entry.isCrit ? <span className="text-cyber-yellow font-bold ml-1">CRIT!</span> : null}
            </>
          )}
        </div>
      )
  }
}

export default function PvpMatch({
  myId,
  match: initialMatch,
  challenger: initialChallenger,
  defender: initialDefender,
  skills: initialSkills,
  activeEffects: initialEffects,
}: Props) {
  const [match, setMatch] = useState(initialMatch)
  const [challenger] = useState(initialChallenger)
  const [defender, setDefender] = useState(initialDefender)
  const [skills, setSkills] = useState(initialSkills)
  const [activeEffects, setActiveEffects] = useState(initialEffects)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { errors } = usePage().props as any

  const isMyTurn = match.currentTurnId === myId
  const isOver = match.status === 'completed' || match.status === 'cancelled'
  const isWaiting = match.status === 'waiting'
  const amChallenger = challenger.id === myId
  const myFighter = amChallenger ? challenger : defender
  const opponentFighter = amChallenger ? defender : challenger
  const myHp = amChallenger ? match.challengerHp : match.defenderHp
  const myHpMax = amChallenger ? match.challengerHpMax : match.defenderHpMax
  const opponentHp = amChallenger ? match.defenderHp : match.challengerHp
  const opponentHpMax = amChallenger ? match.defenderHpMax : match.challengerHpMax
  const myEffects = activeEffects.filter((effect) => effect.targetCharId === myId)
  const opponentEffects = activeEffects.filter((effect) => effect.targetCharId === opponentFighter?.id)

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/pvp/match/${match.id}/state`)
        const data = await res.json()
        setMatch(data.match)
        setSkills(data.skills || [])
        setActiveEffects(data.activeEffects || [])
        if (data.defender && !defender) {
          setDefender(data.defender)
        }
      } catch {}
    }

    pollRef.current = setInterval(poll, 1500)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [match.id, defender])

  useEffect(() => {
    setMatch(initialMatch)
    setSkills(initialSkills)
    setActiveEffects(initialEffects)
    if (initialDefender) setDefender(initialDefender)
  }, [initialMatch, initialSkills, initialEffects, initialDefender])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [match.log])

  const handleAttack = () => {
    if (!isMyTurn || isSubmitting) return
    setIsSubmitting(true)
    router.post(`/pvp/match/${match.id}/attack`, {}, {
      preserveScroll: true,
      onFinish: () => setIsSubmitting(false),
    })
  }

  const handleSkill = (skillId: number) => {
    if (!isMyTurn || isSubmitting) return
    setIsSubmitting(true)
    router.post(`/pvp/match/${match.id}/skill`, { skillId }, {
      preserveScroll: true,
      onFinish: () => setIsSubmitting(false),
    })
  }

  const handleForfeit = () => {
    if (confirm('Abandonner le combat ? Tu perdras du ELO.')) {
      router.post(`/pvp/match/${match.id}/forfeit`)
    }
  }

  return (
    <GameLayout>
      <div className="max-w-5xl mx-auto">
        {errors?.message && (
          <div className="mb-4 rounded-lg border border-cyber-red/30 bg-cyber-red/10 p-3 text-xs text-cyber-red">
            {errors.message}
          </div>
        )}

        {isWaiting && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 animate-pulse">⚔️</div>
            <h2 className="text-xl font-bold text-cyber-yellow tracking-widest mb-4">
              EN ATTENTE D&apos;ADVERSAIRE...
            </h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-cyber-yellow animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-cyber-yellow animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 rounded-full bg-cyber-yellow animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <p className="text-xs text-gray-600 mb-6">
              {challenger.name} (ELO {challenger.pvpRating}) — Recherche d&apos;un adversaire...
            </p>
            <button
              onClick={() => router.post('/pvp/leave-queue')}
              className="px-6 py-2 border border-gray-700 text-gray-500 rounded text-xs hover:text-gray-300 hover:border-gray-500 transition-all"
            >
              ANNULER
            </button>
          </div>
        )}

        {match.status === 'in_progress' && defender && (
          <>
            <div className="text-center mb-4">
              <span className={`text-xs px-4 py-1.5 rounded-full border ${isMyTurn ? 'bg-cyber-green/10 border-cyber-green/50 text-cyber-green' : 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'}`}>
                {isMyTurn ? 'TON TOUR' : `Tour de ${opponentFighter?.name}...`}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className={`bg-cyber-dark border rounded-lg p-4 ${isMyTurn ? 'border-cyber-green/50' : 'border-gray-800'}`}>
                <h3 className="text-cyber-blue font-bold text-center text-sm mb-3 tracking-widest">
                  {myFighter?.name} (TOI)
                </h3>
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>HP</span>
                    <span>{myHp}/{myHpMax}</span>
                  </div>
                  <div className="h-4 bg-cyber-black rounded-full overflow-hidden border border-cyber-green/20">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-500"
                      style={{ width: `${(myHp / myHpMax) * 100}%` }}
                    />
                  </div>
                </div>
                {myEffects.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {myEffects.map((effect, index) => (
                      <div key={`${effect.type}-${index}`} className="rounded border border-cyber-green/20 bg-cyber-green/5 px-2 py-1 text-[10px] text-cyber-green">
                        {effectLabel(effect)} <span className="text-gray-600">({effect.turnsLeft}t)</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="text-center"><span className="text-gray-600">ATK</span> <span className="text-cyber-red font-bold ml-1">{myFighter?.attack}</span></div>
                  <div className="text-center"><span className="text-gray-600">DEF</span> <span className="text-cyber-blue font-bold ml-1">{myFighter?.defense}</span></div>
                  <div className="text-center"><span className="text-gray-600">CRIT%</span> <span className="text-cyber-yellow font-bold ml-1">{myFighter?.critChance}%</span></div>
                  <div className="text-center"><span className="text-gray-600">ELO</span> <span className="text-cyber-yellow font-bold ml-1">{myFighter?.pvpRating}</span></div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="text-4xl font-bold text-cyber-pink neon-text-pink tracking-widest">VS</div>

                <div className="space-y-2 w-full">
                  <button
                    onClick={handleAttack}
                    disabled={!isMyTurn || isSubmitting}
                    className={`w-full py-3 rounded border font-bold uppercase tracking-widest text-sm transition-all ${
                      isMyTurn && !isSubmitting
                        ? 'bg-cyber-red/20 border-cyber-red text-cyber-red hover:bg-cyber-red/30 animate-pulse'
                        : 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'ACTION...' : isMyTurn ? '[ ATTAQUER ]' : 'EN ATTENTE...'}
                  </button>

                  {skills.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] text-cyber-purple uppercase tracking-widest text-center">Competences Speciales</div>
                      {skills.map((skill) => {
                        const onCooldown = skill.currentCooldown > 0
                        const disabled = onCooldown || !isMyTurn || isSubmitting
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => !disabled && handleSkill(skill.id)}
                            disabled={disabled}
                            title={skill.description}
                            className={`w-full rounded border px-2 py-2 text-xs transition-all ${
                              disabled
                                ? 'bg-gray-900/50 border-gray-800 text-gray-700 cursor-not-allowed'
                                : 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/20'
                            }`}
                          >
                            <span className="font-bold">{skill.name}</span>
                            <span className="ml-1 text-[10px] text-gray-600">
                              {onCooldown ? `(${skill.currentCooldown} tours)` : `CD:${skill.cooldown}`}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <button
                    onClick={handleForfeit}
                    className="w-full text-[10px] py-2 text-gray-700 hover:text-cyber-red transition-colors"
                  >
                    ABANDONNER
                  </button>
                </div>
              </div>

              <div className={`bg-cyber-dark border rounded-lg p-4 ${!isMyTurn ? 'border-cyber-red/50' : 'border-gray-800'}`}>
                <h3 className="text-cyber-red font-bold text-center text-sm mb-3 tracking-widest">
                  {opponentFighter?.name}
                </h3>
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>HP</span>
                    <span>{opponentHp}/{opponentHpMax}</span>
                  </div>
                  <div className="h-4 bg-cyber-black rounded-full overflow-hidden border border-cyber-red/20">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-red to-cyber-orange transition-all duration-500"
                      style={{ width: `${(opponentHp / opponentHpMax) * 100}%` }}
                    />
                  </div>
                </div>
                {opponentEffects.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {opponentEffects.map((effect, index) => (
                      <div key={`${effect.type}-${index}`} className="rounded border border-cyber-red/20 bg-cyber-red/5 px-2 py-1 text-[10px] text-cyber-red">
                        {effectLabel(effect)} <span className="text-gray-600">({effect.turnsLeft}t)</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="text-center"><span className="text-gray-600">ATK</span> <span className="text-cyber-red font-bold ml-1">{opponentFighter?.attack}</span></div>
                  <div className="text-center"><span className="text-gray-600">DEF</span> <span className="text-cyber-blue font-bold ml-1">{opponentFighter?.defense}</span></div>
                  <div className="text-center"><span className="text-gray-600">CRIT%</span> <span className="text-cyber-yellow font-bold ml-1">{opponentFighter?.critChance}%</span></div>
                  <div className="text-center"><span className="text-gray-600">ELO</span> <span className="text-cyber-yellow font-bold ml-1">{opponentFighter?.pvpRating}</span></div>
                </div>
              </div>
            </div>

            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-4">
              <h3 className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Combat Log</h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {match.log.map((entry, index) => (
                  <LogLine key={index} entry={entry} myId={myId} />
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </>
        )}

        {isOver && match.winnerId && (
          <div className="text-center py-16">
            <h2 className={`text-3xl font-bold tracking-widest mb-4 ${match.winnerId === myId ? 'text-cyber-green' : 'text-cyber-red'}`}>
              {match.winnerId === myId ? 'VICTOIRE!' : 'DEFAITE'}
            </h2>
            <div className="space-y-2 mb-6">
              <div className={`text-lg font-bold ${match.winnerId === myId ? 'text-cyber-green' : 'text-cyber-red'}`}>
                {match.winnerId === myId ? '+' : '-'}{match.ratingChange} ELO
              </div>
            </div>

            {match.log.length > 0 && (
              <div className="max-w-xl mx-auto bg-cyber-dark border border-gray-800 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Replay</h3>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {match.log.map((entry, index) => (
                    <LogLine key={index} entry={entry} myId={myId} />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.visit('/pvp')}
              className="px-8 py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all"
            >
              [ RETOUR A L&apos;ARENE ]
            </button>
          </div>
        )}
      </div>
    </GameLayout>
  )
}
