import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'friendships'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('requester_character_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('characters')
        .onDelete('CASCADE')
      table
        .integer('addressee_character_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('characters')
        .onDelete('CASCADE')
      table.string('status').notNullable().defaultTo('pending')
      table.timestamp('accepted_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['requester_character_id', 'addressee_character_id'])
      table.index(['requester_character_id', 'status'])
      table.index(['addressee_character_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
