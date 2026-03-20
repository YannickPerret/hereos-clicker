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
      if (!(await db.schema.hasTable('daily_reward_configs'))) {
        return
      }

      const configs = await db
        .from('daily_reward_configs')
        .select('id', 'created_at', 'updated_at')

      for (const config of configs) {
        await db.from('daily_reward_configs').where('id', config.id).update({
          created_at: normalizeTimestamp(config.created_at),
          updated_at: normalizeTimestamp(config.updated_at),
        })
      }
    })
  }

  async down() {
    // Irreversible normalization.
  }
}
