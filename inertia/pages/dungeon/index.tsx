import { router } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface Floor {
  id: number
  name: string
  description: string
  floorNumber: number
  minLevel: number
  bossEnemyId: number | null
}

interface Props {
  character: { id: number; level: number; hpCurrent: number; hpMax: number }
  floors: Floor[]
  activeRun: { id: number } | null
}

export default function DungeonIndex({ character, floors, activeRun }: Props) {
  if (activeRun) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-cyber-dark border border-cyber-red/30 rounded-lg p-8 text-center max-w-md">
            <h2 className="text-xl text-cyber-red font-bold mb-4 tracking-widest">RUN EN COURS</h2>
            <p className="text-gray-500 text-sm mb-6">Tu as un donjon en cours. Termine-le ou fuis.</p>
            <button
              onClick={() => router.visit(`/dungeon/run/${activeRun.id}`)}
              className="px-6 py-3 bg-cyber-red/20 border border-cyber-red text-cyber-red font-bold uppercase tracking-widest rounded hover:bg-cyber-red/30 transition-all"
            >
              [ REPRENDRE ]
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cyber-red tracking-widest">DONJONS</h1>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500">
            LVL <span className="text-cyber-green font-bold">{character.level}</span>
          </span>
          <span className="text-gray-500">
            HP <span className="text-cyber-green font-bold">{character.hpCurrent}/{character.hpMax}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {floors.map((floor) => {
          const locked = character.level < floor.minLevel
          const lowHp = character.hpCurrent < character.hpMax * 0.3

          return (
            <div
              key={floor.id}
              className={`bg-cyber-dark border rounded-lg p-5 transition-all ${
                locked
                  ? 'border-gray-800 opacity-50'
                  : 'border-cyber-red/30 hover:border-cyber-red/60 hover:shadow-[0_0_20px_rgba(255,0,64,0.1)]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-cyber-red">
                  F{floor.floorNumber} - {floor.name}
                </h3>
                {floor.bossEnemyId && (
                  <span className="text-[10px] bg-cyber-yellow/20 text-cyber-yellow px-2 py-0.5 rounded uppercase">
                    Boss
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-4">{floor.description}</p>

              <div className="flex justify-between items-center">
                <span className={`text-xs ${locked ? 'text-cyber-red' : 'text-gray-600'}`}>
                  Niveau requis: {floor.minLevel}
                </span>

                <button
                  onClick={() => router.post(`/dungeon/enter/${floor.id}`)}
                  disabled={locked}
                  className={`px-4 py-2 text-xs uppercase tracking-widest rounded font-bold transition-all ${
                    locked
                      ? 'bg-gray-900 border border-gray-700 text-gray-700 cursor-not-allowed'
                      : 'bg-cyber-red/10 border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/20'
                  }`}
                >
                  {locked ? '[ VERROUILLE ]' : '[ ENTRER ]'}
                </button>
              </div>

              {lowHp && !locked && (
                <div className="mt-2 text-[10px] text-cyber-orange">
                  Attention: HP faibles. Utilisez un Stim Pack.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </GameLayout>
  )
}
