import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import ActiveActivityService from '#services/active_activity_service'

export default class ActivityLockMiddleware {
  private getLockMessage(locale: string, activityType: 'dungeon' | 'pvp') {
    if (locale === 'en') {
      return activityType === 'pvp'
        ? 'A PvP match is already in progress. Use the banner to return to it.'
        : 'A dungeon run is already in progress. Use the banner to return to it.'
    }

    return activityType === 'pvp'
      ? 'Un match PvP est deja en cours. Utilise la banniere pour y retourner.'
      : 'Un donjon est deja en cours. Utilise la banniere pour y retourner.'
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user) {
      return next()
    }

    const activeActivity = await ActiveActivityService.getForUser(user.id)
    if (!activeActivity) {
      return next()
    }

    const message = this.getLockMessage(ctx.locale || 'fr', activeActivity.type)

    if (ctx.request.accepts(['html', 'json']) === 'json') {
      return ctx.response.forbidden({
        error: message,
        activeActivity,
      })
    }

    ctx.session.flash('errors', { message })
    return ctx.response.redirect('/play')
  }
}
