import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dungeon_runs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('afk_penalties').notNullable().defaultTo('{}')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('afk_penalties')
    })
  }
}
