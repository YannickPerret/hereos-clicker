import { Link, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import FloatingChat from '~/components/floating_chat'
import NotificationCenter from '~/components/notification_center'

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-cyber-red',
  moderator: 'text-cyber-orange',
  user: 'text-cyber-green',
}

export default function GameLayout({ children }: { children: ReactNode }) {
  const { auth, blackMarket } = usePage().props as any
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isStaff = auth?.user?.role === 'admin' || auth?.user?.role === 'moderator'
  const roleColor = ROLE_COLORS[auth?.user?.role] || ROLE_COLORS.user
  const roleLabel = auth?.user?.roleLabel || 'RUNNER'
  const blackMarketMinLevel = Number(blackMarket?.minLevel || 12)
  const hasBlackMarketAccess = Number(auth?.activeCharacterLevel || 0) >= blackMarketMinLevel
  const navLinks = [
    { href: '/play', label: 'CLICKER' },
    { href: '/inventory', label: 'INVENTAIRE' },
    { href: '/shop', label: 'SHOP' },
    ...(hasBlackMarketAccess ? [{ href: '/black-market', label: 'MARCHE NOIR' }] : []),
    { href: '/talents', label: 'TALENTS' },
    { href: '/companions', label: 'DRONES' },
    { href: '/party', label: 'GROUPE' },
    { href: '/dungeon', label: 'DONJON' },
    { href: '/pvp', label: 'PVP' },
    { href: '/missions', label: 'MISSIONS' },
    { href: '/leaderboard', label: 'CLASSEMENT' },
  ]

  return (
    <div className="min-h-screen bg-cyber-black">
      <nav className="border-b border-cyber-blue/30 bg-cyber-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
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

            <Link href="/play" className="text-xl font-bold text-cyber-blue neon-text tracking-widest">
              HEREOS
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-xs uppercase tracking-wider text-gray-400 hover:text-cyber-blue hover:bg-cyber-blue/10 rounded transition-all border border-transparent hover:border-cyber-blue/30"
              >
                {link.label}
              </Link>
            ))}
            {isStaff && (
              <Link
                href="/admin"
                className="px-3 py-1.5 text-xs uppercase tracking-wider text-cyber-red hover:text-cyber-red hover:bg-cyber-red/10 rounded transition-all border border-transparent hover:border-cyber-red/30"
              >
                ADMIN
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {auth?.user && (
              <>
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-cyber-green block">{auth.user.username}</span>
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

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-cyber-blue/20 bg-cyber-dark/95 px-4 py-3">
            <div className="flex flex-col items-start gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded border border-cyber-blue/20 px-3 py-2 text-left text-xs uppercase tracking-wider text-gray-300 hover:border-cyber-blue/40 hover:bg-cyber-blue/10 hover:text-cyber-blue transition-all"
                >
                  {link.label}
                </Link>
              ))}
              {isStaff && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded border border-cyber-red/20 px-3 py-2 text-left text-xs uppercase tracking-wider text-cyber-red hover:border-cyber-red/40 hover:bg-cyber-red/10 transition-all"
                >
                  ADMIN
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      <NotificationCenter />
      <FloatingChat />
    </div>
  )
}
