import { router, usePage } from '@inertiajs/react'
import { useState, useRef } from 'react'
import GameLayout from '~/components/layout'

interface TilesetRecord { id: number; key: string; name: string; imagePath: string; tileWidth: number; tileHeight: number; columns: number; tileCount: number; tilesetType: string }
interface SpriteRecord { id: number; key: string; name: string; imagePath: string; frameWidth: number; frameHeight: number; frameCount: number; spriteType: string }
interface EnemyOption { id: number; name: string; hp: number; tier: number }
interface RoomEnemyRecord { id: number; roomId: number; enemyId: number; spriteKey: string | null; gridX: number; gridY: number; isBoss: boolean; blocksExit: boolean }
interface RoomRecord { id: number; dungeonId: number; name: string; roomOrder: number; isBossRoom: boolean; width: number; height: number; tilesetKey: string | null; spawnX: number; spawnY: number; exitX: number | null; exitY: number | null; enemies: RoomEnemyRecord[] }
interface DungeonRecord { id: number; name: string; slug: string; description: string; minLevel: number; maxPlayers: number; icon: string | null; isActive: boolean; sortOrder: number; rooms: RoomRecord[] }

interface Props {
  dungeons: DungeonRecord[]
  tilesets: TilesetRecord[]
  sprites: SpriteRecord[]
  enemies: EnemyOption[]
}

