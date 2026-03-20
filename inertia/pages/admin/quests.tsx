import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface QuestRecord {
  id: number
  key: string
  questType: 'main' | 'seasonal'
  seasonId: number | null
  seasonName: string | null
  parentQuestId: number | null
  parentQuestTitle: string | null
  arcKey: string
  arcTitle: string
  giverName: string | null
  title: string
  summary: string
  narrative: string | null
  objectiveType: 'hack_clicks' | 'hack_credits' | 'reach_level'
  targetValue: number
  rewardType: 'credits' | 'xp' | 'talent_points'
  rewardValue: number
  icon: string
  sortOrder: number
}

interface QuestOption {
  id: number
  key: string
  title: string
  arcTitle: string
  questType: 'main' | 'seasonal'
  seasonId: number | null
}

interface SeasonOption {
  id: number
  name: string
  status: string
}

interface Choice {
  value: string
  label: string
}

interface Props {
  quests: QuestRecord[]
  questOptions: QuestOption[]
  seasons: SeasonOption[]
  questTypes: Choice[]
  objectiveTypes: Choice[]
  rewardTypes: Choice[]
}

type QuestFormState = {
  key: string
  questType: 'main' | 'seasonal'
  seasonId: string
  parentQuestId: string
  arcKey: string
  arcTitle: string
  giverName: string
  title: string
  summary: string
  narrative: string
  objectiveType: string
  targetValue: number
  rewardType: string
  rewardValue: number
  icon: string
  sortOrder: number
}

const emptyForm: QuestFormState = {
  key: '',
  questType: 'main',
  seasonId: '',
  parentQuestId: '',
  arcKey: 'ghost_in_the_grid',
  arcTitle: 'Ghost In The Grid',
  giverName: 'Ghost',
  title: '',
  summary: '',
  narrative: '',
  objectiveType: 'hack_clicks',
  targetValue: 50,
  rewardType: 'credits',
  rewardValue: 500,
  icon: 'terminal',
  sortOrder: 1,
}

function serializeQuestToForm(quest: QuestRecord): QuestFormState {
  return {
    key: quest.key,
    questType: quest.questType,
    seasonId: quest.seasonId ? String(quest.seasonId) : '',
    parentQuestId: quest.parentQuestId ? String(quest.parentQuestId) : '',
    arcKey: quest.arcKey,
    arcTitle: quest.arcTitle,
    giverName: quest.giverName || '',
    title: quest.title,
    summary: quest.summary,
    narrative: quest.narrative || '',
    objectiveType: quest.objectiveType,
    targetValue: quest.targetValue,
    rewardType: quest.rewardType,
    rewardValue: quest.rewardValue,
    icon: quest.icon,
    sortOrder: quest.sortOrder,
  }
}

