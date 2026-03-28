import { useForm, router } from '@inertiajs/react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import CyberpunkAvatar from '~/components/cyberpunk_avatar'
import GameLayout from '~/components/layout'

interface Character {
  id: number
  name: string
  credits: number
  creditsPerClick: number
  creditsPerSecond: number
  level: number
  xp: number
  hpMax: number
  hpCurrent: number
  attack: number
  defense: number
  totalClicks: number
  talentPoints: number
  chosenSpec: string | null
  critChance: number
  critDamage: number
}

interface PartyInfo {
  id: number
  name: string
  status: 'waiting' | 'in_dungeon'
  activeDungeonRunId: number | null
  members: {
    id: number
    name: string
    level: number
    isReady: boolean
    isLeader: boolean
  }[]
}

interface Props {
  characters: Character[]
  activeCharacter: Character | null
  leaderboard: { id: number; name: string; credits: number; level: number; totalClicks: number }[]
  equippedItems: {
    id: number
    isEquipped: boolean
    item: {
      id: number
      name: string
      type: string
      rarity: string
      icon?: string | null
      effectType: string | null
      effectValue: number | null
    }
  }[]
  effectiveCpc: number
  effectiveCps: number
  offlineCredits: number
  party: PartyInfo | null
  questSummary: {
    mainTrack: {
      trackKey: string
      title: string
      subtitle: string
      completedCount: number
      totalCount: number
      activeQuest: {
        id: number
        key: string
        title: string
        summary: string
        giverName: string | null
        icon: string
        progress: number
        targetValue: number
        objectiveLabel: string
        rewardLabel: string
      } | null
    } | null
    seasonalTrack: {
      trackKey: string
      title: string
      subtitle: string
      completedCount: number
      totalCount: number
      activeQuest: {
        id: number
        key: string
        title: string
        summary: string
        giverName: string | null
        icon: string
        progress: number
        targetValue: number
        objectiveLabel: string
        rewardLabel: string
      } | null
    } | null
  } | null
}

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-cyber-green',
  rare: 'text-cyber-blue',
  epic: 'text-cyber-purple',
  legendary: 'text-cyber-yellow',
}

const SPEC_STYLE: Record<string, { color: string; border: string }> = {
  hacker: { color: 'text-cyber-green', border: 'border-cyber-green/30' },
  netrunner: { color: 'text-cyber-blue', border: 'border-cyber-blue/30' },
  samurai: { color: 'text-cyber-red', border: 'border-cyber-red/30' },
  chrome_dealer: {
    color: 'text-cyber-yellow',
    border: 'border-cyber-yellow/30',
  },
}

