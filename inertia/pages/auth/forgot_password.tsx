import { Link, useForm, usePage } from '@inertiajs/react'
import { Trans, useTranslation } from 'react-i18next'
import LanguageSwitcher from '~/components/language_switcher'

export default function ForgotPassword() {
  const { t } = useTranslation('auth')
  const { props } = usePage<{ success?: string; errors?: { message?: string } }>()
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  })

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    post('/forgot-password')
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
            'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)',
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
          {t('forgotPassword.subtitle')}
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-8 neon-border"
        >
          {props.success && (
            <div className="mb-5 rounded-lg border border-cyber-green/50 bg-cyber-green/10 px-4 py-3 text-sm text-cyber-green">
              {props.success}
            </div>
          )}
          {props.errors?.message && (
            <div className="mb-5 rounded-lg border border-cyber-red/50 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">
              {props.errors.message}
            </div>
          )}

          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-gray-400">{t('forgotPassword.description')}</p>

            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">
                {t('forgotPassword.email')}
              </label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none focus:ring-1 focus:ring-cyber-blue/50 transition-all"
                placeholder={t('forgotPassword.placeholder')}
              />
              {errors.email && <p className="text-cyber-red text-xs mt-1">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all disabled:opacity-50 neon-border"
            >
              {processing ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            <Link href="/login" className="text-cyber-pink hover:underline">
              {t('forgotPassword.backToLogin')}
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
