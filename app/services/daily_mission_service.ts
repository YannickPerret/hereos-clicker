import { DateTime } from 'luxon'
import Character from '#models/character'
import DailyMission from '#models/daily_mission'
import CharacterDailyMission from '#models/character_daily_mission'
import InventoryItem from '#models/inventory_item'

const MISSIONS_PER_DAY = 3

export default class DailyMissionService {
  /** Assign random daily missions if none today */
  static async ensureDailyMissions(characterId: number) {
    const today = DateTime.now().startOf('day')

    const existing = await CharacterDailyMission.query()
      .where('characterId', characterId)
      .where('assignedAt', '>=', today.toSQL()!)

    if (existing.length >= MISSIONS_PER_DAY) return existing

    // Clear old missions
    await CharacterDailyMission.query()
      .where('characterId', characterId)
      .where('assignedAt', '<', today.toSQL()!)
      .delete()

    // Pick random missions
    const allMissions = await DailyMission.all()
    const shuffled = allMissions.sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, MISSIONS_PER_DAY)

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

  /** Track progress for a mission type */
  static async trackProgress(characterId: number, type: string, amount: number = 1) {
    const today = DateTime.now().startOf('day')

    const missions = await CharacterDailyMission.query()
      .where('characterId', characterId)
      .where('assignedAt', '>=', today.toSQL()!)
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
}
