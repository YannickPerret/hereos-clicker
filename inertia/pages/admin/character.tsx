import { router } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
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
  inventory: InventoryEntry[]
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

interface Props {
  character: CharacterData
  items: ItemData[]
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

export default function AdminCharacter({ character, items }: Props) {
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
  })

  const [addItemId, setAddItemId] = useState('')
  const [addItemQty, setAddItemQty] = useState('1')
  const [itemSearch, setItemSearch] = useState('')
  const [editQty, setEditQty] = useState<{ id: number; qty: string } | null>(null)

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

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.type.toLowerCase().includes(itemSearch.toLowerCase())
  )

  return (
    <GameLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="text-xs text-gray-600 hover:text-cyber-blue transition-colors">
              &larr; USERS
            </Link>
            <h1 className="text-xl font-bold text-white tracking-widest">{character.name}</h1>
            <span className="text-[10px] text-gray-600">
              ({character.username})
            </span>
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
          {/* ── Stats Panel ── */}
          <div className="bg-cyber-dark border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-bold text-cyber-blue tracking-widest mb-4">STATISTIQUES</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-cyber-black border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-cyber-blue focus:outline-none transition-colors"
                />
              </div>

              {/* Level & XP */}
              <div className="grid grid-cols-2 gap-3">
                <StatInput label="Niveau" name="level" value={form.level} onChange={updateField} />
                <StatInput label="XP" name="xp" value={form.xp} onChange={updateField} />
              </div>

              {/* Credits */}
              <div className="grid grid-cols-3 gap-3">
                <StatInput label="Credits" name="credits" value={form.credits} onChange={updateField} color="cyber-yellow" />
                <StatInput label="Credits/Click" name="creditsPerClick" value={form.creditsPerClick} onChange={updateField} color="cyber-yellow" />
                <StatInput label="Credits/Sec" name="creditsPerSecond" value={form.creditsPerSecond} onChange={updateField} color="cyber-yellow" />
              </div>

              {/* Combat */}
              <div className="grid grid-cols-2 gap-3">
                <StatInput label="HP Max" name="hpMax" value={form.hpMax} onChange={updateField} color="cyber-green" />
                <StatInput label="HP Actuel" name="hpCurrent" value={form.hpCurrent} onChange={updateField} color="cyber-green" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatInput label="Attaque" name="attack" value={form.attack} onChange={updateField} color="cyber-red" />
                <StatInput label="Defense" name="defense" value={form.defense} onChange={updateField} color="cyber-red" />
              </div>

              {/* Crit */}
              <div className="grid grid-cols-2 gap-3">
                <StatInput label="Crit Chance (%)" name="critChance" value={form.critChance} onChange={updateField} color="cyber-yellow" />
                <StatInput label="Crit Damage (%)" name="critDamage" value={form.critDamage} onChange={updateField} color="cyber-yellow" />
              </div>

              {/* Talent Points */}
              <StatInput label="Points de talent" name="talentPoints" value={form.talentPoints} onChange={updateField} color="cyber-purple" />

              {/* Info */}
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

          {/* ── Inventory Panel ── */}
          <div className="bg-cyber-dark border border-gray-800 rounded-lg p-5">
            <h2 className="text-sm font-bold text-cyber-pink tracking-widest mb-4">
              INVENTAIRE ({character.inventory.length} items)
            </h2>

            {/* Add item form */}
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

            {/* Inventory list */}
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
                        onClick={() => {
                          if (confirm(`Retirer ${inv.name} de l'inventaire ?`)) {
                            router.post(`/admin/inventory/${inv.id}/remove`)
                          }
                        }}
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
      </div>
    </GameLayout>
  )
}
