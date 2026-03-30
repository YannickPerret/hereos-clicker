import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'items'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('usable_in_combat').notNullable().defaultTo(false)
    })

    // Mark combat-usable consumables
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .where('type', 'consumable')
        .where('effect_type', 'hp_restore')
        .update({ usable_in_combat: true })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('usable_in_combat')
    })
  }
}