function formatCredits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function QuestTrackCard({
  track,
  accent,
}: {
  track: NonNullable<Props['questSummary']>['mainTrack']
  accent: 'blue' | 'yellow'
}) {
  const { t } = useTranslation(['play', 'common'])
  if (!track) return null

  const accentClasses =
    accent === 'blue'
      ? {
          border: 'border-cyber-blue/30',
          text: 'text-cyber-blue',
          button: 'border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10',
          inner: 'border-cyber-blue/20',
          fill: 'from-cyber-blue to-cyber-purple',
        }
      : {
          border: 'border-cyber-yellow/30',
          text: 'text-cyber-yellow',
          button: 'border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10',
          inner: 'border-cyber-yellow/20',
          fill: 'from-cyber-yellow to-cyber-orange',
        }

  return (
    <div className={`bg-cyber-dark rounded-lg p-4 mt-4 border ${accentClasses.border}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className={`text-[10px] uppercase tracking-[0.28em] ${accentClasses.text}`}>
            {track.subtitle}
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mt-1">
            {track.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => router.visit('/quests')}
          className={`px-2.5 py-1 border rounded text-[10px] uppercase tracking-widest transition-all ${accentClasses.button}`}
        >
          {t('play:journal')}
        </button>
      </div>

      <div className="text-[10px] text-gray-600 mb-3">
        {t('play:questTrack', { done: track.completedCount, total: track.totalCount })}
      </div>

      {track.activeQuest ? (
        <div className={`rounded-lg border bg-cyber-black/40 p-3 ${accentClasses.inner}`}>
          <div className="text-[10px] uppercase tracking-[0.24em] text-gray-500 mb-1">
            {t('play:active')}
          </div>
          <div className={`text-sm font-bold ${accentClasses.text}`}>{track.activeQuest.title}</div>
          <div className="text-xs text-gray-400 mt-1">{track.activeQuest.summary}</div>
          <div className="text-[11px] text-cyber-yellow mt-3">
            {track.activeQuest.objectiveLabel}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-500">
            <span>{track.activeQuest.rewardLabel}</span>
            <span>
              {track.activeQuest.progress}/{track.activeQuest.targetValue}
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full overflow-hidden border bg-cyber-black border-gray-800">
            <div
              className={`h-full bg-gradient-to-r transition-all duration-300 ${accentClasses.fill}`}
              style={{
                width: `${Math.min(100, (track.activeQuest.progress / track.activeQuest.targetValue) * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-cyber-green/20 bg-cyber-green/5 p-3 text-xs text-cyber-green">
          {t('play:trackDone')}
        </div>
      )}
    </div>
  )
}

export default function Play({
  characters,
  activeCharacter,
  leaderboard,
  equippedItems,
  effectiveCpc,
  effectiveCps,
  offlineCredits,
  party,
  questSummary: initialQuestSummary,
}: Props) {
  const { t } = useTranslation(['play', 'common'])
  const [char, setChar] = useState(activeCharacter)
  const [liveLeaderboard, setLiveLeaderboard] = useState(leaderboard)
  const [questSummary, setQuestSummary] = useState(initialQuestSummary)
  const [questEvents, setQuestEvents] = useState<
    { type: string; title: string; rewardLabel?: string }[]
  >([])
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; value: number }[]>(
    []
  )
  const [clickScale, setClickScale] = useState(1)
  const [pendingOfflineCredits, setPendingOfflineCredits] = useState(offlineCredits)
  const [collectingOffline, setCollectingOffline] = useState(false)
  const [antiCheatMsg, setAntiCheatMsg] = useState<string | null>(null)

  // Sync state when props change (e.g. after character creation redirect)
  useEffect(() => {
    setChar(activeCharacter)
  }, [activeCharacter])
  useEffect(() => {
    setLiveLeaderboard(leaderboard)
  }, [leaderboard])
  useEffect(() => {
    setQuestSummary(initialQuestSummary)
  }, [initialQuestSummary])
  useEffect(() => {
    setPendingOfflineCredits(offlineCredits)
  }, [offlineCredits])
  useEffect(() => {
    if (questEvents.length === 0) return

    const timer = window.setTimeout(() => setQuestEvents([]), 5000)
    return () => window.clearTimeout(timer)
  }, [questEvents])
  const pendingClicks = useRef(0)
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const particleId = useRef(0)
  const autoTickTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const createForm = useForm({ name: '' })

  // Auto-tick: every second, add CPS locally + sync every 10s
  const tickCount = useRef(0)
  useEffect(() => {
    if (!char || effectiveCps <= 0) return

    autoTickTimer.current = setInterval(() => {
      setChar((prev) => (prev ? { ...prev, credits: prev.credits + effectiveCps } : null))
      tickCount.current += 1

      // Sync with server every 10 seconds
      if (tickCount.current >= 10) {
        tickCount.current = 0
        fetch('/play/tick', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(
              document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''
            ),
          },
          body: JSON.stringify({ characterId: char.id }),
        })
          .then((r) => r.json())
          .then((data) => {
            setChar((prev) => (prev ? { ...prev, credits: data.credits } : null))
          })
          .catch(() => {})
      }
    }, 1000)

    return () => {
      if (autoTickTimer.current) clearInterval(autoTickTimer.current)
    }
  }, [char?.id, effectiveCps])

  const sendBatch = useCallback(() => {
    if (!char || pendingClicks.current <= 0) return
    const clicks = pendingClicks.current
    pendingClicks.current = 0

    fetch('/play/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''),
      },
      body: JSON.stringify({ characterId: char.id, clicks }),
    })
      .then((r) => {
        if (r.status === 429) {
          return r.json().then((data) => {
            setAntiCheatMsg(data.error || t('play:tooFast'))
            if (data.penaltySeconds) {
              setTimeout(() => setAntiCheatMsg(null), data.penaltySeconds * 1000)
            } else {
              setTimeout(() => setAntiCheatMsg(null), 3000)
            }
            return null
          })
        }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setAntiCheatMsg(null)
        setChar((prev) =>
          prev
            ? {
                ...prev,
                credits: data.credits,
                totalClicks: data.totalClicks,
                level: data.level,
                xp: data.xp,
                talentPoints: data.talentPoints,
              }
            : null
        )
        setQuestSummary(data.questSummary || null)
        setQuestEvents(Array.isArray(data.questEvents) ? data.questEvents : [])
      })
      .catch(() => {})
  }, [char])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!char) return
      setChar((prev) =>
        prev
          ? { ...prev, credits: prev.credits + effectiveCpc, totalClicks: prev.totalClicks + 1 }
          : null
      )

      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = particleId.current++
      setParticles((prev) => [...prev.slice(-10), { id, x, y, value: effectiveCpc }])
      setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 800)

      setClickScale(0.95)
      setTimeout(() => setClickScale(1), 100)

      pendingClicks.current += 1
      if (batchTimer.current) clearTimeout(batchTimer.current)
      batchTimer.current = setTimeout(sendBatch, 500)
    },
    [char, effectiveCpc, sendBatch]
  )

  useEffect(
    () => () => {
      sendBatch()
    },
    [sendBatch]
  )

  useEffect(() => {
    let active = true

    const loadLeaderboard = async () => {
      try {
        const response = await fetch('/play/leaderboard-state')
        if (!response.ok) return
        const data = await response.json()
        if (active) {
          setLiveLeaderboard(data)
        }
      } catch {}
    }

    const interval = setInterval(loadLeaderboard, 15000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  // No character
  if (!char && characters.length === 0) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-8 max-w-md w-full neon-border">
            <h2 className="text-2xl font-bold text-cyber-blue neon-text mb-6 text-center tracking-widest">
              {t('play:createRunnerTitle')}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createForm.post('/play/character')
              }}
            >
              <input
                type="text"
                value={createForm.data.name}
                onChange={(e) => createForm.setData('name', e.target.value)}
                placeholder={t('play:createRunnerPlaceholder')}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-3 text-white focus:border-cyber-blue focus:outline-none mb-4"
                maxLength={50}
                required
              />
              <button
                type="submit"
                disabled={createForm.processing}
                className="w-full py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all neon-border"
              >
                {t('play:createRunnerSubmit')}
              </button>
            </form>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main */}
        <div className="lg:col-span-3">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              {
                label: t('common:stats.credits'),
                value: formatCredits(char?.credits || 0),
                color: 'text-cyber-yellow',
              },
              {
                label: t('common:stats.level'),
                value: `LVL ${char?.level || 1}`,
                color: 'text-cyber-green',
              },
              { label: t('common:stats.cpc'), value: `${effectiveCpc}`, color: 'text-cyber-blue' },
              {
                label: t('common:stats.cps'),
                value: effectiveCps > 0 ? `${effectiveCps}/s` : t('play:off'),
                color: effectiveCps > 0 ? 'text-cyber-purple' : 'text-gray-600',
              },
              {
                label: t('common:stats.clicks'),
                value: formatCredits(char?.totalClicks || 0),
                color: 'text-cyber-pink',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-cyber-dark border border-cyber-blue/20 rounded-lg p-3 text-center"
              >
                <div className="text-[10px] uppercase tracking-widest text-gray-500">
                  {stat.label}
                </div>
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* XP Bar */}
          {char && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>
                  XP{' '}
                  {char.talentPoints > 0 && (
                    <span className="text-cyber-purple ml-2">
                      {t('play:talentPointsAvailable', { count: char.talentPoints })}
                    </span>
                  )}
                </span>
                <span>
                  {char.xp} / {char.level * 100}
                </span>
              </div>
              <div className="h-2 bg-cyber-dark rounded-full overflow-hidden border border-cyber-blue/20">
                <div
                  className="h-full bg-gradient-to-r from-cyber-blue to-cyber-pink transition-all duration-300"
                  style={{ width: `${(char.xp / (char.level * 100)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Anti-cheat warning */}
          {antiCheatMsg && (
            <div className="mb-4 mx-auto max-w-md bg-cyber-red/10 border border-cyber-red/50 rounded-lg px-4 py-3 text-cyber-red text-sm text-center animate-pulse">
              {antiCheatMsg}
            </div>
          )}

          {pendingOfflineCredits > 0 && (
            <div className="mb-4 mx-auto max-w-2xl rounded-lg border border-cyber-yellow/40 bg-cyber-yellow/10 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
                    {t('play:offlineEarnings')}
                  </div>
                  <div className="mt-1 text-xl font-bold text-cyber-yellow">
                    +{formatCredits(pendingOfflineCredits)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {t('play:offlineMessage', {
                      credits: formatCredits(pendingOfflineCredits),
                      hours: 4,
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={collectingOffline}
                  onClick={() => {
                    if (!char || collectingOffline) return
                    setCollectingOffline(true)

                    fetch('/play/collect-offline', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(
                          document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''
                        ),
                      },
                      body: JSON.stringify({ characterId: char.id }),
                    })
                      .then((response) => response.json())
                      .then((data) => {
                        setPendingOfflineCredits(data.remainingOfflineCredits || 0)
                        setChar((prev) =>
                          prev
                            ? {
                                ...prev,
                                credits: data.credits,
                              }
                            : null
                        )
                      })
                      .catch(() => {})
                      .finally(() => setCollectingOffline(false))
                  }}
                  className="rounded border border-cyber-yellow/40 bg-cyber-yellow/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyber-yellow transition-all hover:bg-cyber-yellow/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {collectingOffline ? t('play:pending') : t('play:collectOffline')}
                </button>
              </div>
            </div>
          )}

          {questEvents.length > 0 && (
            <div className="mb-4 space-y-2">
              {questEvents.map((event, index) => (
                <div
                  key={`${event.type}-${event.title}-${index}`}
                  className={`mx-auto max-w-2xl rounded-lg border px-4 py-3 text-sm ${
                    event.type === 'completed'
                      ? 'border-cyber-green/40 bg-cyber-green/10 text-cyber-green'
                      : 'border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-1">
                    {event.type === 'completed'
                      ? t('play:questCompleted')
                      : t('play:questUnlocked')}
                  </div>
                  <div className="font-bold text-white">{event.title}</div>
                  {event.rewardLabel && (
                    <div className="text-xs mt-1">
                      {t('play:reward')}:{' '}
                      <span className="text-cyber-yellow">{event.rewardLabel}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* THE BUTTON */}
          <div className="flex items-center justify-center py-10">
            <div className="relative">
              <button
                onClick={handleClick}
                style={{ transform: `scale(${clickScale})` }}
                className="w-56 h-56 rounded-full bg-cyber-dark border-4 border-cyber-blue text-cyber-blue font-bold text-3xl uppercase tracking-widest transition-transform duration-100 hover:border-cyber-pink hover:text-cyber-pink active:scale-90 relative overflow-hidden group"
              >
                <div
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ boxShadow: '0 0 40px #00f0ff, 0 0 80px #00f0ff33' }}
                />
                <span className="relative z-10 neon-text">{t('play:clickButton')}</span>
                <div className="absolute inset-x-0 bottom-7 z-10 text-center text-xs font-bold uppercase tracking-[0.25em] text-cyber-yellow">
                  {t('play:perClick', { value: effectiveCpc })}
                </div>
              </button>

              {/* Particles */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute text-cyber-yellow font-bold text-lg pointer-events-none"
                  style={{
                    left: p.x,
                    top: p.y,
                    animation: 'floatUp 0.8s ease-out forwards',
                  }}
                >
                  +{p.value}
                </div>
              ))}
            </div>
          </div>

          {/* Auto-click indicator */}
          {effectiveCps > 0 && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-cyber-purple/10 border border-cyber-purple/30 rounded-full px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-cyber-purple animate-pulse" />
                <span className="text-xs text-cyber-purple">
                  {t('play:perSecond', { value: effectiveCps })}
                </span>
              </div>
            </div>
          )}

          {/* HP Bar */}
          {char && (
            <div className="space-y-6">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{t('common:stats.hp')}</span>
                  <span>
                    {char.hpCurrent} / {char.hpMax}
                  </span>
                </div>
                <div className="h-3 bg-cyber-dark rounded-full overflow-hidden border border-cyber-red/20">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-red to-cyber-orange transition-all duration-300"
                    style={{ width: `${(char.hpCurrent / char.hpMax) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
                <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">
                        {t('play:characterLabel')}
                      </div>
                      <h3 className="text-lg uppercase tracking-widest text-cyber-green font-bold mt-1">
                        {char.name}
                      </h3>
                    </div>
                  </div>

                  <CyberpunkAvatar
                    name={char.name}
                    chosenSpec={char.chosenSpec}
                    equippedItems={equippedItems}
                  />
                </div>

                <div className="bg-cyber-dark border border-cyber-purple/30 rounded-lg p-4">
                  <div className="mb-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500">
                        {t('play:customizationLabel')}
                      </div>
                      <h3 className="text-lg uppercase tracking-widest text-cyber-purple font-bold mt-1">
                        {t('play:customizationTitle')}
                      </h3>
                    </div>
                  </div>

                  <div className="rounded border border-gray-800 bg-cyber-black/30 px-3 py-3 mb-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                      {t('play:specLabel')}
                    </div>
                    {char.chosenSpec ? (
                      <span
                        className={`inline-flex rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${SPEC_STYLE[char.chosenSpec]?.color} ${SPEC_STYLE[char.chosenSpec]?.border}`}
                      >
                        {t(`common:specs.${char.chosenSpec}`)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">{t('play:noSpec')}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {['clothes_hair', 'clothes_face', 'clothes_outer', 'clothes_legs'].map(
                      (type) => {
                        const entry = equippedItems.find((item) => item.item.type === type)

                        return (
                          <div
                            key={type}
                            className="rounded border border-gray-800 bg-cyber-black/40 px-3 py-2"
                          >
                            <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">
                              {t(`common:types.${type}`)}
                            </div>
                            {entry ? (
                              <div
                                className={`text-xs font-bold ${RARITY_TEXT[entry.item.rarity] || 'text-white'}`}
                              >
                                {entry.item.name}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-700">{t('play:emptySlot')}</div>
                            )}
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-cyber-dark border border-cyber-pink/30 rounded-lg p-4">
            <h3 className="text-sm uppercase tracking-widest text-cyber-pink neon-text-pink mb-4 text-center">
              {t('play:topRunners')}
            </h3>
            <div className="space-y-2">
              {liveLeaderboard.map((player, i) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    player.id === char?.id
                      ? 'bg-cyber-blue/10 border border-cyber-blue/30'
                      : 'bg-cyber-black/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${i === 0 ? 'text-cyber-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-cyber-orange' : 'text-gray-500'}`}
                    >
                      #{i + 1}
                    </span>
                    <span className="text-white truncate max-w-[80px]">{player.name}</span>
                  </div>
                  <span className="text-cyber-yellow">{formatCredits(player.credits)}</span>
                </div>
              ))}
              {liveLeaderboard.length === 0 && (
                <p className="text-gray-600 text-xs text-center">{t('play:noPlayers')}</p>
              )}
            </div>
          </div>

          {questSummary?.mainTrack && (
            <QuestTrackCard track={questSummary.mainTrack} accent="blue" />
          )}
          {questSummary?.seasonalTrack && (
            <QuestTrackCard track={questSummary.seasonalTrack} accent="yellow" />
          )}

          {char && (
            <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg p-4 mt-4">
              <h3 className="text-sm uppercase tracking-widest text-cyber-green mb-3 text-center">
                {char.name}
              </h3>
              <div className="space-y-1 text-xs">
                {[
                  {
                    label: t('common:stats.atk'),
                    value: `${char.attack}`,
                    color: 'text-cyber-red',
                  },
                  {
                    label: t('common:stats.def'),
                    value: `${char.defense}`,
                    color: 'text-cyber-blue',
                  },
                  {
                    label: t('common:stats.hp'),
                    value: `${char.hpCurrent}/${char.hpMax}`,
                    color: 'text-cyber-green',
                  },
                  {
                    label: t('common:stats.crit'),
                    value: `${char.critChance ?? 5}%`,
                    color: 'text-cyber-yellow',
                  },
                  {
                    label: t('common:stats.critDmg'),
                    value: `${char.critDamage ?? 150}%`,
                    color: 'text-cyber-yellow',
                  },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <span className="text-gray-500">{s.label}</span>
                    <span className={s.color}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-800 pt-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 text-center">
                  {t('play:equipped')}
                </div>
                <div className="space-y-2">
                  {['weapon', 'armor', 'implant'].map((type) => {
                    const entry = equippedItems.find((item) => item.item.type === type)

                    return (
                      <div
                        key={type}
                        className="rounded border border-gray-800 bg-cyber-black/40 px-2 py-2"
                      >
                        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">
                          {t(`common:types.${type}`)}
                        </div>
                        {entry ? (
                          <>
                            <div
                              className={`text-xs font-bold ${RARITY_TEXT[entry.item.rarity] || 'text-white'}`}
                            >
                              {entry.item.name}
                            </div>
                            {entry.item.effectType && entry.item.effectValue !== null && (
                              <div className="text-[10px] text-cyber-green mt-0.5">
                                {t(`common:effects.${entry.item.effectType}`, {
                                  defaultValue: entry.item.effectType,
                                })}
                                : +{entry.item.effectValue}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-gray-700">{t('play:emptySlot')}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Party widget */}
          {party && (
            <div className="bg-cyber-dark border border-cyber-purple/30 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm uppercase tracking-widest text-cyber-purple">
                  {t('play:partyTitle')}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    party.status === 'in_dungeon'
                      ? 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'
                      : 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green'
                  }`}
                >
                  {party.status === 'in_dungeon'
                    ? t('play:partyInDungeon')
                    : t('play:partyWaiting')}
                </span>
              </div>
              <div className="text-[10px] text-gray-600 mb-2 truncate">{party.name}</div>
              <div className="space-y-1.5">
                {party.members.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-1.5 rounded text-xs ${
                      m.id === char?.id
                        ? 'bg-cyber-purple/10 border border-cyber-purple/20'
                        : 'bg-cyber-black/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {m.isLeader && <span className="text-cyber-yellow text-[10px]">★</span>}
                      <span className="text-white truncate max-w-[80px]">{m.name}</span>
                      <span className="text-gray-700 text-[10px]">LVL {m.level}</span>
                    </div>
                    <span
                      className={`text-[10px] ${m.isReady ? 'text-cyber-green' : 'text-gray-600'}`}
                    >
                      {m.isReady ? t('play:partyReady') : t('play:pending')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {party.status === 'in_dungeon' && party.activeDungeonRunId && (
                  <button
                    onClick={() => router.visit(`/dungeon/run/${party.activeDungeonRunId}`)}
                    className="w-full py-2 bg-cyber-red/20 border border-cyber-red text-cyber-red font-bold uppercase tracking-widest rounded text-[10px] hover:bg-cyber-red/30 transition-all animate-pulse"
                  >
                    {t('play:joinDungeon')}
                  </button>
                )}
                <button
                  onClick={() => router.visit('/party')}
                  className="w-full py-1.5 border border-gray-800 text-gray-500 rounded text-[10px] hover:text-gray-300 hover:border-gray-600 transition-all"
                >
                  {t('play:manageParty')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
        }
      `}</style>
    </GameLayout>
  )
}
