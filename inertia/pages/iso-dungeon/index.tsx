import { router } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface Dungeon {
  id: number
  name: string
  slug: string
  description: string
  minLevel: number
  maxPlayers: number
  icon: string | null
  roomCount: number
}

interface Props {
  character: { id: number; name: string; level: number }
  dungeons: Dungeon[]
  activeRun: { id: number; dungeonId: number; dungeonName: string } | null
}

export default function IsoDungeonIndex({ character, dungeons, activeRun }: Props) {
  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-purple mb-1">Donjons 2.5D</div>
            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">Exploration</h1>
          </div>
          <button onClick={() => router.visit('/play')}
            className="px-3 py-2 border border-cyber-blue/30 text-cyber-blue rounded text-[10px] uppercase tracking-widest hover:bg-cyber-blue/10">
            Retour
          </button>
        </div>

        {activeRun && (
          <div className="mb-6 rounded-xl border border-cyber-green/40 bg-cyber-green/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cyber-green">Run en cours</div>
                <div className="text-lg font-bold text-white mt-1">{activeRun.dungeonName}</div>
              </div>
              <button onClick={() => router.visit(`/iso-dungeon/run/${activeRun.id}`)}
                className="px-4 py-2 border border-cyber-green/40 text-cyber-green rounded text-xs uppercase tracking-widest hover:bg-cyber-green/10">
                Reprendre
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {dungeons.map((d) => {
            const locked = character.level < d.minLevel
            return (
              <div key={d.id} className={`rounded-xl border p-5 ${locked ? 'border-gray-800 opacity-50' : 'border-cyber-purple/30 bg-cyber-dark hover:border-cyber-purple/50 transition-all'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-lg font-bold text-white uppercase tracking-wide">{d.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{d.description}</div>
                  </div>
                  <div className="text-2xl">{d.icon || '🏰'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500 uppercase mb-4">
                  <div>Niveau: <span className={locked ? 'text-cyber-red' : 'text-cyber-yellow'}>{d.minLevel}</span></div>
                  <div>Salles: <span className="text-white">{d.roomCount}</span></div>
                  <div>Joueurs: <span className="text-white">{d.maxPlayers}</span></div>
                </div>
                <button
                  disabled={locked || !!activeRun}
                  onClick={() => router.post(`/iso-dungeon/enter/${d.id}`)}
                  className="w-full rounded border border-cyber-purple/40 px-4 py-2.5 text-[11px] uppercase tracking-widest text-cyber-purple hover:bg-cyber-purple/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {locked ? `Niveau ${d.minLevel} requis` : activeRun ? 'Run en cours' : 'Entrer'}
                </button>
              </div>
            )
          })}
          {dungeons.length === 0 && (
            <div className="md:col-span-2 text-center text-sm text-gray-600 py-12 border border-gray-800 rounded-xl">
              Aucun donjon 2.5D disponible
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  )
}
