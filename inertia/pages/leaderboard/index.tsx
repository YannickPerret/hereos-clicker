import GameLayout from '~/components/layout'

interface Player {
  id: number
  name: string
  credits: number
  level: number
  totalClicks: number
}

interface Props {
  players: Player[]
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function Leaderboard({ players }: Props) {
  return (
    <GameLayout>
      <h1 className="text-2xl font-bold text-cyber-yellow tracking-widest mb-6 text-center">
        CLASSEMENT GLOBAL
      </h1>

      <div className="max-w-3xl mx-auto">
        {/* Top 3 */}
        {players.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[players[1], players[0], players[2]].map((player, i) => {
              const rank = i === 0 ? 2 : i === 1 ? 1 : 3
              const colors = {
                1: { border: 'border-cyber-yellow', text: 'text-cyber-yellow', bg: 'bg-cyber-yellow/5' },
                2: { border: 'border-gray-400', text: 'text-gray-300', bg: 'bg-gray-400/5' },
                3: { border: 'border-cyber-orange', text: 'text-cyber-orange', bg: 'bg-cyber-orange/5' },
              }[rank]!

              return (
                <div
                  key={player.id}
                  className={`${colors.bg} border ${colors.border} rounded-lg p-4 text-center ${rank === 1 ? 'scale-110 z-10' : ''}`}
                >
                  <div className={`text-3xl font-bold ${colors.text} mb-2`}>#{rank}</div>
                  <div className="text-white font-bold text-sm mb-1 truncate">{player.name}</div>
                  <div className="text-cyber-yellow text-lg font-bold">{formatNumber(player.credits)}c</div>
                  <div className="text-xs text-gray-500 mt-1">LVL {player.level}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full list */}
        <div className="bg-cyber-dark border border-cyber-blue/20 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cyber-blue/20">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600">Rang</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-gray-600">Runner</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-600">Niveau</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-600">Clicks</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-gray-600">Credits</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => (
                <tr
                  key={player.id}
                  className="border-b border-gray-800/50 hover:bg-cyber-blue/5 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <span className={`font-bold ${i < 3 ? 'text-cyber-yellow' : 'text-gray-600'}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-white font-medium">{player.name}</td>
                  <td className="px-4 py-2.5 text-right text-cyber-green">{player.level}</td>
                  <td className="px-4 py-2.5 text-right text-cyber-pink">{formatNumber(player.totalClicks)}</td>
                  <td className="px-4 py-2.5 text-right text-cyber-yellow font-bold">{formatNumber(player.credits)}</td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-700">
                    Aucun runner enregistre
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GameLayout>
  )
}
