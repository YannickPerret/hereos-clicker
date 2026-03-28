import { Link, router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import GameLayout from '~/components/layout'

interface FriendEntry {
  id: number
  characterId: number
  name: string
  level: number
  pvpRating: number
  chosenSpec: string | null
  isOnline?: boolean
  lastSeenAt?: string | null
  acceptedAt?: string | null
  createdAt?: string | null
}

interface Props {
  character: {
    id: number
    name: string
  }
  friends: FriendEntry[]
  incomingRequests: FriendEntry[]
  outgoingRequests: FriendEntry[]
}

function CharacterCard({
  entry,
  rightSlot,
  t,
}: {
  entry: FriendEntry
  rightSlot: React.ReactNode
  t: (key: string, opts?: Record<string, any>) => string
}) {
  const presenceLabel = formatPresenceLabel(entry, t)

  return (
    <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">{entry.name}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-gray-500">
            LVL {entry.level} • ELO {entry.pvpRating}
            {entry.chosenSpec ? ` • ${entry.chosenSpec}` : ''}
          </div>
          <div
            className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${
              entry.isOnline ? 'text-cyber-green' : 'text-gray-600'
            }`}
          >
            {presenceLabel}
          </div>
        </div>
        <div className="shrink-0">{rightSlot}</div>
      </div>
      <div className="mt-3">
        <Link
          href={`/profile/${encodeURIComponent(entry.name)}`}
          className="text-[10px] uppercase tracking-widest text-cyber-blue transition hover:text-white"
        >
          {t('friends:viewProfile')}
        </Link>
      </div>
    </div>
  )
}

function formatPresenceLabel(entry: FriendEntry, t: (key: string, opts?: Record<string, any>) => string) {
  if (entry.isOnline) {
    return t('friends:online')
  }

  if (!entry.lastSeenAt) {
    return t('friends:offline')
  }

  const diffMs = Date.now() - new Date(entry.lastSeenAt).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return t('friends:offline')
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) {
    return t('friends:offlineLessThanHour')
  }

  if (diffHours < 24) {
    return t('friends:offlineHours', { hours: diffHours })
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    return t('friends:offlineDays', { days: diffDays })
  }

  return t('friends:offlineWeek')
}

export default function FriendsIndex({
  character,
  friends,
  incomingRequests,
  outgoingRequests,
}: Props) {
  const { t } = useTranslation(['friends', 'common'])
  const { errors } = usePage().props as any
  const [characterName, setCharacterName] = useState('')

  return (
    <GameLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-gray-500">Social</div>
            <h1 className="mt-2 text-2xl font-bold tracking-widest text-cyber-green">{t('friends:title')}</h1>
            <div className="mt-1 text-xs text-gray-500">{t('friends:networkOf', { name: character.name })}</div>
          </div>
        </div>

        {errors?.message && (
          <div className="mb-4 rounded-lg border border-cyber-red/40 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">
            {errors.message}
          </div>
        )}

        <div className="mb-6 rounded-lg border border-cyber-green/20 bg-cyber-dark p-4">
          <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-gray-500">{t('friends:addFriend')}</div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!characterName.trim()) return
              router.post('/friends/request', { characterName })
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="text"
              value={characterName}
              onChange={(event) => setCharacterName(event.target.value)}
              placeholder={t('friends:namePlaceholder')}
              className="flex-1 rounded border border-gray-800 bg-cyber-black px-4 py-2.5 text-sm text-white focus:border-cyber-green/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!characterName.trim()}
              className="rounded border border-cyber-green/30 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.24em] text-cyber-green transition hover:bg-cyber-green/10 disabled:opacity-40"
            >
              {t('friends:send')}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="xl:col-span-1">
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-cyber-orange">
              {t('friends:incomingRequests')}
            </div>
            <div className="space-y-3">
              {incomingRequests.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-cyber-dark px-4 py-6 text-center text-xs text-gray-600">
                  {t('friends:noRequests')}
                </div>
              ) : (
                incomingRequests.map((entry) => (
                  <CharacterCard
                    key={entry.id}
                    entry={entry}
                    t={t}
                    rightSlot={
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => router.post(`/friends/${entry.id}/accept`)}
                          className="rounded border border-cyber-green/30 px-2 py-1 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10"
                        >
                          {t('friends:accept')}
                        </button>
                        <button
                          type="button"
                          onClick={() => router.post(`/friends/${entry.id}/decline`)}
                          className="rounded border border-cyber-red/30 px-2 py-1 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
                        >
                          {t('friends:decline')}
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section className="xl:col-span-1">
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-cyber-blue">
              {t('friends:friendsSection')}
            </div>
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-cyber-dark px-4 py-6 text-center text-xs text-gray-600">
                  {t('friends:noFriends')}
                </div>
              ) : (
                friends.map((entry) => (
                  <CharacterCard
                    key={entry.id}
                    entry={entry}
                    t={t}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(t('friends:removeConfirm', { name: entry.name }))) {
                            router.post(`/friends/${entry.id}/remove`)
                          }
                        }}
                        className="rounded border border-cyber-red/30 px-2 py-1 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
                      >
                        {t('friends:remove')}
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section className="xl:col-span-1">
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-cyber-purple">
              {t('friends:outgoingRequests')}
            </div>
            <div className="space-y-3">
              {outgoingRequests.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-cyber-dark px-4 py-6 text-center text-xs text-gray-600">
                  {t('friends:noOutgoing')}
                </div>
              ) : (
                outgoingRequests.map((entry) => (
                  <CharacterCard
                    key={entry.id}
                    entry={entry}
                    t={t}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => router.post(`/friends/${entry.id}/cancel`)}
                        className="rounded border border-gray-700 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-400 hover:border-gray-500 hover:text-white"
                      >
                        {t('friends:cancel')}
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </GameLayout>
  )
}
