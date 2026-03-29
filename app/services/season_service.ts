import { DateTime } from 'luxon'
import Season from '#models/season'
import Character from '#models/character'
import CharacterPvpSeasonStat from '#models/character_pvp_season_stat'
import CharacterBossRushSeasonStat from '#models/character_boss_rush_season_stat'

export interface SeasonSummary {
  id: number
  key: string
  name: string
  slug: string
  theme: string
  campaignTitle: string | null
  storyIntro: string | null
  bannerImage: string | null
  primaryColor: string | null
  secondaryColor: string | null
  status: string
  startsAt: string | null
  endsAt: string | null
  isRankedPvpEnabled: boolean
  isWorldBossEnabled: boolean
  isBossRushEnabled: boolean
  isPlayerMarketEnabled: boolean
  isBlackMarketBonusEnabled: boolean
}

export interface SeasonRewardSummary {
  credits: number
  tier: string | null
}

export interface SeasonPayload {
  key: string
  name: string
  slug: string
  theme: string
  campaignTitle: string | null
  storyIntro: string | null
  storyOutro: string | null
  bannerImage: string | null
  primaryColor: string | null
  secondaryColor: string | null
  status: 'draft' | 'scheduled' | 'active' | 'ended' | 'archived'
  sortOrder: number
  isRankedPvpEnabled: boolean
  isWorldBossEnabled: boolean
  isBossRushEnabled: boolean
  isPlayerMarketEnabled: boolean
  isBlackMarketBonusEnabled: boolean
  startsAt: DateTime | null
  endsAt: DateTime | null
}

const VALID_STATUSES = new Set(['draft', 'scheduled', 'active', 'ended', 'archived'])

export default class SeasonService {
  private static softResetFactor = 0.35

  static async getActiveSeason() {
    return Season.query()
      .where('status', 'active')
      .orderBy('sortOrder', 'desc')
      .orderBy('startsAt', 'desc')
      .orderBy('id', 'desc')
      .first()
  }

  static async getLatestEndedSeason() {
    return Season.query()
      .where('status', 'ended')
      .orderBy('endsAt', 'desc')
      .orderBy('id', 'desc')
      .first()
  }

  static async getCurrentRankedSeason() {
    const activeSeason = await this.getActiveSeason()
    if (!activeSeason || !activeSeason.isRankedPvpEnabled) {
      return null
    }

    return activeSeason
  }

  static async getCurrentBossRushSeason() {
    const activeSeason = await this.getActiveSeason()
    if (!activeSeason || !activeSeason.isBossRushEnabled) {
      return null
    }

    return activeSeason
  }

  static serializeSummary(season: Season | null): SeasonSummary | null {
    if (!season) {
      return null
    }

    return {
      id: season.id,
      key: season.key,
      name: season.name,
      slug: season.slug,
      theme: season.theme,
      campaignTitle: season.campaignTitle,
      storyIntro: season.storyIntro,
      bannerImage: season.bannerImage,
      primaryColor: season.primaryColor,
      secondaryColor: season.secondaryColor,
      status: season.status,
      startsAt: season.startsAt?.toISO() ?? null,
      endsAt: season.endsAt?.toISO() ?? null,
      isRankedPvpEnabled: season.isRankedPvpEnabled,
      isWorldBossEnabled: season.isWorldBossEnabled,
      isBossRushEnabled: season.isBossRushEnabled,
      isPlayerMarketEnabled: season.isPlayerMarketEnabled,
      isBlackMarketBonusEnabled: season.isBlackMarketBonusEnabled,
    }
  }

  static calculateSoftResetRating(rating: number) {
    return 1000 + Math.floor((rating - 1000) * this.softResetFactor)
  }

  static calculateReward(rank: number | null, gamesPlayed: number, rating: number): SeasonRewardSummary {
    if (!rank || gamesPlayed <= 0) {
      return { credits: 0, tier: null }
    }

    if (rank === 1) return { credits: 10000, tier: 'Champion' }
    if (rank <= 3) return { credits: 7500, tier: 'Podium' }
    if (rank <= 10) return { credits: 5000, tier: 'Elite' }
    if (rank <= 50) return { credits: 2500, tier: 'Veteran' }
    if (gamesPlayed >= 10 && rating >= 1200) return { credits: 1500, tier: 'Contender' }
    if (gamesPlayed >= 5) return { credits: 500, tier: 'Participant' }

    return { credits: 0, tier: null }
  }

