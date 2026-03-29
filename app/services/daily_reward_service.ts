import { DateTime } from 'luxon'
import Character from '#models/character'
import CharacterDailyRewardState from '#models/character_daily_reward_state'
import DailyRewardConfig from '#models/daily_reward_config'
import DailyRewardConfigReward from '#models/daily_reward_config_reward'
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
      .preload('rewards', (q) => q.preload('rewardItem'))
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

  private static async applyRewards(
    character: Character,
    rewards: DailyRewardConfigReward[]
  ) {
    for (const reward of rewards) {
      switch (reward.rewardType) {
        case 'credits':
          character.credits += reward.rewardValue
          break
        case 'xp':
          character.xp += reward.rewardValue
          if (character.applyLevelUps()) {
            await CompanionService.refillHpAfterLevelUp(character)
          }
          break
        case 'item': {
          if (!reward.rewardItemId) break

          const quantity = Math.max(1, reward.rewardValue)
          const existing = await InventoryItem.query()
            .where('characterId', character.id)
            .where('itemId', reward.rewardItemId)
            .first()

          if (existing) {
            existing.quantity += quantity
            await existing.save()
          } else {
            await InventoryItem.create({
              characterId: character.id,
              itemId: reward.rewardItemId,
              quantity,
              isEquipped: false,
            })
          }
          break
        }
      }
    }
  }

  private static serializeRewards(rewards: DailyRewardConfigReward[]) {
    return rewards.map((r) => ({
      id: r.id,
      rewardType: r.rewardType,
      rewardValue: r.rewardValue,
      rewardItemId: r.rewardItemId,
      rewardItemName: r.rewardItem?.name || null,
    }))
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

    const nextConfig = this.getConfigForStreak(nextClaimStreak, configs)
    const todayRewardDay = nextConfig?.dayNumber ?? null

    return {
      currentStreak: activeStreak,
      highestStreak: state.highestStreak,
      claimedToday,
      canClaimToday: !claimedToday && !!nextConfig,
      nextClaimStreak,
      todayRewardDay,
      resetsAt: DateTime.now().endOf('day').toISO(),
      days: configs.map((config) => ({
        id: config.id,
        dayNumber: config.dayNumber,
        rewards: this.serializeRewards(config.rewards),
      })),
      nextRewards: nextConfig ? this.serializeRewards(nextConfig.rewards) : [],
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
    const config = this.getConfigForStreak(nextStreak, configs)
    if (!config || config.rewards.length === 0) {
      throw new Error('No matching reward config')
    }

    await this.applyRewards(character, config.rewards)

    state.currentStreak = nextStreak
    state.highestStreak = Math.max(state.highestStreak, nextStreak)
    state.lastClaimedAt = DateTime.now()

    await character.save()
    await state.save()

    return {
      streak: nextStreak,
      rewards: this.serializeRewards(config.rewards),
    }
  }
}
