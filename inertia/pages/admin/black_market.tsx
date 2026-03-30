import { router, usePage } from '@inertiajs/react'
import { useMemo, useState } from 'react'
import GameLayout from '~/components/layout'

interface Vendor {
  key: string
  name: string
  tagline: string
  description: string
  specialties: string[]
}

interface Item {
  id: number
  name: string
  type: string
  rarity: string
}

interface CatalogEntry {
  id: number
  vendorKey: string
  itemId: number
  basePrice: number
  stock: number
  heatValue: number
  reputationRequired: number
  requiredSpec: string | null
  isFeatured: boolean
  isActive: boolean
  sortOrder: number
  item: Item
}

interface Cleaner {
  id: number
  key: string
  name: string
  description: string
  basePrice: number
  heatReduction: number
  isActive: boolean
  sortOrder: number
}

interface Props {
  settings: {
    minLevel: number
    rotationHours: number
    playerListingTaxPerItem: number
    playerListingMinDurationHours: number
    playerListingMaxDurationHours: number
  }
  vendors: Vendor[]
  catalog: CatalogEntry[]
  cleaners: Cleaner[]
  items: Item[]
}

const SPEC_OPTIONS = [
  { value: '', label: 'Aucune' },
  { value: 'hacker', label: 'Hacker' },
  { value: 'netrunner', label: 'Netrunner' },
  { value: 'samurai', label: 'Samurai' },
  { value: 'chrome_dealer', label: 'Chrome Dealer' },
]

