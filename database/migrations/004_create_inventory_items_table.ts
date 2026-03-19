import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('character_id').unsigned().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('item_id').unsigned().references('id').inTable('items').onDelete('CASCADE')
      table.integer('quantity').defaultTo(1)
      table.boolean('is_equipped').defaultTo(false)
      table.timestamp('acquired_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
