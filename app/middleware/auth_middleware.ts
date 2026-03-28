import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import GuestAccountService from '#services/guest_account_service'

export default class AuthMiddleware {
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards || ['web'], {
      loginRoute: this.redirectTo,
    })

    const user = ctx.auth.user
    if (user && GuestAccountService.isExpired(user)) {
      await GuestAccountService.deleteGuest(user)
      await ctx.auth.use('web').logout()
      ctx.session.flash('errors', {
        message:
          ctx.locale === 'en'
            ? 'Guest session expired after 3 days. Start a new guest run or create an account.'
            : 'La session invite a expire apres 3 jours. Lance une nouvelle partie ou cree un compte.',
      })
      return ctx.response.redirect('/')
    }

    return next()
  }
}