export default function AdminQuests({
  quests,
  questOptions,
  seasons,
  questTypes,
  objectiveTypes,
  rewardTypes,
}: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [createForm, setCreateForm] = useState<QuestFormState>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<QuestFormState>(emptyForm)

  const updateCreate = (field: keyof QuestFormState, value: string | number) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateEdit = (field: keyof QuestFormState, value: string | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    router.post('/admin/quests/create', createForm)
  }

  const startEdit = (quest: QuestRecord) => {
    setEditingId(quest.id)
    setEditForm(serializeQuestToForm(quest))
  }

  const handleUpdate = (id: number) => {
    router.post(`/admin/quests/${id}/update`, editForm)
  }

  const parentOptionsFor = (form: QuestFormState, currentQuestId?: number) =>
    questOptions.filter((option) => {
      if (option.id === currentQuestId) return false
      if (option.questType !== form.questType) return false
      if (form.questType === 'seasonal' && String(option.seasonId || '') !== form.seasonId) return false
      return true
    })

  const renderForm = (
    form: QuestFormState,
    update: (field: keyof QuestFormState, value: string | number) => void,
    currentQuestId?: number
  ) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Cle</label>
        <input
          value={form.key}
          onChange={(e) => update('key', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Type</label>
        <select
          value={form.questType}
          onChange={(e) => {
            const nextType = e.target.value as 'main' | 'seasonal'
            update('questType', nextType)
            if (nextType === 'main') {
              update('seasonId', '')
            }
            update('parentQuestId', '')
          }}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        >
          {questTypes.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>

      {form.questType === 'seasonal' && (
        <div>
          <label className="mb-1 block text-[10px] uppercase text-gray-500">Saison</label>
          <select
            value={form.seasonId}
            onChange={(e) => {
              update('seasonId', e.target.value)
              update('parentQuestId', '')
            }}
            className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
          >
            <option value="">Choisir une saison</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} ({season.status})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Donneur</label>
        <input
          value={form.giverName}
          onChange={(e) => update('giverName', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Arc key</label>
        <input
          value={form.arcKey}
          onChange={(e) => update('arcKey', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Arc title</label>
        <input
          value={form.arcTitle}
          onChange={(e) => update('arcTitle', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Parent</label>
        <select
          value={form.parentQuestId}
          onChange={(e) => update('parentQuestId', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        >
          <option value="">Aucun</option>
          {parentOptionsFor(form, currentQuestId).map((option) => (
            <option key={option.id} value={option.id}>
              [{option.arcTitle}] {option.title}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Titre</label>
        <input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Resume</label>
        <input
          value={form.summary}
          onChange={(e) => update('summary', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Narration</label>
        <textarea
          value={form.narrative}
          onChange={(e) => update('narrative', e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Objectif</label>
        <select
          value={form.objectiveType}
          onChange={(e) => update('objectiveType', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        >
          {objectiveTypes.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Cible</label>
        <input
          type="number"
          min={1}
          value={form.targetValue}
          onChange={(e) => update('targetValue', Number(e.target.value))}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Recompense</label>
        <select
          value={form.rewardType}
          onChange={(e) => update('rewardType', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        >
          {rewardTypes.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Valeur recompense</label>
        <input
          type="number"
          min={0}
          value={form.rewardValue}
          onChange={(e) => update('rewardValue', Number(e.target.value))}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Icone</label>
        <input
          value={form.icon}
          onChange={(e) => update('icon', e.target.value)}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Ordre</label>
        <input
          type="number"
          min={1}
          value={form.sortOrder}
          onChange={(e) => update('sortOrder', Number(e.target.value))}
          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none"
        />
      </div>
    </div>
  )

  return (
    <GameLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-widest text-cyber-blue">QUETES</h1>
          <a href="/admin" className="text-[10px] uppercase text-gray-500 hover:text-cyber-blue">
            &larr; RETOUR ADMIN
          </a>
        </div>

        {props.errors?.message && (
          <div className="mb-4 rounded-lg border border-cyber-red/50 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">
            {props.errors.message}
          </div>
        )}
        {props.success && (
          <div className="mb-4 rounded-lg border border-cyber-green/50 bg-cyber-green/10 px-4 py-3 text-sm text-cyber-green">
            {props.success as string}
          </div>
        )}

        <div className="mb-6 rounded-lg border border-cyber-blue/30 bg-cyber-dark p-4">
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-blue">
              Creer une quete
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Une quete peut etre principale ou rattachee a une saison. Les suites passent maintenant par un parent direct.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {renderForm(createForm, updateCreate)}
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded border border-cyber-blue/30 px-4 py-2 text-xs uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10 transition-all"
              >
                Ajouter la quete
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {quests.length === 0 ? (
            <div className="rounded-lg border border-gray-800 bg-cyber-dark p-8 text-center text-sm text-gray-600">
              Aucune quete configuree
            </div>
          ) : (
            quests.map((quest) => (
              <div key={quest.id} className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
                {editingId === quest.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">
                          Edition
                        </div>
                        <div className="text-sm font-bold text-cyber-blue">{quest.title}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdate(quest.id)}
                          className="rounded border border-cyber-green/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10"
                        >
                          Sauver
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-white"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                    {renderForm(editForm, updateEdit, quest.id)}
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                            quest.questType === 'main'
                              ? 'border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue'
                              : 'border-cyber-yellow/30 bg-cyber-yellow/10 text-cyber-yellow'
                          }`}
                        >
                          {quest.questType === 'main' ? 'PRINCIPALE' : 'SAISON'}
                        </span>
                        <span className="rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gray-500">
                          {quest.arcTitle}
                        </span>
                        <span className="rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gray-500">
                          #{quest.sortOrder}
                        </span>
                        <span className="rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gray-500">
                          {quest.key}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">{quest.title}</div>
                      <div className="mt-1 text-xs text-gray-400">{quest.summary}</div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-gray-500 sm:grid-cols-2">
                        <div>Objectif: {quest.objectiveType} / {quest.targetValue}</div>
                        <div>Recompense: {quest.rewardType} / {quest.rewardValue}</div>
                        <div>Donneur: {quest.giverName || 'Aucun'}</div>
                        <div>Parent: {quest.parentQuestTitle || 'Aucun'}</div>
                        <div>Saison: {quest.seasonName || 'Aucune'}</div>
                        <div>Type: {quest.questType === 'main' ? 'Principale' : 'Saison'}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(quest)}
                        className="rounded border border-cyber-blue/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10"
                      >
                        Editer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Supprimer la quete "${quest.title}" ?`)) {
                            router.post(`/admin/quests/${quest.id}/delete`)
                          }
                        }}
                        className="rounded border border-cyber-red/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </GameLayout>
  )
}
