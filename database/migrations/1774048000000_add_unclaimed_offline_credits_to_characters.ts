import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'characters'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('unclaimed_offline_credits').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('unclaimed_offline_credits')
    })
  }
}
