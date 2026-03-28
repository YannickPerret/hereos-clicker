import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import Character from '#models/character'
import vine from '@vinejs/vine'
import { randomBytes } from 'node:crypto'
import GuestAccountService from '#services/guest_account_service'

export default class AuthController {
  private registerValidator = vine.compile(
    vine.object({
      username: vine.string().minLength(3).maxLength(50),
      email: vine.string().email(),
      password: vine.string().minLength(6),
    })
  )

  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  async showLanding({ inertia }: HttpContext) {
    await GuestAccountService.purgeExpiredGuests()
    return inertia.render('landing')
  }

  async showUpgrade({ inertia, auth, response }: HttpContext) {
    if (!auth.user?.isGuest) {
      return response.redirect('/play')
    }

    return inertia.render('auth/upgrade')
  }

  async register({ request, auth, response }: HttpContext) {
    const data = await this.registerValidator.validate(request.all())

    const defaultRole = await Role.findByOrFail('name', 'user')
    const user = await User.create({ ...data, roleId: defaultRole.id, isGuest: false })
    await auth.use('web').login(user)
    return response.redirect('/play')
  }

  async loginGuest({ auth, response }: HttpContext) {
    await GuestAccountService.purgeExpiredGuests()

    const defaultRole = await Role.findByOrFail('name', 'user')
    const identity = await this.generateGuestIdentity()

    const user = await User.create({
      ...identity,
      roleId: defaultRole.id,
      isGuest: true,
    })

    await auth.use('web').login(user)
    return response.redirect('/play')
  }

  async upgradeGuest({ request, auth, response, session, locale }: HttpContext) {
    const user = auth.user
    if (!user?.isGuest) {
      return response.redirect('/play')
    }

    const data = await this.registerValidator.validate(request.all())
    const errors: Record<string, string> = {}

    const usernameTaken = await User.query()
      .where('username', data.username)
      .whereNot('id', user.id)
      .first()
    if (usernameTaken) {
      errors.username =
        locale === 'en' ? 'This username is already taken' : 'Ce nom d utilisateur est deja pris'
    }

    const emailTaken = await User.query().where('email', data.email).whereNot('id', user.id).first()
    if (emailTaken) {
      errors.email =
        locale === 'en' ? 'This email is already used' : 'Cette adresse email est deja utilisee'
    }

    if (Object.keys(errors).length > 0) {
      session.flash('errors', errors)
      return response.redirect().back()
    }

    user.username = data.username
    user.email = data.email
    user.password = data.password
    user.isGuest = false
    await user.save()

    const character = await Character.query().where('userId', user.id).first()
    if (!character) {
      await Character.create({
        userId: user.id,
        name: data.username.substring(0, 50),
        credits: 0,
        creditsPerClick: 1,
        creditsPerSecond: 0,
        level: 1,
        xp: 0,
        hpMax: 100,
        hpCurrent: 100,
        attack: 10,
        defense: 5,
        totalClicks: 0,
        talentPoints: 1,
        lastTickAt: Date.now(),
      })
    }

    session.flash('success', 'Guest account upgraded')
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

  private async generateGuestIdentity() {
    while (true) {
      const token = randomBytes(4).toString('hex')
      const username = `guest_${token}`
      const email = `${username}@guest.hereos.local`

      const existing = await User.query()
        .where('username', username)
        .orWhere('email', email)
        .first()

      if (!existing) {
        return {
          username,
          email,
          password: randomBytes(24).toString('hex'),
        }
      }
    }
  }
}
