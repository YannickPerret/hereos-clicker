import { router, usePage } from '@inertiajs/react'
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

interface RewardEntry {
  id: number
  rewardType: string
  rewardValue: number
  rewardItemId: number | null
  rewardItemName: string | null
}

interface Props {
  character: { id: number; name: string; credits: number }
  missions: MissionData[]
  dailyReward: {
    currentStreak: number
    highestStreak: number
    claimedToday: boolean
    canClaimToday: boolean
    nextClaimStreak: number
    todayRewardDay: number | null
    resetsAt: string | null
    days: {
      id: number
      dayNumber: number
      rewards: RewardEntry[]
    }[]
    nextRewards: RewardEntry[]
  } | null
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

function rewardLabel(rewardType: string, rewardValue: number, rewardItemName: string | null = null) {
  if (rewardType === 'item') return `${rewardValue}x ${rewardItemName || 'item'}`
  return `+${rewardValue.toLocaleString()} ${rewardType}`
}

export default function Missions({ character, missions, dailyReward }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const allClaimed = missions.every((m) => m.claimed)
  const completedCount = missions.filter((m) => m.completed).length

  return (
    <GameLayout>
      <div className="max-w-2xl mx-auto">
        {props.errors?.message && (
          <div className="mb-4 bg-cyber-red/10 border border-cyber-red/30 rounded-lg p-3 text-sm text-cyber-red">
            {props.errors.message}
          </div>
        )}
        {props.success && (
          <div className="mb-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg p-3 text-sm text-cyber-green">
            {props.success as string}
          </div>
        )}

        {dailyReward && (
          <div className="mb-6 bg-cyber-dark border border-cyber-yellow/30 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-yellow mb-1">
                  Recompense Journaliere
                </div>
                <div className="text-2xl font-bold text-white">
                  Streak {dailyReward.currentStreak}
                </div>
                <div className="text-xs text-gray-500">
                  Meilleur streak: {dailyReward.highestStreak}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                  {dailyReward.claimedToday ? 'Reclamee aujourd hui' : `Prochain claim: ${dailyReward.nextClaimStreak}`}
                </div>
                <div className="text-sm font-bold text-cyber-yellow">
                  {dailyReward.nextRewards.length > 0
                    ? dailyReward.nextRewards.map((r, i) => (
                        <span key={i}>
                          {i > 0 && ' + '}
                          {rewardLabel(r.rewardType, r.rewardValue, r.rewardItemName)}
                        </span>
                      ))
                    : 'Aucune recompense'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {dailyReward.days.map((day) => {
                const isCurrent = day.dayNumber === dailyReward.todayRewardDay
                const isReached = dailyReward.currentStreak >= day.dayNumber

                return (
                  <div
                    key={day.id}
                    className={`rounded-lg border p-3 ${
                      isCurrent
                        ? 'border-cyber-yellow bg-cyber-yellow/10'
                        : isReached
                          ? 'border-cyber-green/30 bg-cyber-green/5'
                          : 'border-gray-800 bg-cyber-black/40'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Jour {day.dayNumber}</div>
                    {day.rewards.map((r, i) => (
                      <div key={i} className={`text-xs font-bold ${isCurrent ? 'text-cyber-yellow' : isReached ? 'text-cyber-green' : 'text-gray-400'}`}>
                        {rewardLabel(r.rewardType, r.rewardValue, r.rewardItemName)}
                      </div>
                    ))}
                    {day.rewards.length === 0 && (
                      <div className="text-xs text-gray-600">-</div>
                    )}
                  </div>
                )
              })}
            </div>

            {dailyReward.canClaimToday ? (
              <button
                onClick={() => router.post('/missions/daily-reward/claim')}
                className="w-full py-2 bg-cyber-yellow/20 border border-cyber-yellow text-cyber-yellow text-xs font-bold uppercase tracking-widest rounded hover:bg-cyber-yellow/30 transition-all"
              >
                [ RECLAMER LA RECOMPENSE DU JOUR ]
              </button>
            ) : (
              <div className="text-center text-xs text-gray-500">
                Reviens apres le reset quotidien pour continuer ton streak.
              </div>
            )}
          </div>
        )}

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