export default function AdminIsoDungeons({ dungeons, tilesets, sprites, enemies }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [expandedDungeon, setExpandedDungeon] = useState<number | null>(null)

  // Upload refs
  const tilesetFileRef = useRef<HTMLInputElement>(null)
  const spriteFileRef = useRef<HTMLInputElement>(null)
  const tiledFileRef = useRef<HTMLInputElement>(null)
  const [tiledRoomId, setTiledRoomId] = useState<number | null>(null)

  const inputCls = 'w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-blue/50 focus:outline-none'

  return (
    <GameLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-widest text-cyber-purple">DONJONS 2.5D</h1>
          <a href="/admin" className="text-[10px] uppercase text-gray-500 hover:text-cyber-blue">&larr; RETOUR ADMIN</a>
        </div>

        {props.errors?.message && <div className="mb-4 rounded-lg border border-cyber-red/50 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">{props.errors.message}</div>}
        {props.success && <div className="mb-4 rounded-lg border border-cyber-green/50 bg-cyber-green/10 px-4 py-3 text-sm text-cyber-green">{props.success as string}</div>}

        {/* ═══ TILESETS ═══ */}
        <div className="mb-6 rounded-lg border border-cyber-blue/30 bg-cyber-dark p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-blue mb-3">TILESETS</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.post('/admin/iso-tilesets/upload', fd as any) }} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3" encType="multipart/form-data">
            <input name="key" placeholder="Cle (snake_case)" className={inputCls} required />
            <input name="name" placeholder="Nom" className={inputCls} required />
            <input name="tileWidth" type="number" defaultValue={64} placeholder="Tile W" className={inputCls} />
            <input name="tileHeight" type="number" defaultValue={32} placeholder="Tile H" className={inputCls} />
            <input name="columns" type="number" defaultValue={8} placeholder="Colonnes" className={inputCls} />
            <input name="tileCount" type="number" defaultValue={64} placeholder="Nb tiles" className={inputCls} />
            <select name="tilesetType" className={inputCls}><option value="isometric">Isometrique</option><option value="orthogonal">Orthogonal</option></select>
            <input ref={tilesetFileRef} name="image" type="file" accept=".png,.jpg,.webp" className={inputCls} required />
            <button type="submit" className="rounded border border-cyber-blue/30 px-3 py-2 text-[10px] uppercase tracking-widest text-cyber-blue hover:bg-cyber-blue/10 col-span-2 md:col-span-4">Upload tileset</button>
          </form>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {tilesets.map((t) => (
              <div key={t.id} className="rounded border border-gray-800 p-2">
                <img src={`/assets/maps/tilesets/${t.imagePath}`} alt={t.name} className="w-full h-16 object-cover rounded mb-1" />
                <div className="text-xs font-bold text-white">{t.name}</div>
                <div className="text-[9px] text-gray-500">{t.key} • {t.tileWidth}x{t.tileHeight} • {t.columns}col</div>
                <button onClick={() => { if (confirm('Supprimer ?')) router.post(`/admin/iso-tilesets/${t.id}/delete`) }} className="mt-1 text-[9px] text-cyber-red hover:underline">Supprimer</button>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SPRITES ═══ */}
        <div className="mb-6 rounded-lg border border-cyber-green/30 bg-cyber-dark p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-green mb-3">SPRITES</h2>
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.post('/admin/iso-sprites/upload', fd as any) }} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3" encType="multipart/form-data">
            <input name="key" placeholder="Cle (ex: player, enemy_drone)" className={inputCls} required />
            <input name="name" placeholder="Nom" className={inputCls} required />
            <input name="frameWidth" type="number" defaultValue={64} placeholder="Frame W" className={inputCls} />
            <input name="frameHeight" type="number" defaultValue={64} placeholder="Frame H" className={inputCls} />
            <input name="frameCount" type="number" defaultValue={1} placeholder="Nb frames" className={inputCls} />
            <select name="spriteType" className={inputCls}><option value="character">Personnage</option><option value="enemy">Ennemi</option><option value="npc">NPC</option></select>
            <input ref={spriteFileRef} name="image" type="file" accept=".png,.jpg,.webp" className={inputCls} required />
            <button type="submit" className="rounded border border-cyber-green/30 px-3 py-2 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10">Upload sprite</button>
          </form>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {sprites.map((s) => (
              <div key={s.id} className="rounded border border-gray-800 p-2 text-center">
                <img src={`/assets/sprites/${s.imagePath}`} alt={s.name} className="w-12 h-12 object-contain mx-auto mb-1" />
                <div className="text-[10px] font-bold text-white">{s.name}</div>
                <div className="text-[9px] text-gray-500">{s.key} • {s.spriteType}</div>
                <button onClick={() => { if (confirm('Supprimer ?')) router.post(`/admin/iso-sprites/${s.id}/delete`) }} className="mt-1 text-[9px] text-cyber-red hover:underline">Suppr</button>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ DUNGEONS ═══ */}
        <div className="mb-6 rounded-lg border border-cyber-purple/30 bg-cyber-dark p-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-cyber-purple mb-3">DONJONS</h2>

          {/* Create dungeon */}
          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); router.post('/admin/iso-dungeons/create', fd as any) }} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            <input name="name" placeholder="Nom" className={inputCls} required />
            <input name="slug" placeholder="slug-url" className={inputCls} required />
            <input name="minLevel" type="number" defaultValue={1} placeholder="Niveau min" className={inputCls} />
            <input name="description" placeholder="Description" className={inputCls} />
            <button type="submit" className="rounded border border-cyber-purple/30 px-3 py-2 text-[10px] uppercase tracking-widest text-cyber-purple hover:bg-cyber-purple/10">Creer</button>
          </form>

          {/* Dungeon list */}
          <div className="space-y-3">
            {dungeons.map((d) => (
              <div key={d.id} className="rounded border border-gray-800 p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{d.name}</span>
                    <span className="text-[10px] text-gray-500">{d.slug} • lvl {d.minLevel}+ • {d.rooms.length} salle(s)</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${d.isActive ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' : 'bg-gray-800 text-gray-600'}`}>
                      {d.isActive ? 'actif' : 'inactif'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setExpandedDungeon(expandedDungeon === d.id ? null : d.id)} className="text-[10px] px-2 py-1 rounded border border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10 uppercase">
                      Salles ({d.rooms.length})
                    </button>
                    <button onClick={() => { if (confirm('Supprimer ?')) router.post(`/admin/iso-dungeons/${d.id}/delete`) }} className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 uppercase">X</button>
                  </div>
                </div>

                {expandedDungeon === d.id && (
                  <div className="mt-3 space-y-3 border-t border-gray-800 pt-3">
                    {/* Add room */}
                    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); fd.append('dungeonId', String(d.id)); router.post('/admin/iso-rooms/create', fd as any) }}
                      className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      <input name="name" placeholder="Nom salle" className={inputCls} required />
                      <input name="width" type="number" defaultValue={16} placeholder="Largeur" className={inputCls} />
                      <input name="height" type="number" defaultValue={16} placeholder="Hauteur" className={inputCls} />
                      <select name="tilesetKey" className={inputCls}>
                        <option value="">Tileset</option>
                        {tilesets.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-[10px] text-gray-400">
                        <input name="isBossRoom" type="checkbox" value="true" /> Boss
                      </label>
                      <button type="submit" className="rounded border border-cyber-purple/30 px-3 py-1 text-[10px] uppercase text-cyber-purple hover:bg-cyber-purple/10">+ Salle</button>
                    </form>

                    {/* Room list */}
                    {d.rooms.sort((a, b) => a.roomOrder - b.roomOrder).map((room) => (
                      <div key={room.id} className={`rounded border p-3 ${room.isBossRoom ? 'border-cyber-red/30 bg-cyber-red/5' : 'border-gray-700'}`}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">#{room.roomOrder}</span>
                            <span className="text-xs font-bold text-white">{room.name}</span>
                            {room.isBossRoom && <span className="text-[9px] text-cyber-red">★ BOSS</span>}
                            <span className="text-[9px] text-gray-600">{room.width}x{room.height} • tileset: {room.tilesetKey || 'aucun'} • spawn({room.spawnX},{room.spawnY})</span>
                          </div>
                          <div className="flex gap-1">
                            <label className="text-[10px] px-2 py-1 rounded border border-cyber-yellow/30 text-cyber-yellow hover:bg-cyber-yellow/10 uppercase cursor-pointer">
                              Import Tiled
                              <input type="file" accept=".json" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                const fd = new FormData()
                                fd.append('tiledJson', file)
                                router.post(`/admin/iso-rooms/${room.id}/import-tiled`, fd as any)
                              }} />
                            </label>
                            <button onClick={() => { if (confirm('Supprimer ?')) router.post(`/admin/iso-rooms/${room.id}/delete`) }}
                              className="text-[10px] px-2 py-1 rounded border border-cyber-red/30 text-cyber-red hover:bg-cyber-red/10 uppercase">X</button>
                          </div>
                        </div>

                        {/* Enemies in room */}
                        <div className="mt-2 border-t border-gray-800 pt-2">
                          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Ennemis ({room.enemies.length})</div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {room.enemies.map((e) => (
                              <span key={e.id} className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] ${e.isBoss ? 'border-cyber-red/30 text-cyber-red' : 'border-gray-700 text-gray-400'}`}>
                                #{e.enemyId} ({e.gridX},{e.gridY}) {e.blocksExit && '🚫'} {e.isBoss && '★'}
                                <button onClick={() => router.post(`/admin/iso-room-enemies/${e.id}/delete`)} className="text-cyber-red hover:text-white ml-1">×</button>
                              </span>
                            ))}
                          </div>
                          <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); fd.append('roomId', String(room.id)); router.post('/admin/iso-room-enemies/create', fd as any) }}
                            className="grid grid-cols-3 md:grid-cols-7 gap-1">
                            <select name="enemyId" className={inputCls + ' text-xs'} required>
                              <option value="">Ennemi</option>
                              {enemies.map((en) => <option key={en.id} value={en.id}>{en.name} (T{en.tier})</option>)}
                            </select>
                            <input name="gridX" type="number" defaultValue={0} placeholder="X" className={inputCls + ' text-xs'} />
                            <input name="gridY" type="number" defaultValue={0} placeholder="Y" className={inputCls + ' text-xs'} />
                            <select name="spriteKey" className={inputCls + ' text-xs'}>
                              <option value="">Sprite</option>
                              {sprites.filter((s) => s.spriteType === 'enemy').map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
                            </select>
                            <label className="flex items-center gap-1 text-[9px] text-gray-400"><input name="isBoss" type="checkbox" value="true" />Boss</label>
                            <label className="flex items-center gap-1 text-[9px] text-gray-400"><input name="blocksExit" type="checkbox" value="true" />Bloque</label>
                            <button type="submit" className="rounded border border-cyber-yellow/30 px-2 py-1 text-[9px] uppercase text-cyber-yellow hover:bg-cyber-yellow/10">+</button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
