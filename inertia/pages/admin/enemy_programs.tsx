import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface EnemyProgramEntry {
  id: number
  name: string
  description: string
  nameEn: string | null
  descriptionEn: string | null
  effectType: string
  effectValue: number
  duration: number
  cooldown: number
  chancePercent: number
  windupTurns: number
  icon: string
  isActive: boolean
  sortOrder: number
}

interface Props {
  programs: EnemyProgramEntry[]
}

const EFFECT_OPTIONS = [
  { value: 'paralyze', label: 'Paralysie' },
  { value: 'dot', label: 'DOT' },
  { value: 'attack_lock', label: 'Blocage attaque' },
  { value: 'charge_attack', label: 'Charge + frappe' },
]

function emptyProgram() {
  return {
    name: '',
    description: '',
    nameEn: '',
    descriptionEn: '',
    effectType: 'paralyze',
    effectValue: '0',
    duration: '1',
    cooldown: '2',
    chancePercent: '100',
    windupTurns: '2',
    icon: 'skull',
    isActive: true,
    sortOrder: '1',
  }
}

function programSummary(program: EnemyProgramEntry | ReturnType<typeof emptyProgram>) {
  switch (program.effectType) {
    case 'paralyze':
      return `Paralyse la cible ${program.duration} tour(s)`
    case 'dot':
      return `Inflige ${program.effectValue} degats par tour pendant ${program.duration} tour(s)`
    case 'attack_lock':
      return `Empêche d'attaquer pendant ${program.duration} tour(s)`
    case 'charge_attack':
      return `Charge ${program.windupTurns} tour(s) puis frappe a ${program.effectValue}%`
    default:
      return ''
  }
}

