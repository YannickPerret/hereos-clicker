import { router } from '@inertiajs/react'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import GameLayout from '~/components/layout'
import QuestOverlay from '~/components/quest_overlay'

interface QuestEntry {
  id: number
  key: string
  mode: 'simple' | 'advanced'
  questType: 'main' | 'seasonal'
  seasonId: number | null
  seasonName: string | null
  title: string
  summary: string
  narrative: string | null
  giverName: string | null
  icon: string
  sortOrder: number
  status: 'locked' | 'active' | 'completed' | 'available'
  progress: number
  targetValue: number
  objectiveLabel: string
  rewardLabel: string
  parentQuestTitle: string | null
}

interface QuestTrack {
  trackKey: string
  questType: 'main' | 'seasonal'
  title: string
  subtitle: string
  completedCount: number
  totalCount: number
  activeQuest: {
    id: number
    key: string
    title: string
    summary: string
    giverName: string | null
    icon: string
    progress: number
    targetValue: number
    objectiveLabel: string
    rewardLabel: string
  } | null
  quests: QuestEntry[]
}

interface FlowState {
  characterQuestId: number
  status: 'active' | 'completed'
  currentStep: any
  stepState: any
  steps: any[]
}

interface Props {
  character: {
    id: number
    name: string
    level: number
  }
  journal: {
    tracks: QuestTrack[]
  }
  flowStates: Record<number, FlowState>
}

const STATUS_STYLES: Record<QuestEntry['status'], string> = {
  active: 'border-cyber-blue/40 bg-cyber-blue/10',
  completed: 'border-cyber-green/30 bg-cyber-green/5',
  locked: 'border-gray-800 bg-cyber-black/30 opacity-55',
  available: 'border-cyber-yellow/30 bg-cyber-yellow/5',
}

// STATUS_LABELS moved inside component to use t()

