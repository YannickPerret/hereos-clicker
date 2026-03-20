import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasCharacterId = await db.schema.hasColumn('chat_messages', 'character_id')

      if (!hasCharacterId) {
        await db.schema.alterTable('chat_messages', (table) => {
          table.integer('character_id').unsigned().nullable().references('id').inTable('characters').onDelete('SET NULL')
        })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasCharacterId = await db.schema.hasColumn('chat_messages', 'character_id')

      if (hasCharacterId) {
        await db.schema.alterTable('chat_messages', (table) => {
          table.dropColumn('character_id')
        })
      }
    })
  }
}
