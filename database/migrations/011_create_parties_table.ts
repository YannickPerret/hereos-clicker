import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('parties', (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.string('code', 8).notNullable().unique() // join code
      table.integer('leader_id').unsigned().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('max_size').defaultTo(4)
      table.string('status').defaultTo('waiting') // waiting, in_dungeon, disbanded
      table.timestamp('created_at').notNullable()
    })

    this.schema.createTable('party_members', (table) => {
      table.increments('id').notNullable()
      table.integer('party_id').unsigned().references('id').inTable('parties').onDelete('CASCADE')
      table.integer('character_id').unsigned().references('id').inTable('characters').onDelete('CASCADE')
      table.boolean('is_ready').defaultTo(false)
      table.timestamp('joined_at').notNullable()
      table.unique(['party_id', 'character_id'])
    })

    // Add min/max players to dungeon floors
    this.schema.alterTable('dungeon_floors', (table) => {
      table.integer('min_players').defaultTo(1)
      table.integer('max_players').defaultTo(4)
    })

    // Link dungeon runs to parties
    this.schema.alterTable('dungeon_runs', (table) => {
      table.integer('party_id').unsigned().nullable()
    })
  }

  async down() {
    this.schema.alterTable('dungeon_runs', (table) => {
      table.dropColumn('party_id')
    })
    this.schema.alterTable('dungeon_floors', (table) => {
      table.dropColumn('min_players')
      table.dropColumn('max_players')
    })
    this.schema.dropTable('party_members')
    this.schema.dropTable('parties')
  }
}
