import Character from '#models/character'
import InventoryItem from '#models/inventory_item'
import TalentService from '#services/talent_service'
import DailyMissionService from '#services/daily_mission_service'
import transmit from '@adonisjs/transmit/services/main'

const MAX_CLICKS_PER_BATCH = 50

// ═══════════════════════════════════════════
// Anti-cheat: rate limiting + pattern detection
// ═══════════════════════════════════════════

interface ClickRecord {
  timestamps: number[]    // Last N request timestamps
  clickCounts: number[]   // Last N click counts
  penaltyUntil: number    // If > Date.now(), clicks are blocked
  warnings: number        // Accumulated warnings
}

const clickRecords = new Map<number, ClickRecord>()

const RATE_LIMIT_WINDOW = 1000      // 1 second window
const MAX_REQUESTS_PER_WINDOW = 14  // Mobile users can legitimately burst more often
const PATTERN_HISTORY = 20         // Track last 20 requests
const PENALTY_DURATION = 8_000     // 8 second penalty
const MAX_WARNINGS = 5             // Warnings before penalty
const MIN_CLICK_COUNT_FOR_PATTERN_CHECK = 18
const HUMAN_BATCH_INTERVAL = 500
const HUMAN_BATCH_TOLERANCE = 160
const BOT_TIMING_STDDEV_THRESHOLD = 8
const BOT_INTERVAL_THRESHOLD = 300

