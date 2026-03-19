import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import vine from '@vinejs/vine'

export default class AuthController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  async register({ request, auth, response }: HttpContext) {
    const data = await vine.compile(
      vine.object({
        username: vine.string().minLength(3).maxLength(50),
        email: vine.string().email(),
        password: vine.string().minLength(6),
      })
    ).validate(request.all())

    const defaultRole = await Role.findByOrFail('name', 'user')
    const user = await User.create({ ...data, roleId: defaultRole.id })
    await auth.use('web').login(user)
    return response.redirect('/play')
  }

  async login({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)
    await auth.use('web').login(user)
    return response.redirect('/play')
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }
}
