import { DateTime } from 'luxon'
import Season from '#models/season'

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
  isPlayerMarketEnabled: boolean
  isBlackMarketBonusEnabled: boolean
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
  isPlayerMarketEnabled: boolean
  isBlackMarketBonusEnabled: boolean
  startsAt: DateTime | null
  endsAt: DateTime | null
}

const VALID_STATUSES = new Set(['draft', 'scheduled', 'active', 'ended', 'archived'])

export default class SeasonService {
  static async getActiveSeason() {
    return Season.query()
      .where('status', 'active')
      .orderBy('sortOrder', 'desc')
      .orderBy('startsAt', 'desc')
      .orderBy('id', 'desc')
      .first()
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
      isPlayerMarketEnabled: season.isPlayerMarketEnabled,
      isBlackMarketBonusEnabled: season.isBlackMarketBonusEnabled,
    }
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
