import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('party_invites', (table) => {
      table.increments('id').notNullable()
      table.integer('party_id').unsigned().notNullable().references('id').inTable('parties').onDelete('CASCADE')
      table.integer('invited_by_character_id').unsigned().notNullable().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('invited_character_id').unsigned().notNullable().references('id').inTable('characters').onDelete('CASCADE')
      table.string('status').notNullable().defaultTo('pending') // pending, accepted, declined, expired
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['party_id', 'invited_character_id', 'status'])
    })
  }

  async down() {
    this.schema.dropTable('party_invites')
  }
}
