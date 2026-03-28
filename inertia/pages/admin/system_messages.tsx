import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface SystemMsg {
  id: number
  message: string
  intervalMinutes: number
  isActive: boolean
  channel: string
}

interface BlockedTerm {
  id: number
  term: string
  language: 'all' | 'fr' | 'en'
  isActive: boolean
}

interface Props {
  messages: SystemMsg[]
  blockedTerms: BlockedTerm[]
}

export default function SystemMessages({ messages, blockedTerms }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [newMessage, setNewMessage] = useState('')
  const [newInterval, setNewInterval] = useState(10)
  const [newChannel, setNewChannel] = useState('global')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editMessage, setEditMessage] = useState('')
  const [editInterval, setEditInterval] = useState(10)
  const [editChannel, setEditChannel] = useState('global')
  const [newTerm, setNewTerm] = useState('')
  const [newTermLanguage, setNewTermLanguage] = useState<'all' | 'fr' | 'en'>('all')
  const [editingTermId, setEditingTermId] = useState<number | null>(null)
  const [editTerm, setEditTerm] = useState('')
  const [editTermLanguage, setEditTermLanguage] = useState<'all' | 'fr' | 'en'>('all')

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    router.post('/admin/system-messages/create', {
      message: newMessage,
      intervalMinutes: newInterval,
      channel: newChannel,
    })
    setNewMessage('')
    setNewInterval(10)
    setNewChannel('global')
  }

  const startEdit = (msg: SystemMsg) => {
    setEditingId(msg.id)
    setEditMessage(msg.message)
    setEditInterval(msg.intervalMinutes)
    setEditChannel(msg.channel)
  }

  const handleUpdate = (id: number) => {
    router.post(`/admin/system-messages/${id}/update`, {
      message: editMessage,
      intervalMinutes: editInterval,
      channel: editChannel,
      isActive: messages.find((m) => m.id === id)?.isActive ? 'true' : 'false',
    })
    setEditingId(null)
  }

  const handleCreateBlockedTerm = (e: React.FormEvent) => {
    e.preventDefault()
    router.post('/admin/chat-blocked-terms/create', {
      term: newTerm,
      language: newTermLanguage,
    })
    setNewTerm('')
    setNewTermLanguage('all')
  }

  const startEditBlockedTerm = (term: BlockedTerm) => {
    setEditingTermId(term.id)
    setEditTerm(term.term)
    setEditTermLanguage(term.language)
  }

  const handleUpdateBlockedTerm = (term: BlockedTerm) => {
    router.post(`/admin/chat-blocked-terms/${term.id}/update`, {
      term: editTerm,
      language: editTermLanguage,
      isActive: term.isActive ? 'true' : 'false',
    })
    setEditingTermId(null)
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-cyber-red tracking-widest">MESSAGES SYSTEME</h1>
          <a href="/admin" className="text-[10px] text-gray-500 hover:text-cyber-red uppercase">
            &larr; RETOUR ADMIN
          </a>
        </div>

        {props.errors?.message && (
          <div className="mb-4 bg-cyber-red/10 border border-cyber-red/50 rounded-lg px-4 py-3 text-cyber-red text-sm">
            {props.errors.message}
          </div>
        )}
        {props.success && (
          <div className="mb-4 bg-cyber-green/10 border border-cyber-green/50 rounded-lg px-4 py-3 text-cyber-green text-sm">
            {props.success as string}
          </div>
        )}

        {/* Create form */}
        <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg p-4 mb-6">
          <h2 className="text-sm uppercase tracking-widest text-cyber-green mb-3">
            NOUVEAU MESSAGE AUTO
          </h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">Message</label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={500}
                placeholder="Message qui sera envoye automatiquement..."
                className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-green/50 focus:outline-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 uppercase block mb-1">
                  Intervalle (minutes)
                </label>
                <input
                  type="number"
                  value={newInterval}
                  onChange={(e) => setNewInterval(Number(e.target.value))}
                  min={1}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-green/50 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 uppercase block mb-1">
                  Salon
                </label>
                <input
                  type="text"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  placeholder="global"
                  className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-green/50 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="text-xs px-4 py-2 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 transition-all uppercase"
            >
              Creer
            </button>
          </form>
        </div>

        {/* List */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-8 text-center text-gray-600 text-sm">
              Aucun message systeme configure
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-cyber-dark border rounded-lg p-4 ${
                  msg.isActive ? 'border-cyber-green/30' : 'border-gray-800 opacity-60'
                }`}
              >
                {editingId === msg.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      maxLength={500}
                      className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-green/50 focus:outline-none"
                    />
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={editInterval}
                        onChange={(e) => setEditInterval(Number(e.target.value))}
                        min={1}
                        className="w-32 bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editChannel}
                        onChange={(e) => setEditChannel(e.target.value)}
                        className="w-32 bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(msg.id)}
                        className="text-[10px] px-3 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-[10px] px-3 py-1 text-gray-600 hover:text-white uppercase"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                            msg.isActive
                              ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30'
                              : 'bg-gray-800 text-gray-600 border border-gray-700'
                          }`}
                        >
                          {msg.isActive ? 'ACTIF' : 'INACTIF'}
                        </span>
                        <span className="text-[9px] text-gray-600">
                          #{msg.channel} — toutes les {msg.intervalMinutes} min
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 font-mono">
                        <span className="text-cyber-yellow font-bold">[SYSTEM]</span> {msg.message}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(msg)}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 uppercase"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => router.post(`/admin/system-messages/${msg.id}/toggle`)}
                        className={`text-[10px] px-2 py-1 rounded border uppercase ${
                          msg.isActive
                            ? 'border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10'
                            : 'border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10'
                        }`}
                      >
                        {msg.isActive ? 'Desactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Supprimer ce message systeme ?')) {
                            router.post(`/admin/system-messages/${msg.id}/delete`)
                          }
                        }}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 uppercase"
                      >
                        Suppr
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-cyber-yellow tracking-widest">
              MOTS BLOQUES DU CHAT
            </h2>
            <div className="text-[10px] uppercase text-gray-600">
              S ajoute a la liste codee en dur FR/EN
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-cyber-yellow/30 bg-cyber-dark p-4">
            <form onSubmit={handleCreateBlockedTerm} className="flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="mot ou expression a bloquer"
                className="flex-1 rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-yellow/50 focus:outline-none"
                required
              />
              <select
                value={newTermLanguage}
                onChange={(e) => setNewTermLanguage(e.target.value as 'all' | 'fr' | 'en')}
                className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-yellow/50 focus:outline-none"
              >
                <option value="all">ALL</option>
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
              <button
                type="submit"
                className="rounded border border-cyber-yellow/30 px-4 py-2 text-xs uppercase text-cyber-yellow transition-all hover:bg-cyber-yellow/10"
              >
                Ajouter
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {blockedTerms.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-cyber-dark p-6 text-sm text-gray-600">
                Aucun mot bloque personnalise.
              </div>
            ) : (
              blockedTerms.map((term) => (
                <div
                  key={term.id}
                  className={`rounded-lg border p-4 ${
                    term.isActive ? 'border-cyber-yellow/30 bg-cyber-dark' : 'border-gray-800 bg-cyber-dark/70 opacity-60'
                  }`}
                >
                  {editingTermId === term.id ? (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <input
                        type="text"
                        value={editTerm}
                        onChange={(e) => setEditTerm(e.target.value)}
                        className="flex-1 rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <select
                        value={editTermLanguage}
                        onChange={(e) => setEditTermLanguage(e.target.value as 'all' | 'fr' | 'en')}
                        className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="all">ALL</option>
                        <option value="fr">FR</option>
                        <option value="en">EN</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateBlockedTerm(term)}
                          className="rounded border border-cyber-green/30 px-3 py-2 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
                        >
                          Sauver
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTermId(null)}
                          className="px-3 py-2 text-[10px] uppercase text-gray-500 hover:text-white"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              term.isActive
                                ? 'border-cyber-yellow/30 bg-cyber-yellow/10 text-cyber-yellow'
                                : 'border-gray-700 bg-gray-800 text-gray-500'
                            }`}
                          >
                            {term.isActive ? 'ACTIF' : 'INACTIF'}
                          </span>
                          <span className="text-[10px] uppercase text-gray-500">{term.language}</span>
                        </div>
                        <div className="font-mono text-sm text-gray-300">{term.term}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEditBlockedTerm(term)}
                          className="rounded border border-cyber-blue/30 px-2 py-1 text-[10px] uppercase text-cyber-blue hover:bg-cyber-blue/10"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => router.post(`/admin/chat-blocked-terms/${term.id}/toggle`)}
                          className={`rounded border px-2 py-1 text-[10px] uppercase ${
                            term.isActive
                              ? 'border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10'
                              : 'border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10'
                          }`}
                        >
                          {term.isActive ? 'Desactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Supprimer ce mot bloque ?')) {
                              router.post(`/admin/chat-blocked-terms/${term.id}/delete`)
                            }
                          }}
                          className="rounded border border-cyber-red/30 px-2 py-1 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
                        >
                          Suppr
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
