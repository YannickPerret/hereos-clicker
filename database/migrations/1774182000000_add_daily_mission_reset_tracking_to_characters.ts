import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'characters'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('daily_mission_resets_used').notNullable().defaultTo(0)
      table.timestamp('daily_mission_last_reset_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('daily_mission_resets_used')
      table.dropColumn('daily_mission_last_reset_at')
    })
  }
}
