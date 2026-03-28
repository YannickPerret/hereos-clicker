import { Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '~/components/language_switcher'

const PRIMARY_STEPS = ['click', 'upgrade', 'automate'] as const
const DEEP_STEPS = ['dungeon', 'party', 'pvp'] as const

export default function Landing() {
  const { t } = useTranslation('landing')

  return (
    <div className="min-h-screen overflow-hidden bg-cyber-black text-white">
      <div className="absolute inset-0 opacity-15">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at top left, rgba(0,240,255,0.22), transparent 30%), radial-gradient(circle at bottom right, rgba(255,0,122,0.18), transparent 35%), linear-gradient(rgba(0,240,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.15) 1px, transparent 1px)',
            backgroundSize: 'auto, auto, 44px 44px, 44px 44px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-10 pt-4">
        <div className="flex items-center justify-between">
          <img
            src="/images/hereos_logo.webp"
            alt="HEREOS"
            className="h-16 w-auto object-contain sm:h-20"
          />
          <LanguageSwitcher />
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <div className="inline-flex rounded-full border border-cyber-blue/30 bg-cyber-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.32em] text-cyber-blue">
              {t('eyebrow')}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black uppercase tracking-[0.08em] text-white sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
              {t('description')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/guest"
                method="post"
                as="button"
                className="rounded border border-cyber-blue bg-cyber-blue/15 px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-cyber-blue transition-all hover:bg-cyber-blue/25"
              >
                {t('playGuest')}
              </Link>
              <Link
                href="/register"
                className="rounded border border-cyber-pink/40 bg-cyber-pink/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-cyber-pink transition-all hover:bg-cyber-pink/20"
              >
                {t('createAccount')}
              </Link>
              <Link
                href="/login"
                className="rounded border border-gray-700 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-gray-200 transition-all hover:border-cyber-blue/40 hover:bg-cyber-blue/10 hover:text-cyber-blue"
              >
                {t('login')}
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <span>{t('trust')}</span>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-cyber-blue/25 bg-cyber-dark/70 p-5 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-[0.32em] text-cyber-blue">
                {t('primaryLoopTitle')}
              </div>
              <div className="mt-2 text-sm text-gray-400">{t('primaryLoopDescription')}</div>
              <div className="mt-5 grid gap-3">
                {PRIMARY_STEPS.map((step) => (
                  <div
                    key={step}
                    className="rounded-xl border border-cyber-blue/15 bg-cyber-black/40 p-4"
                  >
                    <div className="text-sm font-bold uppercase tracking-[0.16em] text-white">
                      {t(`primaryLoopSteps.${step}.title`)}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-gray-400">
                      {t(`primaryLoopSteps.${step}.description`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyber-pink/20 bg-cyber-dark/55 p-5">
              <div className="text-[10px] uppercase tracking-[0.32em] text-cyber-pink">
                {t('deepLoopTitle')}
              </div>
              <div className="mt-2 text-sm text-gray-400">{t('deepLoopDescription')}</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {DEEP_STEPS.map((step) => (
                  <div
                    key={step}
                    className="rounded-xl border border-cyber-pink/15 bg-cyber-black/40 p-4"
                  >
                    <div className="text-sm font-bold uppercase tracking-[0.16em] text-cyber-pink">
                      {t(`deepLoopSteps.${step}.title`)}
                    </div>
                    <div className="mt-2 text-xs leading-6 text-gray-400">
                      {t(`deepLoopSteps.${step}.description`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
