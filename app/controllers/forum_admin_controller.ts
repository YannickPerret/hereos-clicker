import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/user'
import ForumCategory from '#models/forum_category'
import ForumThread from '#models/forum_thread'
import ForumPost from '#models/forum_post'
import ForumBan from '#models/forum_ban'
import ForumService from '#services/forum_service'

export default class ForumAdminController {
  async index({ inertia }: HttpContext) {
    const [categories, threads, recentPosts, bans] = await Promise.all([
      ForumCategory.query().orderBy('sortOrder', 'asc').orderBy('name', 'asc'),
      ForumThread.query()
        .preload('category')
        .preload('user')
        .orderBy('isPinned', 'desc')
        .orderBy('lastPostedAt', 'desc')
        .limit(100),
      ForumPost.query()
        .preload('thread', (query) => query.preload('category'))
        .preload('user')
        .orderBy('createdAt', 'desc')
        .limit(100),
      ForumBan.query().preload('user').preload('bannedBy').orderBy('createdAt', 'desc'),
    ])

    return inertia.render('admin/forum', {
      categories: categories.map((category) => category.serialize()),
      threads: threads.map((thread) => ({
        ...thread.serialize(),
        categoryName: thread.category.name,
        categoryId: thread.category.id,
        authorName: thread.user.username,
      })),
      recentPosts: recentPosts.map((post) => ({
        ...post.serialize(),
        threadTitle: post.thread.title,
        forumThreadId: post.thread.id,
        categoryName: post.thread.category.name,
        authorName: post.user.username,
        authorUserId: post.user.id,
      })),
      bans: bans.map((ban) => ({
        ...ban.serialize(),
        username: ban.user.username,
        bannedByUsername: ban.bannedBy.username,
      })),
    })
  }

  async createCategory({ request, response, session }: HttpContext) {
    const name = String(request.input('name', '')).trim()
    const description = String(request.input('description', '')).trim() || null
    const sortOrder = Math.max(1, Number(request.input('sortOrder', 1)))
    const slug = ForumService.slugify(String(request.input('slug', name)))

    if (!name || !slug) {
      session.flash('errors', { message: 'Nom de categorie invalide' })
      return response.redirect('/admin/forum')
    }

    const existing = await ForumCategory.findBy('slug', slug)
    if (existing) {
      session.flash('errors', { message: 'Cette categorie existe deja' })
      return response.redirect('/admin/forum')
    }

    await ForumCategory.create({
      name,
      slug,
      description,
      sortOrder,
      isActive: true,
    })

    session.flash('success', `Categorie "${name}" creee`)
    return response.redirect('/admin/forum')
  }

  async updateCategory({ params, request, response, session }: HttpContext) {
    const category = await ForumCategory.findOrFail(params.id)
    const name = String(request.input('name', category.name)).trim()
    const description = String(request.input('description', category.description || '')).trim() || null
    const sortOrder = Math.max(1, Number(request.input('sortOrder', category.sortOrder)))
    const slug = ForumService.slugify(String(request.input('slug', name)))
    const isActive = request.input('isActive') === 'true' || request.input('isActive') === true

    if (!name || !slug) {
      session.flash('errors', { message: 'Nom de categorie invalide' })
      return response.redirect('/admin/forum')
    }

    const duplicate = await ForumCategory.query()
      .whereNot('id', category.id)
      .where('slug', slug)
      .first()
    if (duplicate) {
      session.flash('errors', { message: 'Cette categorie existe deja' })
      return response.redirect('/admin/forum')
    }

    category.name = name
    category.slug = slug
    category.description = description
    category.sortOrder = sortOrder
    category.isActive = isActive
    await category.save()

    session.flash('success', `Categorie "${name}" mise a jour`)
    return response.redirect('/admin/forum')
  }

  async deleteCategory({ params, response, session }: HttpContext) {
    const category = await ForumCategory.findOrFail(params.id)
    const name = category.name
    await category.delete()
    session.flash('success', `Categorie "${name}" supprimee`)
    return response.redirect('/admin/forum')
  }

