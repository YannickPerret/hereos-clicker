import { useEffect, useRef, useState } from 'react'
import GameLayout from '~/components/layout'

interface Player {
  id: number
  name: string
  credits: number
  level: number
  totalClicks: number
}

interface PvpPlayer {
  id: number
  name: string
  pvpRating: number
  pvpWins: number
  pvpLosses: number
  level: number
}

interface Props {
  players: Player[]
  playersHasMore: boolean
  playersNextOffset: number
  pvpRankings: PvpPlayer[]
  pvpHasMore: boolean
  pvpNextOffset: number
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function Leaderboard({
  players: initialPlayers,
  playersHasMore: initialPlayersHasMore,
  playersNextOffset: initialPlayersNextOffset,
  pvpRankings: initialPvpRankings,
  pvpHasMore: initialPvpHasMore,
  pvpNextOffset: initialPvpNextOffset,
}: Props) {
  const [players, setPlayers] = useState(initialPlayers)
  const [playersHasMore, setPlayersHasMore] = useState(initialPlayersHasMore)
  const [playersNextOffset, setPlayersNextOffset] = useState(initialPlayersNextOffset)
  const [playersLoading, setPlayersLoading] = useState(false)

  const [pvpRankings, setPvpRankings] = useState(initialPvpRankings)
  const [pvpHasMore, setPvpHasMore] = useState(initialPvpHasMore)
  const [pvpNextOffset, setPvpNextOffset] = useState(initialPvpNextOffset)
  const [pvpLoading, setPvpLoading] = useState(false)

  const globalSentinelRef = useRef<HTMLDivElement | null>(null)
  const pvpSentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setPlayers(initialPlayers)
    setPlayersHasMore(initialPlayersHasMore)
    setPlayersNextOffset(initialPlayersNextOffset)
  }, [initialPlayers, initialPlayersHasMore, initialPlayersNextOffset])

  useEffect(() => {
    setPvpRankings(initialPvpRankings)
    setPvpHasMore(initialPvpHasMore)
    setPvpNextOffset(initialPvpNextOffset)
  }, [initialPvpRankings, initialPvpHasMore, initialPvpNextOffset])

  async function loadMoreGlobal() {
    if (playersLoading || !playersHasMore) return

    setPlayersLoading(true)
    try {
      const response = await fetch(`/leaderboard/state?board=global&offset=${playersNextOffset}`)
      const data = await response.json()

      setPlayers((current) => [...current, ...(data.items || [])])
      setPlayersHasMore(Boolean(data.hasMore))
      setPlayersNextOffset(Number(data.nextOffset || playersNextOffset))
    } finally {
      setPlayersLoading(false)
    }
  }

  async function loadMorePvp() {
    if (pvpLoading || !pvpHasMore) return

    setPvpLoading(true)
    try {
      const response = await fetch(`/leaderboard/state?board=pvp&offset=${pvpNextOffset}`)
      const data = await response.json()

      setPvpRankings((current) => [...current, ...(data.items || [])])
      setPvpHasMore(Boolean(data.hasMore))
      setPvpNextOffset(Number(data.nextOffset || pvpNextOffset))
    } finally {
      setPvpLoading(false)
    }
  }

  useEffect(() => {
    if (!globalSentinelRef.current || !playersHasMore) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadMoreGlobal()
      }
    }, { rootMargin: '240px' })

    observer.observe(globalSentinelRef.current)
    return () => observer.disconnect()
  }, [playersHasMore, playersNextOffset, playersLoading])

  useEffect(() => {
    if (!pvpSentinelRef.current || !pvpHasMore) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadMorePvp()
      }
    }, { rootMargin: '240px' })

    observer.observe(pvpSentinelRef.current)
    return () => observer.disconnect()
  }, [pvpHasMore, pvpNextOffset, pvpLoading])

  return (
    <GameLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-center text-2xl font-bold tracking-widest text-cyber-yellow">
          CLASSEMENTS
        </h1>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-cyber-blue/20 bg-cyber-dark p-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-blue">
                  Classement Global
                </h2>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-600">
                  Credits • Niveau • Clicks
                </div>
              </div>
              <div className="text-[10px] text-gray-600">{players.length} joueur(s) charges</div>
            </div>

            <div className="overflow-hidden rounded-lg border border-cyber-blue/10 bg-cyber-black/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-blue/10">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">Rang</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-gray-600">Runner</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-gray-600">Niveau</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-gray-600">Clicks</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-gray-600">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr key={player.id} className="border-b border-gray-800/50 transition-colors hover:bg-cyber-blue/5">
                      <td className="px-4 py-2.5">
                        <span className={`font-bold ${index < 3 ? 'text-cyber-yellow' : 'text-gray-600'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-white font-medium">{player.name}</td>
                      <td className="px-4 py-2.5 text-right text-cyber-green">{player.level}</td>
                      <td className="px-4 py-2.5 text-right text-cyber-pink">{formatNumber(player.totalClicks)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-cyber-yellow">{formatNumber(player.credits)}</td>
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

            <div ref={globalSentinelRef} className="h-6" />
            <div className="pt-2 text-center text-xs text-gray-600">
              {playersLoading ? 'Chargement...' : playersHasMore ? 'Scroll pour charger la suite' : 'Fin du classement'}
            </div>
          </section>

          <section className="rounded-lg border border-cyber-yellow/20 bg-cyber-dark p-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-yellow">
                  Classement PvP
                </h2>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-600">
                  Elo • Wins / Losses
                </div>
              </div>
              <div className="text-[10px] text-gray-600">{pvpRankings.length} joueur(s) charges</div>
            </div>

            <div className="space-y-1">
              {pvpRankings.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between rounded bg-cyber-black/30 p-2 text-xs">
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
              {pvpRankings.length === 0 && (
                <div className="py-8 text-center text-gray-700">
                  Aucun classement PvP disponible
                </div>
              )}
            </div>

            <div ref={pvpSentinelRef} className="h-6" />
            <div className="pt-2 text-center text-xs text-gray-600">
              {pvpLoading ? 'Chargement...' : pvpHasMore ? 'Scroll pour charger la suite' : 'Fin du classement'}
            </div>
          </section>
        </div>
      </div>
    </GameLayout>
  )
}