export default function AdminEnemyPrograms({ programs }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [newProgram, setNewProgram] = useState(emptyProgram())
  const [editData, setEditData] = useState<any>({})

  const startEdit = (program: EnemyProgramEntry) => {
    setEditId(program.id)
    setEditData({
      ...program,
      nameEn: program.nameEn || '',
      descriptionEn: program.descriptionEn || '',
    })
  }

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-cyber-yellow tracking-widest">
              PROGRAMMES ENNEMIS
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Cree des effets reutilisables puis attribue-les aux mobs dans la page ennemis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/enemies"
              className="text-[10px] px-3 py-1.5 rounded border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10 uppercase"
            >
              Gestion ennemis
            </a>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="text-[10px] px-3 py-1.5 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
            >
              + Nouveau programme
            </button>
            <a href="/admin" className="text-[10px] text-gray-500 hover:text-cyber-red uppercase">
              &larr; ADMIN
            </a>
          </div>
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

        {showCreate && (
          <div className="mb-6 rounded-lg border border-cyber-green/30 bg-cyber-dark p-4">
            <h2 className="mb-3 text-sm uppercase tracking-widest text-cyber-green">
              CREER UN PROGRAMME
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                router.post('/admin/enemy-programs/create', newProgram)
                setNewProgram(emptyProgram())
                setShowCreate(false)
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Nom</label>
                  <input
                    type="text"
                    value={newProgram.name}
                    onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Nom EN</label>
                  <input
                    type="text"
                    value={newProgram.nameEn}
                    onChange={(e) => setNewProgram({ ...newProgram, nameEn: e.target.value })}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Type</label>
                  <select
                    value={newProgram.effectType}
                    onChange={(e) => setNewProgram({ ...newProgram, effectType: e.target.value })}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {EFFECT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Ordre</label>
                  <input
                    type="number"
                    value={newProgram.sortOrder}
                    onChange={(e) => setNewProgram({ ...newProgram, sortOrder: e.target.value })}
                    min={1}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Valeur</label>
                  <input
                    type="number"
                    value={newProgram.effectValue}
                    onChange={(e) => setNewProgram({ ...newProgram, effectValue: e.target.value })}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Duree</label>
                  <input
                    type="number"
                    value={newProgram.duration}
                    onChange={(e) => setNewProgram({ ...newProgram, duration: e.target.value })}
                    min={0}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Cooldown</label>
                  <input
                    type="number"
                    value={newProgram.cooldown}
                    onChange={(e) => setNewProgram({ ...newProgram, cooldown: e.target.value })}
                    min={0}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Chance %</label>
                  <input
                    type="number"
                    value={newProgram.chancePercent}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, chancePercent: e.target.value })
                    }
                    min={1}
                    max={100}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Tours de charge</label>
                  <input
                    type="number"
                    value={newProgram.windupTurns}
                    onChange={(e) => setNewProgram({ ...newProgram, windupTurns: e.target.value })}
                    min={0}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Icon</label>
                  <input
                    type="text"
                    value={newProgram.icon}
                    onChange={(e) => setNewProgram({ ...newProgram, icon: e.target.value })}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-400 mt-5">
                  <input
                    type="checkbox"
                    checked={newProgram.isActive}
                    onChange={(e) => setNewProgram({ ...newProgram, isActive: e.target.checked })}
                  />
                  Actif
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Description</label>
                  <input
                    type="text"
                    value={newProgram.description}
                    onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-600 uppercase">Description EN</label>
                  <input
                    type="text"
                    value={newProgram.descriptionEn}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, descriptionEn: e.target.value })
                    }
                    className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded border border-cyber-yellow/20 bg-cyber-yellow/5 px-3 py-2 text-xs text-cyber-yellow">
                {programSummary(newProgram)}
              </div>

              <button
                type="submit"
                className="text-xs px-4 py-2 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
              >
                Creer
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {programs.map((program) => (
            <div key={program.id} className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
              {editId === program.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    router.post(`/admin/enemy-programs/${program.id}/update`, editData)
                    setEditId(null)
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Nom</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Nom EN</label>
                      <input
                        type="text"
                        value={editData.nameEn}
                        onChange={(e) => setEditData({ ...editData, nameEn: e.target.value })}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Type</label>
                      <select
                        value={editData.effectType}
                        onChange={(e) => setEditData({ ...editData, effectType: e.target.value })}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        {EFFECT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Ordre</label>
                      <input
                        type="number"
                        value={editData.sortOrder}
                        onChange={(e) => setEditData({ ...editData, sortOrder: e.target.value })}
                        min={1}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Valeur</label>
                      <input
                        type="number"
                        value={editData.effectValue}
                        onChange={(e) => setEditData({ ...editData, effectValue: e.target.value })}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Duree</label>
                      <input
                        type="number"
                        value={editData.duration}
                        onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                        min={0}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Cooldown</label>
                      <input
                        type="number"
                        value={editData.cooldown}
                        onChange={(e) => setEditData({ ...editData, cooldown: e.target.value })}
                        min={0}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Chance %</label>
                      <input
                        type="number"
                        value={editData.chancePercent}
                        onChange={(e) =>
                          setEditData({ ...editData, chancePercent: e.target.value })
                        }
                        min={1}
                        max={100}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Tours de charge</label>
                      <input
                        type="number"
                        value={editData.windupTurns}
                        onChange={(e) => setEditData({ ...editData, windupTurns: e.target.value })}
                        min={0}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Icon</label>
                      <input
                        type="text"
                        value={editData.icon}
                        onChange={(e) => setEditData({ ...editData, icon: e.target.value })}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-400 mt-5">
                      <input
                        type="checkbox"
                        checked={!!editData.isActive}
                        onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                      />
                      Actif
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Description</label>
                      <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Description EN</label>
                      <input
                        type="text"
                        value={editData.descriptionEn}
                        onChange={(e) =>
                          setEditData({ ...editData, descriptionEn: e.target.value })
                        }
                        className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="rounded border border-cyber-yellow/20 bg-cyber-yellow/5 px-3 py-2 text-xs text-cyber-yellow">
                    {programSummary(editData)}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="text-[10px] px-3 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
                    >
                      Sauvegarder
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="text-[10px] px-3 py-1 text-gray-600 uppercase"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-cyber-yellow">{program.name}</h2>
                      <span className="text-[9px] rounded bg-cyber-yellow/10 px-1.5 py-0.5 text-cyber-yellow">
                        {program.effectType}
                      </span>
                      {!program.isActive && (
                        <span className="text-[9px] rounded bg-gray-800 px-1.5 py-0.5 text-gray-500">
                          OFF
                        </span>
                      )}
                      <span className="text-[9px] text-gray-700">#{program.id}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-500">{program.description}</div>
                    <div className="mt-2 text-[10px] text-gray-400">{programSummary(program)}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500">
                      <span>CD: {program.cooldown}</span>
                      <span>Chance: {program.chancePercent}%</span>
                      <span>Ordre: {program.sortOrder}</span>
                      <span>Icon: {program.icon}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(program)}
                      className="text-[10px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 uppercase"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer "${program.name}" ?`)) {
                          router.post(`/admin/enemy-programs/${program.id}/delete`)
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
          ))}
        </div>
      </div>
    </GameLayout>
  )
}
