import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'characters'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('current_map_id').nullable().unsigned()
      table.integer('pos_x').defaultTo(0)
      table.integer('pos_y').defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('current_map_id')
      table.dropColumn('pos_x')
      table.dropColumn('pos_y')
    })
  }
}
