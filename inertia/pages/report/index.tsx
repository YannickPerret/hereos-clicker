import { router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import GameLayout from '~/components/layout'

interface Report {
  id: number
  title: string
  description: string
  category: string
  status: string
  adminNote: string | null
  createdAt: string
}

interface Props {
  reports: Report[]
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow/30',
  in_progress: 'text-cyber-blue bg-cyber-blue/10 border-cyber-blue/30',
  resolved: 'text-cyber-green bg-cyber-green/10 border-cyber-green/30',
  closed: 'text-gray-500 bg-gray-800 border-gray-700',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'OUVERT',
  in_progress: 'EN COURS',
  resolved: 'RESOLU',
  closed: 'FERME',
}

export default function MyReports({ reports }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('bug')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (params.get('compose') !== '1') return

    const nextCategory = params.get('category') || 'bug'
    const nextTitle = params.get('title') || ''
    const nextDescription = params.get('description') || ''

    setCategory(nextCategory)
    setTitle(nextTitle)
    setDescription(nextDescription)
    setShowForm(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.post('/report', { title, description, category }, {
      onSuccess: () => {
        setTitle('')
        setDescription('')
        setCategory('bug')
        setShowForm(false)
      },
    })
  }

  return (
    <GameLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-cyber-orange tracking-widest">REPORTS</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs px-3 py-1.5 rounded border border-cyber-orange/30 text-cyber-orange hover:bg-cyber-orange/10 transition-all"
          >
            {showForm ? 'ANNULER' : '+ NOUVEAU REPORT'}
          </button>
        </div>

        {/* New report form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-cyber-dark border border-cyber-orange/30 rounded-lg p-4 mb-6 space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">Categorie</label>
              <div className="flex gap-2">
                {['bug', 'exploit', 'player', 'suggestion', 'other'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-[10px] px-2 py-1 rounded border transition-all ${
                      category === cat
                        ? 'border-cyber-orange/50 text-cyber-orange bg-cyber-orange/10'
                        : 'border-gray-800 text-gray-600 hover:border-gray-600'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-orange/50 focus:outline-none"
                placeholder="Resume du probleme..."
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                required
                rows={4}
                className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-orange/50 focus:outline-none resize-none"
                placeholder="Decris le bug en detail..."
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-cyber-orange/20 border border-cyber-orange text-cyber-orange text-xs font-bold uppercase tracking-widest rounded hover:bg-cyber-orange/30 transition-all"
            >
              ENVOYER LE REPORT
            </button>
          </form>
        )}

        {/* Reports list */}
        <div className="space-y-2">
          {reports.length === 0 ? (
            <div className="text-center text-gray-700 text-xs py-8">
              Aucun report. Le systeme fonctionne... pour l'instant.
            </div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="bg-cyber-dark border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-[10px] text-gray-600 uppercase mr-2">[{r.category}]</span>
                    <span className="text-sm font-bold text-white">{r.title}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{r.description}</p>
                {r.adminNote && (
                  <div className="bg-cyber-black/50 border border-cyber-blue/20 rounded p-2 mt-2">
                    <div className="text-[10px] text-cyber-blue uppercase mb-1">Reponse admin</div>
                    <p className="text-xs text-gray-400">{r.adminNote}</p>
                  </div>
                )}
                <div className="text-[10px] text-gray-700 mt-2">
                  {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </GameLayout>
  )
}
