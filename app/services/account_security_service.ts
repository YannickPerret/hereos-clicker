import env from '#start/env'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'
import { createHash, randomBytes } from 'node:crypto'

type Locale = 'fr' | 'en'

export default class AccountSecurityService {
  private static readonly verificationLifetimeHours = 24
  private static readonly resendCooldownMinutes = 5
  private static readonly passwordResetLifetimeHours = 2

  static async issueEmailVerification(
    user: User,
    locale: string,
    options?: { force?: boolean }
  ): Promise<{ throttled: boolean }> {
    const now = DateTime.utc()

    if (
      !options?.force &&
      user.emailVerificationSentAt &&
      now.diff(user.emailVerificationSentAt, 'minutes').minutes < this.resendCooldownMinutes
    ) {
      return { throttled: true }
    }

    const token = randomBytes(32).toString('hex')
    user.emailVerificationToken = this.hashToken(token)
    user.emailVerificationSentAt = now
    await user.save()

    await this.sendVerificationEmail(user, token, this.normalizeLocale(locale))
    return { throttled: false }
  }

  static isEmailVerificationTokenValid(user: User, token: string): boolean {
    if (!token || !user.emailVerificationToken || !user.emailVerificationSentAt || user.emailVerifiedAt) {
      return false
    }

    const ageInHours = DateTime.utc().diff(user.emailVerificationSentAt, 'hours').hours
    return ageInHours <= this.verificationLifetimeHours && user.emailVerificationToken === this.hashToken(token)
  }

  static async issuePasswordReset(user: User, locale: string) {
    const now = DateTime.utc()
    const token = randomBytes(32).toString('hex')

    user.passwordResetToken = this.hashToken(token)
    user.passwordResetSentAt = now
    user.passwordResetExpiresAt = now.plus({ hours: this.passwordResetLifetimeHours })
    await user.save()

    await this.sendPasswordResetEmail(user, token, this.normalizeLocale(locale))
  }

  static isPasswordResetTokenValid(user: User, token: string): boolean {
    if (!token || !user.passwordResetToken || !user.passwordResetExpiresAt) {
      return false
    }

    return (
      user.passwordResetExpiresAt.toMillis() > DateTime.utc().toMillis() &&
      user.passwordResetToken === this.hashToken(token)
    )
  }

  private static async sendVerificationEmail(user: User, token: string, locale: Locale) {
    const verificationUrl = this.makeUrl('/verify-email', {
      uid: String(user.id),
      token,
    })

    const subject =
      locale === 'en' ? 'Validate your HEREOS account' : 'Valide ton compte HEREOS'
    const text =
      locale === 'en'
        ? `Welcome ${user.username}. Validate your account here: ${verificationUrl}`
        : `Bienvenue ${user.username}. Valide ton compte ici : ${verificationUrl}`
    const html = this.wrapEmail(
      locale === 'en' ? 'Validate Your Account' : 'Valide Ton Compte',
      locale === 'en'
        ? `Welcome <strong>${this.escapeHtml(user.username)}</strong>. Click the button below to activate your HEREOS account.`
        : `Bienvenue <strong>${this.escapeHtml(user.username)}</strong>. Clique sur le bouton ci-dessous pour activer ton compte HEREOS.`,
      verificationUrl,
      locale === 'en' ? 'Validate my account' : 'Valider mon compte',
      locale === 'en'
        ? 'This link expires in 24 hours.'
        : 'Ce lien expire dans 24 heures.'
    )

    await this.sendMail(user.email, subject, text, html)
  }

  private static async sendPasswordResetEmail(user: User, token: string, locale: Locale) {
    const resetUrl = this.makeUrl('/reset-password', {
      uid: String(user.id),
      token,
    })

    const subject =
      locale === 'en' ? 'Reset your HEREOS password' : 'Reinitialise ton mot de passe HEREOS'
    const text =
      locale === 'en'
        ? `A password reset was requested for ${user.username}. Reset it here: ${resetUrl}`
        : `Une reinitialisation de mot de passe a ete demandee pour ${user.username}. Reinitialise-le ici : ${resetUrl}`
    const html = this.wrapEmail(
      locale === 'en' ? 'Password Reset' : 'Reinitialisation Du Mot De Passe',
      locale === 'en'
        ? `A password reset was requested for <strong>${this.escapeHtml(user.username)}</strong>.`
        : `Une reinitialisation de mot de passe a ete demandee pour <strong>${this.escapeHtml(user.username)}</strong>.`,
      resetUrl,
      locale === 'en' ? 'Choose a new password' : 'Choisir un nouveau mot de passe',
      locale === 'en'
        ? 'This link expires in 2 hours. If you did not request it, ignore this email.'
        : "Ce lien expire dans 2 heures. Si tu n'es pas a l'origine de la demande, ignore cet email."
    )

    await this.sendMail(user.email, subject, text, html)
  }

  private static async sendMail(to: string, subject: string, text: string, html: string) {
    await mail.send((message) => {
      message.to(to).subject(subject).text(text).html(html)
    })
  }

  private static makeUrl(path: string, query: Record<string, string>) {
    const url = new URL(path, env.get('APP_URL'))
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }
    return url.toString()
  }

  private static wrapEmail(
    title: string,
    body: string,
    actionUrl: string,
    actionLabel: string,
    footer: string
  ) {
    return `
      <div style="background:#070b12;padding:32px 16px;font-family:Arial,sans-serif;color:#e5f6ff;">
        <div style="max-width:560px;margin:0 auto;border:1px solid #1d4f63;background:#0c1420;padding:32px;border-radius:12px;">
          <div style="font-size:12px;letter-spacing:0.35em;text-transform:uppercase;color:#00f0ff;margin-bottom:16px;">HEREOS</div>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">${title}</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#a7c6d8;">${body}</p>
          <a href="${actionUrl}" style="display:inline-block;padding:14px 22px;border-radius:8px;background:#00f0ff;color:#071018;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
            ${actionLabel}
          </a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6f95ab;">${footer}</p>
          <p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#6f95ab;">${this.escapeHtml(actionUrl)}</p>
        </div>
      </div>
    `
  }

  private static hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  private static normalizeLocale(locale: string): Locale {
    return locale === 'en' ? 'en' : 'fr'
  }

  private static escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }
}
