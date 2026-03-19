import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('dungeon_runs', (table) => {
      table.integer('current_turn_id').unsigned().nullable() // character id whose turn it is
      table.bigInteger('turn_deadline').nullable() // timestamp ms
      table.text('combat_log').defaultTo('[]') // JSON array of log entries
    })
  }

  async down() {
    this.schema.alterTable('dungeon_runs', (table) => {
      table.dropColumn('current_turn_id')
      table.dropColumn('turn_deadline')
      table.dropColumn('combat_log')
    })
  }
}
