import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shop_listings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('item_id').unsigned().references('id').inTable('items').onDelete('CASCADE')
      table.integer('price_override').nullable()
      table.integer('stock').nullable()
      table.boolean('is_active').defaultTo(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