export default function BlackMarketAdmin({ settings, vendors, catalog, cleaners, items }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [settingsForm, setSettingsForm] = useState({
    minLevel: settings.minLevel,
    rotationHours: settings.rotationHours,
    playerListingTaxPerItem: settings.playerListingTaxPerItem,
    playerListingMinDurationHours: settings.playerListingMinDurationHours,
    playerListingMaxDurationHours: settings.playerListingMaxDurationHours,
  })
  const [newEntry, setNewEntry] = useState({
    vendorKey: vendors[0]?.key || 'ghostline',
    itemId: items[0]?.id || 0,
    basePrice: 100000,
    stock: 1,
    heatValue: 5,
    reputationRequired: 0,
    requiredSpec: '',
    isFeatured: false,
    isActive: true,
    sortOrder: 0,
  })
  const [editingCatalogId, setEditingCatalogId] = useState<number | null>(null)
  const [catalogForm, setCatalogForm] = useState<Record<string, any>>({})
  const [newCleaner, setNewCleaner] = useState({
    key: '',
    name: '',
    description: '',
    basePrice: 20000,
    heatReduction: 15,
    isActive: true,
    sortOrder: 0,
  })
  const [editingCleanerId, setEditingCleanerId] = useState<number | null>(null)
  const [cleanerForm, setCleanerForm] = useState<Record<string, any>>({})

  const groupedCatalog = useMemo(() => {
    return vendors.map((vendor) => ({
      ...vendor,
      entries: catalog.filter((entry) => entry.vendorKey === vendor.key),
    }))
  }, [catalog, vendors])

  const startCatalogEdit = (entry: CatalogEntry) => {
    setEditingCatalogId(entry.id)
    setCatalogForm({
      vendorKey: entry.vendorKey,
      itemId: entry.itemId,
      basePrice: entry.basePrice,
      stock: entry.stock,
      heatValue: entry.heatValue,
      reputationRequired: entry.reputationRequired,
      requiredSpec: entry.requiredSpec || '',
      isFeatured: entry.isFeatured,
      isActive: entry.isActive,
      sortOrder: entry.sortOrder,
    })
  }

  const startCleanerEdit = (cleaner: Cleaner) => {
    setEditingCleanerId(cleaner.id)
    setCleanerForm({
      key: cleaner.key,
      name: cleaner.name,
      description: cleaner.description,
      basePrice: cleaner.basePrice,
      heatReduction: cleaner.heatReduction,
      isActive: cleaner.isActive,
      sortOrder: cleaner.sortOrder,
    })
  }

  return (
    <GameLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-cyber-red tracking-widest">CONFIG MARCHE NOIR</h1>
          <a href="/admin" className="text-[10px] text-gray-500 hover:text-cyber-red uppercase">
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

        <div className="mb-6 rounded-lg border border-cyber-red/30 bg-cyber-dark p-4">
          <h2 className="text-sm uppercase tracking-widest text-cyber-red mb-3">
            Reglages globaux
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div>
              <label className="mb-1 block text-[10px] uppercase text-gray-500">
                Niveau minimum
              </label>
              <input
                type="number"
                min={1}
                value={settingsForm.minLevel}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    minLevel: Number(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-red/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase text-gray-500">
                Rotation (heures)
              </label>
              <input
                type="number"
                min={1}
                value={settingsForm.rotationHours}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    rotationHours: Number(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-red/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase text-gray-500">
                Taxe par item
              </label>
              <input
                type="number"
                min={0}
                value={settingsForm.playerListingTaxPerItem}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    playerListingTaxPerItem: Number(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-red/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase text-gray-500">
                Duree min vente
              </label>
              <input
                type="number"
                min={1}
                value={settingsForm.playerListingMinDurationHours}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    playerListingMinDurationHours: Number(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-red/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase text-gray-500">
                Duree max vente
              </label>
              <input
                type="number"
                min={1}
                value={settingsForm.playerListingMaxDurationHours}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    playerListingMaxDurationHours: Number(event.target.value),
                  }))
                }
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-red/50 focus:outline-none"
              />
            </div>
            <div className="flex items-end xl:col-span-2">
              <button
                type="button"
                onClick={() => router.post('/admin/black-market/settings', settingsForm)}
                className="w-full rounded border border-cyber-red/30 px-4 py-2 text-xs uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
              >
                Sauver les reglages
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-cyber-blue/30 bg-cyber-dark p-4">
          <h2 className="text-sm uppercase tracking-widest text-cyber-blue mb-3">
            Ajouter une offre
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5 xl:grid-cols-10">
            <select
              value={newEntry.vendorKey}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, vendorKey: event.target.value }))
              }
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
            >
              {vendors.map((vendor) => (
                <option key={vendor.key} value={vendor.key}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <select
              value={newEntry.itemId}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, itemId: Number(event.target.value) }))
              }
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none md:col-span-2 xl:col-span-2"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} [{item.type}]
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newEntry.basePrice}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, basePrice: Number(event.target.value) }))
              }
              placeholder="Prix"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
            />
            <input
              type="number"
              value={newEntry.stock}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, stock: Number(event.target.value) }))
              }
              placeholder="Stock"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
            />
            <input
              type="number"
              value={newEntry.heatValue}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, heatValue: Number(event.target.value) }))
              }
              placeholder="Heat"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
            />
            <input
              type="number"
              value={newEntry.reputationRequired}
              onChange={(event) =>
                setNewEntry((current) => ({
                  ...current,
                  reputationRequired: Number(event.target.value),
                }))
              }
              placeholder="Rep"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
            />
            <select
              value={newEntry.requiredSpec}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, requiredSpec: event.target.value }))
              }
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
            >
              {SPEC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newEntry.sortOrder}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, sortOrder: Number(event.target.value) }))
              }
              placeholder="Ordre"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
            />
            <div className="flex items-center gap-3 rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-gray-300">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEntry.isFeatured}
                  onChange={(event) =>
                    setNewEntry((current) => ({ ...current, isFeatured: event.target.checked }))
                  }
                />
                Featured
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newEntry.isActive}
                  onChange={(event) =>
                    setNewEntry((current) => ({ ...current, isActive: event.target.checked }))
                  }
                />
                Active
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              router.post('/admin/black-market/catalog/create', {
                ...newEntry,
                requiredSpec: newEntry.requiredSpec || '',
              })
            }
            className="mt-3 rounded border border-cyber-blue/30 px-4 py-2 text-xs uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10"
          >
            Ajouter l'offre
          </button>
        </div>

        <div className="space-y-6">
          {groupedCatalog.map((vendor) => (
            <section
              key={vendor.key}
              className="rounded-lg border border-gray-800 bg-cyber-dark p-4"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{vendor.name}</h2>
                  <p className="text-xs uppercase tracking-widest text-cyber-blue">
                    {vendor.tagline}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">{vendor.description}</p>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <div>{vendor.specialties.join(' • ')}</div>
                  <div>{vendor.entries.length} offres catalogue</div>
                </div>
              </div>

              <div className="space-y-3">
                {vendor.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-lg border p-4 ${entry.isActive ? 'border-cyber-blue/20' : 'border-gray-800 opacity-60'}`}
                  >
                    {editingCatalogId === entry.id ? (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-5 xl:grid-cols-10">
                        <select
                          value={catalogForm.vendorKey}
                          onChange={(event) =>
                            setCatalogForm((current: any) => ({
                              ...current,
                              vendorKey: event.target.value,
                            }))
                          }
                          className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                        >
                          {vendors.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={catalogForm.itemId}
                          onChange={(event) =>
                            setCatalogForm((current: any) => ({
                              ...current,
                              itemId: Number(event.target.value),
                            }))
                          }
                          className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white md:col-span-2 xl:col-span-2"
                        >
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} [{item.type}]
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={catalogForm.basePrice}
                          onChange={(event) =>
                            setCatalogForm((current: any) => ({
                              ...current,
                              basePrice: Number(event.target.value),
                            }))
                          }
                          className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="number"
                          value={catalogForm.stock}
                          onChange={(event) =>
                            setCatalogForm((current: any) => ({
                              ...current,
                              stock: Number(event.target.value),
                            }))
                          }
                          className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="number"
                          value={catalogForm.heatValue}
                          onChange={(event) =>
                            setCatalogForm((current: any) => ({
                              ...current,
                              heatValue: Number(event.target.value),
                            }))
                          }
                          className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="number"
                          value={catalogForm.reputationRequired}
                          onChange={(event) =>
                            setCatalogForm((current: any) => ({
                              ...current,
                              reputationRequired: Number(event.target.value),
                            }))
                          }
                          className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                        />
                        <select
                          value={catalogForm.requiredSpec}
                          onChange={(event) =>
                            setCatalogForm((current: any) => ({
                              ...current,
                              requiredSpec: event.target.value,
                            }))
                          }
                          className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                        >
                          {SPEC_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={catalogForm.sortOrder}
                          onChange={(event) =>
                            setCatalogForm((current: any) => ({
                              ...current,
                              sortOrder: Number(event.target.value),
                            }))
                          }
                          className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                        />
                        <div className="flex items-center gap-3 rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-gray-300">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={catalogForm.isFeatured}
                              onChange={(event) =>
                                setCatalogForm((current: any) => ({
                                  ...current,
                                  isFeatured: event.target.checked,
                                }))
                              }
                            />
                            Featured
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={catalogForm.isActive}
                              onChange={(event) =>
                                setCatalogForm((current: any) => ({
                                  ...current,
                                  isActive: event.target.checked,
                                }))
                              }
                            />
                            Active
                          </label>
                        </div>
                        <div className="flex gap-2 xl:col-span-10">
                          <button
                            type="button"
                            onClick={() => {
                              router.post(`/admin/black-market/catalog/${entry.id}/update`, {
                                ...catalogForm,
                                requiredSpec: catalogForm.requiredSpec || '',
                              })
                              setEditingCatalogId(null)
                            }}
                            className="rounded border border-cyber-green/30 px-3 py-1 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
                          >
                            Sauver
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatalogId(null)}
                            className="rounded px-3 py-1 text-[10px] uppercase text-gray-500 hover:text-white"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-bold text-cyber-blue">
                              {entry.item.name}
                            </span>
                            <span className="text-[9px] uppercase text-gray-600">
                              {entry.item.type}
                            </span>
                            {entry.isFeatured && (
                              <span className="rounded border border-cyber-yellow/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-yellow">
                                featured
                              </span>
                            )}
                            {!entry.isActive && (
                              <span className="rounded border border-gray-700 px-1.5 py-0.5 text-[9px] uppercase text-gray-500">
                                off
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400 md:grid-cols-4">
                            <span>Prix: {entry.basePrice.toLocaleString()}c</span>
                            <span>Stock: {entry.stock}</span>
                            <span>Heat: +{entry.heatValue}</span>
                            <span>Rep: {entry.reputationRequired}</span>
                            <span>Spec: {entry.requiredSpec || 'aucune'}</span>
                            <span>Ordre: {entry.sortOrder}</span>
                            <span>Rarity: {entry.item.rarity}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startCatalogEdit(entry)}
                            className="rounded border border-cyber-blue/30 px-3 py-1 text-[10px] uppercase text-cyber-blue hover:bg-cyber-blue/10"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              router.post(`/admin/black-market/catalog/${entry.id}/delete`)
                            }
                            className="rounded border border-cyber-red/30 px-3 py-1 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {vendor.entries.length === 0 && (
                  <div className="rounded-lg border border-gray-800 bg-cyber-black/50 p-4 text-sm text-gray-600">
                    Aucun item configure pour ce fixer.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-cyber-yellow/30 bg-cyber-dark p-4">
          <h2 className="text-sm uppercase tracking-widest text-cyber-yellow mb-3">
            Ajouter un cleaner
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              type="text"
              value={newCleaner.key}
              onChange={(event) =>
                setNewCleaner((current) => ({ ...current, key: event.target.value }))
              }
              placeholder="key"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              value={newCleaner.name}
              onChange={(event) =>
                setNewCleaner((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nom"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              value={newCleaner.description}
              onChange={(event) =>
                setNewCleaner((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Description"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white md:col-span-2"
            />
            <input
              type="number"
              value={newCleaner.basePrice}
              onChange={(event) =>
                setNewCleaner((current) => ({ ...current, basePrice: Number(event.target.value) }))
              }
              placeholder="Prix"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
            />
            <input
              type="number"
              value={newCleaner.heatReduction}
              onChange={(event) =>
                setNewCleaner((current) => ({
                  ...current,
                  heatReduction: Number(event.target.value),
                }))
              }
              placeholder="Reduction"
              className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="number"
              value={newCleaner.sortOrder}
              onChange={(event) =>
                setNewCleaner((current) => ({ ...current, sortOrder: Number(event.target.value) }))
              }
              placeholder="Ordre"
              className="w-32 rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
            />
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={newCleaner.isActive}
                onChange={(event) =>
                  setNewCleaner((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Actif
            </label>
            <button
              type="button"
              onClick={() => router.post('/admin/black-market/cleaners/create', newCleaner)}
              className="rounded border border-cyber-yellow/30 px-4 py-2 text-xs uppercase tracking-widest text-cyber-yellow hover:bg-cyber-yellow/10"
            >
              Ajouter le cleaner
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {cleaners.map((cleaner) => (
            <div
              key={cleaner.id}
              className={`rounded-lg border p-4 ${cleaner.isActive ? 'border-cyber-yellow/20 bg-cyber-dark' : 'border-gray-800 bg-cyber-dark opacity-60'}`}
            >
              {editingCleanerId === cleaner.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                    <input
                      type="text"
                      value={cleanerForm.key}
                      onChange={(event) =>
                        setCleanerForm((current: any) => ({ ...current, key: event.target.value }))
                      }
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="text"
                      value={cleanerForm.name}
                      onChange={(event) =>
                        setCleanerForm((current: any) => ({ ...current, name: event.target.value }))
                      }
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="text"
                      value={cleanerForm.description}
                      onChange={(event) =>
                        setCleanerForm((current: any) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white md:col-span-2"
                    />
                    <input
                      type="number"
                      value={cleanerForm.basePrice}
                      onChange={(event) =>
                        setCleanerForm((current: any) => ({
                          ...current,
                          basePrice: Number(event.target.value),
                        }))
                      }
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                    />
                    <input
                      type="number"
                      value={cleanerForm.heatReduction}
                      onChange={(event) =>
                        setCleanerForm((current: any) => ({
                          ...current,
                          heatReduction: Number(event.target.value),
                        }))
                      }
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={cleanerForm.sortOrder}
                      onChange={(event) =>
                        setCleanerForm((current: any) => ({
                          ...current,
                          sortOrder: Number(event.target.value),
                        }))
                      }
                      className="w-32 rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white"
                    />
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={cleanerForm.isActive}
                        onChange={(event) =>
                          setCleanerForm((current: any) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                      />
                      Actif
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        router.post(
                          `/admin/black-market/cleaners/${cleaner.id}/update`,
                          cleanerForm
                        )
                        setEditingCleanerId(null)
                      }}
                      className="rounded border border-cyber-green/30 px-3 py-1 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
                    >
                      Sauver
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCleanerId(null)}
                      className="rounded px-3 py-1 text-[10px] uppercase text-gray-500 hover:text-white"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-cyber-yellow">{cleaner.name}</span>
                      <span className="text-[9px] uppercase text-gray-600">{cleaner.key}</span>
                      {!cleaner.isActive && (
                        <span className="rounded border border-gray-700 px-1.5 py-0.5 text-[9px] uppercase text-gray-500">
                          off
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{cleaner.description}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {cleaner.basePrice.toLocaleString()}c • -{cleaner.heatReduction} chaleur •
                      ordre {cleaner.sortOrder}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startCleanerEdit(cleaner)}
                      className="rounded border border-cyber-blue/30 px-3 py-1 text-[10px] uppercase text-cyber-blue hover:bg-cyber-blue/10"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.post(`/admin/black-market/cleaners/${cleaner.id}/delete`)
                      }
                      className="rounded border border-cyber-red/30 px-3 py-1 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
                    >
                      Supprimer
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
