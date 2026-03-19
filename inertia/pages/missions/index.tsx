import { router } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface MissionData {
  id: number
  progress: number
  completed: boolean
  claimed: boolean
  mission: {
    name: string
    description: string
    type: string
    targetValue: number
    rewardType: string
    rewardValue: number
    icon: string
  }
}

interface Props {
  character: { id: number; name: string; credits: number }
  missions: MissionData[]
}

const TYPE_COLORS: Record<string, string> = {
  click: 'border-cyber-blue/30',
  kill: 'border-cyber-red/30',
  dungeon_clear: 'border-cyber-purple/30',
  earn_credits: 'border-cyber-yellow/30',
  pvp_win: 'border-cyber-pink/30',
  buy_item: 'border-cyber-green/30',
}

const REWARD_ICONS: Record<string, string> = {
  credits: '💰',
  xp: '⭐',
  item: '📦',
}

export default function Missions({ character, missions }: Props) {
  const allClaimed = missions.every((m) => m.claimed)
  const completedCount = missions.filter((m) => m.completed).length

  return (
    <GameLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-cyber-purple tracking-widest">MISSIONS QUOTIDIENNES</h1>
          <span className="text-xs text-gray-600">{completedCount}/{missions.length} terminees</span>
        </div>

        {allClaimed && missions.length > 0 && (
          <div className="bg-cyber-green/5 border border-cyber-green/30 rounded-lg p-4 mb-6 text-center">
            <div className="text-cyber-green font-bold text-sm">Toutes les missions du jour sont terminees!</div>
            <div className="text-xs text-gray-600 mt-1">Reviens demain pour de nouvelles missions.</div>
          </div>
        )}

        <div className="space-y-3">
          {missions.map((m) => {
            const percent = Math.min(100, (m.progress / m.mission.targetValue) * 100)
            return (
              <div
                key={m.id}
                className={`bg-cyber-dark border rounded-lg p-4 ${TYPE_COLORS[m.mission.type] || 'border-gray-800'} ${m.claimed ? 'opacity-40' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{m.mission.name}</h3>
                    <p className="text-[10px] text-gray-600">{m.mission.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-[10px] text-gray-500">Recompense</div>
                    <div className="text-xs font-bold text-cyber-yellow">
                      {REWARD_ICONS[m.mission.rewardType]} +{m.mission.rewardValue.toLocaleString()} {m.mission.rewardType}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                    <span>Progression</span>
                    <span>{m.progress} / {m.mission.targetValue}</span>
                  </div>
                  <div className="h-2 bg-cyber-black rounded-full overflow-hidden border border-gray-800">
                    <div
                      className={`h-full transition-all duration-500 ${m.completed ? 'bg-cyber-green' : 'bg-gradient-to-r from-cyber-blue to-cyber-purple'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Claim button */}
                {m.completed && !m.claimed && (
                  <button
                    onClick={() => router.post(`/missions/${m.id}/claim`)}
                    className="w-full py-2 bg-cyber-green/20 border border-cyber-green text-cyber-green text-xs font-bold uppercase tracking-widest rounded hover:bg-cyber-green/30 transition-all"
                  >
                    [ RECLAMER ]
                  </button>
                )}
                {m.claimed && (
                  <div className="text-center text-[10px] text-gray-700 uppercase">Reclamee ✓</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </GameLayout>
  )
}
