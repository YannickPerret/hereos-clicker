import { DateTime } from 'luxon'
import Character from '#models/character'
import CharacterQuest from '#models/character_quest'
import InventoryItem from '#models/inventory_item'
import Quest from '#models/quest'
import QuestFlowStep from '#models/quest_flow_step'
import Season from '#models/season'
import CompanionService from '#services/companion_service'
import SeasonService from '#services/season_service'

type SupportedLocale = 'fr' | 'en'

type HackProgressPayload = {
  clicks: number
  creditsEarned: number
  level: number
  shopPurchases?: number
  companionPurchases?: number
  companionActivations?: number
  pvpMatches?: number
  dungeonFloorClears?: number
}

type QuestEvent = {
  type: 'completed' | 'unlocked'
  title: string
  rewardLabel?: string
}

type QuestReward = {
  type: 'credits' | 'xp' | 'talent_points' | 'item'
  value: number
  itemId?: number | null
  itemName?: string | null
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
  static async getPlaySummary(character: Character, locale: SupportedLocale = 'fr') {
    const activeSeason = await SeasonService.getActiveSeason()

    await this.ensureEligibleQuestsStarted(character.id, activeSeason, undefined, locale)
    await this.advanceQuestProgress(
      character,
      { clicks: 0, creditsEarned: 0, level: character.level },
      [],
      activeSeason,
      locale
    )
    await this.ensureEligibleQuestsStarted(character.id, activeSeason, undefined, locale)

    return this.buildSummary(character.id, activeSeason, locale)
  }

  static async getJournal(character: Character, locale: SupportedLocale = 'fr') {
    const activeSeason = await SeasonService.getActiveSeason()

    await this.ensureEligibleQuestsStarted(character.id, activeSeason, undefined, locale)
    await this.advanceQuestProgress(
      character,
      { clicks: 0, creditsEarned: 0, level: character.level },
      [],
      activeSeason,
      locale
    )
    await this.ensureEligibleQuestsStarted(character.id, activeSeason, undefined, locale)

    return this.buildJournal(character.id, activeSeason, locale)
  }

  static async trackHackProgress(
    character: Character,
    payload: HackProgressPayload,
    locale: SupportedLocale = 'fr'
  ) {
    const activeSeason = await SeasonService.getActiveSeason()

    await this.ensureEligibleQuestsStarted(character.id, activeSeason, undefined, locale)

    const events: QuestEvent[] = []
    await this.advanceQuestProgress(character, payload, events, activeSeason, locale)
    await this.ensureEligibleQuestsStarted(character.id, activeSeason, events, locale)

    return {
      summary: await this.buildSummary(character.id, activeSeason, locale),
      events,
    }
  }

  static async trackObjectiveProgress(
    character: Character,
    objectiveType:
      | 'shop_purchase'
      | 'companion_purchase'
      | 'companion_activate'
      | 'pvp_match'
      | 'dungeon_floor_clear',
    amount: number = 1,
    locale: SupportedLocale = 'fr'
  ) {
    const payload: HackProgressPayload = {
      clicks: 0,
      creditsEarned: 0,
      level: character.level,
    }

    if (objectiveType === 'shop_purchase') payload.shopPurchases = amount
    if (objectiveType === 'companion_purchase') payload.companionPurchases = amount
    if (objectiveType === 'companion_activate') payload.companionActivations = amount
    if (objectiveType === 'pvp_match') payload.pvpMatches = amount
    if (objectiveType === 'dungeon_floor_clear') payload.dungeonFloorClears = amount

    return this.trackHackProgress(character, payload, locale)
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
    events?: QuestEvent[],
    locale: SupportedLocale = 'fr'
  ) {
    const quests = await this.getEligibleQuests(activeSeason)
    if (quests.length === 0) {
      return
    }

    const states = await CharacterQuest.query()
      .where('characterId', characterId)
      .whereIn(
        'questId',
        quests.map((quest) => quest.id)
      )
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

      // For advanced quests, find the first flow step
      let firstStepId: number | null = null
      if (quest.mode === 'advanced') {
        const firstStep = await QuestFlowStep.query()
          .where('questId', quest.id)
          .orderBy('sortOrder', 'asc')
          .first()
        firstStepId = firstStep?.id || null
      }

      const created = await CharacterQuest.create({
        characterId,
        questId: quest.id,
        status: 'active',
        progress: 0,
        startedAt: DateTime.now(),
        currentStepId: firstStepId,
        stepStateJson: null,
      })

      stateByQuestId.set(quest.id, created)

      if (events) {
        events.push({
          type: 'unlocked',
          title: this.localizedQuestField(quest.title, quest.titleEn, locale),
        })
      }
    }
  }

  private static async advanceQuestProgress(
    character: Character,
    payload: HackProgressPayload,
    events: QuestEvent[],
    activeSeason: Season | null,
    locale: SupportedLocale
  ) {
    const quests = await this.getEligibleQuests(activeSeason)
    if (quests.length === 0) {
      return
    }

    const activeStates = await CharacterQuest.query()
      .where('characterId', character.id)
      .where('status', 'active')
      .whereIn(
        'questId',
        quests.map((quest) => quest.id)
      )
      .preload('quest')

    const toComplete: CharacterQuest[] = []

    for (const state of activeStates) {
      // Advanced quests track progress through flow steps, not simple progress
      if (state.quest.mode === 'advanced') {
        await this.trackFlowObjectiveProgress(
          character,
          state.quest.objectiveType,
          this.getPayloadAmount(state.quest.objectiveType, payload)
        )
        continue
      }

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
      await this.completeQuest(character, state, events, locale)
    }
  }

  private static computeNextProgress(
    quest: Quest,
    currentProgress: number,
    payload: HackProgressPayload
  ) {
    if (quest.objectiveType === 'hack_clicks') {
      return Math.min(quest.targetValue, currentProgress + Math.max(0, payload.clicks))
    }

    if (quest.objectiveType === 'hack_credits') {
      return Math.min(quest.targetValue, currentProgress + Math.max(0, payload.creditsEarned))
    }

    if (quest.objectiveType === 'reach_level') {
      return Math.min(quest.targetValue, Math.max(currentProgress, Math.max(1, payload.level)))
    }

    if (quest.objectiveType === 'shop_purchase') {
      return Math.min(quest.targetValue, currentProgress + Math.max(0, payload.shopPurchases || 0))
    }

    if (quest.objectiveType === 'companion_purchase') {
      return Math.min(
        quest.targetValue,
        currentProgress + Math.max(0, payload.companionPurchases || 0)
      )
    }

    if (quest.objectiveType === 'companion_activate') {
      return Math.min(
        quest.targetValue,
        currentProgress + Math.max(0, payload.companionActivations || 0)
      )
    }

    if (quest.objectiveType === 'pvp_match') {
      return Math.min(quest.targetValue, currentProgress + Math.max(0, payload.pvpMatches || 0))
    }

    if (quest.objectiveType === 'dungeon_floor_clear') {
      return Math.min(
        quest.targetValue,
        currentProgress + Math.max(0, payload.dungeonFloorClears || 0)
      )
    }

    return currentProgress
  }

  private static getPayloadAmount(objectiveType: string, payload: HackProgressPayload): number {
    if (objectiveType === 'hack_clicks') return Math.max(0, payload.clicks)
    if (objectiveType === 'hack_credits') return Math.max(0, payload.creditsEarned)
    if (objectiveType === 'reach_level') return Math.max(1, payload.level)
    if (objectiveType === 'shop_purchase') return Math.max(0, payload.shopPurchases || 0)
    if (objectiveType === 'companion_purchase') return Math.max(0, payload.companionPurchases || 0)
    if (objectiveType === 'companion_activate')
      return Math.max(0, payload.companionActivations || 0)
    if (objectiveType === 'pvp_match') return Math.max(0, payload.pvpMatches || 0)
    if (objectiveType === 'dungeon_floor_clear') return Math.max(0, payload.dungeonFloorClears || 0)
    return 0
  }

  private static async completeQuest(
    character: Character,
    state: CharacterQuest,
    events: QuestEvent[],
    locale: SupportedLocale
  ) {
    state.status = 'completed'
    state.progress = state.quest.targetValue
    state.completedAt = DateTime.now()
    await state.save()

    const rewardLabel = await this.grantReward(character, state.quest, locale)
    events.push({
      type: 'completed',
      title: this.localizedQuestField(state.quest.title, state.quest.titleEn, locale),
      rewardLabel,
    })
  }

  private static async grantReward(character: Character, quest: Quest, locale: SupportedLocale) {
    const rewards = this.parseRewards(quest)

    for (const reward of rewards) {
      if (reward.type === 'credits') {
        character.credits += reward.value
        continue
      }

      if (reward.type === 'xp') {
        character.xp += reward.value
        if (character.applyLevelUps()) {
          await CompanionService.refillHpAfterLevelUp(character)
        }
        continue
      }

      if (reward.type === 'talent_points') {
        character.talentPoints += reward.value
        continue
      }

      if (reward.type === 'item' && reward.itemId) {
        const existing = await InventoryItem.query()
          .where('characterId', character.id)
          .where('itemId', reward.itemId)
          .first()

        if (existing) {
          existing.quantity += reward.value
          await existing.save()
        } else {
          await InventoryItem.create({
            characterId: character.id,
            itemId: reward.itemId,
            quantity: reward.value,
            isEquipped: false,
          })
        }
      }
    }

    await character.save()
    return this.getRewardLabel(quest, locale)
  }

  private static async buildSummary(
    characterId: number,
    activeSeason: Season | null,
    locale: SupportedLocale
  ) {
    const quests = await this.getEligibleQuests(activeSeason)
    const states =
      quests.length === 0
        ? []
        : await CharacterQuest.query()
            .where('characterId', characterId)
            .whereIn(
              'questId',
              quests.map((quest) => quest.id)
            )
            .preload('quest')

    return {
      mainTrack: this.buildTrackSummary(
        quests.filter((quest) => quest.questType === 'main'),
        states.filter((state) => state.quest.questType === 'main'),
        'main',
        null,
        locale
      ),
      seasonalTrack: activeSeason
        ? this.buildTrackSummary(
            quests.filter(
              (quest) => quest.questType === 'seasonal' && quest.seasonId === activeSeason.id
            ),
            states.filter(
              (state) =>
                state.quest.questType === 'seasonal' && state.quest.seasonId === activeSeason.id
            ),
            'seasonal',
            activeSeason,
            locale
          )
        : null,
    }
  }

  private static async buildJournal(
    characterId: number,
    activeSeason: Season | null,
    locale: SupportedLocale
  ) {
    const quests = await this.getEligibleQuests(activeSeason)
    const states =
      quests.length === 0
        ? []
        : await CharacterQuest.query()
            .where('characterId', characterId)
            .whereIn(
              'questId',
              quests.map((quest) => quest.id)
            )
            .preload('quest', (query) => {
              query.preload('parentQuest').preload('season')
            })

    const tracks: QuestTrackJournal[] = []

    const mainQuests = quests.filter((quest) => quest.questType === 'main')
    const mainStates = states.filter((state) => state.quest.questType === 'main')
    if (mainQuests.length > 0) {
      tracks.push(this.buildTrackJournal(mainQuests, mainStates, 'main', null, locale))
    }

    if (activeSeason) {
      const seasonalQuests = quests.filter(
        (quest) => quest.questType === 'seasonal' && quest.seasonId === activeSeason.id
      )
      const seasonalStates = states.filter(
        (state) => state.quest.questType === 'seasonal' && state.quest.seasonId === activeSeason.id
      )
      if (seasonalQuests.length > 0) {
        tracks.push(
          this.buildTrackJournal(seasonalQuests, seasonalStates, 'seasonal', activeSeason, locale)
        )
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
    season: Season | null,
    locale: SupportedLocale
  ): QuestTrackSummary {
    if (quests.length === 0) {
      return null
    }

    const activeState =
      states
        .filter((state) => state.status === 'active')
        .sort((a, b) => a.quest.sortOrder - b.quest.sortOrder)[0] || null

    return {
      questType,
      trackKey: questType === 'main' ? 'main' : `seasonal:${season?.id ?? 'active'}`,
      title:
        questType === 'main'
          ? quests[0].arcTitle
          : this.localizedQuestField(
              season?.campaignTitle || season?.name || quests[0].arcTitle,
              season?.campaignTitleEn || season?.nameEn || null,
              locale
            ),
      subtitle:
        questType === 'main'
          ? locale === 'en'
            ? 'Main quest'
            : 'Quete principale'
          : locale === 'en'
            ? `Active season${season?.nameEn || season?.name ? ` • ${season?.nameEn || season?.name}` : ''}`
            : `Saison active${season?.name ? ` • ${season.name}` : ''}`,
      completedCount: states.filter((state) => state.status === 'completed').length,
      totalCount: quests.length,
      activeQuest: activeState
        ? {
            id: activeState.id,
            key: activeState.quest.key,
            title: this.localizedQuestField(
              activeState.quest.title,
              activeState.quest.titleEn,
              locale
            ),
            summary: this.localizedQuestField(
              activeState.quest.summary,
              activeState.quest.summaryEn,
              locale
            ),
            giverName: activeState.quest.giverName,
            icon: activeState.quest.icon,
            progress: activeState.progress,
            targetValue: activeState.quest.targetValue,
            objectiveLabel: this.getObjectiveLabel(activeState.quest, locale),
            rewardLabel: this.getRewardLabel(activeState.quest, locale),
          }
        : null,
    }
  }

  private static buildTrackJournal(
    quests: Quest[],
    states: CharacterQuest[],
    questType: 'main' | 'seasonal',
    season: Season | null,
    locale: SupportedLocale
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
        mode: quest.mode || 'simple',
        questType: quest.questType,
        seasonId: quest.seasonId,
        seasonName:
          locale === 'en'
            ? quest.season?.nameEn || quest.season?.name || season?.nameEn || season?.name || null
            : quest.season?.name || season?.name || null,
        title: this.localizedQuestField(quest.title, quest.titleEn, locale),
        summary: this.localizedQuestField(quest.summary, quest.summaryEn, locale),
        narrative: this.localizedQuestField(quest.narrative, quest.narrativeEn, locale),
        giverName: quest.giverName,
        icon: quest.icon,
        sortOrder: quest.sortOrder,
        status,
        progress: state?.progress || 0,
        targetValue: quest.targetValue,
        objectiveLabel: this.getObjectiveLabel(quest, locale),
        rewardLabel: this.getRewardLabel(quest, locale),
        parentQuestTitle: quest.parentQuest
          ? this.localizedQuestField(quest.parentQuest.title, quest.parentQuest.titleEn, locale)
          : null,
      }
    })

    const summary = this.buildTrackSummary(quests, states, questType, season, locale)

    return {
      questType,
      trackKey: summary?.trackKey || questType,
      title:
        summary?.title ||
        (questType === 'main'
          ? locale === 'en'
            ? 'Main quest'
            : 'Quete principale'
          : locale === 'en'
            ? season?.nameEn || season?.name || 'Season'
            : season?.name || 'Saison'),
      subtitle: summary?.subtitle || '',
      completedCount: summary?.completedCount || 0,
      totalCount: summary?.totalCount || quests.length,
      activeQuest: summary?.activeQuest || null,
      quests: serializedQuests,
    }
  }

  private static getObjectiveLabel(quest: Quest, locale: SupportedLocale) {
    if (quest.objectiveType === 'hack_clicks') {
      return locale === 'en'
        ? `Execute ${quest.targetValue.toLocaleString('en-US')} hacks`
        : `Executer ${quest.targetValue.toLocaleString('fr-FR')} hacks`
    }

    if (quest.objectiveType === 'hack_credits') {
      return locale === 'en'
        ? `Siphon ${quest.targetValue.toLocaleString('en-US')} credits`
        : `Siphonner ${quest.targetValue.toLocaleString('fr-FR')} credits`
    }

    if (quest.objectiveType === 'reach_level') {
      return locale === 'en'
        ? `Reach level ${quest.targetValue}`
        : `Atteindre le niveau ${quest.targetValue}`
    }

    if (quest.objectiveType === 'shop_purchase') {
      return locale === 'en'
        ? `Buy ${quest.targetValue.toLocaleString('en-US')} shop item${quest.targetValue > 1 ? 's' : ''}`
        : `Acheter ${quest.targetValue.toLocaleString('fr-FR')} item${quest.targetValue > 1 ? 's' : ''} au shop`
    }

    if (quest.objectiveType === 'companion_purchase') {
      return locale === 'en'
        ? `Buy ${quest.targetValue.toLocaleString('en-US')} drone${quest.targetValue > 1 ? 's' : ''}`
        : `Acheter ${quest.targetValue.toLocaleString('fr-FR')} drone${quest.targetValue > 1 ? 's' : ''}`
    }

    if (quest.objectiveType === 'companion_activate') {
      return locale === 'en'
        ? `Activate ${quest.targetValue.toLocaleString('en-US')} drone${quest.targetValue > 1 ? 's' : ''}`
        : `Installer ${quest.targetValue.toLocaleString('fr-FR')} drone${quest.targetValue > 1 ? 's' : ''}`
    }

    if (quest.objectiveType === 'pvp_match') {
      return locale === 'en'
        ? `Finish ${quest.targetValue.toLocaleString('en-US')} PvP match${quest.targetValue > 1 ? 'es' : ''}`
        : `Terminer ${quest.targetValue.toLocaleString('fr-FR')} combat${quest.targetValue > 1 ? 's' : ''} PvP`
    }

    if (quest.objectiveType === 'dungeon_floor_clear') {
      return locale === 'en'
        ? `Clear ${quest.targetValue.toLocaleString('en-US')} floor${quest.targetValue > 1 ? 's' : ''}`
        : `Terminer ${quest.targetValue.toLocaleString('fr-FR')} floor${quest.targetValue > 1 ? 's' : ''}`
    }

    return locale === 'en' ? `Objective ${quest.targetValue}` : `Objectif ${quest.targetValue}`
  }

  private static getRewardLabel(quest: Quest, locale: SupportedLocale) {
    const rewards = this.parseRewards(quest)
    if (rewards.length === 0) {
      return locale === 'en' ? 'No reward' : 'Aucune recompense'
    }

    return rewards
      .map((reward) => {
        if (reward.type === 'credits') {
          return locale === 'en'
            ? `+${reward.value.toLocaleString('en-US')} credits`
            : `+${reward.value.toLocaleString('fr-FR')} credits`
        }

        if (reward.type === 'xp') {
          return locale === 'en'
            ? `+${reward.value.toLocaleString('en-US')} XP`
            : `+${reward.value.toLocaleString('fr-FR')} XP`
        }

        if (reward.type === 'talent_points') {
          return locale === 'en'
            ? `+${reward.value} talent point${reward.value > 1 ? 's' : ''}`
            : `+${reward.value} point${reward.value > 1 ? 's' : ''} de talent`
        }

        if (reward.type === 'item') {
          return `${reward.value}x ${reward.itemName || `item #${reward.itemId ?? '?'}`}`
        }

        return `+${reward.value}`
      })
      .join(' • ')
  }

  private static localizedQuestField(
    defaultValue: string | null | undefined,
    englishValue: string | null | undefined,
    locale: SupportedLocale
  ) {
    return locale === 'en' ? englishValue || defaultValue || '' : defaultValue || englishValue || ''
  }

  private static parseRewards(quest: Quest): QuestReward[] {
    if (quest.rewardsJson) {
      try {
        const parsed = JSON.parse(quest.rewardsJson)
        if (Array.isArray(parsed)) {
          return parsed
            .filter((reward) => reward && typeof reward === 'object')
            .map((reward) => ({
              type: reward.type,
              value: Math.max(0, Number(reward.value || 0)),
              itemId: reward.itemId ? Number(reward.itemId) : null,
              itemName: reward.itemName ? String(reward.itemName) : null,
            }))
            .filter((reward) => reward.value > 0 || reward.type === 'item')
        }
      } catch {}
    }

    if ((quest.rewardValue || 0) <= 0) {
      return []
    }

    return [
      {
        type: quest.rewardType as QuestReward['type'],
        value: quest.rewardValue,
        itemId: null,
        itemName: null,
      },
    ]
  }

  // ── Flow Step Logic (Advanced Quests) ──

  static async getFlowState(
    characterId: number,
    questId: number,
    locale: SupportedLocale = 'fr'
  ) {
    const state = await CharacterQuest.query()
      .where('characterId', characterId)
      .where('questId', questId)
      .preload('quest', (q) => q.preload('flowSteps'))
      .first()

    if (!state || state.quest.mode !== 'advanced') {
      return null
    }

    const steps = state.quest.flowSteps.sort((a, b) => a.sortOrder - b.sortOrder)
    if (steps.length === 0) return null

    // Initialize to first step if not set
    if (!state.currentStepId && state.status === 'active') {
      state.currentStepId = steps[0].id
      state.stepStateJson = null
      await state.save()
    }

    const currentStep = steps.find((s) => s.id === state.currentStepId) || null

    return {
      characterQuestId: state.id,
      status: state.status,
      currentStep: currentStep
        ? {
            id: currentStep.id,
            stepType: currentStep.stepType,
            sortOrder: currentStep.sortOrder,
            content: currentStep.getContent(locale),
            nextStepId: currentStep.nextStepId,
          }
        : null,
      stepState: state.stepState,
      steps: steps.map((s) => ({
        id: s.id,
        stepType: s.stepType,
        sortOrder: s.sortOrder,
        content: s.getContent(locale),
        nextStepId: s.nextStepId,
      })),
    }
  }

  static async advanceFlowStep(
    character: Character,
    questId: number,
    locale: SupportedLocale = 'fr'
  ): Promise<{ success: boolean; event?: QuestEvent; flowState?: any }> {
    const state = await CharacterQuest.query()
      .where('characterId', character.id)
      .where('questId', questId)
      .where('status', 'active')
      .preload('quest', (q) => q.preload('flowSteps'))
      .first()

    if (!state || state.quest.mode !== 'advanced') {
      return { success: false }
    }

    const steps = state.quest.flowSteps.sort((a, b) => a.sortOrder - b.sortOrder)
    const currentStep = steps.find((s) => s.id === state.currentStepId)

    if (!currentStep) return { success: false }

    // Only narration/conversation can be advanced by clicking "next"
    if (currentStep.stepType !== 'narration' && currentStep.stepType !== 'conversation') {
      return { success: false }
    }

    // For conversation: track which line the player is on
    if (currentStep.stepType === 'conversation') {
      const content = currentStep.getContent(locale)
      const lines = content.lines || []
      const stepState = state.stepState || {}
      const currentLine = stepState.currentLine || 0

      if (currentLine < lines.length - 1) {
        // Advance to next line in conversation
        state.stepStateJson = JSON.stringify({ ...stepState, currentLine: currentLine + 1 })
        await state.save()
        return { success: true, flowState: await this.getFlowState(character.id, questId, locale) }
      }
      // All lines read, fall through to advance to next step
    }

    return this.moveToNextStep(character, state, currentStep, steps, locale)
  }

  static async makeFlowChoice(
    character: Character,
    questId: number,
    optionIndex: number,
    locale: SupportedLocale = 'fr'
  ): Promise<{ success: boolean; event?: QuestEvent; flowState?: any }> {
    const state = await CharacterQuest.query()
      .where('characterId', character.id)
      .where('questId', questId)
      .where('status', 'active')
      .preload('quest', (q) => q.preload('flowSteps'))
      .first()

    if (!state || state.quest.mode !== 'advanced') {
      return { success: false }
    }

    const steps = state.quest.flowSteps.sort((a, b) => a.sortOrder - b.sortOrder)
    const currentStep = steps.find((s) => s.id === state.currentStepId)

    if (!currentStep || currentStep.stepType !== 'choice') {
      return { success: false }
    }

    const content = currentStep.getContent(locale)
    const options = content.options || []
    if (optionIndex < 0 || optionIndex >= options.length) {
      return { success: false }
    }

    const chosen = options[optionIndex]
    const nextStepId = chosen.nextStepId

    if (nextStepId) {
      const nextStep = steps.find((s) => s.id === nextStepId)
      if (nextStep) {
        state.currentStepId = nextStep.id
        state.stepStateJson = JSON.stringify({ choiceMade: chosen.label })
        await state.save()
        return { success: true, flowState: await this.getFlowState(character.id, questId, locale) }
      }
    }

    // No next step from choice — try sortOrder fallback or complete
    return this.moveToNextStep(character, state, currentStep, steps, locale)
  }

  static async checkFlowObjectiveProgress(
    character: Character,
    questId: number,
    locale: SupportedLocale = 'fr'
  ): Promise<{ success: boolean; event?: QuestEvent; flowState?: any }> {
    const state = await CharacterQuest.query()
      .where('characterId', character.id)
      .where('questId', questId)
      .where('status', 'active')
      .preload('quest', (q) => q.preload('flowSteps'))
      .first()

    if (!state || state.quest.mode !== 'advanced') {
      return { success: false }
    }

    const steps = state.quest.flowSteps.sort((a, b) => a.sortOrder - b.sortOrder)
    const currentStep = steps.find((s) => s.id === state.currentStepId)

    if (!currentStep || currentStep.stepType !== 'objective') {
      return { success: false }
    }

    const content = currentStep.getContent(locale)
    const stepState = state.stepState || {}
    const progress = stepState.progress || 0

    if (progress >= (content.targetValue || 1)) {
      return this.moveToNextStep(character, state, currentStep, steps, locale)
    }

    return { success: false, flowState: await this.getFlowState(character.id, questId, locale) }
  }

  static async checkFlowWaitProgress(
    character: Character,
    questId: number,
    locale: SupportedLocale = 'fr'
  ): Promise<{ success: boolean; event?: QuestEvent; flowState?: any }> {
    const state = await CharacterQuest.query()
      .where('characterId', character.id)
      .where('questId', questId)
      .where('status', 'active')
      .preload('quest', (q) => q.preload('flowSteps'))
      .first()

    if (!state || state.quest.mode !== 'advanced') {
      return { success: false }
    }

    const steps = state.quest.flowSteps.sort((a, b) => a.sortOrder - b.sortOrder)
    const currentStep = steps.find((s) => s.id === state.currentStepId)

    if (!currentStep || currentStep.stepType !== 'wait') {
      return { success: false }
    }

    const content = currentStep.getContent(locale)
    const stepState = state.stepState || {}

    // Initialize wait start time
    if (!stepState.waitStartedAt) {
      state.stepStateJson = JSON.stringify({ ...stepState, waitStartedAt: DateTime.now().toISO() })
      await state.save()
      return { success: false, flowState: await this.getFlowState(character.id, questId, locale) }
    }

    const waitStart = DateTime.fromISO(stepState.waitStartedAt)
    const duration = content.duration || 1
    const unit = content.unit || 'minutes'
    const endTime = waitStart.plus({ [unit]: duration })

    if (DateTime.now() >= endTime) {
      return this.moveToNextStep(character, state, currentStep, steps, locale)
    }

    return { success: false, flowState: await this.getFlowState(character.id, questId, locale) }
  }

  static async trackFlowObjectiveProgress(
    character: Character,
    objectiveType: string,
    amount: number
  ) {
    // Find all active advanced quests for this character whose current step is an objective
    const states = await CharacterQuest.query()
      .where('characterId', character.id)
      .where('status', 'active')
      .whereNotNull('currentStepId')
      .preload('quest', (q) => q.preload('flowSteps'))

    for (const state of states) {
      if (state.quest.mode !== 'advanced') continue

      const currentStep = state.quest.flowSteps.find((s) => s.id === state.currentStepId)
      if (!currentStep || currentStep.stepType !== 'objective') continue

      const content = currentStep.content
      if (content.objectiveType !== objectiveType) continue

      const stepState = state.stepState || {}
      const currentProgress = stepState.progress || 0
      const newProgress = Math.min(content.targetValue || 1, currentProgress + amount)

      state.stepStateJson = JSON.stringify({ ...stepState, progress: newProgress })
      await state.save()

      // Auto-advance if objective completed
      if (newProgress >= (content.targetValue || 1)) {
        const steps = state.quest.flowSteps.sort((a, b) => a.sortOrder - b.sortOrder)
        await this.moveToNextStep(character, state, currentStep, steps, 'fr')
      }
    }
  }

  private static async moveToNextStep(
    character: Character,
    state: CharacterQuest,
    currentStep: QuestFlowStep,
    steps: QuestFlowStep[],
    locale: SupportedLocale
  ): Promise<{ success: boolean; event?: QuestEvent; flowState?: any }> {
    // Determine next step: explicit nextStepId or next by sortOrder
    let nextStep: QuestFlowStep | undefined

    if (currentStep.nextStepId) {
      nextStep = steps.find((s) => s.id === currentStep.nextStepId)
    }

    if (!nextStep) {
      const currentIdx = steps.findIndex((s) => s.id === currentStep.id)
      nextStep = steps[currentIdx + 1]
    }

    if (nextStep) {
      state.currentStepId = nextStep.id
      state.stepStateJson = null
      await state.save()

      // If next step is a wait, initialize the timer
      if (nextStep.stepType === 'wait') {
        state.stepStateJson = JSON.stringify({ waitStartedAt: DateTime.now().toISO() })
        await state.save()
      }

      return {
        success: true,
        flowState: await this.getFlowState(character.id, state.questId, locale),
      }
    }

    // No more steps — quest complete
    const events: QuestEvent[] = []
    await this.completeQuest(character, state, events, locale)

    return {
      success: true,
      event: events[0],
      flowState: await this.getFlowState(character.id, state.questId, locale),
    }
  }
}
