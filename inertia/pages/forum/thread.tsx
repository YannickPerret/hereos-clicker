import { Head, Link, router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'
import ForumRichEditor from '~/components/forum_rich_editor'
import { useTranslation } from 'react-i18next'

interface ReplyEntry {
  id: number
  body: string
  createdAt: string
  editedAt: string | null
  canDelete: boolean
  canModerate: boolean
  isPinned: boolean
  isLocked: boolean
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
  canDelete: boolean
  canModerate: boolean
  isPinned: boolean
  isLocked: boolean
  replyCount: number
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

function PostActions({
  postId,
  canDelete,
  canModerate,
  isPinned,
  isLocked,
}: {
  postId: number
  canDelete: boolean
  canModerate: boolean
  isPinned: boolean
  isLocked: boolean
}) {
  const { t } = useTranslation('forum')

  return (
    <div className="flex flex-wrap gap-2">
      {canModerate && (
        <>
          <button
            type="button"
            onClick={() => router.post(`/forum/posts/${postId}/toggle-pin`, {}, { preserveScroll: true })}
            className="rounded border border-cyber-yellow/30 px-2 py-1 text-[10px] uppercase text-cyber-yellow hover:bg-cyber-yellow/10"
          >
            {isPinned ? t('unpinPost') : t('pinPost')}
          </button>
          <button
            type="button"
            onClick={() => router.post(`/forum/posts/${postId}/toggle-lock`, {}, { preserveScroll: true })}
            className="rounded border border-cyber-red/30 px-2 py-1 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
          >
            {isLocked ? t('unlockPost') : t('lockPost')}
          </button>
        </>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('confirmDeletePost'))) {
              router.post(`/forum/posts/${postId}/delete`, {}, { preserveScroll: true })
            }
          }}
          className="rounded border border-cyber-red/30 px-2 py-1 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
        >
          {t('deletePost')}
        </button>
      )}
    </div>
  )
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
      <ForumRichEditor
        value={body}
        onChange={setBody}
        placeholder={t('replyToPostPlaceholder')}
        minHeightClassName="min-h-24"
        disabled={disabled}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
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
  const page = usePage<{ errors?: { message?: string }; success?: string } & { auth?: { user?: { id: number } } }>()
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {post.isPinned && (
                        <span className="rounded border border-cyber-yellow/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-yellow">
                          {t('pinned')}
                        </span>
                      )}
                      {post.isLocked && (
                        <span className="rounded border border-cyber-red/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-red">
                          {t('locked')}
                        </span>
                      )}
                      <div className="text-sm font-bold text-white">{post.author.username}</div>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                      {post.editedAt && ` • ${t('edited')}`} • {t('replyCount', { count: post.replyCount })}
                    </div>
                  </div>
                  <PostActions
                    postId={post.id}
                    canDelete={post.canDelete}
                    canModerate={post.canModerate}
                    isPinned={post.isPinned}
                    isLocked={post.isLocked}
                  />
                </div>

                <div
                  className="prose prose-invert mt-3 max-w-none text-sm leading-7 text-gray-200 prose-a:text-cyber-blue prose-blockquote:border-cyber-orange/35 prose-code:text-cyber-orange prose-img:rounded-lg prose-img:border prose-img:border-cyber-blue/20 prose-img:shadow-[0_0_20px_rgba(0,240,255,0.08)] prose-pre:bg-white/5"
                  dangerouslySetInnerHTML={{ __html: post.body }}
                />

                <div className="mt-4 border-t border-gray-800/80 pt-4">
                  <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-gray-500">
                    {t('replyCount', { count: post.replies.length })}
                  </div>
                  <div className="space-y-3">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="rounded-lg border border-gray-800 bg-cyber-dark/35 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-white">{reply.author.username}</div>
                            <div className="mt-1 text-[11px] text-gray-500">
                              {new Date(reply.createdAt).toLocaleString()}
                              {reply.editedAt && ` • ${t('edited')}`}
                            </div>
                          </div>
                          <PostActions
                            postId={reply.id}
                            canDelete={reply.canDelete}
                            canModerate={false}
                            isPinned={false}
                            isLocked={false}
                          />
                        </div>
                        <div
                          className="prose prose-invert mt-2 max-w-none text-sm leading-7 text-gray-300 prose-a:text-cyber-blue prose-blockquote:border-cyber-orange/35 prose-code:text-cyber-orange prose-img:rounded-lg prose-img:border prose-img:border-cyber-blue/20 prose-img:shadow-[0_0_20px_rgba(0,240,255,0.08)] prose-pre:bg-white/5"
                          dangerouslySetInnerHTML={{ __html: reply.body }}
                        />
                      </div>
                    ))}
                    {post.replies.length === 0 && (
                      <div className="rounded-lg border border-gray-800 bg-cyber-dark/25 p-3 text-sm text-gray-500">
                        {t('noRepliesForPost')}
                      </div>
                    )}
                  </div>

                  {!thread.isLocked && !forumBan && !post.isLocked && (
                    <ReplyForm postId={post.id} disabled={!canPost} />
                  )}
                  {post.isLocked && (
                    <div className="mt-3 text-xs text-cyber-red">{t('postLocked')}</div>
                  )}
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
              <ForumRichEditor
                value={body}
                onChange={setBody}
                placeholder={t('postPlaceholder')}
                disabled={!canPost}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-gray-500">{t('postRules')}</div>
                <button
                  type="submit"
                  disabled={!canPost}
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
