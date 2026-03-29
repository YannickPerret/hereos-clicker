import { router, usePage } from '@inertiajs/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import GameLayout from '~/components/layout'

interface Match {
  id: number
  challengerName: string
  defenderName: string
  isWin: boolean
  ratingChange: number
  queueMode: 'solo' | 'duo' | 'trio'
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
    acceptDeadlineAt: number | null
    acceptedCount: number
    totalParticipants: number
    myAccepted: boolean
  } | null
  recentMatches: Match[]
  queueOverview: QueueCard[]
  currentSeason: {
    id: number
    seasonId: number
    seasonName: string
    rating: number
    peakRating: number
    wins: number
    losses: number
    gamesPlayed: number
    rank: number | null
  } | null
  seasonHistory: {
    id: number
    seasonId: number
    seasonName: string
    seasonStatus: string
    rating: number
    peakRating: number
    wins: number
    losses: number
    gamesPlayed: number
    finalRank: number | null
    rewardCredits: number
    rewardTier: string | null
    rewardClaimed: boolean
  }[]
}

const formatEta = (seconds: number) => {
  if (seconds < 60) return `~${seconds}s`
  return `~${Math.ceil(seconds / 60)} min`
}

export default function PvpArena({
  character,
  activeMatch,
  recentMatches,
  queueOverview,
  currentSeason,
  seasonHistory,
}: Props) {
  const { t } = useTranslation(['pvp', 'common'])
  const { props } = usePage<{
    errors?: { message?: string }
    success?: string
    season?: {
      active: {
        id: number
        name: string
        theme: string
        campaignTitle: string | null
        storyIntro: string | null
        startsAt: string | null
        endsAt: string | null
        isRankedPvpEnabled: boolean
        isWorldBossEnabled: boolean
        isBossRushEnabled: boolean
        isPlayerMarketEnabled: boolean
        isBlackMarketBonusEnabled: boolean
      } | null
    }
  }>()
  const activeSeason = props.season?.active ?? null
  const [now, setNow] = useState(() => Date.now())
  const readyCheckNotificationRef = useRef<Notification | null>(null)
  const notifiedReadyCheckIdRef = useRef<number | null>(null)

  const readyCheckSecondsLeft = useMemo(() => {
    if (!activeMatch?.acceptDeadlineAt) return 0
    return Math.max(0, Math.ceil((activeMatch.acceptDeadlineAt - now) / 1000))
  }, [activeMatch?.acceptDeadlineAt, now])

  const requestBrowserNotifications = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return

    void Notification.requestPermission().catch(() => {})
  }, [])

  const startQueue = useCallback(
    (mode: QueueCard['mode']) => {
      requestBrowserNotifications()
      router.post('/pvp/queue', { mode })
    },
    [requestBrowserNotifications]
  )

  useEffect(() => {
    if (!activeMatch || !['waiting', 'ready_check'].includes(activeMatch.status)) return

    const poll = window.setInterval(() => {
      router.reload({
        only: ['activeMatch', 'queueOverview'],
        preserveScroll: true,
        preserveState: true,
      })
    }, 1500)

    return () => window.clearInterval(poll)
  }, [activeMatch?.id, activeMatch?.status])

  useEffect(() => {
    if (activeMatch?.status !== 'ready_check') return

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 250)

    return () => window.clearInterval(timer)
  }, [activeMatch?.status, activeMatch?.id])

  useEffect(() => {
    if (activeMatch?.status === 'in_progress') {
      readyCheckNotificationRef.current?.close()
      readyCheckNotificationRef.current = null
      router.visit(`/pvp/match/${activeMatch.id}`)
    }
  }, [activeMatch?.id, activeMatch?.status])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !('Notification' in window)) return

    if (activeMatch?.status !== 'ready_check') {
      readyCheckNotificationRef.current?.close()
      readyCheckNotificationRef.current = null

      if (activeMatch?.status !== 'ready_check') {
        notifiedReadyCheckIdRef.current = null
      }
      return
    }

    if (document.visibilityState === 'visible') return
    if (Notification.permission !== 'granted') return
    if (notifiedReadyCheckIdRef.current === activeMatch.id) return

    const notification = new Notification(t('pvp:browserMatchFoundTitle'), {
      body: t('pvp:browserMatchFoundBody'),
      tag: `pvp-ready-${activeMatch.id}`,
      requireInteraction: true,
    })

    notification.onclick = () => {
      window.focus()
      router.visit('/pvp')
      notification.close()
    }

    readyCheckNotificationRef.current?.close()
    readyCheckNotificationRef.current = notification
    notifiedReadyCheckIdRef.current = activeMatch.id
  }, [activeMatch?.id, activeMatch?.status, t])

  useEffect(() => {
    return () => {
      readyCheckNotificationRef.current?.close()
      readyCheckNotificationRef.current = null
    }
  }, [])

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-widest text-cyber-red">{t('pvp:title')}</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-600">{t('pvp:elo')}</div>
              <div className="text-lg font-bold text-cyber-yellow">{character.pvpRating}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">{t('pvp:winLoss')}</div>
              <div className="text-sm">
                <span className="font-bold text-cyber-green">{character.pvpWins}</span>
                <span className="text-gray-600"> / </span>
                <span className="font-bold text-cyber-red">{character.pvpLosses}</span>
              </div>
            </div>
          </div>
        </div>

        {activeSeason && (
          <div className="mb-6 rounded-lg border border-cyber-yellow/30 bg-cyber-dark p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-yellow">
                  {t('pvp:activeSeason')}
                </div>
                <div className="mt-1 text-lg font-bold text-white">{activeSeason.name}</div>
                <div className="text-xs uppercase tracking-widest text-gray-500">
                  {activeSeason.campaignTitle || activeSeason.theme}
                </div>
                {activeSeason.storyIntro && (
                  <p className="mt-2 max-w-3xl text-sm text-gray-300">{activeSeason.storyIntro}</p>
                )}
              </div>
              <div className="space-y-2 text-right">
                <div className="text-[10px] uppercase tracking-widest text-gray-500">
                  {activeSeason.startsAt ? new Date(activeSeason.startsAt).toLocaleString() : t('pvp:freeDate')}
                  {'  ->  '}
                  {activeSeason.endsAt ? new Date(activeSeason.endsAt).toLocaleString() : t('pvp:noEnd')}
                </div>
                <div className="flex flex-wrap justify-end gap-2 text-[10px] uppercase tracking-widest">
                  {activeSeason.isRankedPvpEnabled && <span className="rounded border border-cyber-red/40 px-2 py-1 text-cyber-red">{t('pvp:features.ranked')}</span>}
                  {activeSeason.isWorldBossEnabled && <span className="rounded border border-cyber-green/40 px-2 py-1 text-cyber-green">{t('pvp:features.worldBoss')}</span>}
                  {activeSeason.isBossRushEnabled && <span className="rounded border border-cyber-purple/40 px-2 py-1 text-cyber-purple">{t('pvp:features.bossRush')}</span>}
                  {activeSeason.isPlayerMarketEnabled && <span className="rounded border border-cyber-blue/40 px-2 py-1 text-cyber-blue">{t('pvp:features.playerMarket')}</span>}
                  {activeSeason.isBlackMarketBonusEnabled && <span className="rounded border border-cyber-yellow/40 px-2 py-1 text-cyber-yellow">{t('pvp:features.blackMarketBonus')}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

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
                  {activeMatch.status === 'waiting' ? (
                    <div className="rounded border border-cyber-yellow/30 bg-cyber-yellow/10 px-4 py-3 text-sm font-bold uppercase tracking-widest text-cyber-yellow">
                      {t('pvp:searching')}
                    </div>
                  ) : activeMatch.status === 'ready_check' ? (
                    <div className="space-y-3">
                      <div className="rounded border border-cyber-blue/40 bg-cyber-blue/10 px-4 py-3">
                        <div className="text-sm font-bold uppercase tracking-widest text-cyber-blue">
                          {t('pvp:matchFound')}
                        </div>
                        <div className="mt-2 text-2xl font-black text-white">
                          {readyCheckSecondsLeft}s
                        </div>
                        <div className="mt-1 text-[11px] uppercase tracking-widest text-gray-500">
                          {t('pvp:acceptedPlayers', {
                            accepted: activeMatch.acceptedCount,
                            total: activeMatch.totalParticipants,
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => router.post(`/pvp/match/${activeMatch.id}/accept`)}
                        disabled={activeMatch.myAccepted}
                        className={`w-full rounded border py-3 text-sm font-bold uppercase tracking-widest transition-all ${
                          activeMatch.myAccepted
                            ? 'cursor-not-allowed border-cyber-green/30 bg-cyber-green/10 text-cyber-green/60'
                            : 'border-cyber-green/40 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20'
                        }`}
                      >
                        {activeMatch.myAccepted ? t('pvp:accepted') : t('pvp:acceptMatch')}
                      </button>
                      <button
                        onClick={() => router.post(`/pvp/match/${activeMatch.id}/decline`)}
                        className="w-full rounded border border-cyber-red/40 bg-cyber-red/10 py-3 text-xs font-bold uppercase tracking-widest text-cyber-red transition-all hover:bg-cyber-red/20"
                      >
                        {t('pvp:declineMatch')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => router.visit(`/pvp/match/${activeMatch.id}`)}
                      className="w-full rounded border border-cyber-yellow bg-cyber-yellow/20 py-3 text-sm font-bold uppercase tracking-widest text-cyber-yellow transition-all hover:bg-cyber-yellow/30"
                    >
                      {t('pvp:joinFight')}
                    </button>
                  )}
                  {activeMatch.status === 'waiting' && (
                    <button
                      onClick={() => router.post('/pvp/leave-queue')}
                      className="w-full rounded border border-cyber-red/40 bg-cyber-red/10 py-3 text-xs font-bold uppercase tracking-widest text-cyber-red transition-all hover:bg-cyber-red/20"
                    >
                      {t('pvp:cancelSearch')}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-gray-600">
                  {t('pvp:matchmakingInfo')}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
              <h3 className="mb-2 text-xs uppercase tracking-widest text-gray-600">{t('pvp:yourStats')}</h3>
              <div className="space-y-1 text-xs">
                {[
                  { label: t('common:stats.atk'), value: character.attack, color: 'text-cyber-red' },
                  { label: t('common:stats.def'), value: character.defense, color: 'text-cyber-blue' },
                  { label: t('common:stats.hp'), value: character.hpMax, color: 'text-cyber-green' },
                  { label: t('common:stats.crit'), value: `${character.critChance}%`, color: 'text-cyber-yellow' },
                  { label: t('common:stats.critDmg'), value: `${character.critDamage}%`, color: 'text-cyber-yellow' },
                ].map((stat) => (
                  <div key={stat.label} className="flex justify-between">
                    <span className="text-gray-500">{stat.label}</span>
                    <span className={stat.color}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {currentSeason && (
              <div className="rounded-lg border border-cyber-yellow/20 bg-cyber-dark p-4">
                <h3 className="mb-2 text-xs uppercase tracking-widest text-cyber-yellow">
                  {t('pvp:seasonPvp')}
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('pvp:name')}</span>
                    <span className="text-white">{currentSeason.seasonName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('pvp:seasonElo')}</span>
                    <span className="text-cyber-yellow">{currentSeason.rating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('pvp:peak')}</span>
                    <span className="text-cyber-yellow">{currentSeason.peakRating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('pvp:record')}</span>
                    <span className="text-white">{currentSeason.wins}W / {currentSeason.losses}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('pvp:matches')}</span>
                    <span className="text-white">{currentSeason.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('pvp:rank')}</span>
                    <span className="text-cyber-blue">{currentSeason.rank ? `#${currentSeason.rank}` : t('pvp:noClassification')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-1">
            {queueOverview.map((card) => (
              <div key={card.mode} className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-cyber-red">{card.label}</h3>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-600">
                      {t('pvp:teamSize', { n: card.teamSize })}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-gray-500">
                    <div>{t('pvp:teamsWaiting', { count: card.waitingTeams })}</div>
                    <div className="text-cyber-yellow">{formatEta(card.etaSeconds)}</div>
                  </div>
                </div>

                {card.reason && (
                  <div className="mb-3 rounded border border-gray-800 bg-cyber-black/40 px-3 py-2 text-[10px] text-gray-500">
                    {card.reason}
                  </div>
                )}

                <button
                  onClick={() => startQueue(card.mode)}
                  disabled={!card.canQueue || !!activeMatch}
                  className={`w-full rounded border py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                    card.canQueue && !activeMatch
                      ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20'
                      : 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-700'
                  }`}
                >
                  {activeMatch ? t('pvp:activeQueue') : t('pvp:startQueue', { mode: card.label.toUpperCase() })}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
              <h3 className="mb-3 text-sm uppercase tracking-widest text-gray-400">{t('pvp:history')}</h3>
              <div className="space-y-1">
                {recentMatches.length === 0 ? (
                  <div className="py-4 text-center text-xs italic text-gray-700">{t('pvp:noFights')}</div>
                ) : (
                  recentMatches.map((match) => (
                    <div key={`${match.id}-${match.queueMode}`} className={`rounded p-2 text-xs ${match.isWin ? 'bg-cyber-green/5' : 'bg-cyber-red/5'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={match.isWin ? 'text-cyber-green' : 'text-cyber-red'}>{match.isWin ? 'W' : 'L'}</span>
                          <span className="ml-2 text-gray-500">{t('pvp:vs')}</span>
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

            <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
              <h3 className="mb-3 text-sm uppercase tracking-widest text-gray-400">{t('pvp:seasons')}</h3>
              <div className="space-y-2">
                {seasonHistory.length === 0 ? (
                  <div className="py-4 text-center text-xs italic text-gray-700">{t('pvp:noSeasons')}</div>
                ) : (
                  seasonHistory.map((entry) => (
                    <div key={entry.id} className="rounded border border-gray-800 bg-cyber-black/30 p-3 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-white">{entry.seasonName}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-600">
                            {entry.seasonStatus} • {entry.wins}W / {entry.losses}L • peak {entry.peakRating}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-cyber-yellow">{entry.rating} ELO</div>
                          <div className="text-[10px] text-gray-500">
                            {entry.finalRank ? `#${entry.finalRank}` : t('pvp:noRanking')}
                          </div>
                        </div>
                      </div>
                      {(entry.rewardCredits > 0 || entry.rewardTier) && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded border border-cyber-yellow/20 bg-cyber-yellow/5 px-3 py-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-cyber-yellow">
                              {entry.rewardTier || 'Reward'}
                            </div>
                            <div className="text-xs text-white">{entry.rewardCredits} credits</div>
                          </div>
                          {!entry.rewardClaimed && entry.seasonStatus === 'ended' ? (
                            <button
                              onClick={() => router.post(`/pvp/seasons/${entry.id}/claim`)}
                              className="rounded border border-cyber-green/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10"
                            >
                              {t('pvp:claim')}
                            </button>
                          ) : (
                            <div className="text-[10px] uppercase tracking-widest text-gray-500">
                              {entry.rewardClaimed ? t('pvp:claimed') : t('pvp:pending')}
                            </div>
                          )}
                        </div>
                      )}
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
