import { Head, Link } from '@inertiajs/react'
import GameLayout from '~/components/layout'
import { useTranslation } from 'react-i18next'

interface ThreadEntry {
  id: number
  title: string
  postCount: number
  isLocked: boolean
  createdAt: string
  lastPostedAt: string
  author: {
    id: number
    username: string
  }
}

interface Props {
  category: {
    id: number
    name: string
    slug: string
    description: string | null
  }
  threads: ThreadEntry[]
  forumBan: {
    id: number
    reason: string | null
    expiresAt: string | null
  } | null
}

export default function ForumCategoryPage({ category, threads, forumBan }: Props) {
  const { t } = useTranslation('forum')

  return (
    <GameLayout>
      <Head title={`${category.name} - ${t('title')}`} />
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/forum" className="text-[11px] uppercase tracking-[0.24em] text-cyber-orange hover:text-white">
            {t('backToForum')}
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-widest text-white">{category.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{category.description || t('noDescription')}</p>
        </div>

        {forumBan && (
          <div className="mb-6 rounded-xl border border-cyber-red/35 bg-cyber-red/10 px-4 py-4 text-sm text-cyber-red">
            {t('bannedBanner', { reason: forumBan.reason || t('noReason') })}
          </div>
        )}

        <div className="space-y-3">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/forum/thread/${thread.id}`}
              className="block rounded-xl border border-cyber-blue/15 bg-cyber-dark/40 p-4 transition-all hover:border-cyber-blue/35 hover:bg-cyber-blue/10"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {thread.isLocked && (
                    <span className="rounded border border-cyber-red/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-red">
                      {t('locked')}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-lg font-bold text-white">{thread.title}</div>
              </div>
            </Link>
          ))}
          {threads.length === 0 && (
            <div className="rounded-xl border border-gray-800 bg-cyber-dark/40 p-6 text-sm text-gray-500">
              {t('noThreads')}
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  )
}
