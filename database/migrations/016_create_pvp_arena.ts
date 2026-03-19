import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('characters', (table) => {
      table.integer('pvp_rating').defaultTo(1000)
      table.integer('pvp_wins').defaultTo(0)
      table.integer('pvp_losses').defaultTo(0)
    })

    this.schema.createTable('pvp_matches', (table) => {
      table.increments('id')
      table.integer('challenger_id').unsigned().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('defender_id').unsigned().references('id').inTable('characters').onDelete('CASCADE').nullable()
      table.integer('winner_id').unsigned().references('id').inTable('characters').nullable()
      table.string('status').defaultTo('waiting') // waiting, in_progress, completed, cancelled
      table.integer('current_turn_id').unsigned().nullable() // character_id whose turn it is
      table.integer('challenger_hp').defaultTo(0)
      table.integer('challenger_hp_max').defaultTo(0)
      table.integer('defender_hp').defaultTo(0)
      table.integer('defender_hp_max').defaultTo(0)
      table.text('log').defaultTo('[]') // JSON combat log
      table.integer('rating_change').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('pvp_matches')
    this.schema.alterTable('characters', (table) => {
      table.dropColumn('pvp_rating')
      table.dropColumn('pvp_wins')
      table.dropColumn('pvp_losses')
    })
  }
}
