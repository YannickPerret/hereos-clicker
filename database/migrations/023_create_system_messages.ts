import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('system_messages', (table) => {
      table.increments('id')
      table.string('message', 500).notNullable()
      table.integer('interval_minutes').notNullable().defaultTo(10)
      table.boolean('is_active').defaultTo(true)
      table.string('channel').defaultTo('global')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('system_messages')
  }
}
