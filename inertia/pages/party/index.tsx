import { useForm, router, usePage } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import GameLayout from '~/components/layout'
import { translateBackendMessage } from '~/i18n/backend_messages'

interface CharacterInfo {
  id: number
  name: string
  level: number
  hpCurrent: number
  hpMax: number
  attack: number
  defense: number
}

interface PartyMemberInfo {
  id: number
  characterId: number
  isReady: boolean
  character: CharacterInfo
}

interface PartyInfo {
  id: number
  name: string
  code: string
  leaderId: number
  maxSize: number
  status: string
  members: PartyMemberInfo[]
  isLeader: boolean
}

interface Floor {
  id: number
  name: string
  floorNumber: number
  minLevel: number
  minPlayers: number
  maxPlayers: number
  bossEnemyId: number | null
}

interface Props {
  character: CharacterInfo
  currentParty: PartyInfo | null
  floors: Floor[]
}

export default function PartyIndex({ character, currentParty: initialParty, floors }: Props) {
  const { t } = useTranslation(['party', 'common'])
  const createForm = useForm({ name: '' })
  const joinForm = useForm({ code: '' })
  const [inviteName, setInviteName] = useState('')
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)
  const [currentParty, setCurrentParty] = useState(initialParty)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [decliningCountdown, setDecliningCountdown] = useState(false)

  // Sync from Inertia props on navigation
  useEffect(() => {
    setCurrentParty(initialParty)
  }, [initialParty])

  // Poll party state — faster during countdown (every 1s), normal every 2s
  const isCountdown = countdown !== null
  useEffect(() => {
    if (!currentParty) return
    let active = true
    let hadCountdown = false
    const pollFn = async () => {
      if (!active) return
      try {
        const res = await fetch(`/party/state/${currentParty.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.dungeonRunId) {
          active = false
          setCountdown(null)
          router.visit(`/dungeon/run/${data.dungeonRunId}`)
          return
        }
        if (data.countdown !== null && data.countdown !== undefined) {
          setCountdown(data.countdown)
          hadCountdown = true
        } else {
          setCountdown(null)
        }
        if (data.party) {
          setCurrentParty(data.party)
          if (hadCountdown && data.party.status === 'waiting') {
            hadCountdown = false
            router.visit('/party')
            return
          }
        } else {
          setCurrentParty(null)
        }
      } catch {}
    }
    // Poll immediately on mount/change
    pollFn()
    const poll = setInterval(pollFn, isCountdown ? 1000 : 2000)
    return () => {
      active = false
      clearInterval(poll)
    }
  }, [currentParty?.id, isCountdown])

  // Not in a party
  if (!currentParty) {
    return (
      <GameLayout>
        <h1 className="text-2xl font-bold text-cyber-orange tracking-widest mb-6">{t('title')}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          {/* Create */}
          <div className="bg-cyber-dark border border-cyber-orange/30 rounded-lg p-6">
            <h2 className="text-sm uppercase tracking-widest text-cyber-orange mb-4">
              {t('create')}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createForm.post('/party/create')
              }}
            >
              <input
                type="text"
                value={createForm.data.name}
                onChange={(e) => createForm.setData('name', e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full bg-cyber-black border border-cyber-orange/30 rounded px-4 py-2.5 text-white focus:border-cyber-orange focus:outline-none mb-3 text-sm"
                maxLength={50}
              />
              <button
                type="submit"
                disabled={createForm.processing}
                className="w-full py-2.5 bg-cyber-orange/20 border border-cyber-orange text-cyber-orange font-bold uppercase tracking-widest rounded hover:bg-cyber-orange/30 transition-all text-xs"
              >
                {t('createBtn')}
              </button>
            </form>
          </div>

          {/* Join */}
          <div className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-6">
            <h2 className="text-sm uppercase tracking-widest text-cyber-blue mb-4">{t('join')}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                joinForm.post('/party/join')
              }}
            >
              <input
                type="text"
                value={joinForm.data.code}
                onChange={(e) => joinForm.setData('code', e.target.value.toUpperCase())}
                placeholder={t('codePlaceholder')}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none mb-3 text-sm font-mono tracking-widest text-center"
                maxLength={8}
              />
              <button
                type="submit"
                disabled={joinForm.processing || joinForm.data.code.length < 8}
                className="w-full py-2.5 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all text-xs disabled:opacity-50"
              >
                {t('joinBtn')}
              </button>
            </form>
          </div>
        </div>
      </GameLayout>
    )
  }

  // In a party
  const allReady = currentParty.members.every((m) => m.isReady)
  const myMember = currentParty.members.find((m) => m.characterId === character.id)
  const { errors } = usePage().props as any
  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteName.trim()) return

    setInviteFeedback(null)
    try {
      const res = await fetch('/party/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''
          ),
        },
        body: JSON.stringify({ characterName: inviteName }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setInviteFeedback(data.error ? translateBackendMessage(data.error, t) : t('inviteFailed'))
        return
      }

      setInviteFeedback(data.message ? translateBackendMessage(data.message, t) : t('inviteSent'))
      setInviteName('')
    } catch {
      setInviteFeedback(t('networkError'))
    }
  }

  const declineCountdown = () => {
    setDecliningCountdown(true)
    setError(null)
    router.post(
      '/party/decline-countdown',
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onError: (errors: any) => setError(errors.message || t('networkError')),
        onFinish: () => setDecliningCountdown(false),
      }
    )
  }

  return (
    <GameLayout>
      {/* Countdown overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-cyber-red mb-4 animate-pulse">
              {t('launchTitle')}
            </div>
            <div
              className="text-8xl font-bold text-cyber-yellow neon-text mb-6"
              style={{
                animation: 'pulse 1s ease-in-out infinite',
              }}
            >
              {countdown}
            </div>
            <div className="text-sm text-gray-500">{t('launchMessage')}</div>
            <button
              type="button"
              disabled={decliningCountdown}
              onClick={declineCountdown}
              className="mt-6 rounded border border-cyber-red/40 bg-cyber-red/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyber-red transition-all hover:bg-cyber-red/20 disabled:opacity-50"
            >
              {decliningCountdown ? t('decliningLaunch') : t('declineLaunch')}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        {/* Errors */}
        {(errors?.message || error) && (
          <div className="bg-cyber-red/10 border border-cyber-red/30 rounded-lg p-3 mb-4 text-xs text-cyber-red">
            {translateBackendMessage(errors?.message || error || '', t)}
          </div>
        )}

        {/* Party header */}
        <div className="bg-cyber-dark border border-cyber-orange/30 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-cyber-orange tracking-widest">
                {currentParty.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">{t('code')}</span>
                <span className="font-mono text-sm text-cyber-yellow tracking-[0.3em] bg-cyber-black px-3 py-1 rounded border border-cyber-yellow/20">
                  {currentParty.code}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">
                {t('members', { current: currentParty.members.length, max: currentParty.maxSize })}
              </div>
              {currentParty.isLeader && (
                <span className="text-[10px] bg-cyber-yellow/20 text-cyber-yellow px-2 py-0.5 rounded uppercase">
                  {t('leader')}
                </span>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="space-y-2 mb-4">
            {currentParty.members.map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  member.isReady
                    ? 'border-cyber-green/30 bg-cyber-green/5'
                    : 'border-gray-800 bg-cyber-black/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${member.isReady ? 'bg-cyber-green animate-pulse' : 'bg-gray-700'}`}
                  />
                  <div>
                    <div className="text-sm text-white font-bold">
                      {member.character.name}
                      {member.characterId === currentParty.leaderId && (
                        <span className="text-[9px] text-cyber-yellow ml-2">LEADER</span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      LVL {member.character.level} | ATK {member.character.attack} | DEF{' '}
                      {member.character.defense} | HP {member.character.hpCurrent}/
                      {member.character.hpMax}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${member.isReady ? 'text-cyber-green' : 'text-gray-600'}`}
                  >
                    {member.isReady ? t('ready') : t('waiting')}
                  </span>
                  {currentParty.isLeader && member.characterId !== currentParty.leaderId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(t('kickConfirm', { name: member.character.name }))) return
                        router.post(
                          `/party/members/${member.characterId}/kick`,
                          {},
                          {
                            preserveScroll: true,
                            preserveState: true,
                          }
                        )
                      }}
                      className="rounded border border-cyber-red/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-cyber-red transition-all hover:bg-cyber-red/10"
                    >
                      {t('kick')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => router.post('/party/ready')}
              className={`flex-1 py-2 text-xs uppercase tracking-widest rounded font-bold transition-all border ${
                myMember?.isReady
                  ? 'bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-800'
                  : 'bg-cyber-green/20 border-cyber-green text-cyber-green hover:bg-cyber-green/30'
              }`}
            >
              {myMember?.isReady ? t('cancelReady') : t('readyBtn')}
            </button>
            <button
              onClick={() => router.post('/party/leave')}
              className="px-4 py-2 text-xs uppercase tracking-widest rounded font-bold transition-all border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10"
            >
              {t('leaveBtn')}
            </button>
          </div>

          {currentParty.isLeader && countdown === null && (
            <div className="mt-4 border-t border-cyber-orange/10 pt-4">
              <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-cyber-orange">
                {t('invite')}
              </div>
              <form onSubmit={sendInvite} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder={t('invitePlaceholder')}
                  className="flex-1 rounded border border-cyber-orange/20 bg-cyber-black px-4 py-2.5 text-sm text-white focus:border-cyber-orange focus:outline-none"
                  maxLength={50}
                />
                <button
                  type="submit"
                  disabled={!inviteName.trim()}
                  className="rounded border border-cyber-orange bg-cyber-orange/15 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-cyber-orange transition-all hover:bg-cyber-orange/25 disabled:opacity-50"
                >
                  {t('inviteBtn')}
                </button>
              </form>
              {inviteFeedback && (
                <div
                  className={`mt-2 text-xs ${inviteFeedback === t('inviteSent') ? 'text-cyber-green' : 'text-cyber-red'}`}
                >
                  {inviteFeedback}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dungeon selection (leader only) */}
        {currentParty.isLeader && (
          <div className="bg-cyber-dark border border-cyber-red/30 rounded-lg p-6">
            <h2 className="text-sm uppercase tracking-widest text-cyber-red mb-4">
              {t('selectDungeon')}
            </h2>

            <div className="space-y-2 mb-4">
              {floors.map((floor) => {
                const hasEnoughPlayers = currentParty.members.length >= floor.minPlayers
                const minMemberLevel = Math.min(
                  ...currentParty.members.map((m) => m.character.level)
                )
                const hasLevel = minMemberLevel >= floor.minLevel
                const canSelect = hasEnoughPlayers && hasLevel
                const isSelected = selectedFloor === floor.id
                const isGroupRequired = floor.minPlayers > 1

                return (
                  <div
                    key={floor.id}
                    onClick={() => canSelect && setSelectedFloor(floor.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyber-red bg-cyber-red/10'
                        : canSelect
                          ? 'border-gray-800 hover:border-cyber-red/30'
                          : 'border-gray-800/50 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-white font-bold">
                          F{floor.floorNumber} - {floor.name}
                        </span>
                        <div className="flex items-center gap-3 text-[10px] text-gray-600 mt-0.5">
                          <span className={!hasLevel ? 'text-cyber-red' : ''}>
                            {t('levelReq', { n: floor.minLevel })}
                          </span>
                          <span className={isGroupRequired ? 'text-cyber-orange' : ''}>
                            {floor.minPlayers === 1
                              ? t('soloOrGroup')
                              : t('playerRange', { min: floor.minPlayers, max: floor.maxPlayers })}
                          </span>
                          {floor.bossEnemyId && (
                            <span className="text-cyber-yellow">{t('boss')}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {!hasEnoughPlayers && (
                          <span className="text-[10px] text-cyber-red block">
                            {t('missingPlayers', {
                              count: floor.minPlayers - currentParty.members.length,
                            })}
                          </span>
                        )}
                        {!hasLevel && (
                          <span className="text-[10px] text-cyber-red block">
                            {t('levelTooLow', { n: floor.minLevel })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => {
                if (!selectedFloor || !allReady) return
                setError(null)
                router.post(
                  '/party/start-dungeon',
                  { floorId: selectedFloor },
                  {
                    onError: (errors: any) => setError(errors.message || t('networkError')),
                    preserveState: true,
                  }
                )
              }}
              disabled={!selectedFloor || !allReady}
              className="w-full py-3 bg-cyber-red/20 border border-cyber-red text-cyber-red font-bold uppercase tracking-widest rounded hover:bg-cyber-red/30 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {!allReady
                ? t('waitingReady')
                : !selectedFloor
                  ? t('selectDungeonBtn')
                  : t('launchBtn')}
            </button>
          </div>
        )}

        {!currentParty.isLeader && (
          <div className="bg-cyber-dark/50 border border-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-600 text-sm">{t('waitingForLeader')}</p>
          </div>
        )}
      </div>
    </GameLayout>
  )
}
