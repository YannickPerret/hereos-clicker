import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dungeon_runs'

  async up() {
    this.defer(async (db) => {
      const hasTable = await db.schema.hasTable(this.tableName)
      if (!hasTable) {
        return
      }

      const hasPendingRewards = await db.schema.hasColumn(this.tableName, 'pending_rewards')
      if (!hasPendingRewards) {
        await db.schema.alterTable(this.tableName, (table) => {
          table.text('pending_rewards').notNullable().defaultTo('{}')
        })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasTable = await db.schema.hasTable(this.tableName)
      if (!hasTable) {
        return
      }

      const hasPendingRewards = await db.schema.hasColumn(this.tableName, 'pending_rewards')
      if (hasPendingRewards) {
        await db.schema.alterTable(this.tableName, (table) => {
          table.dropColumn('pending_rewards')
        })
      }
    })
  }
}
