import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'enemy_loot_tables'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('enemy_id').unsigned().references('id').inTable('enemies').onDelete('CASCADE')
      table.integer('item_id').unsigned().references('id').inTable('items').onDelete('CASCADE')
      table.float('drop_chance').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