  async createThread({ request, auth, response, session }: HttpContext) {
    const forumCategoryId = Number(request.input('forumCategoryId'))
    const title = String(request.input('title', '')).trim()
    const body = String(request.input('body', '')).trim()
    const isPinned = request.input('isPinned') === 'true' || request.input('isPinned') === true
    const isLocked = request.input('isLocked') === 'true' || request.input('isLocked') === true

    if (!forumCategoryId || !title || body.length < 3) {
      session.flash('errors', { message: 'Thread invalide' })
      return response.redirect('/admin/forum')
    }

    await ForumThread.create({
      forumCategoryId,
      userId: auth.user!.id,
      title,
      body,
      isPinned,
      isLocked,
      replyCount: 0,
      lastPostedAt: DateTime.now(),
    })

    session.flash('success', `Thread "${title}" cree`)
    return response.redirect('/admin/forum')
  }

  async updateThread({ params, request, response, session }: HttpContext) {
    const thread = await ForumThread.findOrFail(params.id)
    const forumCategoryId = Number(request.input('forumCategoryId', thread.forumCategoryId))
    const title = String(request.input('title', thread.title)).trim()
    const body = String(request.input('body', thread.body)).trim()
    const isPinned = request.input('isPinned') === 'true' || request.input('isPinned') === true
    const isLocked = request.input('isLocked') === 'true' || request.input('isLocked') === true

    if (!forumCategoryId || !title || body.length < 3) {
      session.flash('errors', { message: 'Thread invalide' })
      return response.redirect('/admin/forum')
    }

    thread.forumCategoryId = forumCategoryId
    thread.title = title
    thread.body = body
    thread.isPinned = isPinned
    thread.isLocked = isLocked
    await thread.save()

    session.flash('success', `Thread "${title}" mis a jour`)
    return response.redirect('/admin/forum')
  }

  async deleteThread({ params, response, session }: HttpContext) {
    const thread = await ForumThread.findOrFail(params.id)
    const title = thread.title
    await thread.delete()
    session.flash('success', `Thread "${title}" supprime`)
    return response.redirect('/admin/forum')
  }

  async updatePost({ params, request, response, session }: HttpContext) {
    const post = await ForumPost.findOrFail(params.id)
    const body = String(request.input('body', post.body)).trim()

    if (body.length < 3 || body.length > 4000) {
      session.flash('errors', { message: 'Post invalide' })
      return response.redirect('/admin/forum')
    }

    post.body = body
    post.editedAt = DateTime.now()
    await post.save()

    session.flash('success', 'Post mis a jour')
    return response.redirect('/admin/forum')
  }

  async deletePost({ params, response, session }: HttpContext) {
    const post = await ForumPost.findOrFail(params.id)
    const threadId = post.forumThreadId
    await post.delete()
    await ForumService.syncThreadStats(threadId)
    session.flash('success', 'Post supprime')
    return response.redirect('/admin/forum')
  }

  async createBan({ request, auth, response, session }: HttpContext) {
    const username = String(request.input('username', '')).trim()
    const reason = String(request.input('reason', '')).trim() || null
    const expiresInDaysRaw = request.input('expiresInDays', '')
    const expiresInDays =
      expiresInDaysRaw === '' || expiresInDaysRaw === null || expiresInDaysRaw === undefined
        ? null
        : Math.max(1, Number(expiresInDaysRaw))

    if (!username) {
      session.flash('errors', { message: 'Username requis' })
      return response.redirect('/admin/forum')
    }

    const user = await User.query()
      .whereRaw('LOWER(username) = ?', [username.toLowerCase()])
      .first()

    if (!user) {
      session.flash('errors', { message: 'Utilisateur introuvable' })
      return response.redirect('/admin/forum')
    }

    const existing = await ForumBan.findBy('userId', user.id)
    if (existing) {
      existing.bannedByUserId = auth.user!.id
      existing.reason = reason
      existing.expiresAt = expiresInDays ? DateTime.now().plus({ days: expiresInDays }) : null
      await existing.save()
    } else {
      await ForumBan.create({
        userId: user.id,
        bannedByUserId: auth.user!.id,
        reason,
        expiresAt: expiresInDays ? DateTime.now().plus({ days: expiresInDays }) : null,
      })
    }

    session.flash('success', `Forum ban applique a ${user.username}`)
    return response.redirect('/admin/forum')
  }

  async deleteBan({ params, response, session }: HttpContext) {
    const ban = await ForumBan.findOrFail(params.id)
    await ban.load('user')
    const username = ban.user.username
    await ban.delete()
    session.flash('success', `Forum ban retire pour ${username}`)
    return response.redirect('/admin/forum')
  }
}