export default function Quests({ character, journal, flowStates: initialFlowStates }: Props) {
  const { t } = useTranslation(['quests', 'common'])
  const [flowStates, setFlowStates] = useState<Record<number, FlowState>>(initialFlowStates || {})

  const STATUS_LABELS: Record<QuestEntry['status'], string> = {
    active: t('quests:status.active'),
    completed: t('quests:status.completed'),
    locked: t('quests:status.locked'),
    available: t('quests:status.available'),
  }
  const [activeOverlayQuestId, setActiveOverlayQuestId] = useState<number | null>(null)
  const [activeOverlayTitle, setActiveOverlayTitle] = useState('')
  const [expandedQuestId, setExpandedQuestId] = useState<number | null>(null)

  const openOverlay = useCallback((questId: number, title: string) => {
    setActiveOverlayQuestId(questId)
    setActiveOverlayTitle(title)
  }, [])

  const closeOverlay = useCallback(() => {
    setActiveOverlayQuestId(null)
    router.reload()
  }, [])

  const handleFlowUpdate = useCallback((questId: number) => (newState: FlowState) => {
    setFlowStates((prev) => ({ ...prev, [questId]: newState }))
  }, [])

  return (
    <GameLayout>
      {activeOverlayQuestId && flowStates[activeOverlayQuestId] && (
        <QuestOverlay
          questId={activeOverlayQuestId}
          questTitle={activeOverlayTitle}
          flowState={flowStates[activeOverlayQuestId]}
          onClose={closeOverlay}
          onUpdate={handleFlowUpdate(activeOverlayQuestId)}
        />
      )}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-blue mb-1">
              {t('quests:journalLabel')}
            </div>
            <h1 className="text-3xl font-bold text-white tracking-[0.12em] uppercase">{t('quests:title')}</h1>
            <p className="text-sm text-gray-500 mt-2">
              {t('quests:description')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.visit('/play')}
            className="px-3 py-2 border border-cyber-blue/30 text-cyber-blue rounded text-[10px] uppercase tracking-widest hover:bg-cyber-blue/10 transition-all"
          >
            {t('quests:backToClicker')}
          </button>
        </div>

        <div className="grid gap-6">
          {journal.tracks.map((track) => (
            <section
              key={track.trackKey}
              className={`rounded-xl border p-5 ${
                track.questType === 'main'
                  ? 'border-cyber-blue/30 bg-cyber-dark'
                  : 'border-cyber-yellow/30 bg-cyber-dark'
              }`}
            >
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <div
                        className={`text-[10px] uppercase tracking-[0.3em] mb-1 ${
                          track.questType === 'main' ? 'text-cyber-blue' : 'text-cyber-yellow'
                        }`}
                      >
                        {track.subtitle}
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-[0.1em] uppercase">
                        {track.title}
                      </h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-gray-800 bg-cyber-black/30 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">{t('quests:progression')}</div>
                        <div className="text-lg font-bold text-cyber-green mt-1">
                          {track.completedCount}/{track.totalCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {track.quests.map((quest) => {
                      const progressPercent = Math.min(100, (quest.progress / quest.targetValue) * 100)
                      const isExpanded = expandedQuestId === quest.id

                      return (
                        <button
                          key={quest.id}
                          type="button"
                          onClick={() =>
                            setExpandedQuestId((current) => (current === quest.id ? null : quest.id))
                          }
                          className={`w-full rounded-xl border p-4 text-left transition-all hover:border-cyber-blue/40 ${STATUS_STYLES[quest.status]}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-1">
                                {t('quests:step', { n: quest.sortOrder })}
                              </div>
                              <h3 className="text-lg font-bold text-white uppercase tracking-[0.08em]">
                                {quest.title}
                              </h3>
                              <p className="mt-1 text-sm text-gray-400">{quest.summary}</p>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="mb-1 text-[10px] uppercase tracking-widest text-gray-500">
                                {STATUS_LABELS[quest.status]}
                              </div>
                              <div className="text-xs font-bold text-cyber-yellow">{quest.rewardLabel}</div>
                              <div className="mt-2 text-lg text-gray-500">{isExpanded ? '−' : '+'}</div>
                            </div>
                          </div>

                          <div className="mt-3 flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>{t('quests:progression')}</span>
                            <span>
                              {quest.progress}/{quest.targetValue}
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden border border-gray-800 bg-cyber-black/60">
                            <div
                              className={`h-full transition-all duration-500 ${
                                quest.status === 'completed'
                                  ? 'bg-cyber-green'
                                  : quest.status === 'locked'
                                    ? 'bg-gray-700'
                                    : track.questType === 'main'
                                      ? 'bg-gradient-to-r from-cyber-blue to-cyber-purple'
                                      : 'bg-gradient-to-r from-cyber-yellow to-cyber-orange'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>

                          {isExpanded && (
                            <div className="mt-3">
                              <div className="mb-2 grid gap-2 text-[11px] text-gray-500 sm:grid-cols-2">
                                <div>{t('quests:objective', { label: quest.objectiveLabel })}</div>
                                <div>{quest.parentQuestTitle ? t('quests:parent', { name: quest.parentQuestTitle }) : t('quests:parentNone')}</div>
                              </div>

                              {quest.narrative && (
                                <div className="rounded-lg border border-gray-800 bg-cyber-black/30 px-3 py-2 text-xs text-gray-500 leading-relaxed">
                                  {quest.narrative}
                                </div>
                              )}

                              {quest.mode === 'advanced' &&
                                quest.status === 'active' &&
                                flowStates[quest.id] && (
                                  <div className="mt-3">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        openOverlay(quest.id, quest.title)
                                      }}
                                      className="w-full rounded-lg border border-cyber-purple/40 bg-cyber-purple/10 px-4 py-2.5 text-[11px] uppercase tracking-widest text-cyber-purple hover:bg-cyber-purple/20 transition-all"
                                    >
                                      {t('quests:openFlow')}
                                    </button>
                                  </div>
                                )}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className={`rounded-xl border p-5 ${
                      track.questType === 'main'
                        ? 'border-cyber-purple/30 bg-cyber-dark'
                        : 'border-cyber-yellow/30 bg-cyber-dark'
                    }`}
                  >
                    <div
                      className={`text-[10px] uppercase tracking-[0.3em] mb-2 ${
                        track.questType === 'main' ? 'text-cyber-purple' : 'text-cyber-yellow'
                      }`}
                    >
                      {t('quests:activeQuest')}
                    </div>
                    {track.activeQuest ? (
                      <>
                        <div className="text-2xl font-bold text-white uppercase tracking-[0.08em]">
                          {track.activeQuest.title}
                        </div>
                        <div className="text-sm text-gray-400 mt-2">{track.activeQuest.summary}</div>
                        <div className="mt-4 text-xs text-cyber-yellow">{track.activeQuest.rewardLabel}</div>
                        <div
                          className={`mt-3 text-[11px] ${
                            track.questType === 'main' ? 'text-cyber-blue' : 'text-cyber-yellow'
                          }`}
                        >
                          {track.activeQuest.objectiveLabel}
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-gray-500">
                          <span>{t('quests:liveProgress')}</span>
                          <span>
                            {track.activeQuest.progress}/{track.activeQuest.targetValue}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full overflow-hidden border border-gray-800 bg-cyber-black">
                          <div
                            className={`h-full transition-all duration-300 ${
                              track.questType === 'main'
                                ? 'bg-gradient-to-r from-cyber-purple to-cyber-blue'
                                : 'bg-gradient-to-r from-cyber-yellow to-cyber-orange'
                            }`}
                            style={{
                              width: `${Math.min(100, (track.activeQuest.progress / track.activeQuest.targetValue) * 100)}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-cyber-green">{t('quests:trackDone')}</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </GameLayout>
  )
}
