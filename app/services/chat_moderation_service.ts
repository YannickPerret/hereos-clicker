import ChatBlockedTerm from '#models/chat_blocked_term'

type RateLimitState = {
  timestamps: number[]
  blockedUntil: number | null
}

const CHAT_RATE_LIMIT = {
  maxMessages: 15,
  windowMs: 60_000,
  cooldownMs: 30_000,
}

const DEFAULT_OBSCENE_TERMS = [
  'fuck',
  'fucking',
  'motherfucker',
  'shit',
  'bullshit',
  'bitch',
  'bastard',
  'asshole',
  'dick',
  'pussy',
  'slut',
  'whore',
  'faggot',
  'nigger',
  'retard',
  'putain',
  'merde',
  'pute',
  'encule',
  'enculer',
  'enculee',
  'encules',
  'enculees',
  'connard',
  'connasse',
  'salope',
  'salaud',
  'niquer',
  'fdp',
] as const

function buildTermPattern(term: string) {
  const body = term
    .split('')
    .map((char) => `${char}+`)
    .join('[^a-z0-9]*')

  return new RegExp(`(?:^|[^a-z])${body}(?:$|[^a-z])`, 'i')
}

function normalizeMessageForModeration(message: string) {
  return message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildCompactMessageForModeration(message: string) {
  return normalizeMessageForModeration(message)
    .replace(/[^a-z0-9]/g, '')
    .replace(/([a-z])\1{2,}/g, '$1')
}

export default class ChatModerationService {
  private static rateLimitState = new Map<number, RateLimitState>()
  private static customTermsCache:
    | { expiresAt: number; terms: { term: string; language: 'all' | 'fr' | 'en' }[] }
    | null = null

  static checkRateLimit(userId: number) {
    const now = Date.now()
    const state = this.rateLimitState.get(userId) || {
      timestamps: [],
      blockedUntil: null,
    }

    if (state.blockedUntil && state.blockedUntil > now) {
      this.rateLimitState.set(userId, state)
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
      }
    }

    state.blockedUntil = null
    state.timestamps = state.timestamps.filter((timestamp) => now - timestamp < CHAT_RATE_LIMIT.windowMs)

    if (state.timestamps.length >= CHAT_RATE_LIMIT.maxMessages) {
      state.blockedUntil = now + CHAT_RATE_LIMIT.cooldownMs
      this.rateLimitState.set(userId, state)
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(CHAT_RATE_LIMIT.cooldownMs / 1000),
      }
    }

    state.timestamps.push(now)
    this.rateLimitState.set(userId, state)

    return {
      allowed: true,
      retryAfterSeconds: 0,
    }
  }

  static clearCustomTermsCache() {
    this.customTermsCache = null
  }

  private static async getCustomTerms() {
    const now = Date.now()
    if (this.customTermsCache && this.customTermsCache.expiresAt > now) {
      return this.customTermsCache.terms
    }

    const rows = await ChatBlockedTerm.query().where('isActive', true).orderBy('term', 'asc')
    const terms = rows.map((row) => ({
      term: row.term,
      language: row.language,
    }))

    this.customTermsCache = {
      expiresAt: now + 60_000,
      terms,
    }

    return terms
  }

  static async containsObscenity(message: string, locale: string = 'all') {
    const normalized = normalizeMessageForModeration(message)
    const compact = buildCompactMessageForModeration(message)
    const customTerms = await this.getCustomTerms()
    const allTerms = [
      ...DEFAULT_OBSCENE_TERMS.map((term) => ({ term, language: 'all' as const })),
      ...customTerms,
    ]

    return allTerms.some(({ term, language }) => {
      if (language !== 'all' && locale !== 'all' && language !== locale) {
        return false
      }

      const normalizedTerm = buildCompactMessageForModeration(term)
      return buildTermPattern(normalizedTerm).test(normalized) || compact.includes(normalizedTerm)
    })
  }
}
