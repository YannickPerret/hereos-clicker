import { Link } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface Props {
  currentUser: { id: number; username: string; role: string }
  stats: { totalUsers: number; totalCharacters: number; totalItems: number }
  topCredits: { id: number; name: string; credits: number; level: number }[]
}

export default function AdminDashboard({ currentUser, stats, topCredits }: Props) {
  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-cyber-red tracking-widest">SYSOP TERMINAL</h1>
          <span className="text-[10px] bg-cyber-red/20 text-cyber-red px-2 py-0.5 rounded uppercase">
            {currentUser.role}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-cyber-blue">{stats.totalUsers}</div>
            <div className="text-xs text-gray-600 uppercase mt-1">Utilisateurs</div>
          </div>
          <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-cyber-green">{stats.totalCharacters}</div>
            <div className="text-xs text-gray-600 uppercase mt-1">Personnages</div>
          </div>
          <div className="bg-cyber-dark border border-cyber-pink/30 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-cyber-pink">{stats.totalItems}</div>
            <div className="text-xs text-gray-600 uppercase mt-1">Items en jeu</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin/users"
            className="bg-cyber-dark border border-cyber-red/30 rounded-lg p-6 hover:border-cyber-red/60 hover:bg-cyber-red/5 transition-all"
          >
            <h3 className="text-sm font-bold text-cyber-red tracking-widest mb-1">GESTION USERS</h3>
            <p className="text-xs text-gray-600">Roles, bans, gestion des credits</p>
          </Link>
          <Link
            href="/admin/items"
            className="bg-cyber-dark border border-cyber-pink/30 rounded-lg p-6 hover:border-cyber-pink/60 hover:bg-cyber-pink/5 transition-all"
          >
            <h3 className="text-sm font-bold text-cyber-pink tracking-widest mb-1">ITEMS & SHOP</h3>
            <p className="text-xs text-gray-600">Creer, modifier, prix, ajouter au shop</p>
          </Link>
          <Link
            href="/admin/enemies"
            className="bg-cyber-dark border border-cyber-purple/30 rounded-lg p-6 hover:border-cyber-purple/60 hover:bg-cyber-purple/5 transition-all"
          >
            <h3 className="text-sm font-bold text-cyber-purple tracking-widest mb-1">ENNEMIS & LOOT</h3>
            <p className="text-xs text-gray-600">Stats ennemis, loot tables, drop chances</p>
          </Link>
          <Link
            href="/admin/reports"
            className="bg-cyber-dark border border-cyber-orange/30 rounded-lg p-6 hover:border-cyber-orange/60 hover:bg-cyber-orange/5 transition-all"
          >
            <h3 className="text-sm font-bold text-cyber-orange tracking-widest mb-1">BUG REPORTS</h3>
            <p className="text-xs text-gray-600">Voir et gerer les signalements</p>
          </Link>
          <Link
            href="/admin/system-messages"
            className="bg-cyber-dark border border-cyber-green/30 rounded-lg p-6 hover:border-cyber-green/60 hover:bg-cyber-green/5 transition-all"
          >
            <h3 className="text-sm font-bold text-cyber-green tracking-widest mb-1">MESSAGES SYSTEME</h3>
            <p className="text-xs text-gray-600">Messages automatiques dans le chat</p>
          </Link>
          <Link
            href="/admin/daily-rewards"
            className="bg-cyber-dark border border-cyber-yellow/30 rounded-lg p-6 hover:border-cyber-yellow/60 hover:bg-cyber-yellow/5 transition-all"
          >
            <h3 className="text-sm font-bold text-cyber-yellow tracking-widest mb-1">RECOMPENSES JOURNALIERES</h3>
            <p className="text-xs text-gray-600">Configuration du streak quotidien et des gains</p>
          </Link>
          <Link
            href="/admin/black-market"
            className="bg-cyber-dark border border-cyber-red/30 rounded-lg p-6 hover:border-cyber-red/60 hover:bg-cyber-red/5 transition-all"
          >
            <h3 className="text-sm font-bold text-cyber-red tracking-widest mb-1">MARCHE NOIR</h3>
            <p className="text-xs text-gray-600">Niveau mini, rotation, catalogue fixers, cleaners</p>
          </Link>
        </div>

        {/* Top Credits */}
        <div className="bg-cyber-dark border border-cyber-yellow/20 rounded-lg p-4">
          <h3 className="text-sm uppercase tracking-widest text-cyber-yellow mb-3">Top Credits</h3>
          <div className="space-y-2">
            {topCredits.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-cyber-black/50 rounded">
                <span className="text-gray-400">#{i + 1} <span className="text-white ml-2">{c.name}</span></span>
                <span className="text-cyber-yellow font-bold">{c.credits.toLocaleString()}c (LVL {c.level})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
