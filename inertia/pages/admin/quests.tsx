import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface QuestReward {
  type: 'credits' | 'xp' | 'talent_points' | 'item'
  value: number
  itemId: number | null
  itemName: string | null
}

interface FlowStepRecord {
  id: number
  stepType: string
  sortOrder: number
  contentJson: string
  nextStepId: number | null
}

interface QuestRecord {
  id: number
  key: string
  mode: 'simple' | 'advanced'
  questType: 'main' | 'seasonal'
  seasonId: number | null
  seasonName: string | null
  parentQuestId: number | null
  parentQuestTitle: string | null
  questArcId: number | null
  arcTitle: string
  giverName: string | null
  title: string
  summary: string
  narrative: string | null
  objectiveType: string
  targetValue: number
  icon: string
  sortOrder: number
  rewards: QuestReward[]
  flowSteps: FlowStepRecord[]
}

interface QuestOption {
  id: number
  key: string
  title: string
  arcTitle: string
  questType: 'main' | 'seasonal'
  seasonId: number | null
  questArcId: number | null
}

interface ArcRecord {
  id: number
  key: string
  title: string
  parentArcId: number | null
  parentArcTitle: string | null
  isActive: boolean
  sortOrder: number
}

interface SeasonOption { id: number; name: string; status: string }
interface ItemOption { id: number; name: string }
interface Choice { value: string; label: string }

interface Props {
  quests: QuestRecord[]
  questOptions: QuestOption[]
  arcs: ArcRecord[]
  seasons: SeasonOption[]
  items: ItemOption[]
  questTypes: Choice[]
  objectiveTypes: Choice[]
  rewardTypes: Choice[]
}

type QuestFormReward = { type: string; value: number; itemId: string }
type QuestFormStep = { stepType: string; contentJson: string; nextStepId: string }

type QuestFormState = {
  key: string
  mode: 'simple' | 'advanced'
  questType: 'main' | 'seasonal'
  seasonId: string
  parentQuestId: string
  questArcId: string
  giverName: string
  title: string
  summary: string
  narrative: string
  objectiveType: string
  targetValue: number
  icon: string
  sortOrder: number
  rewards: QuestFormReward[]
  flowSteps: QuestFormStep[]
}

const emptyReward = (): QuestFormReward => ({ type: 'credits', value: 100, itemId: '' })

const STEP_TEMPLATES: Record<string, string> = {
  narration: '{"text": "", "speaker": "Narrateur"}',
  conversation: '{"lines": [{"speaker": "", "text": "", "avatar": ""}]}',
  objective: '{"objectiveType": "hack_clicks", "targetValue": 100, "label": ""}',
  wait: '{"duration": 5, "unit": "minutes"}',
  choice: '{"prompt": "", "options": [{"label": "", "nextStepId": null}]}',
}

const emptyForm = (arcs: ArcRecord[]): QuestFormState => ({
  key: '',
  mode: 'simple',
  questType: 'main',
  seasonId: '',
  parentQuestId: '',
  questArcId: arcs.length > 0 ? String(arcs[0].id) : '',
  giverName: '',
  title: '',
  summary: '',
  narrative: '',
  objectiveType: 'hack_clicks',
  targetValue: 50,
  icon: 'terminal',
  sortOrder: 1,
  rewards: [],
  flowSteps: [],
})

function serializeQuestToForm(quest: QuestRecord): QuestFormState {
  return {
    key: quest.key,
    mode: quest.mode || 'simple',
    questType: quest.questType,
    seasonId: quest.seasonId ? String(quest.seasonId) : '',
    parentQuestId: quest.parentQuestId ? String(quest.parentQuestId) : '',
    questArcId: quest.questArcId ? String(quest.questArcId) : '',
    giverName: quest.giverName || '',
    title: quest.title,
    summary: quest.summary,
    narrative: quest.narrative || '',
    objectiveType: quest.objectiveType,
    targetValue: quest.targetValue,
    icon: quest.icon,
    sortOrder: quest.sortOrder,
    rewards: quest.rewards.map((r) => ({ type: r.type, value: r.value, itemId: r.itemId ? String(r.itemId) : '' })),
    flowSteps: quest.flowSteps.map((s) => ({ stepType: s.stepType, contentJson: s.contentJson, nextStepId: s.nextStepId ? String(s.nextStepId) : '' })),
  }
}

