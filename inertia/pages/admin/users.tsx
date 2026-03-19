import { router } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface UserChar {
  id: number
  name: string
  credits: number
  level: number
  xp: number
  attack: number
  defense: number
  hpMax: number
  chosenSpec: string | null
}

interface UserEntry {
  id: number
  username: string
  email: string
  role: string
  roleLabel: string
  createdAt: string
  characters: UserChar[]
}

interface Props {
  users: UserEntry[]
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-cyber-red bg-cyber-red/10 border-cyber-red/30',
  moderator: 'text-cyber-orange bg-cyber-orange/10 border-cyber-orange/30',
  user: 'text-gray-400 bg-gray-800 border-gray-700',
}

const ROLE_LABEL_MAP: Record<string, string> = {
  admin: 'SYSOP',
  moderator: 'ENFORCER',
  user: 'RUNNER',
}

export default function AdminUsers({ users }: Props) {
  const [expandedUser, setExpandedUser] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <GameLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-gray-600 hover:text-cyber-blue transition-colors">
              &larr; DASHBOARD
            </Link>
            <h1 className="text-2xl font-bold text-cyber-red tracking-widest">GESTION USERS</h1>
          </div>
          <span className="text-xs text-gray-600">{filtered.length} / {users.length} utilisateurs</span>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full bg-cyber-dark border border-gray-800 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-700 focus:border-cyber-blue/50 focus:outline-none transition-colors"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((user) => (
            <div key={user.id} className="bg-cyber-dark border border-gray-800 rounded-lg overflow-hidden">
              {/* User row */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-cyber-blue/5 transition-all"
                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-cyber-blue/10 border border-cyber-blue/20 flex items-center justify-center text-xs text-cyber-blue font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{user.username}</div>
                    <div className="text-[10px] text-gray-600">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-700">
                    {user.characters.length} perso(s)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${ROLE_COLORS[user.role]}`}>
                    {user.roleLabel}
                  </span>
                  <span className="text-gray-700 text-xs">{expandedUser === user.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded details */}
              {expandedUser === user.id && (
                <div className="border-t border-gray-800 p-4 bg-cyber-black/30 space-y-4">
                  {/* Role change */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Role:</span>
                    {['user', 'moderator', 'admin'].map((role) => (
                      <button
                        key={role}
                        onClick={() => router.post(`/admin/users/${user.id}/role`, { role })}
                        className={`text-[10px] px-2 py-1 rounded border transition-all ${
                          user.role === role
                            ? ROLE_COLORS[role]
                            : 'border-gray-800 text-gray-600 hover:border-gray-600'
                        }`}
                      >
                        {ROLE_LABEL_MAP[role]}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        if (confirm(`Bannir ${user.username} ? Cette action est irreversible.`)) {
                          router.post(`/admin/users/${user.id}/ban`)
                        }
                      }}
                      className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 transition-all ml-auto"
                    >
                      BANNIR
                    </button>
                  </div>

                  {/* Characters */}
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase mb-2">
                      Personnages ({user.characters.length})
                    </div>
                    {user.characters.length === 0 ? (
                      <div className="text-xs text-gray-700 italic">Aucun personnage</div>
                    ) : (
                      <div className="space-y-1">
                        {user.characters.map((char) => (
                          <Link
                            key={char.id}
                            href={`/admin/characters/${char.id}`}
                            className="flex items-center justify-between p-3 bg-cyber-dark rounded border border-gray-800 hover:border-cyber-blue/30 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-white font-bold text-xs group-hover:text-cyber-blue transition-colors">
                                {char.name}
                              </span>
                              <span className="text-[10px] text-gray-600">LVL {char.level}</span>
                              {char.chosenSpec && (
                                <span className="text-[10px] text-cyber-purple bg-cyber-purple/10 px-1.5 py-0.5 rounded">
                                  {char.chosenSpec}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-[10px]">
                              <span className="text-gray-600">ATK {char.attack} / DEF {char.defense}</span>
                              <span className="text-gray-600">HP {char.hpMax}</span>
                              <span className="text-cyber-yellow font-bold">{char.credits.toLocaleString()}c</span>
                              <span className="text-gray-700 group-hover:text-cyber-blue transition-colors">EDITER &rarr;</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </GameLayout>
  )
}
