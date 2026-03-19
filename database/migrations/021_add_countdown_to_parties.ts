import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('parties', (table) => {
      table.bigInteger('countdown_start').nullable() // timestamp ms when countdown started
      table.integer('dungeon_run_id').unsigned().nullable()
      table.integer('dungeon_floor_id').unsigned().nullable()
    })
  }

  async down() {
    this.schema.alterTable('parties', (table) => {
      table.dropColumn('countdown_start')
      table.dropColumn('dungeon_run_id')
      table.dropColumn('dungeon_floor_id')
    })
  }
}
