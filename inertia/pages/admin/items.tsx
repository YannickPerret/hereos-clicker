import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface ShopInfo {
  id: number
  priceOverride: number | null
  stock: number | null
  isActive: boolean
}

interface ItemEntry {
  id: number
  name: string
  description: string
  nameEn: string | null
  descriptionEn: string | null
  type: string
  rarity: string
  icon: string
  effectType: string | null
  effectValue: number | null
  basePrice: number
  shop: ShopInfo | null
}

interface Props {
  items: ItemEntry[]
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-cyber-green',
  rare: 'text-cyber-blue',
  epic: 'text-cyber-purple',
  legendary: 'text-cyber-yellow',
}

const TYPE_LABELS: Record<string, string> = {
  weapon: 'ARME',
  armor: 'ARMURE',
  implant: 'IMPLANT',
  clothes_hair: 'CHEVEUX',
  clothes_face: 'VISAGE',
  clothes_outer: 'HAUT',
  clothes_legs: 'BAS',
  consumable: 'CONSO',
  upgrade: 'UPGRADE',
}

const EFFECT_TYPE_OPTIONS = [
  { value: '', label: 'Aucun' },
  { value: 'attack_boost', label: 'ATK Boost' },
  { value: 'defense_boost', label: 'DEF Boost' },
  { value: 'click_multiplier', label: 'CPC %' },
  { value: 'permanent_click', label: 'CPC Permanent %' },
  { value: 'hp_restore', label: 'Soin HP' },
  { value: 'xp_boost', label: 'Boost XP' },
  { value: 'talent_respec', label: 'Talent Respec' },
] as const

