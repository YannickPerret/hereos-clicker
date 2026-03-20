import { Link, router } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface InventoryEntry {
  id: number
  itemId: number
  name: string
  type: string
  rarity: string
  icon: string
  quantity: number
  isEquipped: boolean
}

interface CharacterQuestEntry {
  id: number
  questId: number
  title: string
  arcTitle: string
  questType: 'main' | 'seasonal'
  seasonName: string | null
  status: 'active' | 'completed'
  progress: number
  targetValue: number
  objectiveType: string
}

interface DungeonRunEntry {
  id: number
  dungeonFloorId: number
  floorName: string
  floorNumber: number
  status: 'in_progress' | 'victory' | 'defeat' | 'fled'
  enemiesDefeated: number
  currentEnemyHp: number
  currentEnemyId: number | null
  partyId: number | null
  startedAt: string
  endedAt: string | null
}

interface CharacterData {
  id: number
  userId: number
  username: string
  name: string
  level: number
  xp: number
  credits: number
  creditsPerClick: number
  creditsPerSecond: number
  hpMax: number
  hpCurrent: number
  attack: number
  defense: number
  talentPoints: number
  totalClicks: number
  chosenSpec: string | null
  critChance: number
  critDamage: number
  pvpRating: number
  pvpWins: number
  pvpLosses: number
  inventory: InventoryEntry[]
  quests: CharacterQuestEntry[]
  dungeonRuns: DungeonRunEntry[]
  talentCount: number
}

interface ItemData {
  id: number
  name: string
  type: string
  rarity: string
  icon: string
  basePrice: number
}

interface QuestOption {
  id: number
  title: string
  arcTitle: string
  questType: 'main' | 'seasonal'
  seasonName: string | null
  targetValue: number
}

interface Props {
  character: CharacterData
  items: ItemData[]
  questOptions: QuestOption[]
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400 border-gray-700',
  uncommon: 'text-cyber-green border-cyber-green/30',
  rare: 'text-cyber-blue border-cyber-blue/30',
  epic: 'text-cyber-purple border-cyber-purple/30',
  legendary: 'text-cyber-yellow border-cyber-yellow/30',
}

