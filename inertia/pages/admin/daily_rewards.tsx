import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface DailyReward {
  id: number
  dayNumber: number
  rewardType: 'credits' | 'xp' | 'item'
  rewardValue: number
  rewardItemId: number | null
  rewardItemName: string | null
  isActive: boolean
}

interface Item {
  id: number
  name: string
}

interface Props {
  rewards: DailyReward[]
  items: Item[]
}

export default function DailyRewardsAdmin({ rewards, items }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [newDayNumber, setNewDayNumber] = useState(1)
  const [newRewardType, setNewRewardType] = useState<'credits' | 'xp' | 'item'>('credits')
  const [newRewardValue, setNewRewardValue] = useState(250)
  const [newRewardItemId, setNewRewardItemId] = useState('')
  const [newIsActive, setNewIsActive] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDayNumber, setEditDayNumber] = useState(1)
  const [editRewardType, setEditRewardType] = useState<'credits' | 'xp' | 'item'>('credits')
  const [editRewardValue, setEditRewardValue] = useState(1)
  const [editRewardItemId, setEditRewardItemId] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const startEdit = (reward: DailyReward) => {
    setEditingId(reward.id)
    setEditDayNumber(reward.dayNumber)
    setEditRewardType(reward.rewardType)
    setEditRewardValue(reward.rewardValue)
    setEditRewardItemId(reward.rewardItemId ? String(reward.rewardItemId) : '')
    setEditIsActive(reward.isActive)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    router.post('/admin/daily-rewards/create', {
      dayNumber: newDayNumber,
      rewardType: newRewardType,
      rewardValue: newRewardValue,
      rewardItemId: newRewardType === 'item' ? newRewardItemId : '',
      isActive: newIsActive ? 'true' : 'false',
    })
    setNewDayNumber(1)
    setNewRewardType('credits')
    setNewRewardValue(250)
    setNewRewardItemId('')
    setNewIsActive(true)
  }

  const handleUpdate = (id: number) => {
    router.post(`/admin/daily-rewards/${id}/update`, {
      dayNumber: editDayNumber,
      rewardType: editRewardType,
      rewardValue: editRewardValue,
      rewardItemId: editRewardType === 'item' ? editRewardItemId : '',
      isActive: editIsActive ? 'true' : 'false',
    })
    setEditingId(null)
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
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">Jour</label>
              <input
                type="number"
                min={1}
                value={newDayNumber}
                onChange={(e) => setNewDayNumber(Number(e.target.value))}
                className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-yellow/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">Type</label>
              <select
                value={newRewardType}
                onChange={(e) => setNewRewardType(e.target.value as 'credits' | 'xp' | 'item')}
                className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-yellow/50 focus:outline-none"
              >
                <option value="credits">Credits</option>
                <option value="xp">XP</option>
                <option value="item">Item</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">
                {newRewardType === 'item' ? 'Quantite' : 'Valeur'}
              </label>
              <input
                type="number"
                min={1}
                value={newRewardValue}
                onChange={(e) => setNewRewardValue(Number(e.target.value))}
                className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:border-cyber-yellow/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">Item</label>
              <select
                value={newRewardItemId}
                onChange={(e) => setNewRewardItemId(e.target.value)}
                disabled={newRewardType !== 'item'}
                className="w-full bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white disabled:opacity-40 focus:border-cyber-yellow/50 focus:outline-none"
              >
                <option value="">Aucun</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                />
                Actif
              </label>
              <button
                type="submit"
                className="flex-1 rounded border border-cyber-yellow/30 px-4 py-2 text-xs uppercase tracking-widest text-cyber-yellow hover:bg-cyber-yellow/10 transition-all"
              >
                Sauver
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-3">
          {rewards.length === 0 ? (
            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-8 text-center text-gray-600 text-sm">
              Aucune recompense configuree
            </div>
          ) : (
            rewards.map((reward) => (
              <div
                key={reward.id}
                className={`bg-cyber-dark border rounded-lg p-4 ${reward.isActive ? 'border-cyber-yellow/30' : 'border-gray-800 opacity-60'}`}
              >
                {editingId === reward.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="number"
                      min={1}
                      value={editDayNumber}
                      onChange={(e) => setEditDayNumber(Number(e.target.value))}
                      className="bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none"
                    />
                    <select
                      value={editRewardType}
                      onChange={(e) => setEditRewardType(e.target.value as 'credits' | 'xp' | 'item')}
                      className="bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="credits">Credits</option>
                      <option value="xp">XP</option>
                      <option value="item">Item</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={editRewardValue}
                      onChange={(e) => setEditRewardValue(Number(e.target.value))}
                      className="bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none"
                    />
                    <select
                      value={editRewardItemId}
                      onChange={(e) => setEditRewardItemId(e.target.value)}
                      disabled={editRewardType !== 'item'}
                      className="bg-cyber-black border border-gray-800 rounded px-3 py-2 text-sm text-white disabled:opacity-40 focus:outline-none"
                    >
                      <option value="">Aucun</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                        />
                        Actif
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(reward.id)}
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
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-cyber-yellow">JOUR {reward.dayNumber}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${reward.isActive ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' : 'bg-gray-800 text-gray-600 border border-gray-700'}`}>
                          {reward.isActive ? 'ACTIF' : 'INACTIF'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300">
                        {reward.rewardType === 'item'
                          ? `${reward.rewardValue}x ${reward.rewardItemName || 'item'}`
                          : `+${reward.rewardValue} ${reward.rewardType}`}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(reward)}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 uppercase"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Supprimer la recompense du jour ${reward.dayNumber} ?`)) {
                            router.post(`/admin/daily-rewards/${reward.id}/delete`)
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
