import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface LootEntry {
  id: number
  itemId: number
  itemName: string
  dropChance: number
}

interface EnemyEntry {
  id: number
  name: string
  description: string
  hp: number
  attack: number
  defense: number
  xpReward: number
  creditsRewardMin: number
  creditsRewardMax: number
  tier: number
  critChance: number
  critDamage: number
  loot: LootEntry[]
}

interface Props {
  enemies: EnemyEntry[]
  items: { id: number; name: string; rarity: string }[]
}

const TIER_COLORS: Record<number, string> = {
  1: 'text-gray-400', 2: 'text-cyber-blue', 3: 'text-cyber-purple', 4: 'text-cyber-yellow',
}

export default function AdminEnemies({ enemies, items }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [lootAddId, setLootAddId] = useState<number | null>(null)
  const [newLootItemId, setNewLootItemId] = useState<number>(items[0]?.id || 0)
  const [newLootChance, setNewLootChance] = useState('0.1')
  const [showCreate, setShowCreate] = useState(false)
  const [newEnemy, setNewEnemy] = useState({ name: '', description: '', hp: '50', attack: '10', defense: '5', xpReward: '10', creditsRewardMin: '5', creditsRewardMax: '15', tier: '1', critChance: '5', critDamage: '150' })

  const startEdit = (enemy: EnemyEntry) => {
    setEditId(enemy.id)
    setEditData({ ...enemy })
  }

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-cyber-red tracking-widest">GESTION ENNEMIS & LOOT</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreate(!showCreate)} className="text-[10px] px-3 py-1.5 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase">+ Nouvel ennemi</button>
            <a href="/admin" className="text-[10px] text-gray-500 hover:text-cyber-red uppercase">&larr; ADMIN</a>
          </div>
        </div>

        {props.errors?.message && (
          <div className="mb-4 bg-cyber-red/10 border border-cyber-red/50 rounded-lg px-4 py-3 text-cyber-red text-sm">{props.errors.message}</div>
        )}
        {props.success && (
          <div className="mb-4 bg-cyber-green/10 border border-cyber-green/50 rounded-lg px-4 py-3 text-cyber-green text-sm">{props.success as string}</div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg p-4 mb-6">
            <h2 className="text-sm uppercase tracking-widest text-cyber-green mb-3">CREER UN ENNEMI</h2>
            <form onSubmit={(e) => { e.preventDefault(); router.post('/admin/enemies/create', newEnemy); setShowCreate(false) }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[9px] text-gray-600 uppercase">Nom</label>
                <input type="text" value={newEnemy.name} onChange={(e) => setNewEnemy({ ...newEnemy, name: e.target.value })} required className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 uppercase">Tier</label>
                <input type="number" value={newEnemy.tier} onChange={(e) => setNewEnemy({ ...newEnemy, tier: e.target.value })} min={1} max={4} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 uppercase">HP</label>
                <input type="number" value={newEnemy.hp} onChange={(e) => setNewEnemy({ ...newEnemy, hp: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 uppercase">ATK</label>
                <input type="number" value={newEnemy.attack} onChange={(e) => setNewEnemy({ ...newEnemy, attack: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 uppercase">DEF</label>
                <input type="number" value={newEnemy.defense} onChange={(e) => setNewEnemy({ ...newEnemy, defense: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 uppercase">XP Reward</label>
                <input type="number" value={newEnemy.xpReward} onChange={(e) => setNewEnemy({ ...newEnemy, xpReward: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 uppercase">Credits Min</label>
                <input type="number" value={newEnemy.creditsRewardMin} onChange={(e) => setNewEnemy({ ...newEnemy, creditsRewardMin: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-gray-600 uppercase">Credits Max</label>
                <input type="number" value={newEnemy.creditsRewardMax} onChange={(e) => setNewEnemy({ ...newEnemy, creditsRewardMax: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="text-[9px] text-gray-600 uppercase">Description</label>
                <input type="text" value={newEnemy.description} onChange={(e) => setNewEnemy({ ...newEnemy, description: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none" />
              </div>
              <div className="col-span-2 md:col-span-4">
                <button type="submit" className="text-xs px-4 py-2 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase">Creer</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {enemies.map((enemy) => (
            <div key={enemy.id} className="bg-cyber-dark border border-gray-800 rounded-lg p-4">
              {editId === enemy.id ? (
                <form onSubmit={(e) => { e.preventDefault(); router.post(`/admin/enemies/${enemy.id}/update`, editData); setEditId(null) }} className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Nom</label>
                      <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Tier</label>
                      <input type="number" value={editData.tier} onChange={(e) => setEditData({ ...editData, tier: e.target.value })} min={1} max={4} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">HP</label>
                      <input type="number" value={editData.hp} onChange={(e) => setEditData({ ...editData, hp: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">ATK</label>
                      <input type="number" value={editData.attack} onChange={(e) => setEditData({ ...editData, attack: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">DEF</label>
                      <input type="number" value={editData.defense} onChange={(e) => setEditData({ ...editData, defense: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">XP Reward</label>
                      <input type="number" value={editData.xpReward} onChange={(e) => setEditData({ ...editData, xpReward: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Credits Min</label>
                      <input type="number" value={editData.creditsRewardMin} onChange={(e) => setEditData({ ...editData, creditsRewardMin: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Credits Max</label>
                      <input type="number" value={editData.creditsRewardMax} onChange={(e) => setEditData({ ...editData, creditsRewardMax: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Crit %</label>
                      <input type="number" value={editData.critChance} onChange={(e) => setEditData({ ...editData, critChance: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-gray-600 uppercase">Crit DMG %</label>
                      <input type="number" value={editData.critDamage} onChange={(e) => setEditData({ ...editData, critDamage: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-600 uppercase">Description</label>
                    <input type="text" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                  </div>
                  <div className="flex gap-1">
                    <button type="submit" className="text-[10px] px-3 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase">Sauvegarder</button>
                    <button type="button" onClick={() => setEditId(null)} className="text-[10px] px-3 py-1 text-gray-600 uppercase">Annuler</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-bold ${TIER_COLORS[enemy.tier] || 'text-gray-400'}`}>{enemy.name}</span>
                        <span className="text-[9px] bg-cyber-red/20 text-cyber-red px-1.5 py-0.5 rounded">T{enemy.tier}</span>
                        <span className="text-[9px] text-gray-700">#{enemy.id}</span>
                      </div>
                      <div className="text-[10px] text-gray-600 mb-2">{enemy.description}</div>
                      <div className="flex flex-wrap gap-3 text-[10px]">
                        <span className="text-cyber-green">HP: {enemy.hp}</span>
                        <span className="text-cyber-red">ATK: {enemy.attack}</span>
                        <span className="text-cyber-blue">DEF: {enemy.defense}</span>
                        <span className="text-cyber-yellow">XP: {enemy.xpReward}</span>
                        <span className="text-cyber-yellow">Credits: {enemy.creditsRewardMin}-{enemy.creditsRewardMax}</span>
                        <span className="text-gray-500">Crit: {enemy.critChance}% / {enemy.critDamage}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(enemy)} className="text-[10px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 uppercase">Edit</button>
                      <button onClick={() => { if (confirm(`Supprimer "${enemy.name}" ?`)) router.post(`/admin/enemies/${enemy.id}/delete`) }} className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 uppercase">Suppr</button>
                    </div>
                  </div>

                  {/* Loot table */}
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-600 uppercase tracking-widest">Loot Table</span>
                      <button onClick={() => setLootAddId(lootAddId === enemy.id ? null : enemy.id)} className="text-[9px] px-2 py-0.5 rounded border border-cyber-green/20 text-cyber-green hover:bg-cyber-green/10">+ Ajouter</button>
                    </div>

                    {enemy.loot.length === 0 ? (
                      <div className="text-[10px] text-gray-700">Aucun loot configure</div>
                    ) : (
                      <div className="space-y-1">
                        {enemy.loot.map((l) => (
                          <div key={l.id} className="flex items-center justify-between bg-cyber-black/50 rounded px-2 py-1">
                            <span className="text-[10px] text-white">{l.itemName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-cyber-yellow">{(l.dropChance * 100).toFixed(1)}%</span>
                              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.post(`/admin/loot/${l.id}/update`, { dropChance: fd.get('dropChance') }) }} className="flex items-center gap-1">
                                <input type="number" name="dropChance" defaultValue={l.dropChance} step="0.01" min="0" max="1" className="w-16 bg-cyber-black border border-gray-800 rounded px-1 py-0.5 text-[10px] text-white focus:outline-none" />
                                <button type="submit" className="text-[9px] text-cyber-green">OK</button>
                              </form>
                              <button onClick={() => router.post(`/admin/loot/${l.id}/delete`)} className="text-[9px] text-cyber-red hover:underline">X</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {lootAddId === enemy.id && (
                      <form onSubmit={(e) => { e.preventDefault(); router.post(`/admin/enemies/${enemy.id}/add-loot`, { itemId: newLootItemId, dropChance: newLootChance }); setLootAddId(null) }} className="mt-2 flex items-center gap-2">
                        <select value={newLootItemId} onChange={(e) => setNewLootItemId(Number(e.target.value))} className="flex-1 bg-cyber-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none">
                          {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.rarity})</option>)}
                        </select>
                        <input type="number" value={newLootChance} onChange={(e) => setNewLootChance(e.target.value)} step="0.01" min="0" max="1" placeholder="0.10" className="w-20 bg-cyber-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none" />
                        <button type="submit" className="text-[10px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10">Ajouter</button>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </GameLayout>
  )
}
