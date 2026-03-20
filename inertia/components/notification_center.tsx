import { router, usePage } from '@inertiajs/react'
import { useCallback, useEffect, useRef, useState } from 'react'

interface InviteNotification {
  id: number
  partyId: number
  partyName: string
  partyCode: string
  invitedByName: string
  memberCount: number
  maxSize: number
  createdAt: string
}

function readStoredIds(key: string) {
  if (typeof window === 'undefined') return new Set<number>()

  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return new Set<number>()
    return new Set(parsed.filter((id) => typeof id === 'number'))
  } catch {
    return new Set<number>()
  }
}

function persistIds(key: string, ids: Set<number>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(Array.from(ids)))
}

function getCsrfToken() {
  return decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '')
}

export default function NotificationCenter() {
  const { auth } = usePage().props as any
  const [isOpen, setIsOpen] = useState(false)
  const [invites, setInvites] = useState<InviteNotification[]>([])
  const [toasts, setToasts] = useState<InviteNotification[]>([])
  const [busyInviteId, setBusyInviteId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const seenInviteIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsOpen(window.localStorage.getItem('notification-center-open') === '1')
    seenInviteIds.current = readStoredIds('notification-center-seen-invites')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('notification-center-open', isOpen ? '1' : '0')
  }, [isOpen])

  const loadInvites = useCallback(async () => {
    if (!auth?.user) return

    try {
      const res = await fetch('/party/invitations')
      if (!res.ok) return

      const data = await res.json() as InviteNotification[]
      setInvites(data)

      const unseen = data.filter((invite) => !seenInviteIds.current.has(invite.id))
      if (unseen.length > 0) {
        setToasts((prev) => {
          const existingIds = new Set(prev.map((toast) => toast.id))
          return [...prev, ...unseen.filter((invite) => !existingIds.has(invite.id))]
        })
      }

      for (const invite of unseen) {
        seenInviteIds.current.add(invite.id)
      }
      persistIds('notification-center-seen-invites', seenInviteIds.current)
    } catch {
      // Ignore polling errors for the floating center
    }
  }, [auth?.user])

  useEffect(() => {
    if (!auth?.user) return

    loadInvites()
    const interval = setInterval(loadInvites, 5000)
    return () => clearInterval(interval)
  }, [auth?.user, loadInvites])

  const removeInviteEverywhere = useCallback((inviteId: number) => {
    setInvites((prev) => prev.filter((invite) => invite.id !== inviteId))
    setToasts((prev) => prev.filter((invite) => invite.id !== inviteId))
  }, [])

  const respondToInvite = useCallback(async (inviteId: number, action: 'accept' | 'decline') => {
    setBusyInviteId(inviteId)
    setError(null)

    try {
      const res = await fetch(`/party/invitations/${inviteId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Action impossible.')
        return
      }

      removeInviteEverywhere(inviteId)

      if (action === 'accept') {
        router.visit(data.redirectTo || '/party')
      }
    } catch {
      setError('Erreur reseau.')
    } finally {
      setBusyInviteId(null)
    }
  }, [removeInviteEverywhere])

  if (!auth?.user) return null

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 left-4 z-50 inline-flex items-center gap-2 rounded-full border border-cyber-orange/40 bg-cyber-dark/95 px-3 py-2 text-xs uppercase tracking-widest text-cyber-orange shadow-lg hover:bg-cyber-orange/10 transition-all"
        >
          <span>NOTIFS</span>
          {invites.length > 0 && (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-cyber-red px-1.5 py-0.5 text-[10px] font-bold text-white">
              {invites.length}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-cyber-orange/30 bg-cyber-black/95 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-cyber-orange/20 bg-cyber-dark px-3 py-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-orange">Notification Center</div>
              <div className="text-[10px] text-gray-500">{invites.length} invitation(s) active(s)</div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-500 transition-colors hover:text-cyber-red"
            >
              ✕
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-3">
            {error && (
              <div className="mb-3 rounded border border-cyber-red/30 bg-cyber-red/10 px-3 py-2 text-xs text-cyber-red">
                {error}
              </div>
            )}

            {invites.length === 0 ? (
              <div className="rounded border border-gray-800 bg-cyber-dark/40 px-3 py-4 text-center text-xs text-gray-500">
                Aucune invitation de groupe en attente.
              </div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded-lg border border-cyber-orange/20 bg-cyber-dark/50 p-3">
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-cyber-orange">
                      {invite.partyName}
                    </div>
                    <div className="text-xs text-gray-300">
                      {invite.invitedByName} t&apos;invite dans son groupe.
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">
                      Code {invite.partyCode} • {invite.memberCount}/{invite.maxSize} joueurs
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busyInviteId === invite.id}
                        onClick={() => respondToInvite(invite.id, 'accept')}
                        className="flex-1 rounded border border-cyber-green/30 bg-cyber-green/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyber-green transition-all hover:bg-cyber-green/20 disabled:opacity-50"
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        disabled={busyInviteId === invite.id}
                        onClick={() => respondToInvite(invite.id, 'decline')}
                        className="flex-1 rounded border border-cyber-red/30 bg-cyber-red/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyber-red transition-all hover:bg-cyber-red/20 disabled:opacity-50"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3">
        {toasts.map((invite) => (
          <div
            key={invite.id}
            className="pointer-events-auto rounded-lg border border-cyber-orange/40 bg-cyber-dark/95 p-4 shadow-2xl backdrop-blur-sm"
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-orange">Invitation Groupe</div>
            <div className="mt-2 text-sm font-bold text-white">{invite.partyName}</div>
            <div className="mt-1 text-xs text-gray-300">
              {invite.invitedByName} veut te faire rejoindre son groupe.
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-gray-500">
              {invite.memberCount}/{invite.maxSize} joueurs
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busyInviteId === invite.id}
                onClick={() => respondToInvite(invite.id, 'accept')}
                className="flex-1 rounded border border-cyber-green/30 bg-cyber-green/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyber-green transition-all hover:bg-cyber-green/20 disabled:opacity-50"
              >
                Accepter
              </button>
              <button
                type="button"
                disabled={busyInviteId === invite.id}
                onClick={() => respondToInvite(invite.id, 'decline')}
                className="flex-1 rounded border border-cyber-red/30 bg-cyber-red/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyber-red transition-all hover:bg-cyber-red/20 disabled:opacity-50"
              >
                Refuser
              </button>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== invite.id))}
              className="mt-3 text-[10px] uppercase tracking-widest text-gray-500 transition-colors hover:text-white"
            >
              Masquer
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
