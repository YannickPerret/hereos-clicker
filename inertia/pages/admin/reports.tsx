import { router } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface Report {
  id: number
  username: string
  characterName: string
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

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'text-cyber-red',
  exploit: 'text-cyber-orange',
  suggestion: 'text-cyber-blue',
  other: 'text-gray-400',
}

export default function AdminReports({ reports }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.status === filter)

  const startEdit = (report: Report) => {
    setEditingId(report.id)
    setEditNote(report.adminNote || '')
    setEditStatus(report.status)
  }

  const saveEdit = (id: number) => {
    router.post(`/admin/reports/${id}/update`, {
      status: editStatus,
      adminNote: editNote,
    })
    setEditingId(null)
  }

  const counts = {
    open: reports.filter((r) => r.status === 'open').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  }

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-gray-600 hover:text-cyber-blue transition-colors">
              &larr; DASHBOARD
            </Link>
            <h1 className="text-2xl font-bold text-cyber-orange tracking-widest">BUG REPORTS</h1>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-cyber-yellow">{counts.open} ouverts</span>
            <span className="text-gray-700">|</span>
            <span className="text-cyber-blue">{counts.in_progress} en cours</span>
            <span className="text-gray-700">|</span>
            <span className="text-cyber-green">{counts.resolved} resolus</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-1 rounded border transition-all ${
                filter === f
                  ? 'border-cyber-orange/50 text-cyber-orange bg-cyber-orange/10'
                  : 'border-gray-800 text-gray-600 hover:border-gray-600'
              }`}
            >
              {f === 'all' ? 'TOUS' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="bg-cyber-dark border border-gray-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-[10px] uppercase mr-2 ${CATEGORY_COLORS[r.category]}`}>
                    [{r.category}]
                  </span>
                  <span className="text-sm font-bold text-white">{r.title}</span>
                  <div className="text-[10px] text-gray-700 mt-0.5">
                    par {r.username} ({r.characterName}) — {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${STATUS_COLORS[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-3">{r.description}</p>

              {editingId === r.id ? (
                <div className="space-y-2 bg-cyber-black/50 rounded p-3">
                  <div className="flex gap-2">
                    {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditStatus(s)}
                        className={`text-[10px] px-2 py-1 rounded border transition-all ${
                          editStatus === s ? STATUS_COLORS[s] : 'border-gray-800 text-gray-600'
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    rows={2}
                    placeholder="Note admin..."
                    className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-xs text-white focus:border-cyber-orange/50 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(r.id)}
                      className="text-[10px] px-3 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10"
                    >
                      SAUVEGARDER
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-[10px] px-3 py-1 rounded border border-gray-800 text-gray-600 hover:text-gray-400"
                    >
                      ANNULER
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  {r.adminNote && (
                    <div className="text-[10px] text-cyber-blue">
                      Note: {r.adminNote}
                    </div>
                  )}
                  <button
                    onClick={() => startEdit(r)}
                    className="text-[10px] text-gray-600 hover:text-cyber-orange transition-colors ml-auto"
                  >
                    EDITER
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </GameLayout>
  )
}