export default function AdminItems({ items }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [filter, setFilter] = useState<string>('all')
  const [editId, setEditId] = useState<number | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [showCreate, setShowCreate] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    nameEn: '',
    descriptionEn: '',
    type: 'weapon',
    rarity: 'common',
    icon: '',
    effectType: '',
    effectValue: '',
    basePrice: '100',
  })
  const [shopEditId, setShopEditId] = useState<number | null>(null)
  const [shopData, setShopData] = useState<any>({})

  const filtered =
    filter === 'all'
      ? items
      : filter === 'shop'
        ? items.filter((i) => i.shop)
        : items.filter((i) => i.type === filter)

  const startEdit = (item: ItemEntry) => {
    setEditId(item.id)
    setEditData({ ...item, effectValue: item.effectValue ?? '', basePrice: item.basePrice })
  }

  const buildItemPayload = (data: any) => ({
    name: data.name,
    description: data.description,
    nameEn: data.nameEn ?? '',
    descriptionEn: data.descriptionEn ?? '',
    type: data.type,
    rarity: data.rarity,
    icon: data.icon,
    effectType: data.effectType ?? '',
    effectValue: data.effectValue,
    basePrice: data.basePrice,
  })

  const startShopEdit = (item: ItemEntry) => {
    if (item.shop) {
      setShopEditId(item.id)
      setShopData({
        priceOverride: item.shop.priceOverride ?? '',
        stock: item.shop.stock ?? '',
        isActive: item.shop.isActive,
      })
    }
  }

  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-cyber-red tracking-widest">GESTION ITEMS & SHOP</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="text-[10px] px-3 py-1.5 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
            >
              + Nouvel item
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

        {/* Create form */}
        {showCreate && (
          <div className="bg-cyber-dark border border-cyber-green/30 rounded-lg p-4 mb-6">
            <h2 className="text-sm uppercase tracking-widest text-cyber-green mb-3">
              CREER UN ITEM
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                router.post('/admin/items/create', newItem)
                setShowCreate(false)
              }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Nom</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  required
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:border-cyber-green/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Nom EN</label>
                <input
                  type="text"
                  value={newItem.nameEn}
                  onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:border-cyber-green/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Type</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">Rarete</label>
                <select
                  value={newItem.rarity}
                  onChange={(e) => setNewItem({ ...newItem, rarity: e.target.value })}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  {Object.keys(RARITY_COLORS).map((k) => (
                    <option key={k} value={k}>
                      {k.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">
                  Prix de base
                </label>
                <input
                  type="number"
                  value={newItem.basePrice}
                  onChange={(e) => setNewItem({ ...newItem, basePrice: e.target.value })}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-500 uppercase block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-500 uppercase block mb-1">
                  Description EN
                </label>
                <input
                  type="text"
                  value={newItem.descriptionEn}
                  onChange={(e) => setNewItem({ ...newItem, descriptionEn: e.target.value })}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">
                  Effect Type
                </label>
                <select
                  value={newItem.effectType}
                  onChange={(e) => setNewItem({ ...newItem, effectType: e.target.value })}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                >
                  {EFFECT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value || 'none'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase block mb-1">
                  Effect Value
                </label>
                <input
                  type="number"
                  value={newItem.effectValue}
                  onChange={(e) => setNewItem({ ...newItem, effectValue: e.target.value })}
                  className="w-full bg-cyber-black border border-gray-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="col-span-2 md:col-span-4">
                <button
                  type="submit"
                  className="text-xs px-4 py-2 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
                >
                  Creer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {[
            'all',
            'shop',
            'weapon',
            'armor',
            'implant',
            'clothes_hair',
            'clothes_face',
            'clothes_outer',
            'clothes_legs',
            'consumable',
            'upgrade',
          ].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-3 py-1 rounded border uppercase ${
                filter === f
                  ? 'border-cyber-blue/50 text-cyber-blue bg-cyber-blue/10'
                  : 'border-gray-800 text-gray-600 hover:text-white'
              }`}
            >
              {f === 'all' ? 'TOUS' : f === 'shop' ? 'DANS LE SHOP' : TYPE_LABELS[f] || f}
              <span className="ml-1 text-gray-700">
                (
                {f === 'all'
                  ? items.length
                  : f === 'shop'
                    ? items.filter((i) => i.shop).length
                    : items.filter((i) => i.type === f).length}
                )
              </span>
            </button>
          ))}
        </div>

        {/* Items table */}
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-cyber-dark border rounded-lg p-3 ${item.shop ? 'border-cyber-green/20' : 'border-gray-800'}`}
            >
              {editId === item.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    router.post(`/admin/items/${item.id}/update`, buildItemPayload(editData))
                    setEditId(null)
                  }}
                  className="space-y-2"
                >
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editData.nameEn || ''}
                      onChange={(e) => setEditData({ ...editData, nameEn: e.target.value })}
                      placeholder="Nom EN"
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <select
                      value={editData.type}
                      onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      {Object.entries(TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editData.rarity}
                      onChange={(e) => setEditData({ ...editData, rarity: e.target.value })}
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      {Object.keys(RARITY_COLORS).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editData.effectType || ''}
                      onChange={(e) => setEditData({ ...editData, effectType: e.target.value })}
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      {EFFECT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value || 'none'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editData.effectValue}
                      onChange={(e) => setEditData({ ...editData, effectValue: e.target.value })}
                      placeholder="value"
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editData.descriptionEn || ''}
                      onChange={(e) =>
                        setEditData({ ...editData, descriptionEn: e.target.value })
                      }
                      placeholder="Description EN"
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="number"
                      value={editData.basePrice}
                      onChange={(e) => setEditData({ ...editData, basePrice: e.target.value })}
                      className="bg-cyber-black border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="submit"
                      className="text-[10px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
                    >
                      Sauvegarder
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="text-[10px] px-2 py-1 text-gray-600 uppercase"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold ${RARITY_COLORS[item.rarity]}`}>
                        {item.name}
                      </span>
                      <span className="text-[9px] bg-cyber-black px-1.5 py-0.5 rounded text-gray-500 uppercase">
                        {TYPE_LABELS[item.type]}
                      </span>
                      <span className="text-[9px] text-gray-700">#{item.id}</span>
                    </div>
                    <div className="text-[10px] text-gray-600 truncate">{item.description}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px]">
                      {item.effectType && (
                        <span className="text-cyber-green">
                          {item.effectType}: +{item.effectValue}
                        </span>
                      )}
                      <span className="text-cyber-yellow">Prix: {item.basePrice}c</span>
                      {item.shop && (
                        <span
                          className={`px-1.5 py-0.5 rounded ${item.shop.isActive ? 'bg-cyber-green/10 text-cyber-green' : 'bg-gray-800 text-gray-600'}`}
                        >
                          SHOP{item.shop.priceOverride ? ` (${item.shop.priceOverride}c)` : ''}
                          {item.shop.stock !== null ? ` x${item.shop.stock}` : ' ∞'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-[10px] px-2 py-1 rounded border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10 uppercase"
                    >
                      Edit
                    </button>
                    {!item.shop ? (
                      <button
                        onClick={() => router.post(`/admin/items/${item.id}/add-to-shop`, {})}
                        className="text-[10px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10 uppercase"
                      >
                        + Shop
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => startShopEdit(item)}
                          className="text-[10px] px-2 py-1 rounded border border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10 uppercase"
                        >
                          Shop
                        </button>
                        <button
                          onClick={() => router.post(`/admin/shop/${item.shop!.id}/remove`)}
                          className="text-[10px] px-2 py-1 rounded border border-cyber-orange/30 text-cyber-orange hover:bg-cyber-orange/10 uppercase"
                        >
                          - Shop
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Supprimer "${item.name}" ? (inventaires, shop, loot seront aussi supprimes)`
                          )
                        )
                          router.post(`/admin/items/${item.id}/delete`)
                      }}
                      className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 uppercase"
                    >
                      Suppr
                    </button>
                  </div>
                </div>
              )}

              {/* Shop edit inline */}
              {shopEditId === item.id && item.shop && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    router.post(`/admin/shop/${item.shop!.id}/update`, shopData)
                    setShopEditId(null)
                  }}
                  className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-2"
                >
                  <span className="text-[10px] text-gray-600">Prix override:</span>
                  <input
                    type="number"
                    value={shopData.priceOverride}
                    onChange={(e) => setShopData({ ...shopData, priceOverride: e.target.value })}
                    placeholder="(base)"
                    className="w-24 bg-cyber-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-600">Stock:</span>
                  <input
                    type="number"
                    value={shopData.stock}
                    onChange={(e) => setShopData({ ...shopData, stock: e.target.value })}
                    placeholder="∞"
                    className="w-20 bg-cyber-black border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                  />
                  <label className="flex items-center gap-1 text-[10px] text-gray-500">
                    <input
                      type="checkbox"
                      checked={shopData.isActive}
                      onChange={(e) => setShopData({ ...shopData, isActive: e.target.checked })}
                    />
                    Actif
                  </label>
                  <button
                    type="submit"
                    className="text-[10px] px-2 py-1 rounded border border-cyber-green/30 text-cyber-green hover:bg-cyber-green/10"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setShopEditId(null)}
                    className="text-[10px] text-gray-600"
                  >
                    Annuler
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </GameLayout>
  )
}
