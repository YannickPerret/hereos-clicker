import { DateTime } from 'luxon'
import Character from '#models/character'
import CharacterDailyRewardState from '#models/character_daily_reward_state'
import DailyRewardConfig from '#models/daily_reward_config'
import InventoryItem from '#models/inventory_item'
import CompanionService from '#services/companion_service'

export default class DailyRewardService {
  private static async ensureState(characterId: number) {
    const existing = await CharacterDailyRewardState.query()
      .where('characterId', characterId)
      .first()
    if (existing) return existing

    return CharacterDailyRewardState.create({
      characterId,
      currentStreak: 0,
      highestStreak: 0,
      lastClaimedAt: null,
    })
  }

  private static async getConfigs() {
    return DailyRewardConfig.query()
      .where('isActive', true)
      .preload('rewardItem')
      .orderBy('dayNumber', 'asc')
  }

  private static hasClaimedToday(state: CharacterDailyRewardState) {
    if (!state.lastClaimedAt) return false
    return state.lastClaimedAt >= DateTime.now().startOf('day')
  }

  private static claimedYesterday(state: CharacterDailyRewardState) {
    if (!state.lastClaimedAt) return false

    const today = DateTime.now().startOf('day')
    const yesterday = today.minus({ day: 1 })
    return state.lastClaimedAt >= yesterday && state.lastClaimedAt < today
  }

  private static getConfigForStreak(streak: number, configs: DailyRewardConfig[]) {
    if (configs.length === 0) return null
    const exact = configs.find((config) => config.dayNumber === streak)
    return exact || configs[configs.length - 1]
  }

  private static async applyReward(character: Character, config: DailyRewardConfig) {
    switch (config.rewardType) {
      case 'credits':
        character.credits += config.rewardValue
        break
      case 'xp':
        character.xp += config.rewardValue
        if (character.xp >= character.level * 100) {
          character.levelUp()
          await CompanionService.refillHpAfterLevelUp(character)
        }
        break
      case 'item': {
        if (!config.rewardItemId) {
          throw new Error('Reward item missing')
        }

        const quantity = Math.max(1, config.rewardValue)
        const existing = await InventoryItem.query()
          .where('characterId', character.id)
          .where('itemId', config.rewardItemId)
          .first()

        if (existing) {
          existing.quantity += quantity
          await existing.save()
        } else {
          await InventoryItem.create({
            characterId: character.id,
            itemId: config.rewardItemId,
            quantity,
            isEquipped: false,
          })
        }
        break
      }
    }
  }

  static async getStatus(characterId: number) {
    const [state, configs] = await Promise.all([this.ensureState(characterId), this.getConfigs()])

    const claimedToday = this.hasClaimedToday(state)
    const streakStillAlive = claimedToday || this.claimedYesterday(state)
    const activeStreak = streakStillAlive ? state.currentStreak : 0
    const nextClaimStreak = claimedToday
      ? Math.max(1, activeStreak)
      : this.claimedYesterday(state)
        ? activeStreak + 1
        : 1

    const nextReward = this.getConfigForStreak(nextClaimStreak, configs)
    const todayRewardDay = nextReward?.dayNumber ?? null

    return {
      currentStreak: activeStreak,
      highestStreak: state.highestStreak,
      claimedToday,
      canClaimToday: !claimedToday && !!nextReward,
      nextClaimStreak,
      todayRewardDay,
      resetsAt: DateTime.now().endOf('day').toISO(),
      rewards: configs.map((config) => ({
        id: config.id,
        dayNumber: config.dayNumber,
        rewardType: config.rewardType,
        rewardValue: config.rewardValue,
        rewardItemId: config.rewardItemId,
        rewardItemName: config.rewardItem?.name || null,
      })),
      nextReward: nextReward
        ? {
            id: nextReward.id,
            dayNumber: nextReward.dayNumber,
            rewardType: nextReward.rewardType,
            rewardValue: nextReward.rewardValue,
            rewardItemId: nextReward.rewardItemId,
            rewardItemName: nextReward.rewardItem?.name || null,
          }
        : null,
    }
  }

  static async claim(characterId: number) {
    const [state, configs, character] = await Promise.all([
      this.ensureState(characterId),
      this.getConfigs(),
      Character.findOrFail(characterId),
    ])

    if (configs.length === 0) {
      throw new Error('No daily rewards configured')
    }

    if (this.hasClaimedToday(state)) {
      throw new Error('Daily reward already claimed')
    }

    const nextStreak = this.claimedYesterday(state) ? state.currentStreak + 1 : 1
    const reward = this.getConfigForStreak(nextStreak, configs)
    if (!reward) {
      throw new Error('No matching reward config')
    }

    await this.applyReward(character, reward)

    state.currentStreak = nextStreak
    state.highestStreak = Math.max(state.highestStreak, nextStreak)
    state.lastClaimedAt = DateTime.now()

    await character.save()
    await state.save()

    return {
      streak: nextStreak,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
      rewardItemName: reward.rewardItem?.name || null,
    }
  }
}
