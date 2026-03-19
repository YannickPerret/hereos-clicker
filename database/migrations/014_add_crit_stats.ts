import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('characters', (table) => {
      table.float('crit_chance').defaultTo(5) // % chance de crit (base 5%)
      table.float('crit_damage').defaultTo(150) // % de degats en crit (base 150% = x1.5)
    })

    this.schema.alterTable('enemies', (table) => {
      table.float('crit_chance').defaultTo(5)
      table.float('crit_damage').defaultTo(150)
    })
  }

  async down() {
    this.schema.alterTable('characters', (table) => {
      table.dropColumn('crit_chance')
      table.dropColumn('crit_damage')
    })
    this.schema.alterTable('enemies', (table) => {
      table.dropColumn('crit_chance')
      table.dropColumn('crit_damage')
    })
  }
}
