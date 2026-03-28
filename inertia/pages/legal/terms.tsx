import { Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '~/components/language_switcher'

export default function Terms() {
  const { t } = useTranslation('auth')

  const sections = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'] as const

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col items-center relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="w-full max-w-2xl relative z-10 px-4 py-12">
        <Link
          href="/login"
          className="inline-block mb-6 text-xs uppercase tracking-widest text-gray-500 hover:text-cyber-blue transition-colors"
        >
          &larr; {t('legal.back')}
        </Link>

        <img
          src="/images/hereos_logo.webp"
          alt="HEREOS"
          className="mx-auto mb-4 h-16 w-auto object-contain"
        />

        <h1 className="text-2xl font-bold text-cyber-blue tracking-widest text-center mb-2">
          {t('legal.termsTitle')}
        </h1>
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-gray-600 mb-8">
          {t('legal.lastUpdated')}
        </p>

        <div className="bg-cyber-dark border border-cyber-blue/20 rounded-lg p-6 space-y-6">
          <p className="text-sm text-gray-400">{t('legal.terms.intro')}</p>

          {sections.map((key) => (
            <div key={key}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-cyber-blue mb-2">
                {t(`legal.terms.${key}Title`)}
              </h2>
              <p className="text-sm text-gray-400">{t(`legal.terms.${key}`)}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-10 mt-auto pb-6 pt-8 text-center text-[10px] uppercase tracking-[0.3em] text-gray-700">
        HEREOS &copy; 2025 &mdash; All rights reserved
      </footer>
    </div>
  )
}
