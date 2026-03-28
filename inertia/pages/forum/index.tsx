import { Head, Link } from '@inertiajs/react'
import GameLayout from '~/components/layout'
import { useTranslation } from 'react-i18next'

interface CategoryEntry {
  id: number
  name: string
  slug: string
  description: string | null
  sortOrder: number
  threadCount: number
}

interface ThreadEntry {
  id: number
  title: string
  postCount: number
  isPinned: boolean
  isLocked: boolean
  lastPostedAt: string
  createdAt: string
  category: {
    id: number
    name: string
    slug: string
  }
  author: {
    id: number
    username: string
  }
}

interface ForumBanSummary {
  id: number
  reason: string | null
  expiresAt: string | null
}

interface Props {
  categories: CategoryEntry[]
  latestThreads: ThreadEntry[]
  forumBan: ForumBanSummary | null
}

export default function ForumIndex({ categories, latestThreads, forumBan }: Props) {
  const { t } = useTranslation('forum')

  return (
    <GameLayout>
      <Head title={t('title')} />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-orange">
              {t('eyebrow')}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-widest text-white">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
          </div>
        </div>

        {forumBan && (
          <div className="mb-6 rounded-xl border border-cyber-red/35 bg-cyber-red/10 px-4 py-4 text-sm text-cyber-red">
            {t('bannedBanner', { reason: forumBan.reason || t('noReason') })}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-cyber-orange/20 bg-cyber-dark/40 p-5">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-cyber-orange">
              {t('categories')}
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/forum/category/${category.slug}`}
                  className="block rounded-xl border border-cyber-blue/15 bg-cyber-black/40 p-4 transition-all hover:border-cyber-blue/35 hover:bg-cyber-blue/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-white">{category.name}</div>
                      <div className="mt-1 text-sm text-gray-500">
                        {category.description || t('noDescription')}
                      </div>
                    </div>
                    <div className="rounded-full border border-cyber-orange/20 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyber-orange">
                      {t('threadCount', { count: category.threadCount })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-cyber-blue/20 bg-cyber-dark/40 p-5">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-cyber-blue">
              {t('latestThreads')}
            </div>
            <div className="space-y-3">
              {latestThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forum/thread/${thread.id}`}
                  className="block rounded-xl border border-cyber-blue/15 bg-cyber-black/40 p-4 transition-all hover:border-cyber-blue/35 hover:bg-cyber-blue/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {thread.isPinned && (
                          <span className="rounded border border-cyber-yellow/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-yellow">
                            {t('pinned')}
                          </span>
                        )}
                        {thread.isLocked && (
                          <span className="rounded border border-cyber-red/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-red">
                            {t('locked')}
                          </span>
                        )}
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          {thread.category.name}
                        </span>
                      </div>
                      <div className="mt-2 truncate text-sm font-bold text-white">{thread.title}</div>
                      <div className="mt-2 text-[11px] text-gray-500">
                        {t('byUser', { user: thread.author.username })} •{' '}
                        {new Date(thread.lastPostedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-full border border-cyber-blue/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyber-blue">
                      {t('postCount', { count: thread.postCount })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </GameLayout>
  )
}
