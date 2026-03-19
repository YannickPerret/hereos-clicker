import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.text('description').notNullable()
      table.string('type').notNullable() // weapon, armor, implant, consumable, upgrade
      table.string('rarity').notNullable() // common, uncommon, rare, epic, legendary
      table.string('icon').notNullable()
      table.string('effect_type').nullable()
      table.integer('effect_value').nullable()
      table.integer('base_price').notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
