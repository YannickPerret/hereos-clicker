import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('chat_channels', (table) => {
      table.increments('id')
      table.string('name').notNullable().unique()
      table.string('label').notNullable()
      table.boolean('is_public').defaultTo(true)
      table.string('password').nullable() // for private channels
      table.integer('created_by').unsigned().references('id').inTable('users').nullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('chat_channels')
  }
}
