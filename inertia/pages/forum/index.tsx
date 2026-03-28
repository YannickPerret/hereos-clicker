import { Head, Link } from '@inertiajs/react'
import GameLayout from '~/components/layout'
import { useTranslation } from 'react-i18next'

interface ThreadEntry {
  id: number
  title: string
  postCount: number
  isLocked: boolean
  lastPostedAt: string
  createdAt: string
  author: {
    id: number
    username: string
  }
}

interface CategoryEntry {
  id: number
  name: string
  slug: string
  description: string | null
  sortOrder: number
  threadCount: number
  threads: ThreadEntry[]
}

interface ForumBanSummary {
  id: number
  reason: string | null
  expiresAt: string | null
}

interface Props {
  categories: CategoryEntry[]
  forumBan: ForumBanSummary | null
}

export default function ForumIndex({ categories, forumBan }: Props) {
  const { t } = useTranslation('forum')

  return (
    <GameLayout>
      <Head title={t('title')} />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-orange">
            {t('eyebrow')}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-widest text-white">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>

        {forumBan && (
          <div className="mb-6 rounded-xl border border-cyber-red/35 bg-cyber-red/10 px-4 py-4 text-sm text-cyber-red">
            {t('bannedBanner', { reason: forumBan.reason || t('noReason') })}
          </div>
        )}

        <div className="space-y-6">
          {categories.map((category) => (
            <section
              key={category.id}
              className="rounded-2xl border border-cyber-orange/20 bg-cyber-dark/40 p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/forum/category/${category.slug}`}
                    className="text-lg font-bold text-white transition hover:text-cyber-orange"
                  >
                    {category.name}
                  </Link>
                  <div className="mt-1 text-sm text-gray-500">
                    {category.description || t('noDescription')}
                  </div>
                </div>
                <div className="rounded-full border border-cyber-orange/20 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyber-orange">
                  {t('threadCount', { count: category.threadCount })}
                </div>
              </div>

              <div className="space-y-3">
                {category.threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/forum/thread/${thread.id}`}
                    className="block rounded-xl border border-cyber-blue/15 bg-cyber-black/40 p-4 transition-all hover:border-cyber-blue/35 hover:bg-cyber-blue/10"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {thread.isLocked && (
                          <span className="rounded border border-cyber-red/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-red">
                            {t('locked')}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm font-bold text-white">{thread.title}</div>
                    </div>
                  </Link>
                ))}

                {category.threads.length === 0 && (
                  <div className="rounded-xl border border-gray-800 bg-cyber-black/25 p-4 text-sm text-gray-500">
                    {t('noThreads')}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </GameLayout>
  )
}
