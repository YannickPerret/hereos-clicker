import { Head, Link, router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'
import { useTranslation } from 'react-i18next'

interface ReplyEntry {
  id: number
  body: string
  createdAt: string
  editedAt: string | null
  author: {
    id: number
    username: string
  }
}

interface PostEntry {
  id: number
  body: string
  createdAt: string
  editedAt: string | null
  author: {
    id: number
    username: string
  }
  replies: ReplyEntry[]
}

interface Props {
  thread: {
    id: number
    title: string
    isPinned: boolean
    isLocked: boolean
    postCount: number
    createdAt: string
    lastPostedAt: string
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
  posts: PostEntry[]
  canPost: boolean
  forumBan: {
    id: number
    reason: string | null
    expiresAt: string | null
  } | null
}

function ReplyForm({
  postId,
  disabled,
}: {
  postId: number
  disabled: boolean
}) {
  const { t } = useTranslation('forum')
  const [body, setBody] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        router.post(
          `/forum/posts/${postId}/reply`,
          { body },
          {
            preserveScroll: true,
            onSuccess: () => setBody(''),
          }
        )
      }}
      className="mt-3 space-y-2"
    >
      <textarea
        rows={3}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t('replyToPostPlaceholder')}
        className="w-full resize-y rounded-xl border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:border-cyber-orange/40 focus:outline-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || body.trim().length < 3}
          className="rounded border border-cyber-orange/35 bg-cyber-orange/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-cyber-orange transition-all hover:bg-cyber-orange/20 disabled:opacity-50"
        >
          {t('replyToPost')}
        </button>
      </div>
    </form>
  )
}

export default function ForumThreadPage({ thread, posts, canPost, forumBan }: Props) {
  const { t } = useTranslation('forum')
  const page = usePage<{ errors?: { message?: string }; success?: string }>()
  const [body, setBody] = useState('')

  return (
    <GameLayout>
      <Head title={`${thread.title} - ${t('title')}`} />
      <div className="mx-auto max-w-5xl">
        <div className="mb-5">
          <Link
            href={`/forum/category/${thread.category.slug}`}
            className="text-[11px] uppercase tracking-[0.24em] text-cyber-orange hover:text-white"
          >
            {t('backToCategory', { category: thread.category.name })}
          </Link>
        </div>

        {forumBan && (
          <div className="mb-6 rounded-xl border border-cyber-red/35 bg-cyber-red/10 px-4 py-4 text-sm text-cyber-red">
            {t('bannedBanner', { reason: forumBan.reason || t('noReason') })}
          </div>
        )}

        {(page.props.errors?.message || page.props.success) && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              page.props.errors?.message
                ? 'border-cyber-red/35 bg-cyber-red/10 text-cyber-red'
                : 'border-cyber-green/35 bg-cyber-green/10 text-cyber-green'
            }`}
          >
            {page.props.errors?.message || page.props.success}
          </div>
        )}

        <article className="rounded-2xl border border-cyber-blue/20 bg-cyber-dark/40 p-5">
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
            <span className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
              {thread.category.name}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-widest text-white">{thread.title}</h1>
          <div className="mt-2 text-[11px] text-gray-500">
            {t('byUser', { user: thread.author.username })} •{' '}
            {new Date(thread.createdAt).toLocaleString()} • {t('postCount', { count: thread.postCount })}
          </div>
        </article>

        <section className="mt-6 rounded-2xl border border-cyber-blue/15 bg-cyber-dark/30 p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-cyber-blue">
            {t('postsTitle', { count: posts.length })}
          </div>
          <div className="space-y-5">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-gray-800 bg-cyber-black/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-white">{post.author.username}</div>
                  <div className="text-[11px] text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                    {post.editedAt && ` • ${t('edited')}`}
                  </div>
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-200">{post.body}</div>

                <div className="mt-4 border-t border-gray-800/80 pt-4">
                  <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-gray-500">
                    {t('replyCount', { count: post.replies.length })}
                  </div>
                  <div className="space-y-3">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="rounded-lg border border-gray-800 bg-cyber-dark/35 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-bold text-white">{reply.author.username}</div>
                          <div className="text-[11px] text-gray-500">
                            {new Date(reply.createdAt).toLocaleString()}
                            {reply.editedAt && ` • ${t('edited')}`}
                          </div>
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-300">
                          {reply.body}
                        </div>
                      </div>
                    ))}
                    {post.replies.length === 0 && (
                      <div className="rounded-lg border border-gray-800 bg-cyber-dark/25 p-3 text-sm text-gray-500">
                        {t('noRepliesForPost')}
                      </div>
                    )}
                  </div>

                  {!thread.isLocked && !forumBan && <ReplyForm postId={post.id} disabled={!canPost} />}
                </div>
              </article>
            ))}
            {posts.length === 0 && (
              <div className="rounded-xl border border-gray-800 bg-cyber-black/25 p-6 text-sm text-gray-500">
                {t('noPosts')}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-cyber-orange/20 bg-cyber-dark/40 p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-cyber-orange">
            {t('newPostBox')}
          </div>
          {thread.isLocked ? (
            <div className="text-sm text-cyber-red">{t('threadLocked')}</div>
          ) : forumBan ? (
            <div className="text-sm text-cyber-red">
              {t('bannedBanner', { reason: forumBan.reason || t('noReason') })}
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                router.post(
                  `/forum/thread/${thread.id}/posts`,
                  { body },
                  {
                    preserveScroll: true,
                    onSuccess: () => setBody(''),
                  }
                )
              }}
              className="space-y-3"
            >
              <textarea
                rows={6}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t('postPlaceholder')}
                className="w-full resize-y rounded-xl border border-gray-800 bg-cyber-black px-4 py-3 text-sm text-white focus:border-cyber-orange/40 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-gray-500">{t('postRules')}</div>
                <button
                  type="submit"
                  disabled={!canPost || body.trim().length < 3}
                  className="rounded border border-cyber-orange/35 bg-cyber-orange/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-cyber-orange transition-all hover:bg-cyber-orange/20 disabled:opacity-50"
                >
                  {t('publishPost')}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </GameLayout>
  )
}
