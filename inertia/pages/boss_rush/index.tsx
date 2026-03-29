import { router, usePage } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import GameLayout from '~/components/layout'

interface Props {
  character: {
    id: number
    name: string
    level: number
  }
  season: {
    id: number
    name: string
    theme: string
    campaignTitle: string | null
    storyIntro: string | null
    startsAt: string | null
    endsAt: string | null
    isBossRushEnabled: boolean
  } | null
  activeRun: { id: number } | null
  currentSeason: {
    id: number
    seasonId: number
    seasonName: string
    bestFloor: number
    runsPlayed: number
    totalBossesKilled: number
    rank: number | null
  } | null
  seasonHistory: {
    id: number
    seasonId: number
    seasonName: string
    seasonStatus: string
    bestFloor: number
    runsPlayed: number
    totalBossesKilled: number
    finalRank: number | null
    rewardCredits: number
    rewardTier: string | null
    rewardClaimed: boolean
  }[]
  leaderboard: {
    id: number
    characterId: number
    name: string
    level: number
    bestFloor: number
    totalBossesKilled: number
  }[]
}

export default function BossRushIndex({
  character,
  season,
  activeRun,
  currentSeason,
  seasonHistory,
  leaderboard,
}: Props) {
  const { t } = useTranslation(['boss_rush', 'common'])
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()

  if (!season || !season.isBossRushEnabled) {
    return (
      <GameLayout>
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <div className="w-full rounded-lg border border-cyber-purple/20 bg-cyber-dark p-8 text-center">
            <h1 className="text-3xl font-black tracking-widest text-cyber-purple">
              {t('boss_rush:title')}
            </h1>
            <p className="mt-4 text-sm text-gray-400">{t('boss_rush:disabled')}</p>
            <p className="mt-2 text-xs uppercase tracking-widest text-gray-600">
              {t('boss_rush:disabledHint')}
            </p>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-lg border border-cyber-purple/30 bg-cyber-dark p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-cyber-purple">
                {t('boss_rush:seasonPanel')}
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-widest text-white">
                {t('boss_rush:title')}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">{t('boss_rush:subtitle')}</p>
              <div className="mt-3 text-xs uppercase tracking-widest text-gray-500">
                {season.name} • {season.campaignTitle || season.theme}
              </div>
            </div>

            {activeRun ? (
              <div className="rounded-lg border border-cyber-yellow/30 bg-cyber-yellow/10 p-4 text-center">
                <div className="text-[10px] uppercase tracking-[0.28em] text-cyber-yellow">
                  {t('boss_rush:activeRun')}
                </div>
                <div className="mt-2 text-xs text-gray-400">{t('boss_rush:activeRunMessage')}</div>
                <button
                  onClick={() => router.visit(`/boss-rush/run/${activeRun.id}`)}
                  className="mt-4 rounded border border-cyber-yellow/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyber-yellow transition hover:bg-cyber-yellow/10"
                >
                  {t('boss_rush:resume')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.post('/boss-rush/start')}
                className="rounded border border-cyber-purple/50 bg-cyber-purple/10 px-6 py-3 text-sm font-bold uppercase tracking-widest text-cyber-purple transition hover:bg-cyber-purple/20"
              >
                {t('boss_rush:start')}
              </button>
            )}
          </div>
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <section className="rounded-lg border border-cyber-blue/20 bg-cyber-dark p-4">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-cyber-blue">
                    {character.name}
                  </div>
                  <h2 className="mt-1 text-lg font-bold text-white">{t('boss_rush:seasonPanel')}</h2>
                </div>
                <div className="text-right text-xs text-gray-500">LVL {character.level}</div>
              </div>

              {currentSeason ? (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded border border-cyber-purple/20 bg-cyber-purple/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-600">
                      {t('boss_rush:bestFloor')}
                    </div>
                    <div className="mt-1 text-xl font-black text-cyber-purple">
                      {currentSeason.bestFloor}
                    </div>
                  </div>
                  <div className="rounded border border-cyber-blue/20 bg-cyber-blue/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-600">
                      {t('boss_rush:runsPlayed')}
                    </div>
                    <div className="mt-1 text-xl font-black text-cyber-blue">
                      {currentSeason.runsPlayed}
                    </div>
                  </div>
                  <div className="rounded border border-cyber-green/20 bg-cyber-green/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-600">
                      {t('boss_rush:bossesKilled')}
                    </div>
                    <div className="mt-1 text-xl font-black text-cyber-green">
                      {currentSeason.totalBossesKilled}
                    </div>
                  </div>
                  <div className="rounded border border-cyber-yellow/20 bg-cyber-yellow/5 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-600">
                      {t('boss_rush:rank')}
                    </div>
                    <div className="mt-1 text-xl font-black text-cyber-yellow">
                      {currentSeason.rank ? `#${currentSeason.rank}` : 'N/A'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">{t('boss_rush:noHistory')}</div>
              )}
            </section>

            <section className="rounded-lg border border-cyber-yellow/20 bg-cyber-dark p-4">
              <div className="mb-4 text-sm font-bold uppercase tracking-widest text-cyber-yellow">
                {t('boss_rush:seasonHistory')}
              </div>

              <div className="space-y-3">
                {seasonHistory.length === 0 ? (
                  <div className="text-sm text-gray-600">{t('boss_rush:noHistory')}</div>
                ) : (
                  seasonHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded border border-gray-800 bg-cyber-black/30 p-3 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{entry.seasonName}</div>
                        <div className="mt-1 text-xs uppercase tracking-widest text-gray-500">
                          {t(`boss_rush:status.${entry.seasonStatus}`)} • {t('boss_rush:bestFloor')} {entry.bestFloor}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {entry.runsPlayed} runs • {entry.totalBossesKilled} kills
                          {entry.finalRank ? ` • #${entry.finalRank}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-widest text-gray-600">
                            {t('boss_rush:rewardTier')}
                          </div>
                          <div className="text-sm font-bold text-cyber-yellow">
                            {entry.rewardTier || t('boss_rush:noReward')}
                          </div>
                        </div>
                        {!entry.rewardClaimed && entry.rewardCredits > 0 && entry.seasonStatus === 'ended' ? (
                          <button
                            onClick={() => router.post(`/boss-rush/seasons/${entry.id}/claim`)}
                            className="rounded border border-cyber-green/40 bg-cyber-green/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyber-green transition hover:bg-cyber-green/20"
                          >
                            {t('boss_rush:claimReward')}
                          </button>
                        ) : (
                          <div className="text-xs text-gray-600">
                            {entry.rewardCredits > 0 ? `${entry.rewardCredits}c` : t('boss_rush:noReward')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-cyber-purple/20 bg-cyber-dark p-4">
            <div className="mb-4 text-sm font-bold uppercase tracking-widest text-cyber-purple">
              {t('boss_rush:topRunners')}
            </div>

            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-sm text-gray-600">{t('boss_rush:noLeaderboard')}</div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded border border-gray-800 bg-cyber-black/30 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${index < 3 ? 'text-cyber-yellow' : 'text-gray-500'}`}>
                          #{index + 1}
                        </span>
                        <span className="font-bold text-white">{entry.name}</span>
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-600">
                        LVL {entry.level} • {entry.totalBossesKilled} kills
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-gray-600">
                        {t('boss_rush:bestFloor')}
                      </div>
                      <div className="text-xl font-black text-cyber-purple">{entry.bestFloor}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </GameLayout>
  )
}
