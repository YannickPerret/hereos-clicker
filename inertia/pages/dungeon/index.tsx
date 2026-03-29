import { router, usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
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
  bossRush: {
    unlockLevel: number
    isEnabled: boolean
    activeRun: { id: number } | null
    seasonName: string | null
    bestFloor: number
  }
}

export default function DungeonIndex({ character, floors, activeRun, bossRush }: Props) {
  const { t } = useTranslation(['dungeon', 'common'])
  const page = usePage<{ auth?: { user?: { isGuest?: boolean } | null } }>()
  const isGuest = Boolean(page.props?.auth?.user?.isGuest)
  const bossRushLocked = character.level < bossRush.unlockLevel
  const bossRushUnavailable = !bossRush.isEnabled
  const canEnterBossRush = !bossRushLocked && !bossRushUnavailable

  if (activeRun) {
    return (
      <GameLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-cyber-dark border border-cyber-red/30 rounded-lg p-8 text-center max-w-md">
            <h2 className="text-xl text-cyber-red font-bold mb-4 tracking-widest">{t('dungeon:activeRun')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('dungeon:activeRunMessage')}</p>
            <button
              onClick={() => router.visit(`/dungeon/run/${activeRun.id}`)}
              className="px-6 py-3 bg-cyber-red/20 border border-cyber-red text-cyber-red font-bold uppercase tracking-widest rounded hover:bg-cyber-red/30 transition-all"
            >
              {t('dungeon:resume')}
            </button>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cyber-red tracking-widest">{t('dungeon:title')}</h1>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500">
            LVL <span className="text-cyber-green font-bold">{character.level}</span>
          </span>
          <span className="text-gray-500">
            HP <span className="text-cyber-green font-bold">{character.hpCurrent}/{character.hpMax}</span>
          </span>
        </div>
      </div>

      {isGuest && (
        <div className="mb-6 rounded-lg border border-cyber-yellow/30 bg-cyber-yellow/10 px-4 py-3 text-sm text-cyber-yellow">
          {t('dungeon:guestFloorLimit')}
        </div>
      )}

      <div className="mb-6">
        <div className="rounded-lg border border-cyber-purple/30 bg-cyber-dark p-5 transition-all">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-cyber-purple">
                ENDGAME PVE
              </div>
              <h2 className="text-lg font-bold tracking-widest text-cyber-purple">BOSS RUSH</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                Infinite boss ladder. HP, ATK and DEF scale as long as you survive.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
                {bossRush.seasonName && (
                  <span className="rounded border border-cyber-purple/30 px-2 py-1 text-cyber-purple">
                    {bossRush.seasonName}
                  </span>
                )}
                <span className="rounded border border-gray-800 px-2 py-1 text-gray-500">
                  Best floor: {bossRush.bestFloor}
                </span>
                {bossRushLocked && (
                  <span className="rounded border border-cyber-red/30 px-2 py-1 text-cyber-red">
                    Unlocks at level {bossRush.unlockLevel}
                  </span>
                )}
                {bossRushUnavailable && (
                  <span className="rounded border border-gray-700 px-2 py-1 text-gray-500">
                    Unavailable this season
                  </span>
                )}
              </div>
            </div>

            {bossRush.activeRun ? (
              <button
                onClick={() => router.visit(`/boss-rush/run/${bossRush.activeRun!.id}`)}
                className="rounded border border-cyber-yellow/40 bg-cyber-yellow/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-cyber-yellow transition-all hover:bg-cyber-yellow/20"
              >
                [ CONTINUE ]
              </button>
            ) : (
              <button
                onClick={() => router.post('/boss-rush/start')}
                disabled={!canEnterBossRush}
                className={`rounded border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                  canEnterBossRush
                    ? 'border-cyber-purple/40 bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/20'
                    : 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-700'
                }`}
              >
                [ ENTER BOSS RUSH ]
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {floors.map((floor) => {
          const locked = character.level < floor.minLevel
          const guestLocked = isGuest && floor.floorNumber > 5
          const lowHp = character.hpCurrent < character.hpMax * 0.3
          const disabled = locked || guestLocked

          return (
            <div
              key={floor.id}
              className={`bg-cyber-dark border rounded-lg p-5 transition-all ${
                disabled
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
                    {t('dungeon:boss')}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-4">{floor.description}</p>

              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <span className={`text-xs ${locked ? 'text-cyber-red' : 'text-gray-600'}`}>
                    {t('dungeon:levelReq', { n: floor.minLevel })}
                  </span>
                  {guestLocked && (
                    <span className="text-[10px] uppercase tracking-widest text-cyber-yellow">
                      {t('dungeon:guestFloorLocked')}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => router.post(`/dungeon/enter/${floor.id}`)}
                  disabled={disabled}
                  className={`px-4 py-2 text-xs uppercase tracking-widest rounded font-bold transition-all ${
                    disabled
                      ? 'bg-gray-900 border border-gray-700 text-gray-700 cursor-not-allowed'
                      : 'bg-cyber-red/10 border border-cyber-red/50 text-cyber-red hover:bg-cyber-red/20'
                  }`}
                >
                  {guestLocked ? t('dungeon:guestLocked') : locked ? t('dungeon:locked') : t('dungeon:enter')}
                </button>
              </div>

              {lowHp && !disabled && (
                <div className="mt-2 text-[10px] text-cyber-orange">
                  {t('dungeon:lowHpWarning')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </GameLayout>
  )
}
