import { DateTime } from 'luxon'
import Character from '#models/character'
import DailyMission from '#models/daily_mission'
import CharacterDailyMission from '#models/character_daily_mission'
import InventoryItem from '#models/inventory_item'
import CompanionService from '#services/companion_service'

const MISSIONS_PER_DAY = 3
const MAX_RESETS_PER_DAY = 3
const RESET_COSTS = [0, 25000, 100000]

export default class DailyMissionService {
  private static getToday() {
    return DateTime.now().startOf('day')
  }

  private static getTodayAssignments(characterId: number) {
    return CharacterDailyMission.query()
      .where('characterId', characterId)
      .where('assignedAt', '>=', this.getToday().toSQL()!)
  }

  private static shuffle<T>(values: T[]) {
    return [...values].sort(() => Math.random() - 0.5)
  }

  private static async assignRandomMissions(characterId: number) {
    const allMissions = await DailyMission.all()
    const picked = this.shuffle(allMissions).slice(0, MISSIONS_PER_DAY)

    const assigned: CharacterDailyMission[] = []
    for (const mission of picked) {
      assigned.push(
        await CharacterDailyMission.create({
          characterId,
          dailyMissionId: mission.id,
          progress: 0,
          completed: false,
          claimed: false,
          assignedAt: DateTime.now(),
        })
      )
    }

    return assigned
  }

  private static async normalizeResetState(character: Character) {
    const today = this.getToday()
    const lastReset = character.dailyMissionLastResetAt

    if (lastReset && lastReset >= today) {
      return
    }

    if ((character.dailyMissionResetsUsed || 0) === 0 && !character.dailyMissionLastResetAt) {
      return
    }

    character.dailyMissionResetsUsed = 0
    character.dailyMissionLastResetAt = null
    await character.save()
  }

  /** Assign random daily missions if none today */
  static async ensureDailyMissions(characterId: number) {
    const character = await Character.findOrFail(characterId)
    await this.normalizeResetState(character)
    const today = this.getToday()

    const existing = await this.getTodayAssignments(characterId)

    if (existing.length >= MISSIONS_PER_DAY) return existing

    // Clear old missions
    await CharacterDailyMission.query()
      .where('characterId', characterId)
      .where('assignedAt', '<', today.toSQL()!)
      .delete()

    return this.assignRandomMissions(characterId)
  }

  /** Track progress for a mission type */
  static async trackProgress(characterId: number, type: string, amount: number = 1) {
    const missions = await this.getTodayAssignments(characterId)
      .where('completed', false)
      .preload('dailyMission')

    for (const cm of missions) {
      if (cm.dailyMission.type === type) {
        cm.progress = Math.min(cm.progress + amount, cm.dailyMission.targetValue)
        if (cm.progress >= cm.dailyMission.targetValue) {
          cm.completed = true
          cm.completedAt = DateTime.now()
        }
        await cm.save()
      }
    }
  }

  /** Claim a completed mission reward */
  static async claimReward(characterId: number, characterDailyMissionId: number) {
    const cm = await CharacterDailyMission.query()
      .where('id', characterDailyMissionId)
      .where('characterId', characterId)
      .where('completed', true)
      .where('claimed', false)
      .preload('dailyMission')
      .firstOrFail()

    const character = await Character.findOrFail(characterId)
    const mission = cm.dailyMission

    switch (mission.rewardType) {
      case 'credits':
        character.credits += mission.rewardValue
        break
      case 'xp':
        character.xp += mission.rewardValue
        if (character.xp >= character.level * 100) {
          character.levelUp()
          await CompanionService.refillHpAfterLevelUp(character)
        }
        break
      case 'item':
        if (mission.rewardItemId) {
          const existing = await InventoryItem.query()
            .where('characterId', characterId)
            .where('itemId', mission.rewardItemId)
            .first()
          if (existing) {
            existing.quantity += 1
            await existing.save()
          } else {
            await InventoryItem.create({
              characterId,
              itemId: mission.rewardItemId,
              quantity: 1,
              isEquipped: false,
            })
          }
        }
        break
    }

    cm.claimed = true
    await cm.save()
    await character.save()

    return { rewardType: mission.rewardType, rewardValue: mission.rewardValue, character }
  }

  static async getResetStatus(character: Character) {
    await this.normalizeResetState(character)

    const resetsUsed = character.dailyMissionResetsUsed || 0
    const resetsRemaining = Math.max(0, MAX_RESETS_PER_DAY - resetsUsed)
    const nextResetCost = resetsRemaining > 0 ? RESET_COSTS[resetsUsed] || RESET_COSTS.at(-1)! : null

    return {
      resetsUsed,
      resetsRemaining,
      nextResetCost,
      nextResetIsFree: nextResetCost === 0,
      maxResetsPerDay: MAX_RESETS_PER_DAY,
    }
  }

  static async resetDailyMissions(character: Character) {
    await this.normalizeResetState(character)

    const resetsUsed = character.dailyMissionResetsUsed || 0
    if (resetsUsed >= MAX_RESETS_PER_DAY) {
      throw new Error('Limite de reset quotidienne atteinte')
    }

    const cost = RESET_COSTS[resetsUsed] || RESET_COSTS.at(-1)!
    if (cost > 0 && character.credits < cost) {
      throw new Error(`Pas assez de credits pour reset (${cost} credits requis)`)
    }

    if (cost > 0) {
      character.credits -= cost
    }

    character.dailyMissionResetsUsed = resetsUsed + 1
    character.dailyMissionLastResetAt = DateTime.now()
    await character.save()

    await this.getTodayAssignments(character.id).delete()
    return {
      cost,
      resetsUsed: character.dailyMissionResetsUsed,
      missions: await this.assignRandomMissions(character.id),
    }
  }
}