export default class ClickerService {
  /** Anti-cheat: check if user is rate-limited or showing bot patterns */
  static checkAntiCheat(userId: number, clickCount: number): { allowed: boolean; reason?: string; penaltySeconds?: number } {
    const now = Date.now()

    if (!clickRecords.has(userId)) {
      clickRecords.set(userId, { timestamps: [], clickCounts: [], penaltyUntil: 0, warnings: 0 })
    }
    const record = clickRecords.get(userId)!

    // Check active penalty
    if (record.penaltyUntil > now) {
      const remaining = Math.ceil((record.penaltyUntil - now) / 1000)
      return { allowed: false, reason: 'Activite suspecte detectee. Attends avant de continuer.', penaltySeconds: remaining }
    }

    // Record this request
    record.timestamps.push(now)
    record.clickCounts.push(clickCount)

    // Keep only recent history
    if (record.timestamps.length > PATTERN_HISTORY) {
      record.timestamps = record.timestamps.slice(-PATTERN_HISTORY)
      record.clickCounts = record.clickCounts.slice(-PATTERN_HISTORY)
    }

    // Rate limiting: count requests in the last window
    const recentRequests = record.timestamps.filter((t) => t > now - RATE_LIMIT_WINDOW)
    if (recentRequests.length > MAX_REQUESTS_PER_WINDOW) {
      record.warnings += 1
      if (record.warnings >= MAX_WARNINGS) {
        record.penaltyUntil = now + PENALTY_DURATION
        record.warnings = 0
        return {
          allowed: false,
          reason: 'Trop de requetes de clic. Petite pause imposee.',
          penaltySeconds: Math.ceil(PENALTY_DURATION / 1000),
        }
      }
      return { allowed: false, reason: 'Trop rapide. Ralentis un peu.' }
    }

    // Pattern detection:
    // ignore regular 500ms client batches (space bar / manual spam),
    // and flag only near-perfect, very fast automation patterns.
    if (record.timestamps.length >= 10) {
      const last10Counts = record.clickCounts.slice(-10)
      const last10Times = record.timestamps.slice(-10)

      // All same click count?
      const allSameCount = last10Counts.every((c) => c === last10Counts[0])

      if (allSameCount && last10Counts[0] >= MIN_CLICK_COUNT_FOR_PATTERN_CHECK) {
        const intervals: number[] = []
        for (let i = 1; i < last10Times.length; i++) {
          intervals.push(last10Times[i] - last10Times[i - 1])
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
        const variance = intervals.reduce((sum, v) => sum + (v - avgInterval) ** 2, 0) / intervals.length
        const stdDev = Math.sqrt(variance)
        const looksLikeClientBatchCadence =
          Math.abs(avgInterval - HUMAN_BATCH_INTERVAL) <= HUMAN_BATCH_TOLERANCE && stdDev < 35
        const looksLikeAutomation =
          avgInterval < BOT_INTERVAL_THRESHOLD && stdDev < BOT_TIMING_STDDEV_THRESHOLD

        if (looksLikeAutomation && !looksLikeClientBatchCadence) {
          record.warnings += 1
          if (record.warnings >= MAX_WARNINGS) {
            record.penaltyUntil = now + PENALTY_DURATION
            record.warnings = 0
            return {
              allowed: false,
              reason: 'Pattern automatise detecte. Petite pause imposee.',
              penaltySeconds: Math.ceil(PENALTY_DURATION / 1000),
            }
          }
          return { allowed: false, reason: 'Pattern suspect detecte.' }
        }
      }
    }

    // Reset warnings gradually (if no issues for a while)
    if (record.warnings > 0 && record.timestamps.length >= 5) {
      const last5 = record.timestamps.slice(-5)
      const timeSinceLast5 = now - last5[0]
      if (timeSinceLast5 > 10000) {
        record.warnings = Math.max(0, record.warnings - 1)
      }
    }

    return { allowed: true }
  }

  static async processClicks(character: Character, clickCount: number) {
    const validClicks = Math.min(Math.max(1, Math.floor(clickCount)), MAX_CLICKS_PER_BATCH)

    const equipBonuses = await this.calculateEquipBonuses(character)
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)

    const effectiveCpc = TalentService.computeEffectiveCpc(
      character.creditsPerClick,
      equipBonuses.clickBonus,
      talentBonuses
    )

    const creditsEarned = validClicks * effectiveCpc
    character.credits += creditsEarned
    character.totalClicks += validClicks

    // XP gain
    const xpGained = Math.floor(validClicks / 10) + 1
    character.xp += xpGained

    // Level up check
    const xpForNextLevel = character.level * 100
    let leveledUp = false
    if (character.xp >= xpForNextLevel) {
      character.levelUp()
      leveledUp = true
    }

    await character.save()

    // Track daily missions
    DailyMissionService.trackProgress(character.id, 'click', validClicks).catch(() => {})
    DailyMissionService.trackProgress(character.id, 'earn_credits', creditsEarned).catch(() => {})

    transmit.broadcast('game/leaderboard', {
      characterId: character.id,
      name: character.name,
      credits: character.credits,
      totalClicks: character.totalClicks,
      level: character.level,
    })

    const effectiveCps = TalentService.computeEffectiveCps(
      character.creditsPerSecond,
      talentBonuses
    )

    return {
      credits: character.credits,
      creditsEarned,
      totalClicks: character.totalClicks,
      level: character.level,
      xp: character.xp,
      xpForNextLevel: character.level * 100,
      creditsPerClick: effectiveCpc,
      creditsPerSecond: effectiveCps,
      talentPoints: character.talentPoints,
      leveledUp,
    }
  }

  static async tick(character: Character) {
    const talentBonuses = await TalentService.getCharacterBonuses(character.id)
    const effectiveCps = TalentService.computeEffectiveCps(
      character.creditsPerSecond,
      talentBonuses
    )

    if (effectiveCps <= 0) return { credits: character.credits, earned: 0 }

    character.credits += effectiveCps
    character.lastTickAt = Date.now()
    await character.save()

    return { credits: character.credits, earned: effectiveCps }
  }

  static async calculateEquipBonuses(character: Character) {
    const equipped = await InventoryItem.query()
      .where('characterId', character.id)
      .where('isEquipped', true)
      .preload('item')

    let clickBonus = 0
    let attackBonus = 0
    let defenseBonus = 0

    for (const inv of equipped) {
      switch (inv.item.effectType) {
        case 'click_multiplier':
        case 'permanent_click':
          clickBonus += inv.item.effectValue || 0
          break
        case 'attack_boost':
          attackBonus += inv.item.effectValue || 0
          break
        case 'defense_boost':
          defenseBonus += inv.item.effectValue || 0
          break
      }
    }

    return { clickBonus, attackBonus, defenseBonus }
  }
}
