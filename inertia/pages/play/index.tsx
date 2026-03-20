import { useForm, router } from '@inertiajs/react'
import { useState, useCallback, useRef, useEffect } from 'react'
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
      effectType: string | null
      effectValue: number | null
    }
  }[]
  bonuses: { clickBonus: number; attackBonus: number; defenseBonus: number }
  effectiveCpc: number
  effectiveCps: number
  offlineCredits: number
  party: PartyInfo | null
}

const TYPE_LABELS: Record<string, string> = {
  weapon: 'ARME',
  armor: 'ARMURE',
  implant: 'IMPLANT',
}

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-cyber-green',
  rare: 'text-cyber-blue',
  epic: 'text-cyber-purple',
  legendary: 'text-cyber-yellow',
}

const EFFECT_LABELS: Record<string, string> = {
  attack_boost: 'ATK',
  defense_boost: 'DEF',
  click_multiplier: 'CPC',
  permanent_click: 'CPC',
}

function formatCredits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export default function Play({ characters, activeCharacter, leaderboard, equippedItems, bonuses, effectiveCpc, effectiveCps, offlineCredits, party }: Props) {
  const [char, setChar] = useState(activeCharacter)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; value: number }[]>([])
  const [clickScale, setClickScale] = useState(1)
  const [showOffline, setShowOffline] = useState(offlineCredits > 0)
  const [antiCheatMsg, setAntiCheatMsg] = useState<string | null>(null)

  // Sync state when props change (e.g. after character creation redirect)
  useEffect(() => {
    setChar(activeCharacter)
  }, [activeCharacter])
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
      setChar((prev) => prev ? { ...prev, credits: prev.credits + effectiveCps } : null)
      tickCount.current += 1

      // Sync with server every 10 seconds
      if (tickCount.current >= 10) {
        tickCount.current = 0
        fetch('/play/tick', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''),
          },
          body: JSON.stringify({ characterId: char.id }),
        })
          .then((r) => r.json())
          .then((data) => {
            setChar((prev) => prev ? { ...prev, credits: data.credits } : null)
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
            setAntiCheatMsg(data.error || 'Trop rapide!')
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
      })
      .catch(() => {})
  }, [char])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!char) return
      setChar((prev) =>
        prev ? { ...prev, credits: prev.credits + effectiveCpc, totalClicks: prev.totalClicks + 1 } : null
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

  useEffect(() => () => { sendBatch() }, [sendBatch])

  // No character
  if (!char && characters.length === 0) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-8 max-w-md w-full neon-border">
            <h2 className="text-2xl font-bold text-cyber-blue neon-text mb-6 text-center tracking-widest">
              CREER TON RUNNER
            </h2>
            <form onSubmit={(e) => { e.preventDefault(); createForm.post('/play/character') }}>
              <input
                type="text"
                value={createForm.data.name}
                onChange={(e) => createForm.setData('name', e.target.value)}
                placeholder="Nom du personnage..."
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-3 text-white focus:border-cyber-blue focus:outline-none mb-4"
                maxLength={50}
                required
              />
              <button
                type="submit"
                disabled={createForm.processing}
                className="w-full py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all neon-border"
              >
                [ INITIALISER ]
              </button>
            </form>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      {/* Offline earnings popup */}
      {showOffline && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowOffline(false)}>
          <div className="bg-cyber-dark border border-cyber-yellow/50 rounded-lg p-8 text-center max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Revenus hors-ligne</div>
            <div className="text-4xl font-bold text-cyber-yellow mb-2">
              +{formatCredits(offlineCredits)}
            </div>
            <div className="text-xs text-gray-600 mb-4">credits generes par tes daemons</div>
            <button
              onClick={() => setShowOffline(false)}
              className="px-6 py-2 bg-cyber-yellow/20 border border-cyber-yellow text-cyber-yellow rounded uppercase tracking-widest text-xs font-bold hover:bg-cyber-yellow/30 transition-all"
            >
              [ COLLECTER ]
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main */}
        <div className="lg:col-span-3">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {[
              { label: 'CREDITS', value: formatCredits(char?.credits || 0), color: 'text-cyber-yellow' },
              { label: 'NIVEAU', value: `LVL ${char?.level || 1}`, color: 'text-cyber-green' },
              { label: 'CPC', value: `${effectiveCpc}`, color: 'text-cyber-blue' },
              { label: 'CPS', value: effectiveCps > 0 ? `${effectiveCps}/s` : 'OFF', color: effectiveCps > 0 ? 'text-cyber-purple' : 'text-gray-600' },
              { label: 'CLICKS', value: formatCredits(char?.totalClicks || 0), color: 'text-cyber-pink' },
            ].map((stat) => (
              <div key={stat.label} className="bg-cyber-dark border border-cyber-blue/20 rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase tracking-widest text-gray-500">{stat.label}</div>
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* XP Bar */}
          {char && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>XP {char.talentPoints > 0 && <span className="text-cyber-purple ml-2">{char.talentPoints} pts talent dispo</span>}</span>
                <span>{char.xp} / {char.level * 100}</span>
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
                <span className="relative z-10 neon-text">HACK</span>
                <div className="absolute inset-x-0 bottom-7 z-10 text-center text-xs font-bold uppercase tracking-[0.25em] text-cyber-yellow">
                  +{effectiveCpc} credits
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
                  Auto-hack actif: +{effectiveCps} credits/sec
                </span>
              </div>
            </div>
          )}

          {/* HP Bar */}
          {char && (
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>HP</span>
                <span>{char.hpCurrent} / {char.hpMax}</span>
              </div>
              <div className="h-3 bg-cyber-dark rounded-full overflow-hidden border border-cyber-red/20">
                <div
                  className="h-full bg-gradient-to-r from-cyber-red to-cyber-orange transition-all duration-300"
                  style={{ width: `${(char.hpCurrent / char.hpMax) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-cyber-dark border border-cyber-pink/30 rounded-lg p-4">
            <h3 className="text-sm uppercase tracking-widest text-cyber-pink neon-text-pink mb-4 text-center">
              Top Runners
            </h3>
            <div className="space-y-2">
              {leaderboard.map((player, i) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    player.id === char?.id ? 'bg-cyber-blue/10 border border-cyber-blue/30' : 'bg-cyber-black/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${i === 0 ? 'text-cyber-yellow' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-cyber-orange' : 'text-gray-500'}`}>
                      #{i + 1}
                    </span>
                    <span className="text-white truncate max-w-[80px]">{player.name}</span>
                  </div>
                  <span className="text-cyber-yellow">{formatCredits(player.credits)}</span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-gray-600 text-xs text-center">Aucun joueur</p>
              )}
            </div>
          </div>

          {char && (
            <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg p-4 mt-4">
              <h3 className="text-sm uppercase tracking-widest text-cyber-green mb-3 text-center">
                {char.name}
              </h3>
              <div className="space-y-1 text-xs">
                {[
                  { label: 'ATK', value: char.attack + bonuses.attackBonus, color: 'text-cyber-red' },
                  { label: 'DEF', value: char.defense + bonuses.defenseBonus, color: 'text-cyber-blue' },
                  { label: 'HP', value: `${char.hpCurrent}/${char.hpMax}`, color: 'text-cyber-green' },
                  { label: 'CRIT%', value: `${char.critChance ?? 5}%`, color: 'text-cyber-yellow' },
                  { label: 'CRIT DMG', value: `${char.critDamage ?? 150}%`, color: 'text-cyber-yellow' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <span className="text-gray-500">{s.label}</span>
                    <span className={s.color}>{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-800 pt-3">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 text-center">Equipement</div>
                <div className="space-y-2">
                  {['weapon', 'armor', 'implant'].map((type) => {
                    const entry = equippedItems.find((item) => item.item.type === type)

                    return (
                      <div key={type} className="rounded border border-gray-800 bg-cyber-black/40 px-2 py-2">
                        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">
                          {TYPE_LABELS[type]}
                        </div>
                        {entry ? (
                          <>
                            <div className={`text-xs font-bold ${RARITY_TEXT[entry.item.rarity] || 'text-white'}`}>
                              {entry.item.name}
                            </div>
                            {entry.item.effectType && entry.item.effectValue !== null && (
                              <div className="text-[10px] text-cyber-green mt-0.5">
                                {EFFECT_LABELS[entry.item.effectType] || entry.item.effectType}: +{entry.item.effectValue}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-gray-700">[ Vide ]</div>
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
                  Groupe
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  party.status === 'in_dungeon'
                    ? 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'
                    : 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green'
                }`}>
                  {party.status === 'in_dungeon' ? 'EN DONJON' : 'EN ATTENTE'}
                </span>
              </div>
              <div className="text-[10px] text-gray-600 mb-2 truncate">{party.name}</div>
              <div className="space-y-1.5">
                {party.members.map((m) => (
                  <div key={m.id} className={`flex items-center justify-between p-1.5 rounded text-xs ${
                    m.id === char?.id ? 'bg-cyber-purple/10 border border-cyber-purple/20' : 'bg-cyber-black/30'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      {m.isLeader && <span className="text-cyber-yellow text-[10px]">★</span>}
                      <span className="text-white truncate max-w-[80px]">{m.name}</span>
                      <span className="text-gray-700 text-[10px]">LVL {m.level}</span>
                    </div>
                    <span className={`text-[10px] ${m.isReady ? 'text-cyber-green' : 'text-gray-600'}`}>
                      {m.isReady ? 'PRET' : '...'}
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
                    [ REJOINDRE LE DONJON ]
                  </button>
                )}
                <button
                  onClick={() => router.visit('/party')}
                  className="w-full py-1.5 border border-gray-800 text-gray-500 rounded text-[10px] hover:text-gray-300 hover:border-gray-600 transition-all"
                >
                  GERER LE GROUPE
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