function StatInput({
  label,
  name,
  value,
  onChange,
  color = 'cyber-blue',
}: {
  label: string
  name: string
  value: string | number
  onChange: (name: string, value: string) => void
  color?: string
}) {
  return (
    <div>
      <label className={`text-[10px] text-${color} uppercase block mb-1`}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full bg-cyber-black border border-${color}/30 rounded px-3 py-1.5 text-sm text-white focus:border-${color} focus:outline-none transition-colors`}
      />
    </div>
  )
}

export default function AdminCharacter({ character, items, questOptions }: Props) {
  const [form, setForm] = useState({
    name: character.name,
    level: String(character.level),
    xp: String(character.xp),
    credits: String(character.credits),
    creditsPerClick: String(character.creditsPerClick),
    creditsPerSecond: String(character.creditsPerSecond),
    hpMax: String(character.hpMax),
    hpCurrent: String(character.hpCurrent),
    attack: String(character.attack),
    defense: String(character.defense),
    talentPoints: String(character.talentPoints),
    critChance: String(character.critChance),
    critDamage: String(character.critDamage),
    pvpRating: String(character.pvpRating),
    pvpWins: String(character.pvpWins),
    pvpLosses: String(character.pvpLosses),
  })

  const [addItemId, setAddItemId] = useState('')
  const [addItemQty, setAddItemQty] = useState('1')
  const [itemSearch, setItemSearch] = useState('')
  const [editQty, setEditQty] = useState<{ id: number; qty: string } | null>(null)
  const [removeQty, setRemoveQty] = useState<null | { id: number; name: string; max: number; qty: string }>(null)
  const [addQuestId, setAddQuestId] = useState('')
  const [addQuestStatus, setAddQuestStatus] = useState<'active' | 'completed'>('active')
  const [addQuestProgress, setAddQuestProgress] = useState('0')
  const [questEdits, setQuestEdits] = useState<Record<number, { status: 'active' | 'completed'; progress: string }>>(
    Object.fromEntries(
      character.quests.map((quest) => [
        quest.id,
        {
          status: quest.status,
          progress: String(quest.progress),
        },
      ])
    )
  )
  const [runEdits, setRunEdits] = useState<
    Record<number, { status: DungeonRunEntry['status']; enemiesDefeated: string; currentEnemyHp: string; currentEnemyId: string }>
  >(
    Object.fromEntries(
      character.dungeonRuns.map((run) => [
        run.id,
        {
          status: run.status,
          enemiesDefeated: String(run.enemiesDefeated),
          currentEnemyHp: String(run.currentEnemyHp),
          currentEnemyId: run.currentEnemyId === null ? '' : String(run.currentEnemyId),
        },
      ])
    )
  )

  const updateField = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    router.post(`/admin/characters/${character.id}/update`, form)
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addItemId) return
    router.post(`/admin/characters/${character.id}/add-item`, {
      itemId: addItemId,
      quantity: addItemQty,
    })
    setAddItemId('')
    setAddItemQty('1')
    setItemSearch('')
  }

  const handleAddQuest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addQuestId) return

    router.post(`/admin/characters/${character.id}/quests/add`, {
      questId: addQuestId,
      status: addQuestStatus,
      progress: addQuestProgress,
    })
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.type.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const assignedQuestIds = new Set(character.quests.map((quest) => quest.questId))
  const availableQuestOptions = questOptions.filter((quest) => !assignedQuestIds.has(quest.id))

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="text-xs text-gray-600 hover:text-cyber-blue transition-colors">
              &larr; USERS
            </Link>
            <h1 className="text-xl font-bold text-white tracking-widest">{character.name}</h1>
            <span className="text-[10px] text-gray-600">({character.username})</span>
            {character.chosenSpec && (
              <span className="text-[10px] text-cyber-purple bg-cyber-purple/10 px-2 py-0.5 rounded border border-cyber-purple/20">
                {character.chosenSpec}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`Reinitialiser les talents de ${character.name} ?`)) {
                  router.post(`/admin/characters/${character.id}/reset-talents`)
                }
              }}
              className="text-[10px] px-3 py-1.5 rounded border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10 transition-all"
            >
              RESET TALENTS ({character.talentCount})
            </button>
            <button
              onClick={() => {
                if (confirm(`Supprimer le personnage ${character.name} ? Cette action est irreversible.`)) {
                  router.post(`/admin/characters/${character.id}/delete`)
                }
              }}
              className="text-[10px] px-3 py-1.5 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 transition-all"
            >
              SUPPRIMER
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cyber-dark border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-bold text-cyber-blue tracking-widest mb-4">STATISTIQUES</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-cyber-black border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-cyber-blue focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatInput label="Niveau" name="level" value={form.level} onChange={updateField} />
                <StatInput label="XP" name="xp" value={form.xp} onChange={updateField} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatInput label="Credits" name="credits" value={form.credits} onChange={updateField} color="cyber-yellow" />
                <StatInput label="Credits/Click" name="creditsPerClick" value={form.creditsPerClick} onChange={updateField} color="cyber-yellow" />
                <StatInput label="Credits/Sec" name="creditsPerSecond" value={form.creditsPerSecond} onChange={updateField} color="cyber-yellow" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatInput label="HP Max" name="hpMax" value={form.hpMax} onChange={updateField} color="cyber-green" />
                <StatInput label="HP Actuel" name="hpCurrent" value={form.hpCurrent} onChange={updateField} color="cyber-green" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatInput label="Attaque" name="attack" value={form.attack} onChange={updateField} color="cyber-red" />
                <StatInput label="Defense" name="defense" value={form.defense} onChange={updateField} color="cyber-red" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatInput label="Crit Chance (%)" name="critChance" value={form.critChance} onChange={updateField} color="cyber-yellow" />
                <StatInput label="Crit Damage (%)" name="critDamage" value={form.critDamage} onChange={updateField} color="cyber-yellow" />
              </div>

              <StatInput label="Points de talent" name="talentPoints" value={form.talentPoints} onChange={updateField} color="cyber-purple" />

              <div className="pt-2 border-t border-gray-800">
                <div className="text-[10px] uppercase tracking-widest text-cyber-orange mb-3">PVP</div>
                <div className="grid grid-cols-3 gap-3">
                  <StatInput label="ELO" name="pvpRating" value={form.pvpRating} onChange={updateField} color="cyber-orange" />
                  <StatInput label="Victoires" name="pvpWins" value={form.pvpWins} onChange={updateField} color="cyber-orange" />
                  <StatInput label="Defaites" name="pvpLosses" value={form.pvpLosses} onChange={updateField} color="cyber-orange" />
                </div>
              </div>

              <div className="text-[10px] text-gray-700 flex justify-between pt-2 border-t border-gray-800">
                <span>Total clicks: {character.totalClicks.toLocaleString()}</span>
                <span>Spec: {character.chosenSpec || 'aucune'}</span>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded border border-cyber-green/50 text-cyber-green text-xs font-bold tracking-widest hover:bg-cyber-green/10 transition-all"
              >
                SAUVEGARDER
              </button>
            </form>
          </div>

          <div className="bg-cyber-dark border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-bold text-cyber-pink tracking-widest mb-4">
              INVENTAIRE ({character.inventory.length} items)
            </h2>

            <form onSubmit={handleAddItem} className="mb-4 p-3 bg-cyber-black/50 rounded border border-gray-800">
              <div className="text-[10px] text-gray-500 uppercase mb-2">Ajouter un item</div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Rechercher un item..."
                  className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-1.5 text-[11px] text-white placeholder-gray-700 focus:border-cyber-pink/50 focus:outline-none"
                />
                {itemSearch && (
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {filteredItems.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setAddItemId(String(item.id))
                          setItemSearch(item.name)
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[10px] transition-all ${
                          String(item.id) === addItemId
                            ? 'bg-cyber-pink/10 border border-cyber-pink/30'
                            : 'hover:bg-gray-800'
                        } ${RARITY_COLORS[item.rarity]}`}
                      >
                        <span className="mr-1">{item.icon}</span>
                        {item.name}
                        <span className="text-gray-600 ml-2">[{item.type}]</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={addItemQty}
                    onChange={(e) => setAddItemQty(e.target.value)}
                    min="1"
                    className="w-20 bg-cyber-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:border-cyber-pink/50 focus:outline-none"
                    placeholder="Qte"
                  />
                  <button
                    type="submit"
                    disabled={!addItemId}
                    className="flex-1 py-1 rounded border border-cyber-pink/30 text-cyber-pink text-[10px] font-bold hover:bg-cyber-pink/10 transition-all disabled:opacity-30"
                  >
                    AJOUTER
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {character.inventory.length === 0 ? (
                <div className="text-xs text-gray-700 italic text-center py-4">Inventaire vide</div>
              ) : (
                character.inventory.map((inv) => (
                  <div
                    key={inv.id}
                    className={`flex items-center justify-between p-2 rounded border bg-cyber-black/30 ${RARITY_COLORS[inv.rarity]}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{inv.icon}</span>
                      <span className="text-[11px] truncate">{inv.name}</span>
                      {inv.isEquipped && (
                        <span className="text-[9px] bg-cyber-green/20 text-cyber-green px-1 rounded">EQ</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {editQty?.id === inv.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            router.post(`/admin/inventory/${inv.id}/quantity`, { quantity: editQty.qty })
                            setEditQty(null)
                          }}
                          className="flex items-center gap-1"
                        >
                          <input
                            type="number"
                            value={editQty.qty}
                            onChange={(e) => setEditQty({ id: inv.id, qty: e.target.value })}
                            min="1"
                            className="w-14 bg-cyber-black border border-gray-700 rounded px-1 py-0.5 text-[10px] text-white"
                            autoFocus
                          />
                          <button type="submit" className="text-[10px] text-cyber-green hover:underline">OK</button>
                          <button type="button" onClick={() => setEditQty(null)} className="text-[10px] text-gray-600">X</button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setEditQty({ id: inv.id, qty: String(inv.quantity) })}
                          className="text-[10px] text-gray-400 hover:text-white transition-colors"
                        >
                          x{inv.quantity}
                        </button>
                      )}
                      <button
                        onClick={() => setRemoveQty({ id: inv.id, name: inv.name, max: inv.quantity, qty: String(inv.quantity) })}
                        className="text-[10px] text-cyber-red hover:underline"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-cyber-dark border border-cyber-blue/20 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-cyber-blue tracking-widest">QUETES JOUEUR</h2>
              <span className="text-[10px] text-gray-600">{character.quests.length} assignees</span>
            </div>

            <form onSubmit={handleAddQuest} className="mb-4 p-3 rounded border border-cyber-blue/20 bg-cyber-black/40 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Ajouter une quete</div>
              <select
                value={addQuestId}
                onChange={(e) => setAddQuestId(e.target.value)}
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-blue/50 focus:outline-none"
              >
                <option value="">Choisir une quete</option>
                {availableQuestOptions.map((quest) => (
                  <option key={quest.id} value={quest.id}>
                    [{quest.arcTitle}] {quest.title}
                    {quest.seasonName ? ` • ${quest.seasonName}` : ''}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={addQuestStatus}
                  onChange={(e) => setAddQuestStatus(e.target.value === 'completed' ? 'completed' : 'active')}
                  className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-blue/50 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completee</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={addQuestProgress}
                  onChange={(e) => setAddQuestProgress(e.target.value)}
                  className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-blue/50 focus:outline-none"
                  placeholder="Progression"
                />
              </div>
              <button
                type="submit"
                disabled={!addQuestId}
                className="w-full rounded border border-cyber-blue/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10 disabled:opacity-30"
              >
                ASSIGNER
              </button>
            </form>

            <div className="space-y-3 max-h-[520px] overflow-y-auto">
              {character.quests.length === 0 ? (
                <div className="text-xs text-gray-700 italic text-center py-6">Aucune quete sur ce joueur</div>
              ) : (
                character.quests.map((quest) => {
                  const edit = questEdits[quest.id] || {
                    status: quest.status,
                    progress: String(quest.progress),
                  }

                  return (
                    <div key={quest.id} className="rounded border border-gray-800 bg-cyber-black/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white">{quest.title}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-gray-500">
                            {quest.arcTitle}
                            {quest.seasonName ? ` • ${quest.seasonName}` : ''}
                          </div>
                        </div>
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                            quest.questType === 'main'
                              ? 'border-cyber-blue/30 bg-cyber-blue/10 text-cyber-blue'
                              : 'border-cyber-yellow/30 bg-cyber-yellow/10 text-cyber-yellow'
                          }`}
                        >
                          {quest.questType === 'main' ? 'MAIN' : 'SEASON'}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <select
                          value={edit.status}
                          onChange={(e) =>
                            setQuestEdits((prev) => ({
                              ...prev,
                              [quest.id]: {
                                ...edit,
                                status: e.target.value === 'completed' ? 'completed' : 'active',
                              },
                            }))
                          }
                          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-blue/50 focus:outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completee</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          max={quest.targetValue}
                          value={edit.progress}
                          onChange={(e) =>
                            setQuestEdits((prev) => ({
                              ...prev,
                              [quest.id]: {
                                ...edit,
                                progress: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-blue/50 focus:outline-none"
                        />
                      </div>

                      <div className="mt-2 text-[10px] text-gray-600">
                        {quest.objectiveType} • {quest.progress}/{quest.targetValue}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.post(`/admin/character-quests/${quest.id}/update`, {
                              status: edit.status,
                              progress: edit.progress,
                            })
                          }
                          className="rounded border border-cyber-green/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10"
                        >
                          SAUVER
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Retirer la quete "${quest.title}" de ce joueur ?`)) {
                              router.post(`/admin/character-quests/${quest.id}/delete`)
                            }
                          }}
                          className="rounded border border-cyber-red/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
                        >
                          RETIRER
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="bg-cyber-dark border border-cyber-orange/20 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-cyber-orange tracking-widest">DONJONS</h2>
              <span className="text-[10px] text-gray-600">{character.dungeonRuns.length} runs</span>
            </div>

            <div className="space-y-3 max-h-[650px] overflow-y-auto">
              {character.dungeonRuns.length === 0 ? (
                <div className="text-xs text-gray-700 italic text-center py-6">Aucun run donjon</div>
              ) : (
                character.dungeonRuns.map((run) => {
                  const edit = runEdits[run.id] || {
                    status: run.status,
                    enemiesDefeated: String(run.enemiesDefeated),
                    currentEnemyHp: String(run.currentEnemyHp),
                    currentEnemyId: run.currentEnemyId === null ? '' : String(run.currentEnemyId),
                  }

                  return (
                    <div key={run.id} className="rounded border border-gray-800 bg-cyber-black/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-white">
                            Floor {run.floorNumber} • {run.floorName}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-gray-500">
                            Run #{run.id}
                            {run.partyId ? ` • Party #${run.partyId}` : ' • Solo'}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-600 text-right">
                          <div>{new Date(run.startedAt).toLocaleString('fr-FR')}</div>
                          <div>{run.endedAt ? `fin ${new Date(run.endedAt).toLocaleString('fr-FR')}` : 'en cours'}</div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <select
                          value={edit.status}
                          onChange={(e) =>
                            setRunEdits((prev) => ({
                              ...prev,
                              [run.id]: {
                                ...edit,
                                status: e.target.value as DungeonRunEntry['status'],
                              },
                            }))
                          }
                          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-orange/50 focus:outline-none"
                        >
                          <option value="in_progress">In progress</option>
                          <option value="victory">Victory</option>
                          <option value="defeat">Defeat</option>
                          <option value="fled">Fled</option>
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={edit.enemiesDefeated}
                          onChange={(e) =>
                            setRunEdits((prev) => ({
                              ...prev,
                              [run.id]: {
                                ...edit,
                                enemiesDefeated: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-orange/50 focus:outline-none"
                          placeholder="Enemies defeated"
                        />
                        <input
                          type="number"
                          min="0"
                          value={edit.currentEnemyHp}
                          onChange={(e) =>
                            setRunEdits((prev) => ({
                              ...prev,
                              [run.id]: {
                                ...edit,
                                currentEnemyHp: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-orange/50 focus:outline-none"
                          placeholder="Enemy HP"
                        />
                        <input
                          type="number"
                          min="0"
                          value={edit.currentEnemyId}
                          onChange={(e) =>
                            setRunEdits((prev) => ({
                              ...prev,
                              [run.id]: {
                                ...edit,
                                currentEnemyId: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white focus:border-cyber-orange/50 focus:outline-none"
                          placeholder="Enemy ID"
                        />
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.post(`/admin/dungeon-runs/${run.id}/update`, {
                              status: edit.status,
                              enemiesDefeated: edit.enemiesDefeated,
                              currentEnemyHp: edit.currentEnemyHp,
                              currentEnemyId: edit.currentEnemyId,
                            })
                          }
                          className="rounded border border-cyber-green/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10"
                        >
                          SAUVER
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer le run #${run.id} ?`)) {
                              router.post(`/admin/dungeon-runs/${run.id}/delete`)
                            }
                          }}
                          className="rounded border border-cyber-red/30 px-3 py-1.5 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
                        >
                          SUPPRIMER
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {removeQty && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-cyber-black/80 px-4">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setRemoveQty(null)}
            className="absolute inset-0"
          />
          <div className="relative z-[91] w-full max-w-sm rounded-xl border border-cyber-red/30 bg-cyber-dark p-5 shadow-2xl">
            <div className="text-[10px] uppercase tracking-[0.24em] text-cyber-red">Retrait d item</div>
            <h3 className="mt-1 text-lg font-bold text-white">{removeQty.name}</h3>
            <p className="mt-1 text-xs text-gray-500">Choisis combien retirer de l inventaire du joueur.</p>

            <div className="mt-4">
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500">
                Quantite
              </label>
              <input
                type="number"
                min="1"
                max={removeQty.max}
                value={removeQty.qty}
                onChange={(e) => setRemoveQty((prev) => (prev ? { ...prev, qty: e.target.value } : prev))}
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-red/50 focus:outline-none"
              />
              <div className="mt-1 text-[10px] text-gray-600">Max: {removeQty.max}</div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRemoveQty(null)}
                className="rounded px-3 py-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-white"
              >
                ANNULER
              </button>
              <button
                type="button"
                onClick={() => {
                  router.post(`/admin/inventory/${removeQty.id}/remove`, {
                    quantity: removeQty.qty,
                  })
                  setRemoveQty(null)
                }}
                className="rounded border border-cyber-red/30 px-3 py-2 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
              >
                RETIRER
              </button>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  )
}
