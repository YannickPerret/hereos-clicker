import { DateTime } from 'luxon'
import ForumBan from '#models/forum_ban'
import ForumPost from '#models/forum_post'
import ForumThread from '#models/forum_thread'
import type User from '#models/user'

export default class ForumService {
  private static readonly allowedTags = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'a',
    'img',
  ])

  static isStaff(user: User & { role?: { name: string } | null }) {
    const roleName = user.role?.name || null
    return roleName === 'admin' || roleName === 'moderator'
  }

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

  static postDeletedMessage(locale: string) {
    return locale === 'en' ? 'Post deleted.' : 'Post supprime.'
  }

  static postPinnedMessage(locale: string, pinned: boolean) {
    if (locale === 'en') {
      return pinned ? 'Post pinned.' : 'Post unpinned.'
    }

    return pinned ? 'Post epingle.' : 'Post desepingle.'
  }

  static postLockedMessage(locale: string, locked: boolean) {
    if (locale === 'en') {
      return locked ? 'Post locked.' : 'Post reopened.'
    }

    return locked ? 'Post verrouille.' : 'Post reouvert.'
  }

  static cannotReplyToPostMessage(locale: string) {
    return locale === 'en'
      ? 'This post is locked.'
      : 'Ce post est verrouille.'
  }

  static cannotDeletePostMessage(locale: string) {
    return locale === 'en'
      ? 'You cannot delete this post.'
      : 'Tu ne peux pas supprimer ce post.'
  }

  static cannotModeratePostMessage(locale: string) {
    return locale === 'en'
      ? 'You cannot moderate this post.'
      : 'Tu ne peux pas moderer ce post.'
  }

  static normalizeContent(content: string) {
    return content
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  static stripHtml(content: string) {
    return content
      .replace(/<img[^>]*>/gi, ' [image] ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<li>/gi, '- ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim()
  }

  static sanitizeHtml(content: string) {
    const cleaned = content
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\son\w+='[^']*'/gi, '')
      .replace(/\sstyle="[^"]*"/gi, '')
      .replace(/\sstyle='[^']*'/gi, '')

    return cleaned.replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (_match, closingSlash: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase()
      if (!this.allowedTags.has(tag)) {
        return ''
      }

      if (closingSlash) {
        return `</${tag}>`
      }

      if (tag === 'a') {
        const hrefMatch = rawAttrs.match(/\shref=(?:"([^"]*)"|'([^']*)')/i)
        const href = hrefMatch?.[1] || hrefMatch?.[2] || ''
        const safeHref = href.trim()

        if (!safeHref || !/^(https?:\/\/|mailto:|\/|#)/i.test(safeHref)) {
          return '<a>'
        }

        return `<a href="${safeHref.replace(/"/g, '&quot;')}" target="_blank" rel="noreferrer noopener">`
      }

      if (tag === 'img') {
        const srcMatch = rawAttrs.match(/\ssrc=(?:"([^"]*)"|'([^']*)')/i)
        const altMatch = rawAttrs.match(/\salt=(?:"([^"]*)"|'([^']*)')/i)
        const src = (srcMatch?.[1] || srcMatch?.[2] || '').trim()
        const alt = (altMatch?.[1] || altMatch?.[2] || '').trim()

        if (!src.startsWith('/uploads/forum/')) {
          return ''
        }

        const safeAlt = alt.replace(/"/g, '&quot;')
        return `<img src="${src.replace(/"/g, '&quot;')}" alt="${safeAlt}">`
      }

      return `<${tag}>`
    })
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
    const sanitizedBody = this.sanitizeHtml(body.trim())
    const plainBody = this.stripHtml(sanitizedBody)
    const hasImage = /<img\b/i.test(sanitizedBody)

    if ((plainBody.length < 3 && !hasImage) || plainBody.length > 4000) {
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

    const normalizedBody = this.normalizeContent(plainBody)
    const normalizedComparableBody =
      normalizedBody.length > 0 ? normalizedBody : this.normalizeContent(sanitizedBody)
    const duplicate = await ForumPost.query()
      .where('userId', userId)
      .where('forumThreadId', threadId)
      .where('createdAt', '>=', now.minus({ minutes: 30 }).toSQL()!)
      .orderBy('createdAt', 'desc')
      .limit(5)

    if (
      duplicate.some((post) => {
        const sanitizedExisting = this.sanitizeHtml(post.body)
        const normalizedExistingPlain = this.normalizeContent(this.stripHtml(sanitizedExisting))
        const normalizedExistingComparable =
          normalizedExistingPlain.length > 0
            ? normalizedExistingPlain
            : this.normalizeContent(sanitizedExisting)

        return normalizedExistingComparable === normalizedComparableBody
      })
    ) {
      return { ok: false as const, message: this.duplicatePostMessage(locale) }
    }

    return { ok: true as const, body: sanitizedBody }
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
