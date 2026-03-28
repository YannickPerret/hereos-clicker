import { Link, router, usePage } from '@inertiajs/react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FloatingChat from '~/components/floating_chat'
import NotificationCenter from '~/components/notification_center'
import LanguageSwitcher from '~/components/language_switcher'
import { translateBackendMessage } from '~/i18n/backend_messages'

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

const ACTIVITY_LOCKED_NAVS = new Set([
  '/inventory',
  '/companions',
  '/shop',
  '/black-market',
  '/pvp',
])

function rewardLabel(
  rewardType: string,
  rewardValue: number,
  rewardItemName: string | null = null
) {
  if (rewardType === 'item') return `${rewardValue}x ${rewardItemName || 'item'}`
  return `+${rewardValue.toLocaleString()} ${rewardType}`
}

export default function GameLayout({ children }: { children: ReactNode }) {
  const page = usePage() as any
  const { auth, blackMarket, success, errors, dailyReward } = page.props as any
  const { t } = useTranslation(['common', 'report', 'daily_reward', 'auth'])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState<null | { type: 'success' | 'error'; message: string }>(null)
  const [partyCountdown, setPartyCountdown] = useState<number | null>(null)
  const [decliningPartyCountdown, setDecliningPartyCountdown] = useState(false)
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
  const isGuest = Boolean(auth?.user?.isGuest)
  const activeActivity = auth?.activeActivity || null
  const blackMarketMinLevel = Number(blackMarket?.minLevel || 12)
  const hasBlackMarketAccess = Number(auth?.activeCharacterLevel || 0) >= blackMarketMinLevel
  const companionMinLevel = 10
  const hasCompanionAccess = Number(auth?.activeCharacterLevel || 0) >= companionMinLevel
  const activeCharacterName = auth?.activeCharacterName || null
  const activePartyId = auth?.activePartyId || null
  const hadExternalPartyCountdown = useRef(false)
  const currentPath = typeof page.url === 'string' ? page.url.split('?')[0] : ''
  const isPartyPage = currentPath.startsWith('/party')
  const isDungeonRunPage = currentPath.startsWith('/dungeon/run/')
  const isIsoDungeonRunPage = currentPath.startsWith('/iso-dungeon/run/')
  const isPvpMatchPage = currentPath.startsWith('/pvp/match/')
  const isOnActiveActivity = Boolean(
    activeActivity?.returnPath && currentPath === activeActivity.returnPath
  )
  const publicProfileHref = activeCharacterName
    ? `/profile/${encodeURIComponent(activeCharacterName)}`
    : '/play'
  const navLinks = [
    { href: '/play', label: t('nav.home') },
    { href: '/inventory', label: t('nav.inventory') },
    ...(hasCompanionAccess ? [{ href: '/companions', label: t('nav.drones') }] : []),
    { href: '/talents', label: t('nav.talents') },
    { href: '/shop', label: t('nav.shop') },
    ...(hasBlackMarketAccess ? [{ href: '/black-market', label: t('nav.blackMarket') }] : []),
    { href: '/party', label: t('nav.party') },
    { href: '/dungeon', label: t('nav.dungeon') },
    { href: '/iso-dungeon', label: t('nav.dungeon25d') },
    { href: '/pvp', label: t('nav.pvp') },
    { href: '/forum', label: t('nav.forum') },
    { href: '/quests', label: t('nav.quests') },
    { href: '/missions', label: t('nav.missions') },
    { href: '/friends', label: t('nav.friends') },
    { href: '/leaderboard', label: t('nav.leaderboard') },
  ]

  useEffect(() => {
    if (dailyReward?.canClaimToday) {
      setDailyRewardModalOpen(true)
    }
  }, [])

  useEffect(() => {
    if (success) {
      setToast({ type: 'success', message: translateBackendMessage(success, t) })
      return
    }

    if (errors?.message) {
      setToast({ type: 'error', message: translateBackendMessage(errors.message, t) })
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

  useEffect(() => {
    if (!activePartyId || isPartyPage || isDungeonRunPage || isIsoDungeonRunPage) {
      setPartyCountdown(null)
      return
    }

    let active = true
    const pollPartyState = async () => {
      if (!active) return

      try {
        const res = await fetch(`/party/state/${activePartyId}`)
        if (!res.ok) return

        const data = await res.json()
        if (!active) return

        if (data.dungeonRunId) {
          setPartyCountdown(null)
          hadExternalPartyCountdown.current = false
          if (!isDungeonRunPage || currentPath !== `/dungeon/run/${data.dungeonRunId}`) {
            active = false
            router.visit(`/dungeon/run/${data.dungeonRunId}`)
          }
          return
        }

        if (data.countdown !== null && data.countdown !== undefined) {
          setPartyCountdown(data.countdown)
          hadExternalPartyCountdown.current = true
        } else {
          setPartyCountdown(null)
        }

        if (!data.party) {
          setPartyCountdown(null)
          hadExternalPartyCountdown.current = false
        } else if (hadExternalPartyCountdown.current && data.party.status === 'waiting') {
          hadExternalPartyCountdown.current = false
          active = false
          router.visit('/party')
          return
        }
      } catch {
        // Ignore transient poll failures
      }
    }

    pollPartyState()
    const interval = window.setInterval(pollPartyState, partyCountdown !== null ? 1000 : 2000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [
    activePartyId,
    currentPath,
    isDungeonRunPage,
    isIsoDungeonRunPage,
    isPartyPage,
    partyCountdown,
  ])

  const declinePartyCountdown = () => {
    setDecliningPartyCountdown(true)
    router.post(
      '/party/decline-countdown',
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onFinish: () => setDecliningPartyCountdown(false),
      }
    )
  }

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

  const handleLockedNavigation = (event: React.MouseEvent, href: string) => {
    if (!activeActivity) return

    const isProtectedTarget = href !== activeActivity.returnPath && href !== '/logout'
    if (!isProtectedTarget) return

    event.preventDefault()

    const message =
      activeActivity.type === 'pvp'
        ? t('activityBanner.pvpMessage')
        : t('activityBanner.dungeonMessage')

    if (!isOnActiveActivity) {
      router.visit(activeActivity.returnPath)
      return
    }

    setToast({ type: 'error', message })
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
                {toast.type === 'success' ? t('toast.success') : t('toast.error')}
              </div>
              <div className="flex-1 text-sm text-white">{toast.message}</div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs text-gray-500 transition hover:text-white"
              >
                {t('toast.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {partyCountdown !== null && partyCountdown > 0 && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="mb-4 text-xs uppercase tracking-widest text-cyber-red animate-pulse">
              {t('partyLaunch.title')}
            </div>
            <div
              className="mb-6 text-8xl font-bold text-cyber-yellow neon-text"
              style={{ animation: 'pulse 1s ease-in-out infinite' }}
            >
              {partyCountdown}
            </div>
            <div className="text-sm text-gray-400">{t('partyLaunch.message')}</div>
            <button
              type="button"
              disabled={decliningPartyCountdown}
              onClick={declinePartyCountdown}
              className="mt-6 rounded border border-cyber-red/40 bg-cyber-red/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyber-red transition-all hover:bg-cyber-red/20 disabled:opacity-50"
            >
              {decliningPartyCountdown ? t('partyLaunch.declining') : t('partyLaunch.decline')}
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-cyber-blue/30 bg-cyber-dark/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={mobileMenuOpen ? t('aria.closeMenu') : t('aria.openMenu')}
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

            <Link
              href="/play"
              onClick={(event) => handleLockedNavigation(event, '/play')}
              className="flex items-center"
            >
              <img
                src="/images/hereos_logo.webp"
                alt="HEREOS"
                className="h-20 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <LanguageSwitcher />
            {auth?.user && (
              <>
                <div className="text-right hidden sm:block">
                  <Link
                    href={publicProfileHref}
                    onClick={(event) => handleLockedNavigation(event, publicProfileHref)}
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
                  {t('logout')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r border-cyber-blue/20 bg-cyber-dark/40 px-4 py-5 md:block">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) =>
              (() => {
                const isLockedByActivity = Boolean(
                  activeActivity && ACTIVITY_LOCKED_NAVS.has(link.href)
                )

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(event) => handleLockedNavigation(event, link.href)}
                    className={`rounded border px-3 py-2.5 text-xs uppercase tracking-[0.22em] transition-all ${
                      isLockedByActivity
                        ? 'border-cyber-blue/10 text-gray-500 hover:border-cyber-blue/20 hover:bg-cyber-blue/5 hover:text-gray-300'
                        : 'border-cyber-blue/15 text-gray-300 hover:border-cyber-blue/35 hover:bg-cyber-blue/10 hover:text-cyber-blue'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })()
            )}
            {isStaff && (
              <Link
                href="/admin"
                onClick={(event) => handleLockedNavigation(event, '/admin')}
                className="rounded border border-cyber-red/20 px-3 py-2.5 text-xs uppercase tracking-[0.22em] text-cyber-red transition-all hover:border-cyber-red/40 hover:bg-cyber-red/10"
              >
                {t('nav.admin')}
              </Link>
            )}
            <Link
              href="/reports"
              onClick={(event) => handleLockedNavigation(event, '/reports')}
              className="rounded border border-cyber-orange/20 px-3 py-2.5 text-xs uppercase tracking-[0.22em] text-cyber-orange transition-all hover:border-cyber-orange/40 hover:bg-cyber-orange/10"
            >
              {t('nav.myReports')}
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-[calc(96rem-18rem)]">
            {activeActivity &&
              !isOnActiveActivity &&
              !isDungeonRunPage &&
              !isIsoDungeonRunPage &&
              !isPvpMatchPage && (
                <div className="mb-6 rounded-xl border border-cyber-blue/35 bg-cyber-blue/10 px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-blue">
                        {t('activityBanner.title')}
                      </div>
                      <div className="mt-1 text-sm text-gray-300">
                        {activeActivity.type === 'pvp'
                          ? t('activityBanner.pvpMessage')
                          : t('activityBanner.dungeonMessage')}
                      </div>
                    </div>
                    <Link
                      href={activeActivity.returnPath}
                      className="rounded border border-cyber-blue/40 bg-cyber-blue/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyber-blue transition-all hover:bg-cyber-blue/20"
                    >
                      {activeActivity.type === 'pvp'
                        ? t('activityBanner.returnPvp')
                        : t('activityBanner.returnDungeon')}
                    </Link>
                  </div>
                </div>
              )}
            {isGuest && (
              <div className="mb-6 rounded-xl border border-cyber-yellow/35 bg-cyber-yellow/10 px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-yellow">
                      {t('auth:guestBanner.title')}
                    </div>
                    <div className="mt-1 text-sm text-gray-300">
                      {t('auth:guestBanner.description')}
                    </div>
                  </div>
                  <Link
                    href="/account/upgrade"
                    className="rounded border border-cyber-yellow/40 bg-cyber-yellow/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyber-yellow transition-all hover:bg-cyber-yellow/20"
                  >
                    {t('auth:guestBanner.cta')}
                  </Link>
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label={t('aria.closeMenu')}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-[55] bg-cyber-black/70 md:hidden"
          />
          <aside className="fixed left-0 top-14 z-[60] h-[calc(100vh-3.5rem)] w-72 border-r border-cyber-blue/20 bg-cyber-dark/95 px-4 py-5 shadow-2xl md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    handleLockedNavigation(event, link.href)
                    if (!event.defaultPrevented) {
                      setMobileMenuOpen(false)
                    }
                  }}
                  className="rounded border border-cyber-blue/20 px-3 py-2.5 text-left text-xs uppercase tracking-[0.22em] text-gray-300 transition-all hover:border-cyber-blue/40 hover:bg-cyber-blue/10 hover:text-cyber-blue"
                >
                  {link.label}
                </Link>
              ))}
              {isStaff && (
                <Link
                  href="/admin"
                  onClick={(event) => {
                    handleLockedNavigation(event, '/admin')
                    if (!event.defaultPrevented) {
                      setMobileMenuOpen(false)
                    }
                  }}
                  className="rounded border border-cyber-red/20 px-3 py-2.5 text-left text-xs uppercase tracking-[0.22em] text-cyber-red transition-all hover:border-cyber-red/40 hover:bg-cyber-red/10"
                >
                  {t('nav.admin')}
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
                {t('reportBug')}
              </button>
              <Link
                href="/reports"
                onClick={(event) => {
                  handleLockedNavigation(event, '/reports')
                  if (!event.defaultPrevented) {
                    setMobileMenuOpen(false)
                  }
                }}
                className="rounded border border-cyber-orange/20 px-3 py-2.5 text-left text-xs uppercase tracking-[0.22em] text-cyber-orange transition-all hover:border-cyber-orange/40 hover:bg-cyber-orange/10"
              >
                {t('nav.myReports')}
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
        {t('reportBug')}
      </button>

      {reportModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-cyber-black/80 px-4">
          <button
            type="button"
            aria-label={t('aria.closeWindow')}
            onClick={() => {
              if (submittingReport) return
              setReportModalOpen(false)
            }}
            className="absolute inset-0"
          />
          <div className="relative z-[81] w-full max-w-xl rounded-2xl border border-cyber-orange/30 bg-cyber-dark p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-cyber-orange">
                  {t('report:support')}
                </div>
                <h2 className="mt-1 text-lg font-bold tracking-widest text-white">
                  {t('report:title')}
                </h2>
                <p className="mt-1 text-xs text-gray-500">{t('report:description')}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (submittingReport) return
                  setReportModalOpen(false)
                }}
                className="text-xs uppercase tracking-widest text-gray-500 transition hover:text-white"
              >
                {t('buttons.close')}
              </button>
            </div>

            <form onSubmit={submitBugReport} className="space-y-4">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-widest text-gray-500">
                  {t('report:category')}
                </label>
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
                      {t(`report:categories.${category}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500">
                  {t('report:titleLabel')}
                </label>
                <input
                  type="text"
                  maxLength={200}
                  required
                  value={reportTitle}
                  onChange={(event) => setReportTitle(event.target.value)}
                  className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-orange/50 focus:outline-none"
                  placeholder={t('report:titlePlaceholder')}
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500">
                  {t('report:descriptionLabel')}
                </label>
                <textarea
                  maxLength={2000}
                  required
                  rows={6}
                  value={reportDescription}
                  onChange={(event) => setReportDescription(event.target.value)}
                  className="w-full resize-none rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-orange/50 focus:outline-none"
                  placeholder={t('report:descriptionPlaceholder')}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/reports"
                  onClick={(event) => {
                    handleLockedNavigation(event, '/reports')
                    if (!event.defaultPrevented) {
                      setReportModalOpen(false)
                    }
                  }}
                  className="text-[11px] uppercase tracking-widest text-gray-500 transition hover:text-cyber-orange"
                >
                  {t('report:viewReports')}
                </Link>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="rounded border border-cyber-orange/40 bg-cyber-orange/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyber-orange transition-all hover:bg-cyber-orange/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingReport ? t('report:submitting') : t('report:submit')}
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
            aria-label={t('aria.close')}
            onClick={() => setDailyRewardModalOpen(false)}
            className="absolute inset-0"
          />
          <div className="relative z-[81] w-full max-w-lg rounded-2xl border border-cyber-yellow/30 bg-cyber-dark p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-cyber-yellow">
                  {t('daily_reward:title')}
                </div>
                <h2 className="mt-1 text-lg font-bold tracking-widest text-white">
                  {t('daily_reward:day', { n: dailyReward.nextClaimStreak })}
                </h2>
                <div className="mt-1 text-xs text-gray-500">
                  {t('daily_reward:streak', {
                    current: dailyReward.currentStreak,
                    best: dailyReward.highestStreak,
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDailyRewardModalOpen(false)}
                className="text-xs uppercase tracking-widest text-gray-500 transition hover:text-white"
              >
                {t('buttons.close')}
              </button>
            </div>

            <div className="mb-4 grid grid-cols-7 gap-2">
              {(dailyReward.days || []).map(
                (day: {
                  dayNumber: number
                  rewards: {
                    rewardType: string
                    rewardValue: number
                    rewardItemName: string | null
                  }[]
                }) => {
                  const isClaimed = dailyReward.claimedToday
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
                        {t('daily_reward:dayShort', { n: day.dayNumber })}
                      </div>
                      <div className="my-1 text-base">{isClaimed ? '✅' : '🎁'}</div>
                      <div className={`text-[9px] ${isFuture ? 'text-gray-600' : 'text-gray-400'}`}>
                        {day.rewards.map((r, i) => (
                          <div key={i}>
                            {rewardLabel(r.rewardType, r.rewardValue, r.rewardItemName)}
                          </div>
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
                  {t('daily_reward:todayRewards')}{' '}
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
                  {claimingReward ? t('daily_reward:claiming') : t('daily_reward:claim')}
                </button>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">
                {t('daily_reward:alreadyClaimed')}
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
