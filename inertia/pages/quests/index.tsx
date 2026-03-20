import { router } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface QuestEntry {
  id: number
  key: string
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

interface Props {
  character: {
    id: number
    name: string
    level: number
  }
  journal: {
    tracks: QuestTrack[]
  }
}

const STATUS_STYLES: Record<QuestEntry['status'], string> = {
  active: 'border-cyber-blue/40 bg-cyber-blue/10',
  completed: 'border-cyber-green/30 bg-cyber-green/5',
  locked: 'border-gray-800 bg-cyber-black/30 opacity-55',
  available: 'border-cyber-yellow/30 bg-cyber-yellow/5',
}

const STATUS_LABELS: Record<QuestEntry['status'], string> = {
  active: 'ACTIVE',
  completed: 'TERMINEE',
  locked: 'VERROUILLEE',
  available: 'DISPONIBLE',
}

export default function Quests({ character, journal }: Props) {
  return (
    <GameLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-blue mb-1">
              Journal des Quetes
            </div>
            <h1 className="text-3xl font-bold text-white tracking-[0.12em] uppercase">
              {character.name}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Quetes principales permanentes et suite de saison active dans le meme journal.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.visit('/play')}
            className="px-3 py-2 border border-cyber-blue/30 text-cyber-blue rounded text-[10px] uppercase tracking-widest hover:bg-cyber-blue/10 transition-all"
          >
            Retour clicker
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
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">Progression</div>
                        <div className="text-lg font-bold text-cyber-green mt-1">
                          {track.completedCount}/{track.totalCount}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-800 bg-cyber-black/30 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">Niveau</div>
                        <div className="text-lg font-bold text-cyber-yellow mt-1">LVL {character.level}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {track.quests.map((quest) => {
                      const progressPercent = Math.min(100, (quest.progress / quest.targetValue) * 100)

                      return (
                        <div key={quest.id} className={`rounded-xl border p-4 ${STATUS_STYLES[quest.status]}`}>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.28em] text-gray-500 mb-1">
                                Etape {quest.sortOrder}
                              </div>
                              <h3 className="text-lg font-bold text-white uppercase tracking-[0.08em]">
                                {quest.title}
                              </h3>
                              <p className="text-sm text-gray-400 mt-1">{quest.summary}</p>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
                                {STATUS_LABELS[quest.status]}
                              </div>
                              <div className="text-xs font-bold text-cyber-yellow">{quest.rewardLabel}</div>
                            </div>
                          </div>

                          <div className="grid gap-2 text-[11px] text-gray-500 sm:grid-cols-2 mb-2">
                            <div>Objectif: {quest.objectiveLabel}</div>
                            <div>Parent: {quest.parentQuestTitle || 'Aucun'}</div>
                          </div>

                          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>Progression</span>
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

                          {quest.narrative && (
                            <div className="mt-3 rounded-lg border border-gray-800 bg-cyber-black/30 px-3 py-2 text-xs text-gray-500 leading-relaxed">
                              {quest.narrative}
                            </div>
                          )}
                        </div>
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
                      Quete Active
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
                          <span>Progression live</span>
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
                      <div className="text-sm text-cyber-green">Tout ce track est termine.</div>
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
