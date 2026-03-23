import { Link, router, usePage } from '@inertiajs/react'
import { type ReactNode, useEffect, useState } from 'react'
import FloatingChat from '~/components/floating_chat'
import NotificationCenter from '~/components/notification_center'

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-cyber-red',
  moderator: 'text-cyber-orange',
  user: 'text-cyber-green',
}

const REPORT_CATEGORIES = ['bug', 'exploit', 'player', 'suggestion', 'other'] as const

const REWARD_ICONS: Record<string, string> = {
  credits: '💰',
  xp: '⭐',
  item: '📦',
}

function rewardLabel(rewardType: string, rewardValue: number, rewardItemName: string | null = null) {
  if (rewardType === 'item') return `${rewardValue}x ${rewardItemName || 'item'}`
  return `+${rewardValue.toLocaleString()} ${rewardType}`
}

export default function GameLayout({ children }: { children: ReactNode }) {
  const { auth, blackMarket, success, errors, dailyReward } = usePage().props as any
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState<null | { type: 'success' | 'error'; message: string }>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [dailyRewardModalOpen, setDailyRewardModalOpen] = useState(false)
  const [claimingReward, setClaimingReward] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportCategory, setReportCategory] = useState<(typeof REPORT_CATEGORIES)[number]>('bug')
  const [submittingReport, setSubmittingReport] = useState(false)
  const isStaff = auth?.user?.role === 'admin' || auth?.user?.role === 'moderator'
  const roleColor = ROLE_COLORS[auth?.user?.role] || ROLE_COLORS.user
  const roleLabel = auth?.user?.roleLabel || 'RUNNER'
  const blackMarketMinLevel = Number(blackMarket?.minLevel || 12)
  const hasBlackMarketAccess = Number(auth?.activeCharacterLevel || 0) >= blackMarketMinLevel
  const companionMinLevel = 10
  const hasCompanionAccess = Number(auth?.activeCharacterLevel || 0) >= companionMinLevel
  const activeCharacterName = auth?.activeCharacterName || null
  const publicProfileHref = activeCharacterName
    ? `/profile/${encodeURIComponent(activeCharacterName)}`
    : '/play'
  const navLinks = [
    { href: '/play', label: 'ACCUEIL' },
    { href: '/inventory', label: 'INVENTAIRE' },
    ...(hasCompanionAccess ? [{ href: '/companions', label: 'DRONES' }] : []),
    { href: '/talents', label: 'TALENTS' },
    { href: '/shop', label: 'SHOP' },
    ...(hasBlackMarketAccess ? [{ href: '/black-market', label: 'MARCHE NOIR' }] : []),
    { href: '/party', label: 'GROUPE' },
    { href: '/dungeon', label: 'DONJON' },
    { href: '/iso-dungeon', label: 'DONJON 2.5D' },
    { href: '/pvp', label: 'PVP' },
    { href: '/quests', label: 'QUETES' },
    { href: '/missions', label: 'MISSIONS' },
    { href: '/friends', label: 'AMIS' },
    { href: '/leaderboard', label: 'CLASSEMENT' },
  ]

  useEffect(() => {
    if (dailyReward?.canClaimToday) {
      setDailyRewardModalOpen(true)
    }
  }, [])

  useEffect(() => {
    if (success) {
      setToast({ type: 'success', message: success })
      return
    }

    if (errors?.message) {
      setToast({ type: 'error', message: errors.message })
    }
  }, [errors?.message, success])

  useEffect(() => {
    if (!toast) return

    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!submittingReport || !success) return

    setSubmittingReport(false)
    setReportModalOpen(false)
    setReportTitle('')
    setReportDescription('')
    setReportCategory('bug')
  }, [submittingReport, success])

  useEffect(() => {
    if (!submittingReport || !errors?.message) return
    setSubmittingReport(false)
  }, [errors?.message, submittingReport])

  const submitBugReport = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmittingReport(true)
    router.post(
      '/report',
      {
        title: reportTitle,
        description: reportDescription,
        category: reportCategory,
      },
      {
        preserveScroll: true,
      }
    )
  }

  return (
    <div className="min-h-screen bg-cyber-black">
      {toast && (
        <div className="pointer-events-none fixed right-4 top-[4.5rem] z-[70] w-full max-w-sm">
          <div
            className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-2xl backdrop-blur ${
              toast.type === 'success'
                ? 'border-cyber-green/40 bg-cyber-green/12 text-cyber-green'
                : 'border-cyber-red/40 bg-cyber-red/12 text-cyber-red'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.24em]">
                {toast.type === 'success' ? 'Succes' : 'Erreur'}
              </div>
              <div className="flex-1 text-sm text-white">{toast.message}</div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs text-gray-500 transition hover:text-white"
              >
                FERMER
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-cyber-blue/30 bg-cyber-dark/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 transition-all"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>

            <Link href="/play" className="flex items-center">
              <img
                src="/images/hereos_logo.webp"
                alt="HEREOS"
                className="h-20 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {auth?.user && (
              <>
                <div className="text-right hidden sm:block">
                  <Link
                    href={publicProfileHref}
                    className="block text-xs text-cyber-green transition hover:text-cyber-blue"
                  >
                    {auth.user.username}
                  </Link>
                  <span className={`text-[9px] ${roleColor}`}>{roleLabel}</span>
                </div>
                <Link
                  href="/logout"
                  method="post"
                  as="button"
                  className="text-xs text-cyber-red hover:text-red-400 border border-cyber-red/30 px-2 py-1 rounded hover:bg-cyber-red/10 transition-all"
                >
                  DECONNEXION
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r border-cyber-blue/20 bg-cyber-dark/40 px-4 py-5 md:block">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded border border-cyber-blue/15 px-3 py-2.5 text-xs uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-cyber-blue/35 hover:bg-cyber-blue/10 hover:text-cyber-blue"
              >
                {link.label}
              </Link>
            ))}
            {isStaff && (
              <Link
                href="/admin"
                className="rounded border border-cyber-red/20 px-3 py-2.5 text-xs uppercase tracking-[0.22em] text-cyber-red transition-all hover:border-cyber-red/40 hover:bg-cyber-red/10"
              >
                ADMIN
              </Link>
            )}
            <Link
              href="/reports"
              className="rounded border border-cyber-orange/20 px-3 py-2.5 text-xs uppercase tracking-[0.22em] text-cyber-orange transition-all hover:border-cyber-orange/40 hover:bg-cyber-orange/10"
            >
              MES REPORTS
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-[calc(96rem-18rem)]">
            {children}
          </div>
        </main>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-[55] bg-cyber-black/70 md:hidden"
          />
          <aside className="fixed left-0 top-14 z-[60] h-[calc(100vh-3.5rem)] w-72 border-r border-cyber-blue/20 bg-cyber-dark/95 px-4 py-5 shadow-2xl md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded border border-cyber-blue/20 px-3 py-2.5 text-left text-xs uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-cyber-blue/40 hover:bg-cyber-blue/10 hover:text-cyber-blue"
                >
                  {link.label}
                </Link>
              ))}
              {isStaff && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded border border-cyber-red/20 px-3 py-2.5 text-left text-xs uppercase tracking-[0.22em] text-cyber-red transition-all hover:border-cyber-red/40 hover:bg-cyber-red/10"
                >
                  ADMIN
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setReportModalOpen(true)
                }}
                className="rounded border border-cyber-orange/20 px-3 py-2.5 text-left text-xs uppercase tracking-[0.22em] text-cyber-orange transition-all hover:border-cyber-orange/40 hover:bg-cyber-orange/10"
              >
                REPORT BUG
              </button>
              <Link
                href="/reports"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded border border-cyber-orange/20 px-3 py-2.5 text-left text-xs uppercase tracking-[0.22em] text-cyber-orange transition-all hover:border-cyber-orange/40 hover:bg-cyber-orange/10"
              >
                MES REPORTS
              </Link>
            </nav>
          </aside>
        </>
      )}

      <button
        type="button"
        onClick={() => setReportModalOpen(true)}
        className="fixed bottom-5 right-5 z-[65] hidden rounded-full border border-cyber-orange/40 bg-cyber-dark/90 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.28em] text-cyber-orange shadow-2xl transition-all hover:bg-cyber-orange/10 md:block"
      >
        REPORT BUG
      </button>

      {reportModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-cyber-black/80 px-4">
          <button
            type="button"
            aria-label="Fermer la fenetre"
            onClick={() => {
              if (submittingReport) return
              setReportModalOpen(false)
            }}
            className="absolute inset-0"
          />
          <div className="relative z-[81] w-full max-w-xl rounded-2xl border border-cyber-orange/30 bg-cyber-dark p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-cyber-orange">Support</div>
                <h2 className="mt-1 text-lg font-bold tracking-widest text-white">REPORT BUG</h2>
                <p className="mt-1 text-xs text-gray-500">Signale un bug, un exploit ou une suggestion sans quitter la page.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (submittingReport) return
                  setReportModalOpen(false)
                }}
                className="text-xs uppercase tracking-widest text-gray-500 transition hover:text-white"
              >
                FERMER
              </button>
            </div>

            <form onSubmit={submitBugReport} className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest text-gray-500">Categorie</label>
                <div className="flex flex-wrap gap-2">
                  {REPORT_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setReportCategory(category)}
                      className={`rounded border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all ${
                        reportCategory === category
                          ? 'border-cyber-orange/50 bg-cyber-orange/10 text-cyber-orange'
                          : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500">Titre</label>
                <input
                  type="text"
                  maxLength={200}
                  required
                  value={reportTitle}
                  onChange={(event) => setReportTitle(event.target.value)}
                  className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-orange/50 focus:outline-none"
                  placeholder="Resume court du probleme"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500">Description</label>
                <textarea
                  maxLength={2000}
                  required
                  rows={6}
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  className="w-full resize-none rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-orange/50 focus:outline-none"
                  placeholder="Etapes, contexte, ecran, comportement attendu, comportement observe..."
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/reports"
                  onClick={() => setReportModalOpen(false)}
                  className="text-[11px] uppercase tracking-widest text-gray-500 transition hover:text-cyber-orange"
                >
                  Voir mes reports
                </Link>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="rounded border border-cyber-orange/40 bg-cyber-orange/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyber-orange transition-all hover:bg-cyber-orange/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingReport ? 'ENVOI...' : 'ENVOYER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dailyRewardModalOpen && dailyReward && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-cyber-black/80 px-4">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setDailyRewardModalOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative z-[81] w-full max-w-lg rounded-2xl border border-cyber-yellow/30 bg-cyber-dark p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-cyber-yellow">
                  Recompense Journaliere
                </div>
                <h2 className="mt-1 text-lg font-bold tracking-widest text-white">
                  JOUR {dailyReward.nextClaimStreak}
                </h2>
                <div className="mt-1 text-xs text-gray-500">
                  Streak actuel: {dailyReward.currentStreak} | Meilleur: {dailyReward.highestStreak}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDailyRewardModalOpen(false)}
                className="text-xs uppercase tracking-widest text-gray-500 transition hover:text-white"
              >
                FERMER
              </button>
            </div>

            <div className="mb-4 grid grid-cols-7 gap-2">
              {(dailyReward.days || []).map(
                (day: {
                  dayNumber: number
                  rewards: { rewardType: string; rewardValue: number; rewardItemName: string | null }[]
                }) => {
                  const isClaimed =
                    dailyReward.claimedToday
                      ? day.dayNumber <= dailyReward.currentStreak
                      : day.dayNumber < dailyReward.nextClaimStreak
                  const isCurrent = day.dayNumber === dailyReward.nextClaimStreak
                  const isFuture = !isClaimed && !isCurrent

                  return (
                    <div
                      key={day.dayNumber}
                      className={`flex flex-col items-center rounded-lg border p-2 text-center transition-all ${
                        isCurrent
                          ? 'border-cyber-yellow/50 bg-cyber-yellow/10 shadow-lg shadow-cyber-yellow/10'
                          : isClaimed
                            ? 'border-cyber-green/30 bg-cyber-green/5'
                            : 'border-gray-800 bg-cyber-black/40'
                      }`}
                    >
                      <div
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          isCurrent
                            ? 'text-cyber-yellow'
                            : isClaimed
                              ? 'text-cyber-green'
                              : 'text-gray-600'
                        }`}
                      >
                        J{day.dayNumber}
                      </div>
                      <div className="my-1 text-base">
                        {isClaimed ? '✅' : '🎁'}
                      </div>
                      <div
                        className={`text-[9px] ${
                          isFuture ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {day.rewards.map((r, i) => (
                          <div key={i}>{rewardLabel(r.rewardType, r.rewardValue, r.rewardItemName)}</div>
                        ))}
                        {day.rewards.length === 0 && <span>-</span>}
                      </div>
                    </div>
                  )
                }
              )}
            </div>

            {dailyReward.canClaimToday && dailyReward.nextRewards?.length > 0 ? (
              <div className="text-center">
                <div className="mb-3 text-sm text-gray-400">
                  Recompenses du jour:{' '}
                  <span className="font-bold text-cyber-yellow">
                    {dailyReward.nextRewards.map((r: any, i: number) => (
                      <span key={i}>
                        {i > 0 && ' + '}
                        {REWARD_ICONS[r.rewardType] || '🎁'}{' '}
                        {rewardLabel(r.rewardType, r.rewardValue, r.rewardItemName)}
                      </span>
                    ))}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={claimingReward}
                  onClick={() => {
                    setClaimingReward(true)
                    router.post(
                      '/missions/daily-reward/claim',
                      {},
                      {
                        preserveScroll: true,
                        onFinish: () => {
                          setClaimingReward(false)
                          setDailyRewardModalOpen(false)
                        },
                      }
                    )
                  }}
                  className="rounded border border-cyber-yellow/40 bg-cyber-yellow/10 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.24em] text-cyber-yellow transition-all hover:bg-cyber-yellow/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {claimingReward ? 'RECUPERATION...' : '[ RECUPERER LA RECOMPENSE ]'}
                </button>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">
                Recompense deja recuperee aujourd&apos;hui. Reviens demain !
              </div>
            )}
          </div>
        </div>
      )}

      <NotificationCenter />
      <FloatingChat />
    </div>
  )
}
