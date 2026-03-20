import { DateTime } from 'luxon'
import Character from '#models/character'
import CharacterQuest from '#models/character_quest'
import Quest from '#models/quest'
import Season from '#models/season'
import SeasonService from '#services/season_service'

type HackProgressPayload = {
  clicks: number
  creditsEarned: number
  level: number
}

type QuestEvent = {
  type: 'completed' | 'unlocked'
  title: string
  rewardLabel?: string
}

type QuestTrackSummary = {
  questType: 'main' | 'seasonal'
  trackKey: string
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
} | null

type QuestJournalEntry = {
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

type QuestTrackJournal = {
  questType: 'main' | 'seasonal'
  trackKey: string
  title: string
  subtitle: string
  completedCount: number
  totalCount: number
  activeQuest: NonNullable<QuestTrackSummary>['activeQuest']
  quests: QuestJournalEntry[]
}

export default class QuestService {
  static async getPlaySummary(character: Character) {
    const activeSeason = await SeasonService.getActiveSeason()

    await this.ensureEligibleQuestsStarted(character.id, activeSeason)
    await this.advanceQuestProgress(
      character,
      { clicks: 0, creditsEarned: 0, level: character.level },
      [],
      activeSeason
    )
    await this.ensureEligibleQuestsStarted(character.id, activeSeason)

    return this.buildSummary(character.id, activeSeason)
  }

  static async getJournal(character: Character) {
    const activeSeason = await SeasonService.getActiveSeason()

    await this.ensureEligibleQuestsStarted(character.id, activeSeason)
    await this.advanceQuestProgress(
      character,
      { clicks: 0, creditsEarned: 0, level: character.level },
      [],
      activeSeason
    )
    await this.ensureEligibleQuestsStarted(character.id, activeSeason)

    return this.buildJournal(character.id, activeSeason)
  }

  static async trackHackProgress(character: Character, payload: HackProgressPayload) {
    const activeSeason = await SeasonService.getActiveSeason()

    await this.ensureEligibleQuestsStarted(character.id, activeSeason)

    const events: QuestEvent[] = []
    await this.advanceQuestProgress(character, payload, events, activeSeason)
    await this.ensureEligibleQuestsStarted(character.id, activeSeason, events)

    return {
      summary: await this.buildSummary(character.id, activeSeason),
      events,
    }
  }

  private static async getEligibleQuests(activeSeason: Season | null) {
    const query = Quest.query()
      .preload('season')
      .preload('parentQuest')
      .orderBy('questType', 'asc')
      .orderBy('sortOrder', 'asc')
      .orderBy('id', 'asc')
      .where((builder) => {
        builder.where('questType', 'main')

        if (activeSeason) {
          builder.orWhere((seasonBuilder) => {
            seasonBuilder.where('questType', 'seasonal').where('seasonId', activeSeason.id)
          })
        }
      })

    return query
  }

  private static async ensureEligibleQuestsStarted(
    characterId: number,
    activeSeason: Season | null,
    events?: QuestEvent[]
  ) {
    const quests = await this.getEligibleQuests(activeSeason)
    if (quests.length === 0) {
      return
    }

    const states = await CharacterQuest.query()
      .where('characterId', characterId)
      .whereIn('questId', quests.map((quest) => quest.id))
      .preload('quest')

    const stateByQuestId = new Map(states.map((state) => [state.questId, state]))
    const completedQuestIds = new Set(
      states.filter((state) => state.status === 'completed').map((state) => state.questId)
    )

    for (const quest of quests) {
      if (stateByQuestId.has(quest.id)) {
        continue
      }

      if (quest.parentQuestId && !completedQuestIds.has(quest.parentQuestId)) {
        continue
      }

      const created = await CharacterQuest.create({
        characterId,
        questId: quest.id,
        status: 'active',
        progress: 0,
        startedAt: DateTime.now(),
      })

      stateByQuestId.set(quest.id, created)

      if (events) {
        events.push({
          type: 'unlocked',
          title: quest.title,
        })
      }
    }
  }

  private static async advanceQuestProgress(
    character: Character,
    payload: HackProgressPayload,
    events: QuestEvent[],
    activeSeason: Season | null
  ) {
    const quests = await this.getEligibleQuests(activeSeason)
    if (quests.length === 0) {
      return
    }

    const activeStates = await CharacterQuest.query()
      .where('characterId', character.id)
      .where('status', 'active')
      .whereIn('questId', quests.map((quest) => quest.id))
      .preload('quest')

    const toComplete: CharacterQuest[] = []

    for (const state of activeStates) {
      const nextProgress = this.computeNextProgress(state.quest, state.progress, payload)

      if (nextProgress === state.progress) {
        continue
      }

      state.progress = nextProgress
      await state.save()

      if (state.progress >= state.quest.targetValue) {
        toComplete.push(state)
      }
    }

    for (const state of toComplete) {
      await this.completeQuest(character, state, events)
    }
  }

  private static computeNextProgress(quest: Quest, currentProgress: number, payload: HackProgressPayload) {
    if (quest.objectiveType === 'hack_clicks') {
      return Math.min(quest.targetValue, currentProgress + Math.max(0, payload.clicks))
    }

    if (quest.objectiveType === 'hack_credits') {
      return Math.min(quest.targetValue, currentProgress + Math.max(0, payload.creditsEarned))
    }

    if (quest.objectiveType === 'reach_level') {
      return Math.min(quest.targetValue, Math.max(currentProgress, Math.max(1, payload.level)))
    }

    return currentProgress
  }

  private static async completeQuest(character: Character, state: CharacterQuest, events: QuestEvent[]) {
    state.status = 'completed'
    state.progress = state.quest.targetValue
    state.completedAt = DateTime.now()
    await state.save()

    const rewardLabel = await this.grantReward(character, state.quest)
    events.push({
      type: 'completed',
      title: state.quest.title,
      rewardLabel,
    })
  }

  private static async grantReward(character: Character, quest: Quest) {
    if (quest.rewardType === 'credits') {
      character.credits += quest.rewardValue
    } else if (quest.rewardType === 'xp') {
      character.xp += quest.rewardValue
      while (character.xp >= character.level * 100) {
        character.levelUp()
      }
    } else if (quest.rewardType === 'talent_points') {
      character.talentPoints += quest.rewardValue
    }

    await character.save()
    return this.getRewardLabel(quest)
  }

  private static async buildSummary(characterId: number, activeSeason: Season | null) {
    const quests = await this.getEligibleQuests(activeSeason)
    const states = quests.length === 0
      ? []
      : await CharacterQuest.query()
          .where('characterId', characterId)
          .whereIn('questId', quests.map((quest) => quest.id))
          .preload('quest')

    return {
      mainTrack: this.buildTrackSummary(
        quests.filter((quest) => quest.questType === 'main'),
        states.filter((state) => state.quest.questType === 'main'),
        'main',
        null
      ),
      seasonalTrack: activeSeason
        ? this.buildTrackSummary(
            quests.filter((quest) => quest.questType === 'seasonal' && quest.seasonId === activeSeason.id),
            states.filter(
              (state) => state.quest.questType === 'seasonal' && state.quest.seasonId === activeSeason.id
            ),
            'seasonal',
            activeSeason
          )
        : null,
    }
  }

  private static async buildJournal(characterId: number, activeSeason: Season | null) {
    const quests = await this.getEligibleQuests(activeSeason)
    const states = quests.length === 0
      ? []
      : await CharacterQuest.query()
          .where('characterId', characterId)
          .whereIn('questId', quests.map((quest) => quest.id))
          .preload('quest', (query) => {
            query.preload('parentQuest').preload('season')
          })

    const tracks: QuestTrackJournal[] = []

    const mainQuests = quests.filter((quest) => quest.questType === 'main')
    const mainStates = states.filter((state) => state.quest.questType === 'main')
    if (mainQuests.length > 0) {
      tracks.push(this.buildTrackJournal(mainQuests, mainStates, 'main', null))
    }

    if (activeSeason) {
      const seasonalQuests = quests.filter(
        (quest) => quest.questType === 'seasonal' && quest.seasonId === activeSeason.id
      )
      const seasonalStates = states.filter(
        (state) => state.quest.questType === 'seasonal' && state.quest.seasonId === activeSeason.id
      )
      if (seasonalQuests.length > 0) {
        tracks.push(this.buildTrackJournal(seasonalQuests, seasonalStates, 'seasonal', activeSeason))
      }
    }

    return {
      tracks,
    }
  }

  private static buildTrackSummary(
    quests: Quest[],
    states: CharacterQuest[],
    questType: 'main' | 'seasonal',
    season: Season | null
  ): QuestTrackSummary {
    if (quests.length === 0) {
      return null
    }

    const activeState = states
      .filter((state) => state.status === 'active')
      .sort((a, b) => a.quest.sortOrder - b.quest.sortOrder)[0] || null

    return {
      questType,
      trackKey: questType === 'main' ? 'main' : `seasonal:${season?.id ?? 'active'}`,
      title: questType === 'main' ? quests[0].arcTitle : season?.campaignTitle || season?.name || quests[0].arcTitle,
      subtitle:
        questType === 'main'
          ? 'Quete principale'
          : `Saison active${season?.name ? ` • ${season.name}` : ''}`,
      completedCount: states.filter((state) => state.status === 'completed').length,
      totalCount: quests.length,
      activeQuest: activeState
        ? {
            id: activeState.id,
            key: activeState.quest.key,
            title: activeState.quest.title,
            summary: activeState.quest.summary,
            giverName: activeState.quest.giverName,
            icon: activeState.quest.icon,
            progress: activeState.progress,
            targetValue: activeState.quest.targetValue,
            objectiveLabel: this.getObjectiveLabel(activeState.quest),
            rewardLabel: this.getRewardLabel(activeState.quest),
          }
        : null,
    }
  }

  private static buildTrackJournal(
    quests: Quest[],
    states: CharacterQuest[],
    questType: 'main' | 'seasonal',
    season: Season | null
  ): QuestTrackJournal {
    const stateByQuestId = new Map(states.map((state) => [state.questId, state]))
    const completedQuestIds = new Set(
      states.filter((state) => state.status === 'completed').map((state) => state.questId)
    )

    const serializedQuests: QuestJournalEntry[] = quests.map((quest) => {
      const state = stateByQuestId.get(quest.id)
      let status: QuestJournalEntry['status'] = 'locked'

      if (state?.status === 'completed') {
        status = 'completed'
      } else if (state?.status === 'active') {
        status = 'active'
      } else if (!quest.parentQuestId || completedQuestIds.has(quest.parentQuestId)) {
        status = 'available'
      }

      return {
        id: quest.id,
        key: quest.key,
        questType: quest.questType,
        seasonId: quest.seasonId,
        seasonName: quest.season?.name || season?.name || null,
        title: quest.title,
        summary: quest.summary,
        narrative: quest.narrative,
        giverName: quest.giverName,
        icon: quest.icon,
        sortOrder: quest.sortOrder,
        status,
        progress: state?.progress || 0,
        targetValue: quest.targetValue,
        objectiveLabel: this.getObjectiveLabel(quest),
        rewardLabel: this.getRewardLabel(quest),
        parentQuestTitle: quest.parentQuest?.title || null,
      }
    })

    const summary = this.buildTrackSummary(quests, states, questType, season)

    return {
      questType,
      trackKey: summary?.trackKey || questType,
      title: summary?.title || (questType === 'main' ? 'Quete principale' : season?.name || 'Saison'),
      subtitle: summary?.subtitle || '',
      completedCount: summary?.completedCount || 0,
      totalCount: summary?.totalCount || quests.length,
      activeQuest: summary?.activeQuest || null,
      quests: serializedQuests,
    }
  }

  private static getObjectiveLabel(quest: Quest) {
    if (quest.objectiveType === 'hack_clicks') {
      return `Executer ${quest.targetValue.toLocaleString('fr-FR')} hacks`
    }

    if (quest.objectiveType === 'hack_credits') {
      return `Siphonner ${quest.targetValue.toLocaleString('fr-FR')} credits`
    }

    if (quest.objectiveType === 'reach_level') {
      return `Atteindre le niveau ${quest.targetValue}`
    }

    return `Objectif ${quest.targetValue}`
  }

  private static getRewardLabel(quest: Quest) {
    if (quest.rewardType === 'credits') {
      return `+${quest.rewardValue.toLocaleString('fr-FR')} credits`
    }

    if (quest.rewardType === 'xp') {
      return `+${quest.rewardValue.toLocaleString('fr-FR')} XP`
    }

    if (quest.rewardType === 'talent_points') {
      return `+${quest.rewardValue} point${quest.rewardValue > 1 ? 's' : ''} de talent`
    }

    return `+${quest.rewardValue}`
  }
}
