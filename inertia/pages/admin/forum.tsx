import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface CategoryRecord {
  id: number
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

interface ThreadRecord {
  id: number
  forumCategoryId: number
  categoryId: number
  categoryName: string
  title: string
  isPinned: boolean
  isLocked: boolean
  replyCount: number
  lastPostedAt: string
  authorName: string
}

interface PostRecord {
  id: number
  forumThreadId: number
  parentPostId: number | null
  threadTitle: string
  categoryName: string
  body: string
  authorName: string
  authorUserId: number
  createdAt: string
}

interface BanRecord {
  id: number
  username: string
  reason: string | null
  expiresAt: string | null
  bannedByUsername: string
  createdAt: string
}

interface Props {
  categories: CategoryRecord[]
  threads: ThreadRecord[]
  recentPosts: PostRecord[]
  bans: BanRecord[]
}

export default function ForumAdminPage({ categories, threads, recentPosts, bans }: Props) {
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: 1,
  })
  const [newThread, setNewThread] = useState({
    forumCategoryId: categories[0]?.id || 0,
    title: '',
    starterBody: '',
    isPinned: false,
    isLocked: false,
  })
  const [banForm, setBanForm] = useState({
    username: '',
    reason: '',
    expiresInDays: '',
  })
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null)
  const [editingThreadId, setEditingThreadId] = useState<number | null>(null)
  const [editingThread, setEditingThread] = useState<ThreadRecord | null>(null)
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [editingPostBody, setEditingPostBody] = useState('')

  return (
    <GameLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-cyber-orange">FORUM ADMIN</h1>
            <p className="mt-1 text-sm text-gray-500">
              Categories larges, threads admin, posts joueurs et moderation.
            </p>
          </div>
          <a href="/admin" className="text-[10px] uppercase text-gray-500 hover:text-cyber-orange">
            &larr; RETOUR ADMIN
          </a>
        </div>

        {props.errors?.message && (
          <div className="mb-4 rounded-lg border border-cyber-red/40 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">
            {props.errors.message}
          </div>
        )}
        {props.success && (
          <div className="mb-4 rounded-lg border border-cyber-green/40 bg-cyber-green/10 px-4 py-3 text-sm text-cyber-green">
            {props.success}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-cyber-orange/20 bg-cyber-dark/40 p-5">
            <h2 className="mb-4 text-sm font-bold tracking-widest text-cyber-orange">CATEGORIES</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                router.post('/admin/forum/categories/create', newCategory)
              }}
              className="mb-5 grid gap-3"
            >
              <input
                value={newCategory.name}
                onChange={(event) => setNewCategory((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nom"
                className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <input
                value={newCategory.slug}
                onChange={(event) => setNewCategory((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="slug-optionnel"
                className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <textarea
                rows={3}
                value={newCategory.description}
                onChange={(event) => setNewCategory((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Description"
                className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <input
                type="number"
                min={1}
                value={newCategory.sortOrder}
                onChange={(event) => setNewCategory((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))}
                className="w-32 rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded border border-cyber-orange/35 px-4 py-2 text-xs uppercase text-cyber-orange hover:bg-cyber-orange/10"
              >
                Creer categorie
              </button>
            </form>

            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="rounded-xl border border-gray-800 bg-cyber-black/35 p-4">
                  {editingCategoryId === category.id && editingCategory ? (
                    <div className="space-y-3">
                      <input
                        value={editingCategory.name}
                        onChange={(event) => setEditingCategory({ ...editingCategory, name: event.target.value })}
                        className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <input
                        value={editingCategory.slug}
                        onChange={(event) => setEditingCategory({ ...editingCategory, slug: event.target.value })}
                        className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <textarea
                        rows={3}
                        value={editingCategory.description || ''}
                        onChange={(event) => setEditingCategory({ ...editingCategory, description: event.target.value })}
                        className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          value={editingCategory.sortOrder}
                          onChange={(event) => setEditingCategory({ ...editingCategory, sortOrder: Number(event.target.value) })}
                          className="w-28 rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                        />
                        <label className="flex items-center gap-2 text-xs text-gray-400">
                          <input
                            type="checkbox"
                            checked={editingCategory.isActive}
                            onChange={(event) => setEditingCategory({ ...editingCategory, isActive: event.target.checked })}
                          />
                          Active
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.post(`/admin/forum/categories/${category.id}/update`, {
                              ...editingCategory,
                              isActive: editingCategory.isActive ? 'true' : 'false',
                            })
                          }
                          className="rounded border border-cyber-green/35 px-3 py-2 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
                        >
                          Sauver
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(null)
                            setEditingCategory(null)
                          }}
                          className="px-3 py-2 text-[10px] uppercase text-gray-500 hover:text-white"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white">{category.name}</div>
                        <div className="mt-1 text-xs text-gray-500">{category.description || '-'}</div>
                        <div className="mt-2 text-[10px] uppercase text-gray-600">
                          slug: {category.slug} • ordre: {category.sortOrder} • {category.isActive ? 'active' : 'inactive'}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(category.id)
                            setEditingCategory({ ...category })
                          }}
                          className="rounded border border-cyber-blue/35 px-2 py-1 text-[10px] uppercase text-cyber-blue hover:bg-cyber-blue/10"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer la categorie "${category.name}" ?`)) {
                              router.post(`/admin/forum/categories/${category.id}/delete`)
                            }
                          }}
                          className="rounded border border-cyber-red/35 px-2 py-1 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
                        >
                          Suppr
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-cyber-blue/20 bg-cyber-dark/40 p-5">
            <h2 className="mb-4 text-sm font-bold tracking-widest text-cyber-blue">THREADS</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                router.post('/admin/forum/threads/create', {
                  ...newThread,
                  isPinned: newThread.isPinned ? 'true' : 'false',
                  isLocked: newThread.isLocked ? 'true' : 'false',
                })
              }}
              className="mb-5 grid gap-3"
            >
              <select
                value={newThread.forumCategoryId}
                onChange={(event) => setNewThread((prev) => ({ ...prev, forumCategoryId: Number(event.target.value) }))}
                className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                value={newThread.title}
                onChange={(event) => setNewThread((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Titre du thread"
                className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <textarea
                rows={5}
                value={newThread.starterBody}
                onChange={(event) => setNewThread((prev) => ({ ...prev, starterBody: event.target.value }))}
                placeholder="Premier post du thread"
                className="rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <div className="flex gap-4 text-xs text-gray-400">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newThread.isPinned}
                    onChange={(event) => setNewThread((prev) => ({ ...prev, isPinned: event.target.checked }))}
                  />
                  Pinned
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newThread.isLocked}
                    onChange={(event) => setNewThread((prev) => ({ ...prev, isLocked: event.target.checked }))}
                  />
                  Locked
                </label>
              </div>
              <button
                type="submit"
                className="rounded border border-cyber-blue/35 px-4 py-2 text-xs uppercase text-cyber-blue hover:bg-cyber-blue/10"
              >
                Creer thread
              </button>
            </form>

            <div className="space-y-3">
              {threads.map((thread) => (
                <div key={thread.id} className="rounded-xl border border-gray-800 bg-cyber-black/35 p-4">
                  {editingThreadId === thread.id && editingThread ? (
                    <div className="space-y-3">
                      <select
                        value={editingThread.forumCategoryId}
                        onChange={(event) => setEditingThread({ ...editingThread, forumCategoryId: Number(event.target.value) })}
                        className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editingThread.title}
                        onChange={(event) => setEditingThread({ ...editingThread, title: event.target.value })}
                        className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <div className="flex gap-4 text-xs text-gray-400">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingThread.isPinned}
                            onChange={(event) => setEditingThread({ ...editingThread, isPinned: event.target.checked })}
                          />
                          Pinned
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingThread.isLocked}
                            onChange={(event) => setEditingThread({ ...editingThread, isLocked: event.target.checked })}
                          />
                          Locked
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.post(`/admin/forum/threads/${thread.id}/update`, {
                              ...editingThread,
                              isPinned: editingThread.isPinned ? 'true' : 'false',
                              isLocked: editingThread.isLocked ? 'true' : 'false',
                            })
                          }
                          className="rounded border border-cyber-green/35 px-3 py-2 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
                        >
                          Sauver
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingThreadId(null)
                            setEditingThread(null)
                          }}
                          className="px-3 py-2 text-[10px] uppercase text-gray-500 hover:text-white"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase text-gray-500">{thread.categoryName}</span>
                          {thread.isPinned && <span className="rounded border border-cyber-yellow/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-yellow">Pinned</span>}
                          {thread.isLocked && <span className="rounded border border-cyber-red/30 px-1.5 py-0.5 text-[9px] uppercase text-cyber-red">Locked</span>}
                        </div>
                        <div className="mt-2 text-sm font-bold text-white">{thread.title}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {thread.authorName} • {thread.replyCount} posts • {new Date(thread.lastPostedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingThreadId(thread.id)
                            setEditingThread({ ...thread })
                          }}
                          className="rounded border border-cyber-blue/35 px-2 py-1 text-[10px] uppercase text-cyber-blue hover:bg-cyber-blue/10"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Supprimer le thread "${thread.title}" ?`)) {
                              router.post(`/admin/forum/threads/${thread.id}/delete`)
                            }
                          }}
                          className="rounded border border-cyber-red/35 px-2 py-1 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
                        >
                          Suppr
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-cyber-green/20 bg-cyber-dark/40 p-5">
            <h2 className="mb-4 text-sm font-bold tracking-widest text-cyber-green">POSTS RECENTS</h2>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="rounded-xl border border-gray-800 bg-cyber-black/35 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase text-gray-500">
                    <span>{post.categoryName}</span>
                    <span>•</span>
                    <span>{post.threadTitle}</span>
                    <span>•</span>
                    <span>{post.authorName}</span>
                    {post.parentPostId && (
                      <>
                        <span>•</span>
                        <span>reponse</span>
                      </>
                    )}
                  </div>
                  {editingPostId === post.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        value={editingPostBody}
                        onChange={(event) => setEditingPostBody(event.target.value)}
                        className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => router.post(`/admin/forum/posts/${post.id}/update`, { body: editingPostBody })}
                          className="rounded border border-cyber-green/35 px-3 py-2 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
                        >
                          Sauver
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPostId(null)
                            setEditingPostBody('')
                          }}
                          className="px-3 py-2 text-[10px] uppercase text-gray-500 hover:text-white"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="whitespace-pre-wrap text-sm text-gray-200">{post.body}</div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPostId(post.id)
                            setEditingPostBody(post.body)
                          }}
                          className="rounded border border-cyber-blue/35 px-2 py-1 text-[10px] uppercase text-cyber-blue hover:bg-cyber-blue/10"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Supprimer ce post ?')) {
                              router.post(`/admin/forum/posts/${post.id}/delete`)
                            }
                          }}
                          className="rounded border border-cyber-red/35 px-2 py-1 text-[10px] uppercase text-cyber-red hover:bg-cyber-red/10"
                        >
                          Suppr
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-cyber-red/20 bg-cyber-dark/40 p-5">
            <h2 className="mb-4 text-sm font-bold tracking-widest text-cyber-red">BANS FORUM</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                router.post('/admin/forum/bans/create', banForm)
              }}
              className="mb-5 space-y-3"
            >
              <input
                value={banForm.username}
                onChange={(event) => setBanForm((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="username"
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <textarea
                rows={3}
                value={banForm.reason}
                onChange={(event) => setBanForm((prev) => ({ ...prev, reason: event.target.value }))}
                placeholder="raison"
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <input
                type="number"
                min={1}
                value={banForm.expiresInDays}
                onChange={(event) => setBanForm((prev) => ({ ...prev, expiresInDays: event.target.value }))}
                placeholder="duree en jours (vide = permanent)"
                className="w-full rounded border border-gray-800 bg-cyber-black px-3 py-2 text-sm text-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded border border-cyber-red/35 px-4 py-2 text-xs uppercase text-cyber-red hover:bg-cyber-red/10"
              >
                Bannir du forum
              </button>
            </form>

            <div className="space-y-3">
              {bans.map((ban) => (
                <div key={ban.id} className="rounded-xl border border-gray-800 bg-cyber-black/35 p-4">
                  <div className="text-sm font-bold text-white">{ban.username}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {ban.reason || 'Aucune raison'} • par {ban.bannedByUsername}
                  </div>
                  <div className="mt-1 text-[10px] uppercase text-gray-600">
                    {ban.expiresAt ? `expire ${new Date(ban.expiresAt).toLocaleString()}` : 'permanent'}
                  </div>
                  <button
                    type="button"
                    onClick={() => router.post(`/admin/forum/bans/${ban.id}/delete`)}
                    className="mt-3 rounded border border-cyber-green/35 px-3 py-1 text-[10px] uppercase text-cyber-green hover:bg-cyber-green/10"
                  >
                    Debannir
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </GameLayout>
  )
}
