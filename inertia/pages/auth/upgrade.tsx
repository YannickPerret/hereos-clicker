import { Link, useForm } from '@inertiajs/react'
import { Trans, useTranslation } from 'react-i18next'
import LanguageSwitcher from '~/components/language_switcher'

export default function UpgradeGuest() {
  const { t } = useTranslation('auth')
  const { data, setData, post, processing, errors } = useForm({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })

  const passwordMismatch =
    data.passwordConfirmation.length > 0 && data.password !== data.passwordConfirmation

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (passwordMismatch) return
    post('/account/upgrade')
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
          {t('upgrade.subtitle')}
        </p>

        <div className="mb-8 rounded-lg border border-cyber-blue/15 bg-cyber-dark/50 px-5 py-4 text-center backdrop-blur-sm">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-cyber-blue">
            {t('upgrade.headline')}
          </div>
          <p className="text-xs leading-relaxed text-gray-400">{t('upgrade.description')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-8 neon-border"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">
                {t('upgrade.username')}
              </label>
              <input
                type="text"
                value={data.username}
                onChange={(e) => setData('username', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none transition-all"
                placeholder={t('upgrade.placeholderUsername')}
              />
              {errors.username && <p className="text-cyber-red text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">
                {t('upgrade.email')}
              </label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none transition-all"
                placeholder={t('upgrade.placeholderEmail')}
              />
              {errors.email && <p className="text-cyber-red text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">
                {t('upgrade.password')}
              </label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none transition-all"
                placeholder={t('upgrade.placeholderPassword')}
              />
              {errors.password && <p className="text-cyber-red text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">
                {t('upgrade.passwordConfirmation')}
              </label>
              <input
                type="password"
                value={data.passwordConfirmation}
                onChange={(e) => setData('passwordConfirmation', e.target.value)}
                className={`w-full bg-cyber-black border rounded px-4 py-2.5 text-white focus:outline-none transition-all ${
                  passwordMismatch
                    ? 'border-cyber-red/50 focus:border-cyber-red'
                    : 'border-cyber-blue/30 focus:border-cyber-blue'
                }`}
                placeholder={t('upgrade.placeholderPasswordConfirmation')}
              />
              {passwordMismatch && (
                <p className="text-cyber-red text-xs mt-1">{t('upgrade.passwordMismatch')}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={processing || passwordMismatch || !data.passwordConfirmation}
              className="w-full py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all disabled:opacity-50 neon-border"
            >
              {processing ? t('upgrade.submitting') : t('upgrade.submit')}
            </button>
          </div>
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
