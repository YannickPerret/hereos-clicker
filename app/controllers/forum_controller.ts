import type { HttpContext } from '@adonisjs/core/http'
import ForumCategory from '#models/forum_category'
import ForumThread from '#models/forum_thread'
import ForumPost from '#models/forum_post'
import ForumService from '#services/forum_service'
import User from '#models/user'

export default class ForumController {
  private ensureForumAccount(ctx: HttpContext) {
    if (!ctx.auth.user!.isGuest) {
      return null
    }

    ctx.session.flash('errors', {
      message: ForumService.forumAccountRequiredMessage(ctx.locale),
    })
    return ctx.response.redirect('/account/upgrade')
  }

  private async ensureRole(user: User) {
    if (!(user as any).$preloaded?.role) {
      await user.load('role')
    }
    return user
  }

  private serializePost(post: ForumPost, viewer: User, canModerate: boolean) {
    return {
      id: post.id,
      body: ForumService.sanitizeHtml(post.body),
      createdAt: post.createdAt.toISO(),
      editedAt: post.editedAt?.toISO() || null,
      isPinned: post.isPinned,
      isLocked: post.isLocked,
      canDelete: canModerate || post.userId === viewer.id,
      canModerate,
      author: {
        id: post.user.id,
        username: post.user.username,
      },
    }
  }

