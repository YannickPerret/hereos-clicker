import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import BugReport from '#models/bug_report'

export default class BugReportController {
  private readonly allowedCategories = ['bug', 'exploit', 'player', 'suggestion', 'other']

  /** User: submit a report */
  async create({ request, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .first()

    const { title, description, category } = request.only(['title', 'description', 'category'])

    if (!title || !description) {
      session.flash('errors', { message: 'Titre et description requis' })
      return response.redirect().back()
    }

    await BugReport.create({
      userId: auth.user!.id,
      characterName: character?.name || auth.user!.username,
      title: title.slice(0, 200),
      description: description.slice(0, 2000),
      category: this.allowedCategories.includes(category) ? category : 'bug',
      status: 'open',
    })

    session.flash('success', 'Report envoye. Merci, Netrunner.')
    return response.redirect().back()
  }

  /** User: see own reports */
  async myReports({ inertia, auth }: HttpContext) {
    const reports = await BugReport.query()
      .where('userId', auth.user!.id)
      .orderBy('createdAt', 'desc')

    return inertia.render('report/index', {
      reports: reports.map((r) => r.serialize()),
    })
  }

  /** Admin: list all reports */
  async adminIndex({ inertia }: HttpContext) {
    const reports = await BugReport.query()
      .preload('user')
      .orderBy('createdAt', 'desc')

    return inertia.render('admin/reports', {
      reports: reports.map((r) => ({
        ...r.serialize(),
        username: r.user.username,
      })),
    })
  }

  /** Admin: update report status/note */
  async adminUpdate({ params, request, response, session }: HttpContext) {
    const report = await BugReport.findOrFail(params.id)

    const status = request.input('status')
    const adminNote = request.input('adminNote')

    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      report.status = status
    }
    if (adminNote !== undefined) {
      report.adminNote = adminNote
    }

    await report.save()

    session.flash('success', `Report #${report.id} mis a jour`)
    return response.redirect('/admin/reports')
  }
}
