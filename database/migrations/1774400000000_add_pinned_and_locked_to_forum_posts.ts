import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'forum_posts'

  async up() {
    this.defer(async (db) => {
      const hasTable = await db.schema.hasTable(this.tableName)
      if (!hasTable) {
        return
      }

      const hasPinned = await db.schema.hasColumn(this.tableName, 'is_pinned')
      const hasLocked = await db.schema.hasColumn(this.tableName, 'is_locked')

      if (!hasPinned || !hasLocked) {
        await db.schema.alterTable(this.tableName, (table) => {
          if (!hasPinned) {
            table.boolean('is_pinned').notNullable().defaultTo(false)
          }
          if (!hasLocked) {
            table.boolean('is_locked').notNullable().defaultTo(false)
          }
        })
      }

      const pinnedThreads = await db
        .from('forum_threads')
        .where('is_pinned', true)
        .select('id')

      for (const thread of pinnedThreads) {
        const firstPost = await db
          .from('forum_posts')
          .where('forum_thread_id', thread.id)
          .whereNull('parent_post_id')
          .orderBy('created_at', 'asc')
          .first()

        if (!firstPost) {
          continue
        }

        await db.from('forum_posts').where('id', firstPost.id).update({
          is_pinned: true,
        })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasTable = await db.schema.hasTable(this.tableName)
      if (!hasTable) {
        return
      }

      const hasPinned = await db.schema.hasColumn(this.tableName, 'is_pinned')
      const hasLocked = await db.schema.hasColumn(this.tableName, 'is_locked')

      if (hasPinned || hasLocked) {
        await db.schema.alterTable(this.tableName, (table) => {
          if (hasPinned) {
            table.dropColumn('is_pinned')
          }
          if (hasLocked) {
            table.dropColumn('is_locked')
          }
        })
      }
    })
  }
}
