import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { roles: string[] }) {
    const user = ctx.auth.user!
    await user.load('role')
    if (!options.roles.includes(user.role.name)) {
      return ctx.response.forbidden({ message: 'Acces refuse, Netrunner.' })
    }
    return next()
  }
}
