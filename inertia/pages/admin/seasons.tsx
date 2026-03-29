import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface SeasonEntry {
  id: number
  key: string
  name: string
  slug: string
  theme: string
  campaignTitle: string | null
  storyIntro: string | null
  storyOutro: string | null
  bannerImage: string | null
  primaryColor: string | null
  secondaryColor: string | null
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'archived'
  sortOrder: number
  isRankedPvpEnabled: boolean
  isWorldBossEnabled: boolean
  isBossRushEnabled: boolean
  isPlayerMarketEnabled: boolean
  isBlackMarketBonusEnabled: boolean
  startsAt: string | null
  endsAt: string | null
}

interface Props {
  seasons: SeasonEntry[]
  activeSeason: {
    id: number
    name: string
    theme: string
    campaignTitle: string | null
    status: string
    startsAt: string | null
    endsAt: string | null
  } | null
}

const STATUS_OPTIONS: SeasonEntry['status'][] = ['draft', 'scheduled', 'active', 'ended', 'archived']

const emptyForm = {
  key: '',
  name: '',
  slug: '',
  theme: 'core',
  campaignTitle: '',
  storyIntro: '',
  storyOutro: '',
  bannerImage: '',
  primaryColor: '#facc15',
  secondaryColor: '#38bdf8',
  status: 'draft',
  sortOrder: '0',
  isRankedPvpEnabled: true,
  isWorldBossEnabled: false,
  isBossRushEnabled: false,
  isPlayerMarketEnabled: false,
  isBlackMarketBonusEnabled: false,
  startsAt: '',
  endsAt: '',
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) return ''

  const date = new Date(value)
  const pad = (num: number) => String(num).padStart(2, '0')

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('')
}

function toForm(season: SeasonEntry) {
  return {
    key: season.key,
    name: season.name,
    slug: season.slug,
    theme: season.theme,
    campaignTitle: season.campaignTitle || '',
    storyIntro: season.storyIntro || '',
    storyOutro: season.storyOutro || '',
    bannerImage: season.bannerImage || '',
    primaryColor: season.primaryColor || '#facc15',
    secondaryColor: season.secondaryColor || '#38bdf8',
    status: season.status,
    sortOrder: String(season.sortOrder),
    isRankedPvpEnabled: season.isRankedPvpEnabled,
    isWorldBossEnabled: season.isWorldBossEnabled,
    isBossRushEnabled: season.isBossRushEnabled,
    isPlayerMarketEnabled: season.isPlayerMarketEnabled,
    isBlackMarketBonusEnabled: season.isBlackMarketBonusEnabled,
    startsAt: toDatetimeLocalValue(season.startsAt),
    endsAt: toDatetimeLocalValue(season.endsAt),
  }
}

