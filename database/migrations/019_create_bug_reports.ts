import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('bug_reports', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('character_name').notNullable()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.string('category').defaultTo('bug') // bug, exploit, suggestion, other
      table.string('status').defaultTo('open') // open, in_progress, resolved, closed
      table.text('admin_note').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('bug_reports')
  }
}