function rewardPreview(rewards: QuestReward[]) {
  if (rewards.length === 0) return 'Aucune'
  return rewards
    .map((r) => {
      if (r.type === 'item') return `${r.value}x ${r.itemName || `item #${r.itemId}`}`
      if (r.type === 'talent_points') return `+${r.value} talent`
      return `+${r.value} ${r.type}`
    })
    .join(' • ')
}

export default function AdminQuests({ quests, questOptions, arcs, seasons, items, questTypes, objectiveTypes, rewardTypes }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [createForm, setCreateForm] = useState<QuestFormState>(emptyForm(arcs))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<QuestFormState>(emptyForm(arcs))

  // Arc form state
  const [newArcKey, setNewArcKey] = useState('')
  const [newArcTitle, setNewArcTitle] = useState('')
  const [newArcParentId, setNewArcParentId] = useState('')
  const [newArcActive, setNewArcActive] = useState(true)
  const [newArcSort, setNewArcSort] = useState(1)
  const [editingArcId, setEditingArcId] = useState<number | null>(null)
  const [editArc, setEditArc] = useState<{ key: string; title: string; parentArcId: string; isActive: boolean; sortOrder: number }>({ key: '', title: '', parentArcId: '', isActive: true, sortOrder: 1 })

  // Flow step editor state
  const [flowEditQuestId, setFlowEditQuestId] = useState<number | null>(null)
  const [newStepType, setNewStepType] = useState('narration')
  const [newStepContent, setNewStepContent] = useState('{}')
  const [newStepNextId, setNewStepNextId] = useState('')
  const [editingStepId, setEditingStepId] = useState<number | null>(null)
  const [editStepType, setEditStepType] = useState('')
  const [editStepContent, setEditStepContent] = useState('')
  const [editStepNextId, setEditStepNextId] = useState('')
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const stepTypeLabels: Record<string, string> = {
    narration: 'Narration',
    conversation: 'Conversation',
    objective: 'Objectif',
    wait: 'Attente',
    choice: 'Choix',
  }

  const stepTypeColors: Record<string, string> = {
    narration: 'border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue',
    conversation: 'border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple',
    objective: 'border-cyber-yellow/30 bg-cyber-yellow/10 text-cyber-yellow',
    wait: 'border-gray-600 bg-gray-800/50 text-gray-400',
    choice: 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green',
  }

  const getContentPreview = (stepType: string, json: string) => {
    try {
      const c = JSON.parse(json)
      if (stepType === 'narration') return `${c.speaker || 'Narrateur'}: "${(c.text || '').slice(0, 60)}..."`
      if (stepType === 'conversation') return `${(c.lines || []).length} lignes`
      if (stepType === 'objective') return `${c.objectiveType}: ${c.targetValue}`
      if (stepType === 'wait') return `${c.duration} ${c.unit || 'minutes'}`
      if (stepType === 'choice') return `${(c.options || []).length} options: ${(c.options || []).map((o: any) => o.label).join(', ')}`
    } catch {}
    return json.slice(0, 50)
  }

  const handleCreateStep = (questId: number) => {
    router.post('/admin/quest-steps/create', {
      questId,
      stepType: newStepType,
      contentJson: newStepContent,
      nextStepId: newStepNextId,
    } as any)
    setNewStepContent('{}')
    setNewStepNextId('')
  }

  const handleUpdateStep = (stepId: number) => {
    router.post(`/admin/quest-steps/${stepId}/update`, {
      stepType: editStepType,
      contentJson: editStepContent,
      nextStepId: editStepNextId,
    } as any)
    setEditingStepId(null)
  }

  const handleReorder = (questId: number, steps: FlowStepRecord[], fromIdx: number, toIdx: number) => {
    const reordered = [...steps]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const order = reordered.map((s, i) => ({ id: s.id, sortOrder: i + 1 }))
    router.post('/admin/quest-steps/reorder', { order } as any)
  }

  const updateCreate = (field: keyof QuestFormState, value: any) => setCreateForm((p) => ({ ...p, [field]: value }))
  const updateEdit = (field: keyof QuestFormState, value: any) => setEditForm((p) => ({ ...p, [field]: value }))

  const updateReward = (rewards: QuestFormReward[], index: number, field: keyof QuestFormReward, value: string | number) =>
    rewards.map((r, i) => (i === index ? { ...r, [field]: value } : r))

  const handleCreate = (e: React.FormEvent) => { e.preventDefault(); router.post('/admin/quests/create', createForm as any) }
  const startEdit = (q: QuestRecord) => { setEditingId(q.id); setEditForm(serializeQuestToForm(q)) }
  const handleUpdate = (id: number) => router.post(`/admin/quests/${id}/update`, editForm as any)

  const parentOptionsFor = (form: QuestFormState, currentQuestId?: number) =>
    questOptions.filter((o) => {
      if (o.id === currentQuestId) return false
      if (o.questType !== form.questType) return false
      if (form.questArcId && String(o.questArcId) !== form.questArcId) return false
      if (form.questType === 'seasonal' && String(o.seasonId || '') !== form.seasonId) return false
      return true
    })

  const renderRewardsEditor = (form: QuestFormState, setForm: (f: keyof QuestFormState, v: any) => void) => (
    <div className="md:col-span-2 rounded-lg border border-gray-800 bg-cyber-black/30 p-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500">Recompenses</div>
          <div className="text-xs text-gray-600">Zero, une ou plusieurs recompenses.</div>
        </div>
        <button type="button" onClick={() => setForm('rewards', [...form.rewards, emptyReward()])}
          className="rounded border border-cyber-yellow/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-yellow hover:bg-cyber-yellow/10">
          Ajouter
        </button>
      </div>
      {form.rewards.length === 0 ? (
        <div className="text-xs text-gray-600">Aucune recompense configuree.</div>
      ) : (
        <div className="space-y-3">
          {form.rewards.map((reward, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
              <div>
                <label className="mb-1 block text-[10px] uppercase text-gray-500">Type</label>
                <select value={reward.type} onChange={(e) => {
                  const next = updateReward(form.rewards, index, 'type', e.target.value)
                  setForm('rewards', next.map((entry, i) => i === index && e.target.value !== 'item' ? { ...entry, itemId: '' } : entry))
                }} className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none">
                  {rewardTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase text-gray-500">{reward.type === 'item' ? 'Quantite' : 'Valeur'}</label>
                <input type="number" min={0} value={reward.value} onChange={(e) => setForm('rewards', updateReward(form.rewards, index, 'value', Number(e.target.value)))}
                  className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase text-gray-500">Item</label>
                <select value={reward.itemId} disabled={reward.type !== 'item'} onChange={(e) => setForm('rewards', updateReward(form.rewards, index, 'itemId', e.target.value))}
                  className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white disabled:opacity-40 focus:border-cyber-blue/50 focus:outline-none">
                  <option value="">Aucun</option>
                  {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => setForm('rewards', form.rewards.filter((_, i) => i !== index))}
                className="rounded border border-cyber-red/30 px-3 py-2 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10">
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const inputCls = 'w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none'

  const renderForm = (form: QuestFormState, update: (f: keyof QuestFormState, v: any) => void, currentQuestId?: number) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Cle</label>
        <input value={form.key} onChange={(e) => update('key', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Mode</label>
        <select value={form.mode} onChange={(e) => update('mode', e.target.value)} className={inputCls}>
          <option value="simple">Simple</option>
          <option value="advanced">Advanced (Flow)</option>
        </select>
        {form.mode === 'advanced' && (
          <div className="mt-1 text-[10px] text-cyber-green">Mode flow actif — sauvegardez puis gerez les steps ci-dessous.</div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Type</label>
        <select value={form.questType} onChange={(e) => { update('questType', e.target.value); if (e.target.value === 'main') update('seasonId', ''); update('parentQuestId', '') }} className={inputCls}>
          {questTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      {form.questType === 'seasonal' && (
        <div>
          <label className="mb-1 block text-[10px] uppercase text-gray-500">Saison</label>
          <select value={form.seasonId} onChange={(e) => { update('seasonId', e.target.value); update('parentQuestId', '') }} className={inputCls}>
            <option value="">Choisir une saison</option>
            {seasons.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.status})</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Arc</label>
        <select value={form.questArcId} onChange={(e) => { update('questArcId', e.target.value); update('parentQuestId', '') }} className={inputCls}>
          <option value="">-- Choisir un arc --</option>
          {arcs.filter((a) => a.isActive).map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}{a.parentArcTitle ? ` (sous-arc de ${a.parentArcTitle})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Donneur</label>
        <input value={form.giverName} onChange={(e) => update('giverName', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Parent</label>
        <select value={form.parentQuestId} onChange={(e) => update('parentQuestId', e.target.value)} className={inputCls}>
          <option value="">Aucun</option>
          {parentOptionsFor(form, currentQuestId).map((o) => (
            <option key={o.id} value={o.id}>[{o.arcTitle}] {o.title}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Titre</label>
        <input value={form.title} onChange={(e) => update('title', e.target.value)} className={inputCls} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Resume</label>
        <input value={form.summary} onChange={(e) => update('summary', e.target.value)} className={inputCls} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Narration</label>
        <textarea value={form.narrative} onChange={(e) => update('narrative', e.target.value)} rows={3} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Objectif</label>
        <select value={form.objectiveType} onChange={(e) => update('objectiveType', e.target.value)} className={inputCls}>
          {objectiveTypes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Cible</label>
        <input type="number" min={1} value={form.targetValue} onChange={(e) => update('targetValue', Number(e.target.value))} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Icone</label>
        <input value={form.icon} onChange={(e) => update('icon', e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-[10px] uppercase text-gray-500">Ordre</label>
        <input type="number" min={1} value={form.sortOrder} onChange={(e) => update('sortOrder', Number(e.target.value))} className={inputCls} />
      </div>
      {renderRewardsEditor(form, update)}

      {/* ── INLINE FLOW STEPS (visible when mode = advanced) ── */}
      {form.mode === 'advanced' && (
        <div className="md:col-span-2 rounded-lg border border-cyber-green/30 bg-cyber-green/5 p-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cyber-green">Flow Steps</div>
              <div className="text-xs text-gray-600">{form.flowSteps.length} step(s) — narration, conversation, objectif, attente, choix.</div>
            </div>
            <button type="button" onClick={() => update('flowSteps', [...form.flowSteps, { stepType: 'narration', contentJson: STEP_TEMPLATES.narration, nextStepId: '' }])}
              className="rounded border border-cyber-green/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10">
              + Step
            </button>
          </div>
          {form.flowSteps.length === 0 ? (
            <div className="text-xs text-gray-600 text-center py-2">Aucune step. Cliquez "+ Step" pour commencer le flow.</div>
          ) : (
            <div className="space-y-3">
              {form.flowSteps.map((step, idx) => (
                <div key={idx} className="rounded border border-gray-800 bg-cyber-black/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">#{idx + 1}</span>
                      <select value={step.stepType} onChange={(e) => {
                        const next = [...form.flowSteps]
                        next[idx] = { ...next[idx], stepType: e.target.value, contentJson: STEP_TEMPLATES[e.target.value] || '{}' }
                        update('flowSteps', next)
                      }} className={inputCls + ' !w-auto'}>
                        {Object.entries(stepTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-1">
                      {idx > 0 && (
                        <button type="button" onClick={() => {
                          const next = [...form.flowSteps]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                          update('flowSteps', next)
                        }} className="text-[10px] px-2 py-1 text-gray-500 hover:text-white">↑</button>
                      )}
                      {idx < form.flowSteps.length - 1 && (
                        <button type="button" onClick={() => {
                          const next = [...form.flowSteps]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
                          update('flowSteps', next)
                        }} className="text-[10px] px-2 py-1 text-gray-500 hover:text-white">↓</button>
                      )}
                      <button type="button" onClick={() => update('flowSteps', form.flowSteps.filter((_, i) => i !== idx))}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10">X</button>
                    </div>
                  </div>
                  <textarea value={step.contentJson} onChange={(e) => {
                    const next = [...form.flowSteps]; next[idx] = { ...next[idx], contentJson: e.target.value }
                    update('flowSteps', next)
                  }} rows={3} className={inputCls + ' font-mono text-xs'} placeholder="Content JSON" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <GameLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-widest text-cyber-blue">QUETES</h1>
          <a href="/admin" className="text-[10px] uppercase text-gray-500 hover:text-cyber-blue">&larr; RETOUR ADMIN</a>
        </div>

        {props.errors?.message && (
          <div className="mb-4 rounded-lg border border-cyber-red/50 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">{props.errors.message}</div>
        )}
        {props.success && (
          <div className="mb-4 rounded-lg border border-cyber-green/50 bg-cyber-green/10 px-4 py-3 text-sm text-cyber-green">{props.success as string}</div>
        )}

        {/* ═══ ARC MANAGEMENT ═══ */}
        <div className="mb-6 rounded-lg border border-cyber-purple/30 bg-cyber-dark p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-purple mb-3">ARCS NARRATIFS</h2>

          {/* Create arc */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4">
            <input placeholder="Cle (snake_case)" value={newArcKey} onChange={(e) => setNewArcKey(e.target.value)} className={inputCls} />
            <input placeholder="Titre" value={newArcTitle} onChange={(e) => setNewArcTitle(e.target.value)} className={inputCls} />
            <select value={newArcParentId} onChange={(e) => setNewArcParentId(e.target.value)} className={inputCls}>
              <option value="">Pas de parent</option>
              {arcs.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
            <input type="number" min={1} value={newArcSort} onChange={(e) => setNewArcSort(Number(e.target.value))} className={inputCls} placeholder="Ordre" />
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input type="checkbox" checked={newArcActive} onChange={(e) => setNewArcActive(e.target.checked)} /> Actif
            </label>
            <button type="button" onClick={() => {
              router.post('/admin/quest-arcs/create', { key: newArcKey, title: newArcTitle, parentArcId: newArcParentId, isActive: newArcActive ? 'true' : 'false', sortOrder: newArcSort } as any)
              setNewArcKey(''); setNewArcTitle(''); setNewArcParentId(''); setNewArcActive(true); setNewArcSort(1)
            }} className="rounded border border-cyber-purple/30 px-3 py-2 text-[10px] uppercase tracking-widest text-cyber-purple hover:bg-cyber-purple/10">
              Creer
            </button>
          </div>

          {/* List arcs */}
          <div className="space-y-2">
            {arcs.map((arc) => (
              <div key={arc.id} className={`rounded border p-3 ${arc.isActive ? 'border-cyber-purple/30' : 'border-gray-800 opacity-50'}`}>
                {editingArcId === arc.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                    <input value={editArc.key} onChange={(e) => setEditArc((p) => ({ ...p, key: e.target.value }))} className={inputCls} />
                    <input value={editArc.title} onChange={(e) => setEditArc((p) => ({ ...p, title: e.target.value }))} className={inputCls} />
                    <select value={editArc.parentArcId} onChange={(e) => setEditArc((p) => ({ ...p, parentArcId: e.target.value }))} className={inputCls}>
                      <option value="">Pas de parent</option>
                      {arcs.filter((a) => a.id !== arc.id).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                    </select>
                    <input type="number" min={1} value={editArc.sortOrder} onChange={(e) => setEditArc((p) => ({ ...p, sortOrder: Number(e.target.value) }))} className={inputCls} />
                    <label className="flex items-center gap-2 text-xs text-gray-400">
                      <input type="checkbox" checked={editArc.isActive} onChange={(e) => setEditArc((p) => ({ ...p, isActive: e.target.checked }))} /> Actif
                    </label>
                    <div className="flex gap-1">
                      <button onClick={() => { router.post(`/admin/quest-arcs/${arc.id}/update`, { ...editArc, isActive: editArc.isActive ? 'true' : 'false' } as any); setEditingArcId(null) }}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase">OK</button>
                      <button onClick={() => setEditingArcId(null)} className="text-[10px] px-2 py-1 text-gray-600 hover:text-white uppercase">X</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-cyber-purple">{arc.title}</span>
                      <span className="text-[10px] text-gray-600">{arc.key}</span>
                      {arc.parentArcTitle && <span className="text-[10px] text-gray-500">sous-arc de {arc.parentArcTitle}</span>}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${arc.isActive ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>
                        {arc.isActive ? 'actif' : 'inactif'}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingArcId(arc.id); setEditArc({ key: arc.key, title: arc.title, parentArcId: arc.parentArcId ? String(arc.parentArcId) : '', isActive: arc.isActive, sortOrder: arc.sortOrder }) }}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 uppercase">Editer</button>
                      <button onClick={() => { if (confirm(`Supprimer l'arc "${arc.title}" ?`)) router.post(`/admin/quest-arcs/${arc.id}/delete`) }}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 uppercase">Suppr</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {arcs.length === 0 && <div className="text-xs text-gray-600 text-center py-4">Aucun arc cree</div>}
          </div>
        </div>

        {/* ═══ CREATE QUEST ═══ */}
        <div className="mb-6 rounded-lg border border-cyber-blue/30 bg-cyber-dark p-4">
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-blue">Creer une quete</h2>
            <p className="mt-1 text-xs text-gray-500">Principale ou saisonniere, dans un arc existant.</p>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            {renderForm(createForm, updateCreate)}
            <div className="flex justify-end">
              <button type="submit" className="rounded border border-cyber-blue/30 px-4 py-2 text-xs uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10 transition-all">
                Ajouter la quete
              </button>
            </div>
          </form>
        </div>

        {/* ═══ QUEST LIST ═══ */}
        <div className="space-y-4">
          {quests.length === 0 ? (
            <div className="rounded-lg border border-gray-800 bg-cyber-dark p-8 text-center text-sm text-gray-600">Aucune quete configuree</div>
          ) : (
            quests.map((quest) => (
              <div key={quest.id} className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
                {editingId === quest.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">Edition</div>
                        <div className="text-sm font-bold text-cyber-blue">{quest.title}</div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleUpdate(quest.id)} className="rounded border border-cyber-green/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10">Sauver</button>
                        <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-gray-500 hover:text-white">Annuler</button>
                      </div>
                    </div>
                    {renderForm(editForm, updateEdit, quest.id)}
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-widest ${quest.questType === 'main' ? 'border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue' : 'border-cyber-yellow/30 bg-cyber-yellow/10 text-cyber-yellow'}`}>
                          {quest.questType === 'main' ? 'PRINCIPALE' : 'SAISON'}
                        </span>
                        {quest.mode === 'advanced' && (
                          <span className="rounded border border-cyber-green/30 bg-cyber-green/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-cyber-green">FLOW</span>
                        )}
                        <span className="rounded border border-cyber-purple/30 bg-cyber-purple/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-cyber-purple">{quest.arcTitle}</span>
                        <span className="rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gray-500">#{quest.sortOrder}</span>
                        <span className="rounded border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gray-500">{quest.key}</span>
                      </div>
                      <div className="text-sm font-bold text-white">{quest.title}</div>
                      <div className="mt-1 text-xs text-gray-400">{quest.summary}</div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-gray-500 sm:grid-cols-2">
                        <div>Objectif: {quest.objectiveType} / {quest.targetValue}</div>
                        <div>Recompenses: {rewardPreview(quest.rewards)}</div>
                        <div>Donneur: {quest.giverName || 'Aucun'}</div>
                        <div>Parent: {quest.parentQuestTitle || 'Aucun'}</div>
                        <div>Mode: <span className={quest.mode === 'advanced' ? 'text-cyber-green' : 'text-gray-500'}>{quest.mode || 'simple'}</span></div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => startEdit(quest)} className="rounded border border-cyber-blue/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10">Editer</button>
                      <button type="button" onClick={() => { if (window.confirm(`Supprimer la quete "${quest.title}" ?`)) router.post(`/admin/quests/${quest.id}/delete`) }}
                        className="rounded border border-cyber-red/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10">Supprimer</button>
                    </div>
                  </div>
                )}

                {/* ── FLOW STEPS EDITOR (always visible for advanced quests) ── */}
                {quest.mode === 'advanced' && (
                  <div className="mt-4 rounded-lg border border-cyber-green/20 bg-cyber-black/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-cyber-green">Flow Steps</h3>
                      <span className="text-[10px] text-gray-600">{quest.flowSteps.length} step(s)</span>
                    </div>

                    {/* Step list with drag & drop */}
                    <div className="space-y-2 mb-4">
                      {quest.flowSteps.sort((a, b) => a.sortOrder - b.sortOrder).map((step, idx) => (
                        <div
                          key={step.id}
                          draggable
                          onDragStart={() => setDragIdx(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => { if (dragIdx !== null && dragIdx !== idx) handleReorder(quest.id, quest.flowSteps, dragIdx, idx); setDragIdx(null) }}
                          className={`rounded border p-3 ${editingStepId === step.id ? 'border-cyber-green/40' : 'border-gray-800 hover:border-gray-700'} cursor-grab`}
                        >
                          {editingStepId === step.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <select value={editStepType} onChange={(e) => setEditStepType(e.target.value)} className={inputCls}>
                                  {Object.entries(stepTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                                <input placeholder="nextStepId (vide=auto)" value={editStepNextId} onChange={(e) => setEditStepNextId(e.target.value)} className={inputCls} />
                                <div className="flex gap-1">
                                  <button onClick={() => handleUpdateStep(step.id)}
                                    className="text-[10px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase">OK</button>
                                  <button onClick={() => setEditingStepId(null)}
                                    className="text-[10px] px-2 py-1 text-gray-600 hover:text-white uppercase">X</button>
                                </div>
                              </div>
                              <textarea value={editStepContent} onChange={(e) => setEditStepContent(e.target.value)} rows={4}
                                className={inputCls + ' font-mono text-xs'} placeholder="Content JSON" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] text-gray-600 shrink-0">#{step.sortOrder}</span>
                                <span className={`rounded border px-1.5 py-0.5 text-[9px] uppercase font-bold shrink-0 ${stepTypeColors[step.stepType] || 'border-gray-700 text-gray-500'}`}>
                                  {stepTypeLabels[step.stepType] || step.stepType}
                                </span>
                                <span className="text-[10px] text-gray-400 truncate">
                                  {getContentPreview(step.stepType, step.contentJson)}
                                </span>
                                {step.nextStepId && <span className="text-[9px] text-gray-600 shrink-0">→#{step.nextStepId}</span>}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button onClick={() => { setEditingStepId(step.id); setEditStepType(step.stepType); setEditStepContent(step.contentJson); setEditStepNextId(step.nextStepId ? String(step.nextStepId) : '') }}
                                  className="text-[10px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 uppercase">E</button>
                                <button onClick={() => { if (confirm('Supprimer cette step ?')) router.post(`/admin/quest-steps/${step.id}/delete`) }}
                                  className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 uppercase">X</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {quest.flowSteps.length === 0 && (
                        <div className="text-[10px] text-gray-600 text-center py-3">Aucune step. Ajoutez-en une ci-dessous.</div>
                      )}
                    </div>

                    {/* Add new step */}
                    <div className="rounded border border-gray-800 p-3 space-y-2">
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Ajouter une step</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select value={newStepType} onChange={(e) => {
                          setNewStepType(e.target.value)
                          const templates: Record<string, string> = {
                            narration: '{"text": "", "speaker": "Narrateur"}',
                            conversation: '{"lines": [{"speaker": "", "text": "", "avatar": ""}]}',
                            objective: '{"objectiveType": "hack_clicks", "targetValue": 100, "label": ""}',
                            wait: '{"duration": 5, "unit": "minutes"}',
                            choice: '{"prompt": "", "options": [{"label": "", "nextStepId": null}]}',
                          }
                          setNewStepContent(templates[e.target.value] || '{}')
                        }} className={inputCls}>
                          {Object.entries(stepTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                        <input placeholder="nextStepId (vide=auto)" value={newStepNextId} onChange={(e) => setNewStepNextId(e.target.value)} className={inputCls} />
                        <button onClick={() => handleCreateStep(quest.id)}
                          className="rounded border border-cyber-green/30 px-3 py-2 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10">
                          Ajouter
                        </button>
                      </div>
                      <textarea value={newStepContent} onChange={(e) => setNewStepContent(e.target.value)} rows={3}
                        className={inputCls + ' font-mono text-xs'} placeholder="Content JSON" />
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
