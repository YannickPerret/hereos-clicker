import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('forum_categories', (table) => {
      table.increments('id')
      table.string('name', 120).notNullable()
      table.string('slug', 160).notNullable().unique()
      table.text('description').nullable()
      table.integer('sort_order').notNullable().defaultTo(1)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable('forum_threads', (table) => {
      table.increments('id')
      table.integer('forum_category_id').unsigned().notNullable().references('id').inTable('forum_categories').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('title', 180).notNullable()
      table.text('body').notNullable()
      table.boolean('is_pinned').notNullable().defaultTo(false)
      table.boolean('is_locked').notNullable().defaultTo(false)
      table.integer('reply_count').notNullable().defaultTo(0)
      table.timestamp('last_posted_at').notNullable().defaultTo(this.now())
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.index(['forum_category_id', 'is_pinned', 'last_posted_at'])
    })

    this.schema.createTable('forum_posts', (table) => {
      table.increments('id')
      table.integer('forum_thread_id').unsigned().notNullable().references('id').inTable('forum_threads').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.text('body').notNullable()
      table.timestamp('edited_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.index(['forum_thread_id', 'created_at'])
      table.index(['user_id', 'created_at'])
    })

    this.schema.createTable('forum_bans', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE').unique()
      table.integer('banned_by_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.text('reason').nullable()
      table.timestamp('expires_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable('forum_bans')
    this.schema.dropTable('forum_posts')
    this.schema.dropTable('forum_threads')
    this.schema.dropTable('forum_categories')
  }
}
