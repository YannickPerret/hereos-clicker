import { useForm, Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '~/components/language_switcher'

export default function Login() {
  const { t } = useTranslation('auth')
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/login')
  }

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col items-center justify-center relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <img
          src="/images/hereos_logo.webp"
          alt="HEREOS"
          className="mx-auto mb-3 h-20 w-auto object-contain"
        />
        <p className="text-center text-gray-500 mb-8 text-sm tracking-widest uppercase">
          {t('login.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-8 neon-border">
          <div className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">{t('login.email')}</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none focus:ring-1 focus:ring-cyber-blue/50 transition-all"
                placeholder={t('login.placeholder')}
              />
              {errors.email && <p className="text-cyber-red text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-cyber-blue mb-2">{t('login.password')}</label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                className="w-full bg-cyber-black border border-cyber-blue/30 rounded px-4 py-2.5 text-white focus:border-cyber-blue focus:outline-none focus:ring-1 focus:ring-cyber-blue/50 transition-all"
                placeholder="********"
              />
              {errors.password && <p className="text-cyber-red text-xs mt-1">{errors.password}</p>}
            </div>

            {(errors as any).E_INVALID_CREDENTIALS && (
              <p className="text-cyber-red text-xs">{t('login.invalidCredentials')}</p>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all disabled:opacity-50 neon-border"
            >
              {processing ? t('login.submitting') : t('login.submit')}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            {t('login.noAccount')}{' '}
            <Link href="/register" className="text-cyber-pink hover:underline">
              {t('login.register')}
            </Link>
          </p>
        </form>
      </div>

      <footer className="relative z-10 mt-auto pb-6 pt-8 text-center text-[10px] uppercase tracking-[0.3em] text-gray-700">
        HEREOS &copy; 2025 &mdash; All rights reserved
      </footer>
    </div>
  )
}
