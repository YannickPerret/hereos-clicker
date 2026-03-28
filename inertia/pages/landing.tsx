import { Link } from '@inertiajs/react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '~/components/language_switcher'

const PRIMARY_STEPS = ['click', 'upgrade', 'automate'] as const
const DEEP_STEPS = ['dungeon', 'party', 'pvp'] as const
const PATCH_NOTES = ['stability', 'phantom', 'warning', 'mobile', 'event'] as const

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

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-24 pt-4">
        <div className="flex items-center justify-between border-b border-cyber-blue/15 bg-cyber-black/70 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img
              src="/images/hereos_logo.webp"
              alt="HEREOS"
              className="h-12 w-auto object-contain sm:h-14"
            />
            <span
              className="text-xl font-black uppercase tracking-[0.2em] text-cyber-blue sm:text-2xl"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              HEREOS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="flex h-10 w-10 items-center justify-center border border-cyber-blue/20 bg-white/5 text-cyber-blue transition hover:bg-cyber-blue/10"
              aria-label={t('login')}
            >
              <span className="text-sm">+</span>
            </Link>
          </div>
        </div>

        <div className="grid flex-1 items-start gap-10 py-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="space-y-8">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 animate-pulse bg-cyber-blue" />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.32em] text-cyber-blue"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {t('eyebrow')}
                </span>
              </div>

              <h1
                className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[0.04em] text-white sm:text-6xl lg:text-7xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {t('titlePrefix')}{' '}
                <span className="bg-gradient-to-r from-cyber-blue to-cyber-pink bg-clip-text text-transparent">
                  HEREOS
                </span>
              </h1>

              <p className="max-w-2xl border-l-2 border-cyber-blue/30 pl-6 text-sm leading-7 text-gray-300 sm:text-base">
                {t('description')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/guest"
                method="post"
                as="button"
                className="border border-cyber-blue bg-cyber-blue/15 px-6 py-4 text-sm font-black uppercase tracking-[0.22em] text-cyber-blue shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all hover:bg-cyber-blue/25"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {t('playGuest')}
              </Link>
              <Link
                href="/register"
                className="border border-cyber-pink/40 bg-cyber-pink/10 px-6 py-4 text-sm font-bold uppercase tracking-[0.22em] text-cyber-pink transition-all hover:bg-cyber-pink/20"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {t('createAccount')}
              </Link>
            </div>

            <div className="flex justify-start">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-cyber-blue/50 transition-all hover:text-cyber-blue"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <span className="text-cyber-blue/70">&gt;</span>
                {t('login')}
              </Link>
            </div>

            <div className="rounded-2xl border border-cyber-blue/20 bg-cyber-dark/65 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-cyber-blue">::</span>
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyber-blue"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {t('patchNotes.title')} {t('patchNotes.version')}
                </span>
              </div>

              <div className="max-h-52 space-y-3 overflow-y-auto pr-2 font-mono text-xs leading-relaxed">
                {PATCH_NOTES.map((note) => {
                  const tone = t(`patchNotes.entries.${note}.tone`)
                  const isWarning = tone === 'warning'

                  return (
                    <div
                      key={note}
                      className={
                        isWarning
                          ? 'border-l border-cyber-pink/45 pl-3 text-cyber-pink/90'
                          : 'flex gap-4 text-gray-300'
                      }
                    >
                      {isWarning ? (
                        <>
                          <span className="shrink-0 uppercase text-cyber-pink">
                            {t(`patchNotes.entries.${note}.date`)}
                          </span>
                          <span className="italic">{t(`patchNotes.entries.${note}.body`)}</span>
                        </>
                      ) : (
                        <>
                          <span className="shrink-0 text-cyber-pink/60">
                            {t(`patchNotes.entries.${note}.date`)}
                          </span>
                          <span className={tone === 'highlight' ? 'text-cyber-blue/90' : 'text-gray-300'}>
                            {t(`patchNotes.entries.${note}.body`)}
                          </span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-8 pt-1">
              <div className="flex flex-col">
                <span
                  className="text-2xl font-black text-cyber-pink"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {t('stats.runs.value')}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  {t('stats.runs.label')}
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-2xl font-black text-cyber-blue"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {t('stats.runners.value')}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  {t('stats.runners.label')}
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-2xl font-black text-red-300"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {t('stats.uptime.value')}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  {t('stats.uptime.label')}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <span>{t('trust')}</span>
            </div>
          </section>

          <section className="space-y-5">
            <div className="overflow-hidden border border-cyber-blue/25 bg-cyber-dark/70 p-1 backdrop-blur-sm">
              <div className="border border-cyber-blue/10 bg-cyber-black/80 p-6">
                <div className="mb-6 flex items-center justify-between border-b border-cyber-blue/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-cyber-pink">&gt;_</span>
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyber-blue"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {t('terminal.title')}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-cyber-blue/30" />
                    <div className="h-2 w-2 bg-cyber-blue/30" />
                    <div className="h-2 w-2 bg-cyber-pink/50" />
                  </div>
                </div>

                <div className="mb-8 space-y-4 font-mono text-[11px] text-cyber-blue/60">
                  <p>&gt; {t('terminal.boot')}</p>
                  <p>
                    &gt; {t('terminal.link')}{' '}
                    <span className="text-cyber-pink">{t('terminal.status')}</span>
                  </p>
                  <p>
                    &gt; {t('terminal.cpcLabel')}{' '}
                    <span className="font-bold text-white">{t('terminal.cpcValue')}</span>
                  </p>
                  <div className="relative h-2 w-full overflow-hidden bg-white/5">
                    <div className="absolute inset-y-0 left-0 w-3/4 bg-cyber-blue/40" />
                  </div>
                  <p>&gt; {t('terminal.target')}</p>
                </div>

                <div className="relative aspect-square overflow-hidden border border-cyber-blue/10 bg-[radial-gradient(circle_at_top,rgba(0,240,255,0.24),transparent_35%),linear-gradient(180deg,rgba(255,0,255,0.08),rgba(10,10,15,0.95))]">
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-cyber-blue/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cyber-black to-transparent" />
                  <div className="absolute right-4 top-4 border border-cyber-pink/50 bg-cyber-pink/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cyber-pink">
                    {t('terminal.danger')}
                  </div>
                  <div className="absolute inset-x-[18%] bottom-0 top-[18%] rounded-t-[999px] border border-cyber-blue/20 bg-gradient-to-b from-cyber-blue/18 via-cyber-dark to-cyber-black opacity-90" />
                  <div className="absolute left-1/2 top-[21%] h-16 w-16 -translate-x-1/2 rounded-full border border-cyber-blue/35 bg-cyber-black shadow-[0_0_35px_rgba(0,240,255,0.18)]" />
                  <div className="absolute left-[39%] top-[25%] h-2 w-2 rounded-full bg-cyber-blue shadow-[0_0_10px_rgba(0,240,255,0.9)]" />
                  <div className="absolute right-[39%] top-[25%] h-2 w-2 rounded-full bg-cyber-blue shadow-[0_0_10px_rgba(0,240,255,0.9)]" />
                  <div className="absolute left-1/2 top-[34%] h-24 w-24 -translate-x-1/2 border-x border-cyber-blue/20" />
                  <div className="absolute left-[27%] top-[46%] h-28 w-10 -rotate-[22deg] rounded-full border border-cyber-blue/12 bg-cyber-blue/8" />
                  <div className="absolute right-[27%] top-[46%] h-28 w-10 rotate-[22deg] rounded-full border border-cyber-blue/12 bg-cyber-blue/8" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyber-blue/25 bg-cyber-dark/70 p-5 backdrop-blur-sm">
              <div
                className="text-[10px] uppercase tracking-[0.32em] text-cyber-blue"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {t('eyebrow')}
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
              <div
                className="text-[10px] uppercase tracking-[0.32em] text-cyber-pink"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {t('primaryLoopTitle')}
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

        <footer className="mt-auto flex flex-col gap-4 border-t border-cyber-blue/10 py-4 text-[10px] uppercase tracking-[0.2em] text-cyber-blue/50 sm:flex-row sm:items-center sm:justify-between">
          <span style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{t('footer.copyright')}</span>
          <div className="flex flex-wrap items-center gap-6">
            <a href="/terms" className="transition-colors hover:text-cyber-pink">
              {t('footer.terms')}
            </a>
            <a href="/privacy" className="transition-colors hover:text-cyber-pink">
              {t('footer.privacy')}
            </a>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyber-green shadow-[0_0_8px_#00ff41]" />
              <span>{t('footer.status')}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
