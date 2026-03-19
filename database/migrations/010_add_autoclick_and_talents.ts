import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('characters', (table) => {
      table.integer('credits_per_second').defaultTo(0)
      table.integer('talent_points').defaultTo(0)
      table.bigInteger('last_tick_at').defaultTo(Date.now())
    })

    this.schema.createTable('talents', (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.text('description').notNullable()
      table.string('spec').notNullable() // hacker, netrunner, samurai, chrome_dealer
      table.integer('tier').notNullable() // 1-5, determines position in tree
      table.string('icon').notNullable()
      table.string('effect_type').notNullable()
      table.float('effect_value').notNullable()
      table.integer('cost').defaultTo(1) // talent points to unlock
      table.integer('requires_talent_id').nullable() // prerequisite
      table.integer('requires_level').defaultTo(1)
    })

    this.schema.createTable('character_talents', (table) => {
      table.increments('id').notNullable()
      table.integer('character_id').unsigned().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('talent_id').unsigned().references('id').inTable('talents').onDelete('CASCADE')
      table.integer('rank').defaultTo(1) // current rank
      table.integer('max_rank').defaultTo(1) // max rank
      table.timestamp('unlocked_at').notNullable()
      table.unique(['character_id', 'talent_id'])
    })
  }

  async down() {
    this.schema.dropTable('character_talents')
    this.schema.dropTable('talents')
    this.schema.alterTable('characters', (table) => {
      table.dropColumn('credits_per_second')
      table.dropColumn('talent_points')
      table.dropColumn('last_tick_at')
    })
  }
}
