import type { HttpContext } from '@adonisjs/core/http'
import ForumCategory from '#models/forum_category'
import ForumThread from '#models/forum_thread'
import ForumPost from '#models/forum_post'
import ForumService from '#services/forum_service'

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

  async index(ctx: HttpContext) {
    const denied = this.ensureForumAccount(ctx)
    if (denied) return denied

    const [categories, latestThreads, ban] = await Promise.all([
      ForumCategory.query()
        .where('isActive', true)
        .withCount('threads', (query) => {
          query.whereHas('category', (inner) => inner.where('isActive', true))
        })
        .orderBy('sortOrder', 'asc')
        .orderBy('name', 'asc'),
      ForumThread.query()
        .preload('category')
        .preload('user')
        .whereHas('category', (query) => query.where('isActive', true))
        .orderBy('isPinned', 'desc')
        .orderBy('lastPostedAt', 'desc')
        .limit(20),
      ForumService.getActiveBan(ctx.auth.user!.id),
    ])

    return ctx.inertia.render('forum/index', {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        threadCount: Number(category.$extras.threads_count || 0),
      })),
      latestThreads: latestThreads.map((thread) => ({
        id: thread.id,
        title: thread.title,
        replyCount: thread.replyCount,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        lastPostedAt: thread.lastPostedAt.toISO(),
        createdAt: thread.createdAt.toISO(),
        category: {
          id: thread.category.id,
          name: thread.category.name,
          slug: thread.category.slug,
        },
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
        .orderBy('isPinned', 'desc')
        .orderBy('lastPostedAt', 'desc'),
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
        replyCount: thread.replyCount,
        isPinned: thread.isPinned,
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

    const thread = await ForumThread.query()
      .where('id', ctx.params.id)
      .preload('category')
      .preload('user')
      .firstOrFail()

    const [posts, ban] = await Promise.all([
      ForumPost.query()
        .where('forumThreadId', thread.id)
        .preload('user')
        .orderBy('createdAt', 'asc'),
      ForumService.getActiveBan(ctx.auth.user!.id),
    ])

    return ctx.inertia.render('forum/thread', {
      thread: {
        id: thread.id,
        title: thread.title,
        body: thread.body,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        replyCount: thread.replyCount,
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
        id: post.id,
        body: post.body,
        createdAt: post.createdAt.toISO(),
        editedAt: post.editedAt?.toISO() || null,
        author: {
          id: post.user.id,
          username: post.user.username,
        },
      })),
      forumBan: ban
        ? {
            id: ban.id,
            reason: ban.reason,
            expiresAt: ban.expiresAt?.toISO() || null,
          }
        : null,
      canReply: !thread.isLocked && !ban,
    })
  }

  async reply(ctx: HttpContext) {
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

    const post = await ForumPost.create({
      forumThreadId: thread.id,
      userId: ctx.auth.user!.id,
      body: validation.body,
    })

    thread.replyCount += 1
    thread.lastPostedAt = post.createdAt
    await thread.save()

    ctx.session.flash('success', ctx.locale === 'en' ? 'Reply posted' : 'Reponse postee')
    return ctx.response.redirect(`/forum/thread/${thread.id}`)
  }
}