  static calculateBossRushReward(
    rank: number | null,
    bestFloor: number,
    totalBossesKilled: number
  ): SeasonRewardSummary {
    if (!rank || bestFloor <= 0) {
      return { credits: 0, tier: null }
    }

    if (rank === 1) return { credits: 12000, tier: 'Overlord' }
    if (rank <= 3) return { credits: 9000, tier: 'Apex' }
    if (rank <= 10) return { credits: 6000, tier: 'Elite' }
    if (rank <= 50) return { credits: 3000, tier: 'Veteran' }
    if (bestFloor >= 25) return { credits: 1800, tier: 'Breaker' }
    if (bestFloor >= 15 || totalBossesKilled >= 25) return { credits: 900, tier: 'Climber' }
    if (bestFloor >= 8) return { credits: 350, tier: 'Participant' }

    return { credits: 0, tier: null }
  }

  static async getOrCreatePvpSeasonStat(character: Character, season: Season) {
    let stat = await CharacterPvpSeasonStat.query()
      .where('characterId', character.id)
      .where('seasonId', season.id)
      .first()

    if (!stat) {
      stat = await CharacterPvpSeasonStat.create({
        characterId: character.id,
        seasonId: season.id,
        startingRating: character.pvpRating,
        rating: character.pvpRating,
        peakRating: character.pvpRating,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        finalRank: null,
        rewardCredits: 0,
        rewardTier: null,
        rewardClaimed: false,
        finalizedAt: null,
      })
    }

    return stat
  }

  static async getOrCreateBossRushSeasonStat(character: Character, season: Season) {
    let stat = await CharacterBossRushSeasonStat.query()
      .where('characterId', character.id)
      .where('seasonId', season.id)
      .first()

    if (!stat) {
      stat = await CharacterBossRushSeasonStat.create({
        characterId: character.id,
        seasonId: season.id,
        bestFloor: 0,
        runsPlayed: 0,
        totalBossesKilled: 0,
        finalRank: null,
        rewardCredits: 0,
        rewardTier: null,
        rewardClaimed: false,
        finalizedAt: null,
      })
    }

    return stat
  }

  static async syncCharacterWithActiveSeason(character: Character) {
    const activeSeason = await this.getCurrentRankedSeason()
    if (!activeSeason) {
      return null
    }

    const stat = await this.getOrCreatePvpSeasonStat(character, activeSeason)
    if (character.pvpRating !== stat.rating) {
      character.pvpRating = stat.rating
      await character.save()
    }

    return stat
  }

  static async activateSeason(season: Season) {
    const otherActive = await Season.query()
      .where('status', 'active')
      .whereNot('id', season.id)
      .first()

    if (otherActive) {
      throw new Error(`Une autre saison est deja active: ${otherActive.name}`)
    }

    const characters = await Character.query().orderBy('id', 'asc')
    for (const character of characters) {
      const resetRating = this.calculateSoftResetRating(character.pvpRating)
      character.pvpRating = resetRating
      await character.save()

      const existingStat = await CharacterPvpSeasonStat.query()
        .where('characterId', character.id)
        .where('seasonId', season.id)
        .first()

      if (existingStat) {
        existingStat.startingRating = resetRating
        existingStat.rating = resetRating
        existingStat.peakRating = resetRating
        existingStat.wins = 0
        existingStat.losses = 0
        existingStat.gamesPlayed = 0
        existingStat.finalRank = null
        existingStat.rewardCredits = 0
        existingStat.rewardTier = null
        existingStat.rewardClaimed = false
        existingStat.finalizedAt = null
        await existingStat.save()
      } else {
        await CharacterPvpSeasonStat.create({
          characterId: character.id,
          seasonId: season.id,
          startingRating: resetRating,
          rating: resetRating,
          peakRating: resetRating,
          wins: 0,
          losses: 0,
          gamesPlayed: 0,
          finalRank: null,
          rewardCredits: 0,
          rewardTier: null,
          rewardClaimed: false,
          finalizedAt: null,
        })
      }
    }

    season.status = 'active'
    season.startsAt = season.startsAt || DateTime.now()
    await season.save()
  }

