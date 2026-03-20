import { BaseSchema } from '@adonisjs/lucid/schema'

function normalizeTimestamp(value: unknown) {
  if (value === null || value === undefined) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'number') {
    const numericValue = value > 9_999_999_999 ? value : value * 1000
    return new Date(numericValue).toISOString()
  }

  const stringValue = String(value).trim()
  if (!stringValue) {
    return null
  }

  if (/^\d+$/.test(stringValue)) {
    const numericValue = Number(stringValue)
    return new Date(numericValue > 9_999_999_999 ? numericValue : numericValue * 1000).toISOString()
  }

  return stringValue
}

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      if (await db.schema.hasTable('quests')) {
        const quests = await db.from('quests').select('id', 'created_at', 'updated_at')

        for (const quest of quests) {
          await db.from('quests').where('id', quest.id).update({
            created_at: normalizeTimestamp(quest.created_at),
            updated_at: normalizeTimestamp(quest.updated_at),
          })
        }
      }

      if (await db.schema.hasTable('character_quests')) {
        const characterQuests = await db
          .from('character_quests')
          .select('id', 'started_at', 'completed_at', 'created_at', 'updated_at')

        for (const entry of characterQuests) {
          await db.from('character_quests').where('id', entry.id).update({
            started_at: normalizeTimestamp(entry.started_at),
            completed_at: normalizeTimestamp(entry.completed_at),
            created_at: normalizeTimestamp(entry.created_at),
            updated_at: normalizeTimestamp(entry.updated_at),
          })
        }
      }
    })
  }

  async down() {
    // Irreversible normalization.
  }
}
