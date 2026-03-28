import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  protected tableName = 'forum_posts'

  async up() {
    const schema = (db as any).schema
    const hasTable = await schema.hasTable(this.tableName)
    if (!hasTable) {
      return
    }

    const hasParentPostId = await schema.hasColumn(this.tableName, 'parent_post_id')
    if (!hasParentPostId) {
      await schema.alterTable(this.tableName, (table: any) => {
        table.integer('parent_post_id').unsigned().nullable().references('id').inTable('forum_posts').onDelete('CASCADE')
      })
    }

    const threads = await db
      .from('forum_threads')
      .leftJoin('forum_posts', 'forum_threads.id', 'forum_posts.forum_thread_id')
      .groupBy('forum_threads.id')
      .select('forum_threads.id', 'forum_threads.user_id', 'forum_threads.body', 'forum_threads.created_at', 'forum_threads.updated_at')
      .count('forum_posts.id as post_count')

    for (const thread of threads) {
      const postCount = Number((thread as any).post_count || 0)
      if (postCount > 0) {
        continue
      }

      const body = String((thread as any).body || '').trim()
      if (!body) {
        continue
      }

      await db.table('forum_posts').insert({
        forum_thread_id: thread.id,
        user_id: thread.user_id,
        parent_post_id: null,
        body,
        edited_at: null,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
      })
    }
  }

  async down() {
    const schema = (db as any).schema
    const hasTable = await schema.hasTable(this.tableName)
    if (!hasTable) {
      return
    }

    const hasParentPostId = await schema.hasColumn(this.tableName, 'parent_post_id')
    if (hasParentPostId) {
      await schema.alterTable(this.tableName, (table: any) => {
        table.dropColumn('parent_post_id')
      })
    }
  }
}