  static async completeSeason(season: Season) {
    const stats = await CharacterPvpSeasonStat.query()
      .where('seasonId', season.id)
      .orderBy('rating', 'desc')
      .orderBy('peakRating', 'desc')
      .orderBy('wins', 'desc')
      .orderBy('characterId', 'asc')

    let rank = 1
    for (const stat of stats) {
      if (stat.gamesPlayed <= 0) {
        stat.finalRank = null
        stat.rewardCredits = 0
        stat.rewardTier = null
        stat.rewardClaimed = false
        stat.finalizedAt = DateTime.now()
        await stat.save()
        continue
      }

      const reward = this.calculateReward(rank, stat.gamesPlayed, stat.rating)
      stat.finalRank = rank
      stat.rewardCredits = reward.credits
      stat.rewardTier = reward.tier
      stat.rewardClaimed = reward.credits <= 0
      stat.finalizedAt = DateTime.now()
      await stat.save()
      rank += 1
    }

    const bossRushStats = await CharacterBossRushSeasonStat.query()
      .where('seasonId', season.id)
      .whereHas('character', (query) =>
        query.whereHas('user', (userQuery) => userQuery.where('isGuest', false))
      )
      .orderBy('bestFloor', 'desc')
      .orderBy('totalBossesKilled', 'desc')
      .orderBy('updatedAt', 'asc')
      .orderBy('characterId', 'asc')

    let bossRushRank = 1
    for (const stat of bossRushStats) {
      if (stat.bestFloor <= 0) {
        stat.finalRank = null
        stat.rewardCredits = 0
        stat.rewardTier = null
        stat.rewardClaimed = false
        stat.finalizedAt = DateTime.now()
        await stat.save()
        continue
      }

      const reward = this.calculateBossRushReward(
        bossRushRank,
        stat.bestFloor,
        stat.totalBossesKilled
      )
      stat.finalRank = bossRushRank
      stat.rewardCredits = reward.credits
      stat.rewardTier = reward.tier
      stat.rewardClaimed = reward.credits <= 0
      stat.finalizedAt = DateTime.now()
      await stat.save()
      bossRushRank += 1
    }

    season.status = 'ended'
    season.endsAt = season.endsAt || DateTime.now()
    await season.save()
  }

  static async claimSeasonReward(character: Character, statId: number) {
    const stat = await CharacterPvpSeasonStat.query()
      .where('id', statId)
      .where('characterId', character.id)
      .preload('season')
      .firstOrFail()

    if (!stat.finalRank || stat.rewardCredits <= 0) {
      throw new Error('Aucune recompense disponible pour cette saison')
    }

    if (stat.rewardClaimed) {
      throw new Error('Cette recompense a deja ete recuperee')
    }

    character.credits += stat.rewardCredits
    await character.save()

    stat.rewardClaimed = true
    await stat.save()

    return stat
  }

  static normalizePayload(input: Record<string, any>): SeasonPayload {
    const name = String(input.name || '').trim()
    const generatedSlug = this.toSlug(name)
    const generatedKey = generatedSlug.replace(/-/g, '_')
    const status = VALID_STATUSES.has(String(input.status || '').trim())
      ? (String(input.status).trim() as SeasonPayload['status'])
      : 'draft'

    return {
      key: this.normalizeString(input.key) || generatedKey,
      name,
      slug: this.normalizeString(input.slug) || generatedSlug,
      theme: this.normalizeString(input.theme) || 'core',
      campaignTitle: this.optionalString(input.campaignTitle),
      storyIntro: this.optionalString(input.storyIntro),
      storyOutro: this.optionalString(input.storyOutro),
      bannerImage: this.optionalString(input.bannerImage),
      primaryColor: this.optionalString(input.primaryColor),
      secondaryColor: this.optionalString(input.secondaryColor),
      status,
      sortOrder: Number(input.sortOrder) || 0,
      isRankedPvpEnabled: this.toBoolean(input.isRankedPvpEnabled, true),
      isWorldBossEnabled: this.toBoolean(input.isWorldBossEnabled, false),
      isBossRushEnabled: this.toBoolean(input.isBossRushEnabled, false),
      isPlayerMarketEnabled: this.toBoolean(input.isPlayerMarketEnabled, false),
      isBlackMarketBonusEnabled: this.toBoolean(input.isBlackMarketBonusEnabled, false),
      startsAt: this.toDateTime(input.startsAt),
      endsAt: this.toDateTime(input.endsAt),
    }
  }

  static toSlug(value: string) {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private static normalizeString(value: unknown) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
  }

  private static optionalString(value: unknown) {
    const normalized = String(value || '').trim()
    return normalized.length > 0 ? normalized : null
  }

  private static toBoolean(value: unknown, defaultValue: boolean) {
    if (value === undefined || value === null || value === '') {
      return defaultValue
    }

    return value === true || value === 'true' || value === 'on' || value === 1 || value === '1'
  }

  private static toDateTime(value: unknown) {
    const normalized = String(value || '').trim()
    if (!normalized) {
      return null
    }

    const parsed = DateTime.fromISO(normalized)
    return parsed.isValid ? parsed : null
  }
}
