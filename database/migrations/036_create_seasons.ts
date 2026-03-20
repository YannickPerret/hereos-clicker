import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('seasons', (table) => {
      table.increments('id')
      table.string('key').notNullable().unique()
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.string('theme').notNullable().defaultTo('core')
      table.string('campaign_title').nullable()
      table.text('story_intro').nullable()
      table.text('story_outro').nullable()
      table.string('banner_image').nullable()
      table.string('primary_color').nullable()
      table.string('secondary_color').nullable()
      table.string('status').notNullable().defaultTo('draft')
      table.integer('sort_order').notNullable().defaultTo(0)
      table.boolean('is_ranked_pvp_enabled').notNullable().defaultTo(true)
      table.boolean('is_world_boss_enabled').notNullable().defaultTo(false)
      table.boolean('is_player_market_enabled').notNullable().defaultTo(false)
      table.boolean('is_black_market_bonus_enabled').notNullable().defaultTo(false)
      table.timestamp('starts_at').nullable()
      table.timestamp('ends_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('seasons')
  }
}
