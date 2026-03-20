import { router, usePage } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface Match {
  id: number
  challengerName: string
  defenderName: string
  isWin: boolean
  ratingChange: number
  queueMode: 'solo' | 'duo' | 'trio'
}

interface Ranking {
  id: number
  name: string
  pvpRating: number
  pvpWins: number
  pvpLosses: number
  level: number
}

interface QueueCard {
  mode: 'solo' | 'duo' | 'trio'
  label: string
  teamSize: number
  waitingTeams: number
  etaSeconds: number
  canQueue: boolean
  reason: string | null
}

interface Props {
  character: {
    id: number
    name: string
    pvpRating: number
    pvpWins: number
    pvpLosses: number
    level: number
    attack: number
    defense: number
    hpMax: number
    critChance: number
    critDamage: number
  }
  activeMatch: {
    id: number
    status: string
    queueMode: 'solo' | 'duo' | 'trio'
    teamSize: number
  } | null
  recentMatches: Match[]
  rankings: Ranking[]
  queueOverview: QueueCard[]
}

const formatEta = (seconds: number) => {
  if (seconds < 60) return `~${seconds}s`
  return `~${Math.ceil(seconds / 60)} min`
}

export default function PvpArena({ character, activeMatch, recentMatches, rankings, queueOverview }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-widest text-cyber-red">ARENA PVP</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-600">ELO</div>
              <div className="text-lg font-bold text-cyber-yellow">{character.pvpRating}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">W/L</div>
              <div className="text-sm">
                <span className="font-bold text-cyber-green">{character.pvpWins}</span>
                <span className="text-gray-600"> / </span>
                <span className="font-bold text-cyber-red">{character.pvpLosses}</span>
              </div>
            </div>
          </div>
        </div>

        {props.errors?.message && (
          <div className="mb-4 rounded-lg border border-cyber-red/50 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">
            {props.errors.message}
          </div>
        )}
        {props.success && (
          <div className="mb-4 rounded-lg border border-cyber-green/50 bg-cyber-green/10 px-4 py-3 text-sm text-cyber-green">
            {props.success as string}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-lg border border-cyber-red/30 bg-cyber-dark p-6 text-center">
              <div className="mb-4 text-6xl">⚔️</div>

              {activeMatch ? (
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-widest text-gray-500">
                    {activeMatch.queueMode.toUpperCase()} • {activeMatch.teamSize}v{activeMatch.teamSize}
                  </div>
                  <button
                    onClick={() => router.visit(`/pvp/match/${activeMatch.id}`)}
                    className="w-full rounded border border-cyber-yellow bg-cyber-yellow/20 py-3 text-sm font-bold uppercase tracking-widest text-cyber-yellow transition-all hover:bg-cyber-yellow/30"
                  >
                    [ REJOINDRE COMBAT ]
                  </button>
                  {activeMatch.status === 'waiting' && (
                    <button
                      onClick={() => router.post('/pvp/leave-queue')}
                      className="w-full py-2 text-xs text-gray-600 transition-colors hover:text-gray-400"
                    >
                      Annuler la file
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-gray-600">
                  Matchmaking par mode. Les files duo/trio utilisent ton groupe actuel.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
              <h3 className="mb-2 text-xs uppercase tracking-widest text-gray-600">Tes stats</h3>
              <div className="space-y-1 text-xs">
                {[
                  { label: 'ATK', value: character.attack, color: 'text-cyber-red' },
                  { label: 'DEF', value: character.defense, color: 'text-cyber-blue' },
                  { label: 'HP', value: character.hpMax, color: 'text-cyber-green' },
                  { label: 'CRIT%', value: `${character.critChance}%`, color: 'text-cyber-yellow' },
                  { label: 'CRIT DMG', value: `${character.critDamage}%`, color: 'text-cyber-yellow' },
                ].map((stat) => (
                  <div key={stat.label} className="flex justify-between">
                    <span className="text-gray-500">{stat.label}</span>
                    <span className={stat.color}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-1">
            {queueOverview.map((card) => (
              <div key={card.mode} className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-cyber-red">{card.label}</h3>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-600">
                      {card.teamSize}v{card.teamSize}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-gray-500">
                    <div>{card.waitingTeams} equipe(s)</div>
                    <div className="text-cyber-yellow">{formatEta(card.etaSeconds)}</div>
                  </div>
                </div>

                {card.reason && (
                  <div className="mb-3 rounded border border-gray-800 bg-cyber-black/40 px-3 py-2 text-[10px] text-gray-500">
                    {card.reason}
                  </div>
                )}

                <button
                  onClick={() => router.post('/pvp/queue', { mode: card.mode })}
                  disabled={!card.canQueue || !!activeMatch}
                  className={`w-full rounded border py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                    card.canQueue && !activeMatch
                      ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20'
                      : 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-700'
                  }`}
                >
                  {activeMatch ? '[ FILE ACTIVE ]' : `[ LANCER ${card.label.toUpperCase()} ]`}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-lg border border-cyber-yellow/20 bg-cyber-dark p-4">
              <h3 className="mb-3 text-sm uppercase tracking-widest text-cyber-yellow">Classement PvP</h3>
              <div className="space-y-1">
                {rankings.map((entry, index) => (
                  <div key={entry.id} className={`flex items-center justify-between rounded p-2 text-xs ${entry.id === character.id ? 'border border-cyber-blue/30 bg-cyber-blue/10' : 'bg-cyber-black/30'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${index === 0 ? 'text-cyber-yellow' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-cyber-orange' : 'text-gray-600'}`}>
                        #{index + 1}
                      </span>
                      <span className="text-white">{entry.name}</span>
                      <span className="text-gray-700">LVL {entry.level}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyber-yellow">{entry.pvpRating}</div>
                      <div className="text-[9px] text-gray-600">{entry.pvpWins}W / {entry.pvpLosses}L</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
              <h3 className="mb-3 text-sm uppercase tracking-widest text-gray-400">Historique</h3>
              <div className="space-y-1">
                {recentMatches.length === 0 ? (
                  <div className="py-4 text-center text-xs italic text-gray-700">Aucun combat</div>
                ) : (
                  recentMatches.map((match) => (
                    <div key={`${match.id}-${match.queueMode}`} className={`rounded p-2 text-xs ${match.isWin ? 'bg-cyber-green/5' : 'bg-cyber-red/5'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={match.isWin ? 'text-cyber-green' : 'text-cyber-red'}>{match.isWin ? 'W' : 'L'}</span>
                          <span className="ml-2 text-gray-500">vs</span>
                          <span className="ml-1 text-white">{match.challengerName === character.name ? match.defenderName : match.challengerName}</span>
                        </div>
                        <span className={`font-bold ${match.isWin ? 'text-cyber-green' : 'text-cyber-red'}`}>
                          {match.isWin ? '+' : '-'}{match.ratingChange}
                        </span>
                      </div>
                      <div className="mt-1 text-[9px] uppercase tracking-widest text-gray-600">{match.queueMode}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
