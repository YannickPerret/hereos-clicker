import { router, usePage } from '@inertiajs/react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  currentHp: number
  hpMax: number
  isEliminated: boolean
  slot: number
  isLeader: boolean
}

interface TeamState {
  team: number
  averageRating: number
  members: Fighter[]
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
}

interface MatchState {
  id: number
  status: string
  queueMode: 'solo' | 'duo' | 'trio'
  teamSize: number
  currentTurnId: number | null
  winnerId: number | null
  winnerTeam: number | null
  ratingChange: number
  log: LogEntry[]
  queueEstimateSeconds: number
}

interface Props {
  myId: number
  match: MatchState
  teams: TeamState[]
  skills: Skill[]
  activeEffects: ActiveEffect[]
}

const formatEta = (seconds: number) => {
  if (seconds < 60) return `~${seconds}s`
  const minutes = Math.ceil(seconds / 60)
  return `~${minutes} min`
}

const queueLabel: Record<MatchState['queueMode'], string> = {
  solo: 'SoloQ',
  duo: 'DuoQ',
  trio: 'TrioQ',
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
        <div className="rounded border border-cyber-purple/30 bg-cyber-purple/10 p-2 text-xs">
          <span className={actorClass}>{entry.attackerName}</span>
          <span className="ml-1 font-bold text-cyber-purple">[{entry.skillName}]</span>
          {entry.blocked ? (
            <span className="ml-1 font-bold text-cyber-blue">BLOQUE</span>
          ) : entry.damage ? (
            <span className="ml-1 font-bold text-white">-{entry.damage}</span>
          ) : null}
          {entry.healed ? (
            <span className="ml-1 font-bold text-cyber-green">+{entry.healed} HP</span>
          ) : null}
          {entry.isCrit ? <span className="ml-1 font-bold text-cyber-yellow">CRIT!</span> : null}
          {entry.dot ? <span className="ml-1 text-cyber-orange">DOT {entry.dot}</span> : null}
          {entry.stun ? <span className="ml-1 text-cyber-yellow">STUN</span> : null}
          {entry.message && !entry.damage && !entry.healed ? (
            <span className="ml-1 text-gray-400">{entry.message}</span>
          ) : null}
        </div>
      )
    case 'skill_effect':
      return (
        <div className="rounded border border-cyber-orange/20 bg-cyber-orange/10 p-2 text-xs">
          <span className={actorClass}>{entry.attackerName}</span>
          <span className="ml-1 text-cyber-orange">{entry.message}</span>
          {entry.blocked ? <span className="ml-1 text-cyber-blue">BLOQUE</span> : null}
        </div>
      )
    case 'stunned':
      return (
        <div className="rounded border border-cyber-yellow/30 bg-cyber-yellow/10 p-2 text-xs text-cyber-yellow">
          {entry.message}
        </div>
      )
    case 'forfeit':
      return (
        <div className="rounded border border-cyber-red/30 bg-cyber-red/10 p-2 text-xs">
          <span className={actorClass}>{entry.attackerName}</span>
          <span className="ml-1 text-gray-400">abandonne le match</span>
        </div>
      )
    case 'player_attack':
    default:
      return (
        <div
          className={`rounded p-2 text-xs ${
            entry.blocked
              ? 'border border-cyber-blue/20 bg-cyber-blue/10'
              : entry.isCrit
                ? 'border border-cyber-yellow/20 bg-cyber-yellow/10'
                : entry.attackerId === myId
                  ? 'bg-cyber-blue/5'
                  : 'bg-cyber-red/5'
          }`}
        >
          <span className={actorClass}>{entry.attackerName}</span>
          {entry.forfeit ? (
            <span className="ml-1 text-gray-500">a abandonne</span>
          ) : entry.blocked ? (
            <span className="ml-1 font-bold text-cyber-blue">attaque bloquee</span>
          ) : (
            <>
              <span className="ml-1 text-gray-500">frappe</span>
              <span className="ml-1 font-bold text-white">-{entry.damage}</span>
              {entry.isCrit ? (
                <span className="ml-1 font-bold text-cyber-yellow">CRIT!</span>
              ) : null}
            </>
          )}
        </div>
      )
  }
}

