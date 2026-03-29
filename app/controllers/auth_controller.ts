import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import Character from '#models/character'
import vine from '@vinejs/vine'
import { randomBytes } from 'node:crypto'
import GuestAccountService from '#services/guest_account_service'
import AccountSecurityService from '#services/account_security_service'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class AuthController {
  private registerValidator = vine.compile(
    vine.object({
      username: vine.string().minLength(3).maxLength(50),
      email: vine.string().email(),
      password: vine.string().minLength(6),
      passwordConfirmation: vine.string().minLength(6),
    })
  )

  private loginValidator = vine.compile(
    vine.object({
      email: vine.string().email(),
      password: vine.string().minLength(6),
    })
  )

  private forgotPasswordValidator = vine.compile(
    vine.object({
      email: vine.string().email(),
    })
  )

  private resetPasswordValidator = vine.compile(
    vine.object({
      userId: vine.number(),
      token: vine.string().minLength(32),
      password: vine.string().minLength(6),
      passwordConfirmation: vine.string().minLength(6),
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

  async showForgotPassword({ inertia }: HttpContext) {
    return inertia.render('auth/forgot_password')
  }

  async showResetPassword({ inertia, request, response, session, locale }: HttpContext) {
    const token = request.input('token')
    const userId = Number(request.input('uid'))

    if (!token || Number.isNaN(userId)) {
      session.flash('errors', {
        message: this.t(locale, 'Lien de reinitialisation invalide ou expire.', 'Invalid or expired reset link.'),
      })
      return response.redirect('/forgot-password')
    }

    const user = await User.find(userId)
    if (!user || user.isGuest || !AccountSecurityService.isPasswordResetTokenValid(user, token)) {
      session.flash('errors', {
        message: this.t(locale, 'Lien de reinitialisation invalide ou expire.', 'Invalid or expired reset link.'),
      })
      return response.redirect('/forgot-password')
    }

    return inertia.render('auth/reset_password', {
      token,
      userId,
    })
  }

  async showUpgrade({ inertia, auth, response }: HttpContext) {
    if (!auth.user?.isGuest) {
      return response.redirect('/play')
    }

    return inertia.render('auth/upgrade')
  }

  async register({ request, auth, response, session, locale }: HttpContext) {
    const data = await this.registerValidator.validate(request.all())
    const formErrors = this.passwordConfirmationError(data.password, data.passwordConfirmation, locale)
    if (formErrors) {
      session.flash('errors', formErrors)
      return response.redirect().back()
    }

    const fieldErrors = await this.getRegistrationErrors(data, undefined, locale)
    if (Object.keys(fieldErrors).length > 0) {
      session.flash('errors', fieldErrors)
      return response.redirect().back()
    }

    const defaultRole = await Role.findByOrFail('name', 'user')
    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      roleId: defaultRole.id,
      isGuest: false,
      emailVerifiedAt: null,
    })

    await AccountSecurityService.issueEmailVerification(user, locale, { force: true })

    await auth.use('web').logout()
    session.flash(
      'success',
      this.t(
        locale,
        'Compte cree. Verifie ton email pour activer ta connexion.',
        'Account created. Check your email to activate your login.'
      )
    )
    return response.redirect('/login')
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
    const passwordConfirmationError = this.passwordConfirmationError(
      data.password,
      data.passwordConfirmation,
      locale
    )
    if (passwordConfirmationError) {
      session.flash('errors', passwordConfirmationError)
      return response.redirect().back()
    }

    const errors = await this.getRegistrationErrors(data, user.id, locale)
    if (Object.keys(errors).length > 0) {
      session.flash('errors', errors)
      return response.redirect().back()
    }

    user.username = data.username
    user.email = data.email
    user.password = data.password
    user.isGuest = false
    user.emailVerifiedAt = null
    user.emailVerificationToken = null
    user.emailVerificationSentAt = null
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

    await AccountSecurityService.issueEmailVerification(user, locale, { force: true })
    await auth.use('web').logout()

    session.flash(
      'success',
      this.t(
        locale,
        'Compte converti. Verifie ton email pour te reconnecter.',
        'Account upgraded. Check your email before logging back in.'
      )
    )
    return response.redirect('/login')
  }

  async login({ request, auth, response, session, locale }: HttpContext) {
    const { email, password } = await this.loginValidator.validate(request.all())
    const user = await User.findBy('email', email)

    if (!user || !(await hash.verify(user.password, password))) {
      session.flash('errors', {
        E_INVALID_CREDENTIALS: true,
      })
      return response.redirect().back()
    }

    if (!user.isGuest && !user.emailVerifiedAt) {
      const result = await AccountSecurityService.issueEmailVerification(user, locale)
      session.flash('errors', {
        message: result.throttled
          ? this.t(
              locale,
              'Compte non valide. Un email de validation a deja ete envoye recemment.',
              'Account not verified. A verification email was already sent recently.'
            )
          : this.t(
              locale,
              'Compte non valide. Un email de validation vient d etre renvoye.',
              'Account not verified. A fresh verification email has been sent.'
            ),
      })
      return response.redirect().back()
    }

    await auth.use('web').login(user)
    return response.redirect('/play')
  }

  async verifyEmail({ request, auth, response, session, locale }: HttpContext) {
    const token = request.input('token')
    const userId = Number(request.input('uid'))

    if (!token || Number.isNaN(userId)) {
      session.flash('errors', {
        message: this.t(
          locale,
          'Lien de validation invalide ou expire.',
          'Invalid or expired verification link.'
        ),
      })
      return response.redirect('/login')
    }

    const user = await User.find(userId)
    if (!user || user.isGuest) {
      session.flash('errors', {
        message: this.t(
          locale,
          'Lien de validation invalide ou expire.',
          'Invalid or expired verification link.'
        ),
      })
      return response.redirect('/login')
    }

    if (user.emailVerifiedAt) {
      await auth.use('web').login(user)
      session.flash(
        'success',
        this.t(locale, 'Compte deja valide.', 'Account already verified.')
      )
      return response.redirect('/play')
    }

    if (!AccountSecurityService.isEmailVerificationTokenValid(user, token)) {
      session.flash('errors', {
        message: this.t(
          locale,
          'Lien de validation invalide ou expire.',
          'Invalid or expired verification link.'
        ),
      })
      return response.redirect('/login')
    }

    user.emailVerifiedAt = DateTime.utc()
    user.emailVerificationToken = null
    user.emailVerificationSentAt = null
    await user.save()

    await auth.use('web').login(user)
    session.flash(
      'success',
      this.t(locale, 'Compte valide. Bienvenue dans HEREOS.', 'Account verified. Welcome to HEREOS.')
    )
    return response.redirect('/play')
  }

  async forgotPassword({ request, response, session, locale }: HttpContext) {
    const { email } = await this.forgotPasswordValidator.validate(request.all())
    const user = await User.findBy('email', email)

    if (user && !user.isGuest) {
      await AccountSecurityService.issuePasswordReset(user, locale)
    }

    session.flash(
      'success',
      this.t(
        locale,
        'Si cette adresse existe, un email de reinitialisation a ete envoye.',
        'If this address exists, a password reset email has been sent.'
      )
    )
    return response.redirect().back()
  }

  async resetPassword({ request, response, session, locale }: HttpContext) {
    const data = await this.resetPasswordValidator.validate(request.all())
    const passwordConfirmationError = this.passwordConfirmationError(
      data.password,
      data.passwordConfirmation,
      locale
    )
    if (passwordConfirmationError) {
      session.flash('errors', passwordConfirmationError)
      return response.redirect().back()
    }

    const user = await User.find(data.userId)
    if (!user || user.isGuest || !AccountSecurityService.isPasswordResetTokenValid(user, data.token)) {
      session.flash('errors', {
        message: this.t(
          locale,
          'Lien de reinitialisation invalide ou expire.',
          'Invalid or expired reset link.'
        ),
      })
      return response.redirect('/forgot-password')
    }

    user.password = data.password
    user.passwordResetToken = null
    user.passwordResetSentAt = null
    user.passwordResetExpiresAt = null
    await user.save()

    session.flash(
      'success',
      this.t(
        locale,
        'Mot de passe mis a jour. Tu peux maintenant te connecter.',
        'Password updated. You can now log in.'
      )
    )
    return response.redirect('/login')
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }

  private async getRegistrationErrors(
    data: { username: string; email: string },
    ignoredUserId?: number,
    locale: string = 'fr'
  ) {
    const errors: Record<string, string> = {}

    const usernameQuery = User.query().where('username', data.username)
    const emailQuery = User.query().where('email', data.email)

    if (ignoredUserId) {
      usernameQuery.whereNot('id', ignoredUserId)
      emailQuery.whereNot('id', ignoredUserId)
    }

    const [usernameTaken, emailTaken] = await Promise.all([
      usernameQuery.first(),
      emailQuery.first(),
    ])

    if (usernameTaken) {
      errors.username =
        locale === 'en' ? 'This username is already taken' : 'Ce nom d utilisateur est deja pris'
    }

    if (emailTaken) {
      errors.email =
        locale === 'en' ? 'This email is already used' : 'Cette adresse email est deja utilisee'
    }

    return errors
  }

  private passwordConfirmationError(password: string, passwordConfirmation: string, locale: string) {
    if (password === passwordConfirmation) {
      return null
    }

    return {
      passwordConfirmation: this.t(
        locale,
        'La confirmation du mot de passe ne correspond pas',
        'Password confirmation does not match'
      ),
    }
  }

  private t(locale: string, fr: string, en: string) {
    return locale === 'en' ? en : fr
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
