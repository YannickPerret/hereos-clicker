import { Link, useForm, usePage } from '@inertiajs/react'
import { Trans, useTranslation } from 'react-i18next'
import LanguageSwitcher from '~/components/language_switcher'

type ResetPasswordProps = {
  userId: number
  token: string
  errors?: { message?: string }
}

export default function ResetPassword() {
  const { t } = useTranslation('auth')
  const { props } = usePage<ResetPasswordProps>()
  const { data, setData, post, processing, errors } = useForm({
    userId: props.userId,
    token: props.token,
    password: '',
    passwordConfirmation: '',
  })

  const passwordMismatch =
    data.passwordConfirmation.length > 0 && data.password !== data.passwordConfirmation

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (passwordMismatch) return
    post('/reset-password')
  }

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,0,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <img
          src="/images/hereos_logo.webp"
          alt="HEREOS"
          className="mx-auto mb-3 h-20 w-auto object-contain"
        />
        <p className="text-center text-gray-500 mb-6 text-sm tracking-widest uppercase">
          {t('resetPassword.subtitle')}
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-cyber-dark border border-cyber-pink/30 rounded-lg p-8 neon-border-pink"
        >
          {props.errors?.message && (
            <div className="mb-5 rounded-lg border border-cyber-red/50 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">
              {props.errors.message}
            </div>
          )}

          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-gray-400">{t('resetPassword.description')}</p>

            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-pink mb-2">
                {t('resetPassword.password')}
              </label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-pink/30 rounded px-4 py-2.5 text-white focus:border-cyber-pink focus:outline-none transition-all"
                placeholder={t('resetPassword.placeholderPassword')}
              />
              {errors.password && <p className="text-cyber-red text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-pink mb-2">
                {t('resetPassword.passwordConfirmation')}
              </label>
              <input
                type="password"
                value={data.passwordConfirmation}
                onChange={(e) => setData('passwordConfirmation', e.target.value)}
                className={`w-full bg-cyber-black border rounded px-4 py-2.5 text-white focus:outline-none transition-all ${
                  passwordMismatch
                    ? 'border-cyber-red/50 focus:border-cyber-red'
                    : 'border-cyber-pink/30 focus:border-cyber-pink'
                }`}
                placeholder={t('resetPassword.placeholderPasswordConfirmation')}
              />
              {passwordMismatch && (
                <p className="text-cyber-red text-xs mt-1">{t('resetPassword.passwordMismatch')}</p>
              )}
              {errors.passwordConfirmation && (
                <p className="text-cyber-red text-xs mt-1">{errors.passwordConfirmation}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={processing || passwordMismatch || !data.passwordConfirmation}
              className="w-full py-3 bg-cyber-pink/20 border border-cyber-pink text-cyber-pink font-bold uppercase tracking-widest rounded hover:bg-cyber-pink/30 transition-all disabled:opacity-50 neon-border-pink"
            >
              {processing ? t('resetPassword.submitting') : t('resetPassword.submit')}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            <Link href="/login" className="text-cyber-blue hover:underline">
              {t('resetPassword.backToLogin')}
            </Link>
          </p>
        </form>
      </div>

      <footer className="relative z-10 mt-auto pb-6 pt-8 text-center text-gray-600 space-y-2">
        <p className="text-[11px]">
          <Trans
            i18nKey="auth:legal.notice"
            components={{
              terms: <Link href="/terms" className="text-cyber-blue hover:underline" />,
              privacy: <Link href="/privacy" className="text-cyber-pink hover:underline" />,
            }}
          />
        </p>
      </footer>
    </div>
  )
}
