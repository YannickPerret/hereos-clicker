import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface Reward {
  id?: number
  rewardType: 'credits' | 'xp' | 'item'
  rewardValue: number
  rewardItemId: number | null
  rewardItemName?: string | null
}

interface DayConfig {
  id: number
  dayNumber: number
  isActive: boolean
  rewards: Reward[]
}

interface Item {
  id: number
  name: string
}

interface Props {
  configs: DayConfig[]
  items: Item[]
}

function RewardRow({
  reward,
  items,
  onChange,
  onRemove,
}: {
  reward: Reward
  items: Item[]
  onChange: (r: Reward) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={reward.rewardType}
        onChange={(e) =>
          onChange({ ...reward, rewardType: e.target.value as Reward['rewardType'], rewardItemId: null })
        }
        className="bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
      >
        <option value="credits">Credits</option>
        <option value="xp">XP</option>
        <option value="item">Item</option>
      </select>
      <input
        type="number"
        min={1}
        value={reward.rewardValue}
        onChange={(e) => onChange({ ...reward, rewardValue: Number(e.target.value) })}
        className="w-24 bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
        placeholder={reward.rewardType === 'item' ? 'Qte' : 'Valeur'}
      />
      {reward.rewardType === 'item' && (
        <select
          value={reward.rewardItemId ?? ''}
          onChange={(e) => onChange({ ...reward, rewardItemId: e.target.value ? Number(e.target.value) : null })}
          className="flex-1 bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="">-- Item --</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="text-[10px] px-2 py-1 text-cyber-red hover:text-red-400"
      >
        ✕
      </button>
    </div>
  )
}

const emptyReward = (): Reward => ({ rewardType: 'credits', rewardValue: 250, rewardItemId: null })

export default function DailyRewardsAdmin({ configs, items }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [newDayNumber, setNewDayNumber] = useState(1)
  const [newIsActive, setNewIsActive] = useState(true)
  const [newRewards, setNewRewards] = useState<Reward[]>([emptyReward()])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDayNumber, setEditDayNumber] = useState(1)
  const [editIsActive, setEditIsActive] = useState(true)
  const [editRewards, setEditRewards] = useState<Reward[]>([])

  const startEdit = (config: DayConfig) => {
    setEditingId(config.id)
    setEditDayNumber(config.dayNumber)
    setEditIsActive(config.isActive)
    setEditRewards(config.rewards.length > 0 ? config.rewards.map((r) => ({ ...r })) : [emptyReward()])
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    router.post('/admin/daily-rewards/create', {
      dayNumber: newDayNumber,
      isActive: newIsActive ? 'true' : 'false',
      rewards: newRewards,
    } as any)
    setNewDayNumber(1)
    setNewIsActive(true)
    setNewRewards([emptyReward()])
  }

  const handleUpdate = (id: number) => {
    router.post(`/admin/daily-rewards/${id}/update`, {
      dayNumber: editDayNumber,
      isActive: editIsActive ? 'true' : 'false',
      rewards: editRewards,
    } as any)
    setEditingId(null)
  }

  const updateNewReward = (index: number, r: Reward) => {
    setNewRewards((prev) => prev.map((item, i) => (i === index ? r : item)))
  }

  const removeNewReward = (index: number) => {
    setNewRewards((prev) => prev.filter((_, i) => i !== index))
  }

  const updateEditReward = (index: number, r: Reward) => {
    setEditRewards((prev) => prev.map((item, i) => (i === index ? r : item)))
  }

  const removeEditReward = (index: number) => {
    setEditRewards((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <GameLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-cyber-yellow tracking-widest">RECOMPENSES JOURNALIERES</h1>
          <a href="/admin" className="text-[10px] text-gray-500 hover:text-cyber-yellow uppercase">
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

        <div className="bg-cyber-dark border border-cyber-yellow/30 rounded-lg p-4 mb-6">
          <h2 className="text-sm uppercase tracking-widest text-cyber-yellow mb-3">AJOUTER / REMPLACER UN JOUR</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex items-end gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Jour</label>
                <input
                  type="number"
                  min={1}
                  value={newDayNumber}
                  onChange={(e) => setNewDayNumber(Number(e.target.value))}
                  className="w-20 bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-yellow/50 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                />
                Actif
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-gray-500 uppercase">Recompenses</div>
              {newRewards.map((reward, i) => (
                <RewardRow
                  key={i}
                  reward={reward}
                  items={items}
                  onChange={(r) => updateNewReward(i, r)}
                  onRemove={() => removeNewReward(i)}
                />
              ))}
              <button
                type="button"
                onClick={() => setNewRewards((prev) => [...prev, emptyReward()])}
                className="text-[10px] px-3 py-1 rounded border border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10 uppercase"
              >
                + Ajouter recompense
              </button>
            </div>

            <button
              type="submit"
              className="rounded border border-cyber-yellow/30 px-4 py-2 text-xs uppercase tracking-widest text-cyber-yellow hover:bg-cyber-yellow/10 transition-all"
            >
              Sauver
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {configs.length === 0 ? (
            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-8 text-center text-gray-600 text-sm">
              Aucune recompense configuree
            </div>
          ) : (
            configs.map((config) => (
              <div
                key={config.id}
                className={`bg-cyber-dark border rounded-lg p-4 ${config.isActive ? 'border-cyber-yellow/30' : 'border-gray-800 opacity-60'}`}
              >
                {editingId === config.id ? (
                  <div className="space-y-3">
                    <div className="flex items-end gap-3">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase block mb-1">Jour</label>
                        <input
                          type="number"
                          min={1}
                          value={editDayNumber}
                          onChange={(e) => setEditDayNumber(Number(e.target.value))}
                          className="w-20 bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                        />
                        Actif
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] text-gray-500 uppercase">Recompenses</div>
                      {editRewards.map((reward, i) => (
                        <RewardRow
                          key={i}
                          reward={reward}
                          items={items}
                          onChange={(r) => updateEditReward(i, r)}
                          onRemove={() => removeEditReward(i)}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditRewards((prev) => [...prev, emptyReward()])}
                        className="text-[10px] px-3 py-1 rounded border border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10 uppercase"
                      >
                        + Ajouter recompense
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(config.id)}
                        className="text-[10px] px-3 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
                      >
                        Sauver
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
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-cyber-yellow">JOUR {config.dayNumber}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${config.isActive ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' : 'bg-gray-800 text-gray-600 border border-gray-700'}`}
                        >
                          {config.isActive ? 'ACTIF' : 'INACTIF'}
                        </span>
                      </div>
                      {config.rewards.length === 0 ? (
                        <div className="text-xs text-gray-600 italic">Aucune recompense</div>
                      ) : (
                        <div className="space-y-0.5">
                          {config.rewards.map((r, i) => (
                            <div key={i} className="text-xs text-gray-300">
                              {r.rewardType === 'item'
                                ? `${r.rewardValue}x ${r.rewardItemName || 'item'}`
                                : `+${r.rewardValue} ${r.rewardType}`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(config)}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 uppercase"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer la recompense du jour ${config.dayNumber} ?`)) {
                            router.post(`/admin/daily-rewards/${config.id}/delete`)
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
      </div>
    </GameLayout>
  )
}