function FighterCard({
  fighter,
  isCurrentTurn,
  isMe,
  isSelected,
  effects,
  onSelect,
}: {
  fighter: Fighter
  isCurrentTurn: boolean
  isMe: boolean
  isSelected: boolean
  effects: ActiveEffect[]
  onSelect?: () => void
}) {
  const border = fighter.isEliminated
    ? 'border-gray-800 opacity-50'
    : isCurrentTurn
      ? 'border-cyber-yellow/50 bg-cyber-yellow/5'
      : isSelected
        ? 'border-cyber-red/50 bg-cyber-red/5'
        : isMe
          ? 'border-cyber-blue/40 bg-cyber-blue/5'
          : 'border-gray-800'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect || fighter.isEliminated}
      className={`w-full rounded-lg border p-3 text-left transition-all ${border} ${onSelect && !fighter.isEliminated ? 'hover:border-cyber-red/50' : 'cursor-default'}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">
            {fighter.name} {isMe ? '(TOI)' : ''}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-600">
            LVL {fighter.level} {fighter.isLeader ? '• Leader' : ''}
          </div>
        </div>
        {fighter.isEliminated && (
          <div className="rounded border border-cyber-red/30 bg-cyber-red/10 px-2 py-1 text-[10px] uppercase tracking-widest text-cyber-red">
            KO
          </div>
        )}
      </div>

      <div className="mb-2">
        <div className="mb-1 flex justify-between text-[10px] text-gray-500">
          <span>HP</span>
          <span>
            {fighter.currentHp}/{fighter.hpMax}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-cyber-green/20 bg-cyber-black">
          <div
            className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-500"
            style={{
              width: `${fighter.hpMax > 0 ? (fighter.currentHp / fighter.hpMax) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {effects.length > 0 && (
        <div className="mb-2 space-y-1">
          {effects.map((effect, index) => (
            <div
              key={`${effect.type}-${index}`}
              className="rounded border border-cyber-purple/20 bg-cyber-purple/5 px-2 py-1 text-[10px] text-cyber-purple"
            >
              {effectLabel(effect)} <span className="text-gray-600">({effect.turnsLeft}t)</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 text-[10px]">
        <div>
          <span className="text-gray-600">ATK</span>{' '}
          <span className="ml-1 font-bold text-cyber-red">{fighter.attack}</span>
        </div>
        <div>
          <span className="text-gray-600">DEF</span>{' '}
          <span className="ml-1 font-bold text-cyber-blue">{fighter.defense}</span>
        </div>
        <div>
          <span className="text-gray-600">CRIT%</span>{' '}
          <span className="ml-1 font-bold text-cyber-yellow">{fighter.critChance}%</span>
        </div>
        <div>
          <span className="text-gray-600">ELO</span>{' '}
          <span className="ml-1 font-bold text-cyber-yellow">{fighter.pvpRating}</span>
        </div>
      </div>
    </button>
  )
}

export default function PvpMatch({
  myId,
  match: initialMatch,
  teams: initialTeams,
  skills: initialSkills,
  activeEffects: initialEffects,
}: Props) {
  const [match, setMatch] = useState(initialMatch)
  const [teams, setTeams] = useState(initialTeams)
  const [skills, setSkills] = useState(initialSkills)
  const [activeEffects, setActiveEffects] = useState(initialEffects)
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { errors } = usePage().props as { errors?: { message?: string } }

  const myTeam = useMemo(
    () => teams.find((team) => team.members.some((member) => member.id === myId)) || teams[0],
    [teams, myId]
  )
  const opponentTeam = useMemo(
    () => teams.find((team) => team.team !== myTeam?.team) || teams[1] || null,
    [teams, myTeam]
  )
  const myFighter = useMemo(
    () => myTeam?.members.find((member) => member.id === myId) || null,
    [myTeam, myId]
  )
  const opponentAlive = useMemo(
    () => (opponentTeam?.members || []).filter((member) => !member.isEliminated),
    [opponentTeam]
  )
  const myEffects = useMemo(
    () => activeEffects.filter((effect) => effect.targetCharId === myId),
    [activeEffects, myId]
  )
  const isMyTurn = match.currentTurnId === myId && !myFighter?.isEliminated
  const isSoloQueue = match.queueMode === 'solo'
  const isOver = match.status === 'completed' || match.status === 'cancelled'
  const isWaiting = match.status === 'waiting'

  useEffect(() => {
    const fallbackTarget = opponentAlive[0]?.id || null
    if (!selectedTargetId || !opponentAlive.some((member) => member.id === selectedTargetId)) {
      setSelectedTargetId(fallbackTarget)
    }
  }, [opponentAlive, selectedTargetId])

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/pvp/match/${match.id}/state`)
        const data = await res.json()
        setMatch(data.match)
        setTeams(data.teams || [])
        setSkills(data.skills || [])
        setActiveEffects(data.activeEffects || [])
      } catch {}
    }

    pollRef.current = setInterval(poll, 1500)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [match.id])

  useEffect(() => {
    setMatch(initialMatch)
    setTeams(initialTeams)
    setSkills(initialSkills)
    setActiveEffects(initialEffects)
  }, [initialMatch, initialTeams, initialSkills, initialEffects])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [match.log])

  const handleAttack = () => {
    if (!isMyTurn || isSubmitting) return
    setIsSubmitting(true)
    router.post(
      `/pvp/match/${match.id}/attack`,
      { targetId: selectedTargetId },
      {
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false),
      }
    )
  }

  const handleSkill = (skillId: number, needsTarget: boolean) => {
    if (!isMyTurn || isSubmitting) return
    setIsSubmitting(true)
    router.post(
      `/pvp/match/${match.id}/skill`,
      {
        skillId,
        targetId: needsTarget ? selectedTargetId : null,
      },
      {
        preserveScroll: true,
        onFinish: () => setIsSubmitting(false),
      }
    )
  }

  const handleForfeit = () => {
    if (confirm('Abandonner le combat ? Toute ton equipe perdra ce match.')) {
      router.post(`/pvp/match/${match.id}/forfeit`)
    }
  }

  const turnOrder = useMemo(() => {
    return [...teams.flatMap((team) => team.members)].sort((a, b) => a.slot - b.slot || a.id - b.id)
  }, [teams])

  return (
    <GameLayout>
      <div className="mx-auto max-w-6xl">
        {errors?.message && (
          <div className="mb-4 rounded-lg border border-cyber-red/30 bg-cyber-red/10 p-3 text-xs text-cyber-red">
            {errors.message}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-gray-600">
              {queueLabel[match.queueMode]} • {match.teamSize}v{match.teamSize}
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-widest text-cyber-red">MATCH PVP</h1>
          </div>
          {!isOver && (
            <div className="text-right text-xs text-gray-500">
              <div>
                Mode: <span className="text-cyber-yellow">{queueLabel[match.queueMode]}</span>
              </div>
              {!isWaiting && match.currentTurnId && (
                <div>
                  Tour:{' '}
                  <span className="text-white">
                    {teams
                      .flatMap((team) => team.members)
                      .find((member) => member.id === match.currentTurnId)?.name || '...'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {isWaiting && myTeam && (
          <div className="py-12 text-center">
            <div className="mb-6 text-6xl animate-pulse">⚔️</div>
            <h2 className="mb-4 text-xl font-bold tracking-widest text-cyber-yellow">
              EN ATTENTE D&apos;ADVERSAIRE...
            </h2>
            <div className="mb-2 text-sm text-gray-400">
              {queueLabel[match.queueMode]} • Estimation {formatEta(match.queueEstimateSeconds)}
            </div>
            <div className="mx-auto mt-6 max-w-xl rounded-lg border border-gray-800 bg-cyber-dark p-4 text-left">
              <div className="mb-3 text-[10px] uppercase tracking-widest text-gray-600">
                Ton equipe
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {myTeam.members.map((fighter) => (
                  <FighterCard
                    key={fighter.id}
                    fighter={fighter}
                    isCurrentTurn={false}
                    isMe={fighter.id === myId}
                    isSelected={false}
                    effects={activeEffects.filter((effect) => effect.targetCharId === fighter.id)}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => router.post('/pvp/leave-queue')}
              className="mt-6 rounded border border-gray-700 px-6 py-2 text-xs text-gray-500 transition-all hover:border-gray-500 hover:text-gray-300"
            >
              ANNULER LA FILE
            </button>
          </div>
        )}

        {match.status === 'in_progress' && myTeam && opponentTeam && (
          <>
            <div className="mb-4 text-center">
              <span
                className={`rounded-full border px-4 py-1.5 text-xs ${
                  isMyTurn
                    ? 'border-cyber-green/50 bg-cyber-green/10 text-cyber-green'
                    : 'border-cyber-red/30 bg-cyber-red/10 text-cyber-red'
                }`}
              >
                {isMyTurn
                  ? 'TON TOUR'
                  : `Tour de ${teams.flatMap((team) => team.members).find((member) => member.id === match.currentTurnId)?.name || '...'}`}
              </span>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.9fr_1.2fr]">
                  <div className="rounded-lg border border-cyber-blue/30 bg-cyber-dark p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-cyber-blue">
                        Equipe Alpha
                      </h3>
                      <div className="text-[10px] text-gray-500">ELO moy. {myTeam.averageRating}</div>
                    </div>
                    <div className="space-y-2">
                      {myTeam.members.map((fighter) => (
                        <FighterCard
                          key={fighter.id}
                          fighter={fighter}
                          isCurrentTurn={match.currentTurnId === fighter.id}
                          isMe={fighter.id === myId}
                          isSelected={false}
                          effects={activeEffects.filter(
                            (effect) => effect.targetCharId === fighter.id
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="text-center text-4xl font-bold tracking-widest text-cyber-pink neon-text-pink">
                      VS
                    </div>

                    {isSoloQueue && (
                      <>
                        <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
                          <div className="mb-3 text-[10px] uppercase tracking-widest text-gray-600">
                            Ordre de tour
                          </div>
                          <div className="space-y-1">
                            {turnOrder.map((fighter) => (
                              <div
                                key={fighter.id}
                                className={`rounded border px-2 py-1 text-xs ${
                                  fighter.isEliminated
                                    ? 'border-gray-800 text-gray-700'
                                    : match.currentTurnId === fighter.id
                                      ? 'border-cyber-yellow/40 bg-cyber-yellow/10 text-cyber-yellow'
                                      : fighter.id === myId
                                        ? 'border-cyber-blue/30 bg-cyber-blue/5 text-cyber-blue'
                                        : 'border-gray-800 text-gray-400'
                                }`}
                              >
                                {fighter.name}
                              </div>
                            ))}
                          </div>
                        </div>

                        {opponentAlive.length > 0 && (
                          <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
                            <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-600">
                              Cible
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {opponentAlive.map((fighter) => (
                                <button
                                  key={fighter.id}
                                  type="button"
                                  onClick={() => setSelectedTargetId(fighter.id)}
                                  className={`rounded border px-3 py-1 text-xs transition-all ${
                                    selectedTargetId === fighter.id
                                      ? 'border-cyber-red/50 bg-cyber-red/10 text-cyber-red'
                                      : 'border-gray-700 text-gray-400 hover:border-cyber-red/30 hover:text-cyber-red'
                                  }`}
                                >
                                  {fighter.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="space-y-2">
                      <button
                        onClick={handleAttack}
                        disabled={!isMyTurn || isSubmitting || !selectedTargetId}
                        className={`w-full rounded border py-3 text-sm font-bold uppercase tracking-widest transition-all ${
                          isMyTurn && !isSubmitting && selectedTargetId
                            ? 'border-cyber-red bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30'
                            : 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-700'
                        }`}
                      >
                        {isSubmitting ? 'ACTION...' : isMyTurn ? '[ ATTAQUER ]' : 'EN ATTENTE...'}
                      </button>

                      {skills.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-center text-[9px] uppercase tracking-widest text-cyber-purple">
                            Competences Speciales
                          </div>
                          {skills.map((skill) => {
                            const onCooldown = skill.currentCooldown > 0
                            const needsTarget = ![
                              'heal_percent',
                              'guaranteed_crit',
                              'shield',
                              'buff_all',
                            ].includes(skill.effectType)
                            const disabled =
                              onCooldown ||
                              !isMyTurn ||
                              isSubmitting ||
                              (needsTarget && !selectedTargetId)

                            return (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() => !disabled && handleSkill(skill.id, needsTarget)}
                                disabled={disabled}
                                title={skill.description}
                                className={`w-full rounded border px-2 py-2 text-xs transition-all ${
                                  disabled
                                    ? 'cursor-not-allowed border-gray-800 bg-gray-900/50 text-gray-700'
                                    : 'border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/20'
                                }`}
                              >
                                <span className="font-bold">{skill.name}</span>
                                <span className="ml-1 text-[10px] text-gray-600">
                                  {onCooldown
                                    ? `(${skill.currentCooldown} tours)`
                                    : `CD:${skill.cooldown}`}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <button
                        onClick={handleForfeit}
                        className="w-full py-2 text-[10px] text-gray-700 transition-colors hover:text-cyber-red"
                      >
                        ABANDONNER
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-cyber-red/30 bg-cyber-dark p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-cyber-red">
                        Equipe Omega
                      </h3>
                      <div className="text-[10px] text-gray-500">
                        ELO moy. {opponentTeam.averageRating}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {opponentTeam.members.map((fighter) => (
                        <FighterCard
                          key={fighter.id}
                          fighter={fighter}
                          isCurrentTurn={match.currentTurnId === fighter.id}
                          isMe={false}
                          isSelected={selectedTargetId === fighter.id}
                          effects={activeEffects.filter(
                            (effect) => effect.targetCharId === fighter.id
                          )}
                          onSelect={() => setSelectedTargetId(fighter.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {!isSoloQueue && (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
                      <div className="mb-3 text-[10px] uppercase tracking-widest text-gray-600">
                        Ordre de tour
                      </div>
                      <div className="space-y-1">
                        {turnOrder.map((fighter) => (
                          <div
                            key={fighter.id}
                            className={`rounded border px-2 py-1 text-xs ${
                              fighter.isEliminated
                                ? 'border-gray-800 text-gray-700'
                                : match.currentTurnId === fighter.id
                                  ? 'border-cyber-yellow/40 bg-cyber-yellow/10 text-cyber-yellow'
                                  : fighter.id === myId
                                    ? 'border-cyber-blue/30 bg-cyber-blue/5 text-cyber-blue'
                                    : 'border-gray-800 text-gray-400'
                            }`}
                          >
                            {fighter.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {opponentAlive.length > 0 && (
                      <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
                        <div className="mb-2 text-[10px] uppercase tracking-widest text-gray-600">
                          Cible
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {opponentAlive.map((fighter) => (
                            <button
                              key={fighter.id}
                              type="button"
                              onClick={() => setSelectedTargetId(fighter.id)}
                              className={`rounded border px-3 py-1 text-xs transition-all ${
                                selectedTargetId === fighter.id
                                  ? 'border-cyber-red/50 bg-cyber-red/10 text-cyber-red'
                                  : 'border-gray-700 text-gray-400 hover:border-cyber-red/30 hover:text-cyber-red'
                              }`}
                            >
                              {fighter.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4 xl:sticky xl:top-24">
                <h3 className="mb-2 text-[10px] uppercase tracking-widest text-gray-600">
                  Combat Log
                </h3>
                <div className="max-h-80 space-y-1 overflow-y-auto xl:max-h-[36rem]">
                  {match.log.map((entry, index) => (
                    <LogLine key={index} entry={entry} myId={myId} />
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          </>
        )}

        {isOver && myTeam && (
          <div className="py-16 text-center">
            <h2
              className={`mb-4 text-3xl font-bold tracking-widest ${match.winnerTeam === myTeam.team ? 'text-cyber-green' : 'text-cyber-red'}`}
            >
              {match.winnerTeam === myTeam.team ? 'VICTOIRE!' : 'DEFAITE'}
            </h2>
            <div
              className={`mb-6 text-lg font-bold ${match.winnerTeam === myTeam.team ? 'text-cyber-green' : 'text-cyber-red'}`}
            >
              {match.winnerTeam === myTeam.team ? '+' : '-'}
              {match.ratingChange} ELO
            </div>

            {match.log.length > 0 && (
              <div className="mx-auto mb-6 max-w-xl rounded-lg border border-gray-800 bg-cyber-dark p-4 text-left">
                <h3 className="mb-2 text-[10px] uppercase tracking-widest text-gray-600">Replay</h3>
                <div className="max-h-56 space-y-1 overflow-y-auto">
                  {match.log.map((entry, index) => (
                    <LogLine key={index} entry={entry} myId={myId} />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.visit('/pvp')}
              className="rounded border border-cyber-blue bg-cyber-blue/20 px-8 py-3 font-bold uppercase tracking-widest text-cyber-blue transition-all hover:bg-cyber-blue/30"
            >
              [ RETOUR A L&apos;ARENE ]
            </button>
          </div>
        )}
      </div>
    </GameLayout>
  )
}
