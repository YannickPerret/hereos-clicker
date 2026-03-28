type RateLimitState = {
  timestamps: number[]
  blockedUntil: number | null
}

const CHAT_RATE_LIMIT = {
  maxMessages: 15,
  windowMs: 60_000,
  cooldownMs: 30_000,
}

const OBSCENE_TERMS = [
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

const OBSCENE_PATTERNS = OBSCENE_TERMS.map((term) => {
  const body = term
    .split('')
    .map((char) => `${char}+`)
    .join('[^a-z0-9]*')

  return new RegExp(`(?:^|[^a-z])${body}(?:$|[^a-z])`, 'i')
})

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

  static containsObscenity(message: string) {
    const normalized = normalizeMessageForModeration(message)
    const compact = buildCompactMessageForModeration(message)

    return (
      OBSCENE_PATTERNS.some((pattern) => pattern.test(normalized)) ||
      OBSCENE_TERMS.some((term) => compact.includes(term))
    )
  }
}
