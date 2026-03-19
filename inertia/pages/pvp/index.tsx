import { router } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface Match {
  id: number
  challengerName: string
  defenderName: string
  isWin: boolean
  ratingChange: number
}

interface Ranking {
  id: number
  name: string
  pvpRating: number
  pvpWins: number
  pvpLosses: number
  level: number
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
  activeMatchId: number | null
  recentMatches: Match[]
  rankings: Ranking[]
}

export default function PvpArena({ character, activeMatchId, recentMatches, rankings }: Props) {
  return (
    <GameLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-cyber-red tracking-widest">ARENA PVP</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-600">ELO</div>
              <div className="text-lg font-bold text-cyber-yellow">{character.pvpRating}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">W/L</div>
              <div className="text-sm">
                <span className="text-cyber-green font-bold">{character.pvpWins}</span>
                <span className="text-gray-600"> / </span>
                <span className="text-cyber-red font-bold">{character.pvpLosses}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue / Fight */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-cyber-dark border border-cyber-red/30 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">⚔️</div>

              {activeMatchId ? (
                <div className="space-y-2">
                  <button
                    onClick={() => router.visit(`/pvp/match/${activeMatchId}`)}
                    className="w-full py-3 bg-cyber-yellow/20 border border-cyber-yellow text-cyber-yellow font-bold uppercase tracking-widest rounded hover:bg-cyber-yellow/30 transition-all text-sm"
                  >
                    [ REJOINDRE COMBAT ]
                  </button>
                  <button
                    onClick={() => router.post('/pvp/leave-queue')}
                    className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    Annuler la file
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.post('/pvp/queue')}
                  className="w-full py-3 bg-cyber-red/20 border border-cyber-red text-cyber-red font-bold uppercase tracking-widest rounded hover:bg-cyber-red/30 transition-all text-sm"
                >
                  [ CHERCHER UN ADVERSAIRE ]
                </button>
              )}

              <p className="text-[10px] text-gray-600 mt-3">
                Combat en temps reel tour par tour. Matchmaking par ELO.
              </p>
            </div>

            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-4">
              <h3 className="text-xs text-gray-600 uppercase tracking-widest mb-2">Tes stats</h3>
              <div className="space-y-1 text-xs">
                {[
                  { label: 'ATK', value: character.attack, color: 'text-cyber-red' },
                  { label: 'DEF', value: character.defense, color: 'text-cyber-blue' },
                  { label: 'HP', value: character.hpMax, color: 'text-cyber-green' },
                  { label: 'CRIT%', value: `${character.critChance}%`, color: 'text-cyber-yellow' },
                  { label: 'CRIT DMG', value: `${character.critDamage}%`, color: 'text-cyber-yellow' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <span className="text-gray-500">{s.label}</span>
                    <span className={s.color}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="lg:col-span-1">
            <div className="bg-cyber-dark border border-cyber-yellow/20 rounded-lg p-4">
              <h3 className="text-sm text-cyber-yellow uppercase tracking-widest mb-3">Classement PvP</h3>
              <div className="space-y-1">
                {rankings.map((r, i) => (
                  <div key={r.id} className={`flex items-center justify-between p-2 rounded text-xs ${r.id === character.id ? 'bg-cyber-blue/10 border border-cyber-blue/30' : 'bg-cyber-black/30'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${i === 0 ? 'text-cyber-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-cyber-orange' : 'text-gray-600'}`}>
                        #{i + 1}
                      </span>
                      <span className="text-white">{r.name}</span>
                      <span className="text-gray-700">LVL {r.level}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-cyber-yellow font-bold">{r.pvpRating}</div>
                      <div className="text-[9px] text-gray-600">{r.pvpWins}W / {r.pvpLosses}L</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-1">
            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-3">Historique</h3>
              <div className="space-y-1">
                {recentMatches.length === 0 ? (
                  <div className="text-xs text-gray-700 italic text-center py-4">Aucun combat</div>
                ) : (
                  recentMatches.map((m) => (
                    <div key={m.id} className={`flex items-center justify-between p-2 rounded text-xs ${m.isWin ? 'bg-cyber-green/5' : 'bg-cyber-red/5'}`}>
                      <div>
                        <span className={m.isWin ? 'text-cyber-green' : 'text-cyber-red'}>
                          {m.isWin ? 'W' : 'L'}
                        </span>
                        <span className="text-gray-500 ml-2">vs</span>
                        <span className="text-white ml-1">
                          {m.challengerName === character.name ? m.defenderName : m.challengerName}
                        </span>
                      </div>
                      <span className={`font-bold ${m.isWin ? 'text-cyber-green' : 'text-cyber-red'}`}>
                        {m.isWin ? '+' : '-'}{m.ratingChange}
                      </span>
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
