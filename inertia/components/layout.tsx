import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import FloatingChat from '~/components/floating_chat'

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-cyber-red',
  moderator: 'text-cyber-orange',
  user: 'text-cyber-green',
}

export default function GameLayout({ children }: { children: ReactNode }) {
  const { auth } = usePage().props as any
  const isStaff = auth?.user?.role === 'admin' || auth?.user?.role === 'moderator'
  const roleColor = ROLE_COLORS[auth?.user?.role] || ROLE_COLORS.user
  const roleLabel = auth?.user?.roleLabel || 'RUNNER'

  return (
    <div className="min-h-screen bg-cyber-black">
      <nav className="border-b border-cyber-blue/30 bg-cyber-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/play" className="text-xl font-bold text-cyber-blue neon-text tracking-widest">
            HEREOS
          </Link>

          <div className="flex items-center gap-1">
            {[
              { href: '/play', label: 'CLICKER' },
              { href: '/inventory', label: 'INVENTAIRE' },
              { href: '/shop', label: 'SHOP' },
              { href: '/talents', label: 'TALENTS' },
              { href: '/companions', label: 'DRONES' },
              { href: '/party', label: 'GROUPE' },
              { href: '/dungeon', label: 'DONJON' },
              { href: '/pvp', label: 'PVP' },
              { href: '/missions', label: 'MISSIONS' },
              { href: '/leaderboard', label: 'CLASSEMENT' },
            ].map((link) => (
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

          <div className="flex items-center gap-3">
            {auth?.user && (
              <>
                <div className="text-right">
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
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      <FloatingChat />
    </div>
  )
}