  async index(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const [categories, ban] = await Promise.all([
      ForumCategory.query()
        .where('isActive', true)
        .preload('threads', (query) => {
          query
            .preload('user')
            .orderBy('lastPostedAt', 'desc')
            .orderBy('createdAt', 'desc')
        })
        .orderBy('sortOrder', 'asc')
        .orderBy('name', 'asc'),
      ForumService.getActiveBan(ctx.auth.user!.id),
    ])

    return ctx.inertia.render('forum/index', {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        threadCount: category.threads.length,
        threads: category.threads.map((thread) => ({
          id: thread.id,
          title: thread.title,
          postCount: thread.replyCount,
          isLocked: thread.isLocked,
          lastPostedAt: thread.lastPostedAt.toISO(),
          createdAt: thread.createdAt.toISO(),
          author: {
            id: thread.user.id,
            username: thread.user.username,
          },
        })),
      })),
      forumBan: ban
        ? {
            id: ban.id,
            reason: ban.reason,
            expiresAt: ban.expiresAt?.toISO() || null,
          }
        : null,
    })
  }

  async category(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const category = await ForumCategory.query()
      .where('slug', ctx.params.slug)
      .where('isActive', true)
      .firstOrFail()

    const [threads, ban] = await Promise.all([
      ForumThread.query()
        .where('forumCategoryId', category.id)
        .preload('user')
        .orderBy('lastPostedAt', 'desc')
        .orderBy('createdAt', 'desc'),
      ForumService.getActiveBan(ctx.auth.user!.id),
    ])

    return ctx.inertia.render('forum/category', {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
      threads: threads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        postCount: thread.replyCount,
        isLocked: thread.isLocked,
        createdAt: thread.createdAt.toISO(),
        lastPostedAt: thread.lastPostedAt.toISO(),
        author: {
          id: thread.user.id,
          username: thread.user.username,
        },
      })),
      forumBan: ban
        ? {
            id: ban.id,
            reason: ban.reason,
            expiresAt: ban.expiresAt?.toISO() || null,
          }
        : null,
    })
  }

  async thread(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const viewer = await this.ensureRole(ctx.auth.user!)
    const canModerate = ForumService.isStaff(viewer)

    const thread = await ForumThread.query()
      .where('id', ctx.params.id)
      .preload('category')
      .preload('user')
      .firstOrFail()

    const [posts, ban] = await Promise.all([
      ForumPost.query()
        .where('forumThreadId', thread.id)
        .whereNull('parentPostId')
        .preload('user')
        .preload('replies', (query) => {
          query.preload('user').orderBy('createdAt', 'asc')
        })
        .orderBy('isPinned', 'desc')
        .orderBy('createdAt', 'asc'),
      ForumService.getActiveBan(viewer.id),
    ])

    return ctx.inertia.render('forum/thread', {
      thread: {
        id: thread.id,
        title: thread.title,
        isLocked: thread.isLocked,
        postCount: thread.replyCount,
        createdAt: thread.createdAt.toISO(),
        lastPostedAt: thread.lastPostedAt.toISO(),
        category: {
          id: thread.category.id,
          name: thread.category.name,
          slug: thread.category.slug,
        },
        author: {
          id: thread.user.id,
          username: thread.user.username,
        },
      },
      posts: posts.map((post) => ({
        ...this.serializePost(post, viewer, canModerate),
        replyCount: post.replies.length,
        replies: post.replies.map((reply) => ({
          ...this.serializePost(reply, viewer, canModerate),
        })),
      })),
      forumBan: ban
        ? {
            id: ban.id,
            reason: ban.reason,
            expiresAt: ban.expiresAt?.toISO() || null,
          }
        : null,
      canPost: !thread.isLocked && !ban,
      canModerate,
    })
  }

  async createPost(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const ban = await ForumService.getActiveBan(ctx.auth.user!.id)
    if (ban) {
      ctx.session.flash('errors', {
        message: ForumService.forumBannedMessage(ctx.locale, ban.reason),
      })
      return ctx.response.redirect(`/forum/thread/${ctx.params.id}`)
    }

    const thread = await ForumThread.findOrFail(ctx.params.id)
    if (thread.isLocked) {
      ctx.session.flash('errors', {
        message: ForumService.lockedThreadMessage(ctx.locale),
      })
      return ctx.response.redirect(`/forum/thread/${thread.id}`)
    }

    const validation = await ForumService.validatePosting(
      ctx.auth.user!.id,
      thread.id,
      String(ctx.request.input('body', '')),
      ctx.locale
    )

    if (!validation.ok) {
      ctx.session.flash('errors', { message: validation.message })
      return ctx.response.redirect(`/forum/thread/${thread.id}`)
    }

    await ForumPost.create({
      forumThreadId: thread.id,
      userId: ctx.auth.user!.id,
      parentPostId: null,
      body: validation.body,
      isPinned: false,
      isLocked: false,
    })

    await ForumService.syncThreadStats(thread.id)

    ctx.session.flash('success', ctx.locale === 'en' ? 'Post published' : 'Post publie')
    return ctx.response.redirect(`/forum/thread/${thread.id}`)
  }

  async replyToPost(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const ban = await ForumService.getActiveBan(ctx.auth.user!.id)
    if (ban) {
      ctx.session.flash('errors', {
        message: ForumService.forumBannedMessage(ctx.locale, ban.reason),
      })
      return ctx.response.redirect().back()
    }

    const parentPost = await ForumPost.findOrFail(ctx.params.id)
    const thread = await ForumThread.findOrFail(parentPost.forumThreadId)
    if (thread.isLocked) {
      ctx.session.flash('errors', {
        message: ForumService.lockedThreadMessage(ctx.locale),
      })
      return ctx.response.redirect(`/forum/thread/${parentPost.forumThreadId}`)
    }

    if (parentPost.isLocked) {
      ctx.session.flash('errors', {
        message: ForumService.cannotReplyToPostMessage(ctx.locale),
      })
      return ctx.response.redirect(`/forum/thread/${parentPost.forumThreadId}`)
    }

    const validation = await ForumService.validatePosting(
      ctx.auth.user!.id,
      parentPost.forumThreadId,
      String(ctx.request.input('body', '')),
      ctx.locale
    )

    if (!validation.ok) {
      ctx.session.flash('errors', { message: validation.message })
      return ctx.response.redirect(`/forum/thread/${parentPost.forumThreadId}`)
    }

    await ForumPost.create({
      forumThreadId: parentPost.forumThreadId,
      userId: ctx.auth.user!.id,
      parentPostId: parentPost.id,
      body: validation.body,
      isPinned: false,
      isLocked: false,
    })

    await ForumService.syncThreadStats(parentPost.forumThreadId)

    ctx.session.flash('success', ctx.locale === 'en' ? 'Reply posted' : 'Reponse postee')
    return ctx.response.redirect(`/forum/thread/${parentPost.forumThreadId}`)
  }

  async deletePost(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const viewer = await this.ensureRole(ctx.auth.user!)
    const post = await ForumPost.findOrFail(ctx.params.id)
    const canDelete = ForumService.isStaff(viewer) || post.userId === viewer.id

    if (!canDelete) {
      ctx.session.flash('errors', {
        message: ForumService.cannotDeletePostMessage(ctx.locale),
      })
      return ctx.response.redirect(`/forum/thread/${post.forumThreadId}`)
    }

    const threadId = post.forumThreadId
    await post.delete()
    await ForumService.syncThreadStats(threadId)

    ctx.session.flash('success', ForumService.postDeletedMessage(ctx.locale))
    return ctx.response.redirect(`/forum/thread/${threadId}`)
  }

  async togglePostPin(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const viewer = await this.ensureRole(ctx.auth.user!)
    if (!ForumService.isStaff(viewer)) {
      ctx.session.flash('errors', {
        message: ForumService.cannotModeratePostMessage(ctx.locale),
      })
      return ctx.response.redirect().back()
    }

    const post = await ForumPost.findOrFail(ctx.params.id)
    post.isPinned = !post.isPinned
    await post.save()

    ctx.session.flash('success', ForumService.postPinnedMessage(ctx.locale, post.isPinned))
    return ctx.response.redirect(`/forum/thread/${post.forumThreadId}`)
  }

  async togglePostLock(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const viewer = await this.ensureRole(ctx.auth.user!)
    if (!ForumService.isStaff(viewer)) {
      ctx.session.flash('errors', {
        message: ForumService.cannotModeratePostMessage(ctx.locale),
      })
      return ctx.response.redirect().back()
    }

    const post = await ForumPost.findOrFail(ctx.params.id)
    post.isLocked = !post.isLocked
    await post.save()

    ctx.session.flash('success', ForumService.postLockedMessage(ctx.locale, post.isLocked))
    return ctx.response.redirect(`/forum/thread/${post.forumThreadId}`)
  }
}
