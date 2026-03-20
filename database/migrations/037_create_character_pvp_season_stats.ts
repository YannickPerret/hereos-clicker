import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('character_pvp_season_stats', (table) => {
      table.increments('id')
      table
        .integer('character_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('characters')
        .onDelete('CASCADE')
      table
        .integer('season_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('seasons')
        .onDelete('CASCADE')
      table.integer('starting_rating').notNullable().defaultTo(1000)
      table.integer('rating').notNullable().defaultTo(1000)
      table.integer('peak_rating').notNullable().defaultTo(1000)
      table.integer('wins').notNullable().defaultTo(0)
      table.integer('losses').notNullable().defaultTo(0)
      table.integer('games_played').notNullable().defaultTo(0)
      table.integer('final_rank').nullable()
      table.integer('reward_credits').notNullable().defaultTo(0)
      table.string('reward_tier').nullable()
      table.boolean('reward_claimed').notNullable().defaultTo(false)
      table.timestamp('finalized_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.unique(['character_id', 'season_id'])
    })
  }

  async down() {
    this.schema.dropTable('character_pvp_season_stats')
  }
}
