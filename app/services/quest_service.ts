import { DateTime } from 'luxon'
import Character from '#models/character'
import CharacterQuest from '#models/character_quest'
import InventoryItem from '#models/inventory_item'
import Quest from '#models/quest'
import Season from '#models/season'
import CompanionService from '#services/companion_service'
import SeasonService from '#services/season_service'

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

  static async trackObjectiveProgress(
    character: Character,
    objectiveType:
      | 'shop_purchase'
      | 'companion_purchase'
      | 'companion_activate'
      | 'pvp_match'
      | 'dungeon_floor_clear',
    amount: number = 1
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

    return this.trackHackProgress(character, payload)
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
      .whereIn(
        'questId',
        quests.map((quest) => quest.id)
      )
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

  private static async completeQuest(
    character: Character,
    state: CharacterQuest,
    events: QuestEvent[]
  ) {
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
    const rewards = this.parseRewards(quest)

    for (const reward of rewards) {
      if (reward.type === 'credits') {
        character.credits += reward.value
        continue
      }

      if (reward.type === 'xp') {
        character.xp += reward.value
        while (character.xp >= character.level * 100) {
          character.levelUp()
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
    return this.getRewardLabel(quest)
  }

  private static async buildSummary(characterId: number, activeSeason: Season | null) {
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
        null
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
            activeSeason
          )
        : null,
    }
  }

  private static async buildJournal(characterId: number, activeSeason: Season | null) {
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
        tracks.push(
          this.buildTrackJournal(seasonalQuests, seasonalStates, 'seasonal', activeSeason)
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
    season: Season | null
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
          : season?.campaignTitle || season?.name || quests[0].arcTitle,
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
      title:
        summary?.title || (questType === 'main' ? 'Quete principale' : season?.name || 'Saison'),
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

    if (quest.objectiveType === 'shop_purchase') {
      return `Acheter ${quest.targetValue.toLocaleString('fr-FR')} item${quest.targetValue > 1 ? 's' : ''} au shop`
    }

    if (quest.objectiveType === 'companion_purchase') {
      return `Acheter ${quest.targetValue.toLocaleString('fr-FR')} drone${quest.targetValue > 1 ? 's' : ''}`
    }

    if (quest.objectiveType === 'companion_activate') {
      return `Installer ${quest.targetValue.toLocaleString('fr-FR')} drone${quest.targetValue > 1 ? 's' : ''}`
    }

    if (quest.objectiveType === 'pvp_match') {
      return `Terminer ${quest.targetValue.toLocaleString('fr-FR')} combat${quest.targetValue > 1 ? 's' : ''} PvP`
    }

    if (quest.objectiveType === 'dungeon_floor_clear') {
      return `Terminer ${quest.targetValue.toLocaleString('fr-FR')} floor${quest.targetValue > 1 ? 's' : ''}`
    }

    return `Objectif ${quest.targetValue}`
  }

  private static getRewardLabel(quest: Quest) {
    const rewards = this.parseRewards(quest)
    if (rewards.length === 0) {
      return 'Aucune recompense'
    }

    return rewards
      .map((reward) => {
        if (reward.type === 'credits') {
          return `+${reward.value.toLocaleString('fr-FR')} credits`
        }

        if (reward.type === 'xp') {
          return `+${reward.value.toLocaleString('fr-FR')} XP`
        }

        if (reward.type === 'talent_points') {
          return `+${reward.value} point${reward.value > 1 ? 's' : ''} de talent`
        }

        if (reward.type === 'item') {
          return `${reward.value}x ${reward.itemName || `item #${reward.itemId ?? '?'}`}`
        }

        return `+${reward.value}`
      })
      .join(' • ')
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
}
