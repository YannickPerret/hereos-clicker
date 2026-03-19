import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('companions', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('description').notNullable()
      table.string('rarity').notNullable() // common, uncommon, rare, epic, legendary
      table.string('bonus_type').notNullable() // cpc_flat, cps_flat, atk_flat, def_flat, crit_chance, hp_flat, loot_bonus
      table.float('bonus_value').notNullable()
      table.string('icon').notNullable()
      table.integer('base_price').defaultTo(0)
    })

    this.schema.createTable('character_companions', (table) => {
      table.increments('id')
      table.integer('character_id').unsigned().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('companion_id').unsigned().references('id').inTable('companions').onDelete('CASCADE')
      table.boolean('is_active').defaultTo(false)
      table.integer('level').defaultTo(1)
      table.integer('xp').defaultTo(0)
      table.timestamp('acquired_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('character_companions')
    this.schema.dropTable('companions')
  }
}