export default function AdminSeasons({ seasons, activeSeason }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [showCreate, setShowCreate] = useState(false)
  const [newSeason, setNewSeason] = useState(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)
  const [editSeason, setEditSeason] = useState(emptyForm)

  const startEdit = (season: SeasonEntry) => {
    setEditId(season.id)
    setEditSeason(toForm(season))
  }

  const toggleField = (
    target: 'create' | 'edit',
    key:
      | 'isRankedPvpEnabled'
      | 'isWorldBossEnabled'
      | 'isBossRushEnabled'
      | 'isPlayerMarketEnabled'
      | 'isBlackMarketBonusEnabled',
    checked: boolean
  ) => {
    if (target === 'create') {
      setNewSeason((current) => ({ ...current, [key]: checked }))
      return
    }

    setEditSeason((current) => ({ ...current, [key]: checked }))
  }

  return (
    <GameLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-widest text-cyber-blue">GESTION SAISONS</h1>
            <p className="mt-1 text-xs text-gray-500">
              Histoire, campagne, dates et toggles de contenu saisonnier.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate((current) => !current)}
              className="rounded border border-cyber-green/30 px-3 py-1.5 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
            >
              + Nouvelle saison
            </button>
            <a href="/admin" className="text-[10px] uppercase text-gray-500 hover:text-cyber-blue">
              &larr; Admin
            </a>
          </div>
        </div>

        {activeSeason && (
          <div className="mb-6 rounded-lg border border-cyber-yellow/30 bg-cyber-dark p-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-yellow">Active</div>
            <div className="mt-1 text-lg font-bold text-white">{activeSeason.name}</div>
            <div className="text-xs text-gray-500">{activeSeason.campaignTitle || activeSeason.theme}</div>
          </div>
        )}

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

        {showCreate && (
          <div className="mb-6 rounded-lg border border-cyber-green/30 bg-cyber-dark p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-cyber-green">
              Creer une saison
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                router.post('/admin/seasons/create', newSeason)
                setShowCreate(false)
                setNewSeason(emptyForm)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="text"
                  value={newSeason.name}
                  onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                  placeholder="Nom"
                  required
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newSeason.key}
                  onChange={(e) => setNewSeason({ ...newSeason, key: e.target.value })}
                  placeholder="key"
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newSeason.slug}
                  onChange={(e) => setNewSeason({ ...newSeason, slug: e.target.value })}
                  placeholder="slug"
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newSeason.theme}
                  onChange={(e) => setNewSeason({ ...newSeason, theme: e.target.value })}
                  placeholder="Theme"
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newSeason.campaignTitle}
                  onChange={(e) => setNewSeason({ ...newSeason, campaignTitle: e.target.value })}
                  placeholder="Titre campagne"
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white md:col-span-2"
                />
                <select
                  value={newSeason.status}
                  onChange={(e) => setNewSeason({ ...newSeason, status: e.target.value as SeasonEntry['status'] })}
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.toUpperCase()}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={newSeason.sortOrder}
                  onChange={(e) => setNewSeason({ ...newSeason, sortOrder: e.target.value })}
                  placeholder="Sort order"
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
                <input
                  type="datetime-local"
                  value={newSeason.startsAt}
                  onChange={(e) => setNewSeason({ ...newSeason, startsAt: e.target.value })}
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
                <input
                  type="datetime-local"
                  value={newSeason.endsAt}
                  onChange={(e) => setNewSeason({ ...newSeason, endsAt: e.target.value })}
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newSeason.bannerImage}
                  onChange={(e) => setNewSeason({ ...newSeason, bannerImage: e.target.value })}
                  placeholder="Banner image / URL"
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white md:col-span-2"
                />
                <input
                  type="text"
                  value={newSeason.primaryColor}
                  onChange={(e) => setNewSeason({ ...newSeason, primaryColor: e.target.value })}
                  placeholder="Primary color"
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newSeason.secondaryColor}
                  onChange={(e) => setNewSeason({ ...newSeason, secondaryColor: e.target.value })}
                  placeholder="Secondary color"
                  className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                />
              </div>

              <textarea
                value={newSeason.storyIntro}
                onChange={(e) => setNewSeason({ ...newSeason, storyIntro: e.target.value })}
                placeholder="Intro de saison"
                rows={3}
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
              />
              <textarea
                value={newSeason.storyOutro}
                onChange={(e) => setNewSeason({ ...newSeason, storyOutro: e.target.value })}
                placeholder="Outro de saison"
                rows={3}
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
              />

              <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSeason.isRankedPvpEnabled}
                    onChange={(e) => toggleField('create', 'isRankedPvpEnabled', e.target.checked)}
                  />
                  PvP ranked
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSeason.isWorldBossEnabled}
                    onChange={(e) => toggleField('create', 'isWorldBossEnabled', e.target.checked)}
                  />
                  Boss mondial
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSeason.isBossRushEnabled}
                    onChange={(e) => toggleField('create', 'isBossRushEnabled', e.target.checked)}
                  />
                  Boss Rush
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSeason.isPlayerMarketEnabled}
                    onChange={(e) => toggleField('create', 'isPlayerMarketEnabled', e.target.checked)}
                  />
                  Marche joueur
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSeason.isBlackMarketBonusEnabled}
                    onChange={(e) => toggleField('create', 'isBlackMarketBonusEnabled', e.target.checked)}
                  />
                  Bonus marche noir
                </label>
              </div>

              <button
                type="submit"
                className="rounded border border-cyber-green/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10"
              >
                Enregistrer la saison
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {seasons.map((season) => (
            <div key={season.id} className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-blue">
                      {season.name}
                    </h2>
                    <span className="rounded border border-gray-800 px-2 py-1 text-[10px] uppercase text-gray-400">
                      {season.status}
                    </span>
                    <span className="rounded border border-gray-800 px-2 py-1 text-[10px] uppercase text-gray-500">
                      {season.theme}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {season.campaignTitle || 'Sans campagne'} • key {season.key} • slug {season.slug}
                  </div>
                  {season.storyIntro && (
                    <p className="mt-2 max-w-3xl text-sm text-gray-300">{season.storyIntro}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {season.status !== 'active' && (
                    <button
                      onClick={() => router.post(`/admin/seasons/${season.id}/activate`)}
                      className="rounded border border-cyber-green/30 px-3 py-1.5 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
                    >
                      Activer
                    </button>
                  )}
                  {season.status === 'active' && (
                    <button
                      onClick={() => router.post(`/admin/seasons/${season.id}/complete`)}
                      className="rounded border border-cyber-yellow/30 px-3 py-1.5 text-[10px] uppercase text-cyber-yellow hover:bg-cyber-yellow/10"
                    >
                      Cloturer
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(season)}
                    className="rounded border border-cyber-blue/30 px-3 py-1.5 text-[10px] uppercase text-cyber-blue hover:bg-cyber-blue/10"
                  >
                    Editer
                  </button>
                  <button
                    onClick={() => router.post(`/admin/seasons/${season.id}/delete`)}
                    className="rounded border border-cyber-red/30 px-3 py-1.5 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest">
                {season.isRankedPvpEnabled && <span className="rounded border border-cyber-red/40 px-2 py-1 text-cyber-red">PvP</span>}
                {season.isWorldBossEnabled && <span className="rounded border border-cyber-green/40 px-2 py-1 text-cyber-green">Boss</span>}
                {season.isBossRushEnabled && <span className="rounded border border-cyber-purple/40 px-2 py-1 text-cyber-purple">Boss Rush</span>}
                {season.isPlayerMarketEnabled && <span className="rounded border border-cyber-blue/40 px-2 py-1 text-cyber-blue">Market</span>}
                {season.isBlackMarketBonusEnabled && <span className="rounded border border-cyber-yellow/40 px-2 py-1 text-cyber-yellow">Black market</span>}
                <span className="rounded border border-gray-800 px-2 py-1 text-gray-500">
                  {season.startsAt ? new Date(season.startsAt).toLocaleString() : 'date libre'}
                </span>
                <span className="rounded border border-gray-800 px-2 py-1 text-gray-500">
                  {season.endsAt ? new Date(season.endsAt).toLocaleString() : 'sans fin'}
                </span>
              </div>

              {editId === season.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    router.post(`/admin/seasons/${season.id}/update`, editSeason)
                    setEditId(null)
                  }}
                  className="space-y-4 rounded border border-gray-800 bg-cyber-black/40 p-4"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input
                      type="text"
                      value={editSeason.name}
                      onChange={(e) => setEditSeason({ ...editSeason, name: e.target.value })}
                      placeholder="Nom"
                      required
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editSeason.key}
                      onChange={(e) => setEditSeason({ ...editSeason, key: e.target.value })}
                      placeholder="key"
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editSeason.slug}
                      onChange={(e) => setEditSeason({ ...editSeason, slug: e.target.value })}
                      placeholder="slug"
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editSeason.theme}
                      onChange={(e) => setEditSeason({ ...editSeason, theme: e.target.value })}
                      placeholder="Theme"
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editSeason.campaignTitle}
                      onChange={(e) => setEditSeason({ ...editSeason, campaignTitle: e.target.value })}
                      placeholder="Titre campagne"
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white md:col-span-2"
                    />
                    <select
                      value={editSeason.status}
                      onChange={(e) => setEditSeason({ ...editSeason, status: e.target.value as SeasonEntry['status'] })}
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={editSeason.sortOrder}
                      onChange={(e) => setEditSeason({ ...editSeason, sortOrder: e.target.value })}
                      placeholder="Sort order"
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="datetime-local"
                      value={editSeason.startsAt}
                      onChange={(e) => setEditSeason({ ...editSeason, startsAt: e.target.value })}
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="datetime-local"
                      value={editSeason.endsAt}
                      onChange={(e) => setEditSeason({ ...editSeason, endsAt: e.target.value })}
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editSeason.bannerImage}
                      onChange={(e) => setEditSeason({ ...editSeason, bannerImage: e.target.value })}
                      placeholder="Banner image / URL"
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white md:col-span-2"
                    />
                    <input
                      type="text"
                      value={editSeason.primaryColor}
                      onChange={(e) => setEditSeason({ ...editSeason, primaryColor: e.target.value })}
                      placeholder="Primary color"
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={editSeason.secondaryColor}
                      onChange={(e) => setEditSeason({ ...editSeason, secondaryColor: e.target.value })}
                      placeholder="Secondary color"
                      className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <textarea
                    value={editSeason.storyIntro}
                    onChange={(e) => setEditSeason({ ...editSeason, storyIntro: e.target.value })}
                    placeholder="Intro de saison"
                    rows={3}
                    className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                  />
                  <textarea
                    value={editSeason.storyOutro}
                    onChange={(e) => setEditSeason({ ...editSeason, storyOutro: e.target.value })}
                    placeholder="Outro de saison"
                    rows={3}
                    className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-xs text-white"
                  />

                  <div className="flex flex-wrap gap-4 text-xs text-gray-300">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editSeason.isRankedPvpEnabled}
                        onChange={(e) => toggleField('edit', 'isRankedPvpEnabled', e.target.checked)}
                      />
                      PvP ranked
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editSeason.isWorldBossEnabled}
                        onChange={(e) => toggleField('edit', 'isWorldBossEnabled', e.target.checked)}
                      />
                      Boss mondial
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editSeason.isBossRushEnabled}
                        onChange={(e) => toggleField('edit', 'isBossRushEnabled', e.target.checked)}
                      />
                      Boss Rush
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editSeason.isPlayerMarketEnabled}
                        onChange={(e) => toggleField('edit', 'isPlayerMarketEnabled', e.target.checked)}
                      />
                      Marche joueur
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editSeason.isBlackMarketBonusEnabled}
                        onChange={(e) => toggleField('edit', 'isBlackMarketBonusEnabled', e.target.checked)}
                      />
                      Bonus marche noir
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded border border-cyber-blue/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10"
                    >
                      Sauver
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="rounded border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-900"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}

          {seasons.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-800 bg-cyber-dark p-8 text-center text-sm text-gray-600">
              Aucune saison configuree pour le moment.
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  )
}
