import { DateTime } from 'luxon'
import ForumBan from '#models/forum_ban'
import ForumPost from '#models/forum_post'
import ForumThread from '#models/forum_thread'

export default class ForumService {
  static forumAccountRequiredMessage(locale: string) {
    return locale === 'en'
      ? 'You need a full account to use the forum.'
      : 'Tu as besoin d un vrai compte pour utiliser le forum.'
  }

  static forumBannedMessage(locale: string, reason?: string | null) {
    if (locale === 'en') {
      return reason
        ? `You are banned from the forum. Reason: ${reason}`
        : 'You are banned from the forum.'
    }

    return reason
      ? `Tu es banni du forum. Raison: ${reason}`
      : 'Tu es banni du forum.'
  }

  static lockedThreadMessage(locale: string) {
    return locale === 'en' ? 'This thread is locked.' : 'Ce thread est verrouille.'
  }

  static invalidPostMessage(locale: string) {
    return locale === 'en'
      ? 'Invalid post. Please write between 3 and 4000 characters.'
      : 'Post invalide. Ecris entre 3 et 4000 caracteres.'
  }

  static cooldownMessage(locale: string, seconds: number) {
    return locale === 'en'
      ? `You are posting too fast. Please wait ${seconds}s.`
      : `Tu postes trop vite. Attends ${seconds}s.`
  }

  static rateLimitMessage(locale: string) {
    return locale === 'en'
      ? 'You have posted too much recently. Please try again in a few minutes.'
      : 'Tu as trop poste recemment. Reessaie dans quelques minutes.'
  }

  static duplicatePostMessage(locale: string) {
    return locale === 'en'
      ? 'Duplicate post blocked.'
      : 'Post duplique bloque.'
  }

  static normalizeContent(content: string) {
    return content
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  static slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 160)
  }

  static async getActiveBan(userId: number) {
    const now = DateTime.now()
    const ban = await ForumBan.query()
      .where('userId', userId)
      .where((query) => {
        query.whereNull('expiresAt').orWhere('expiresAt', '>', now.toSQL()!)
      })
      .first()

    return ban
  }

  static async validatePosting(userId: number, threadId: number, body: string, locale: string) {
    const trimmedBody = body.trim()
    if (trimmedBody.length < 3 || trimmedBody.length > 4000) {
      return { ok: false as const, message: this.invalidPostMessage(locale) }
    }

    const now = DateTime.now()
    const lastPost = await ForumPost.query()
      .where('userId', userId)
      .orderBy('createdAt', 'desc')
      .first()

    if (lastPost?.createdAt) {
      const secondsSinceLastPost = Math.floor(now.diff(lastPost.createdAt, 'seconds').seconds)
      if (secondsSinceLastPost < 15) {
        return {
          ok: false as const,
          message: this.cooldownMessage(locale, Math.max(1, 15 - secondsSinceLastPost)),
        }
      }
    }

    const recentPosts = await ForumPost.query()
      .where('userId', userId)
      .where('createdAt', '>=', now.minus({ minutes: 10 }).toSQL()!)

    if (recentPosts.length >= 12) {
      return { ok: false as const, message: this.rateLimitMessage(locale) }
    }

    const normalizedBody = this.normalizeContent(trimmedBody)
    const duplicate = await ForumPost.query()
      .where('userId', userId)
      .where('forumThreadId', threadId)
      .where('createdAt', '>=', now.minus({ minutes: 30 }).toSQL()!)
      .orderBy('createdAt', 'desc')
      .limit(5)

    if (duplicate.some((post) => this.normalizeContent(post.body) === normalizedBody)) {
      return { ok: false as const, message: this.duplicatePostMessage(locale) }
    }

    return { ok: true as const, body: trimmedBody }
  }

  static async syncThreadStats(threadId: number) {
    const thread = await ForumThread.find(threadId)
    if (!thread) return

    const posts = await ForumPost.query()
      .where('forumThreadId', threadId)
      .orderBy('createdAt', 'desc')

    thread.replyCount = posts.length
    thread.lastPostedAt = posts[0]?.createdAt || thread.createdAt
    await thread.save()
  }
}
