import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'chat_blocked_terms'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('term', 255).notNullable()
      table.string('language', 8).notNullable().defaultTo('all')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
      table.unique(['term', 'language'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
