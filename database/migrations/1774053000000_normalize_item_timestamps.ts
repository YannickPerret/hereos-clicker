import { BaseSchema } from '@adonisjs/lucid/schema'

function normalizeTimestamp(value: unknown) {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()

  if (typeof value === 'number') {
    const v = value > 9_999_999_999 ? value : value * 1000
    return new Date(v).toISOString()
  }

  const s = String(value).trim()
  if (!s) return null

  if (/^\d+$/.test(s)) {
    const n = Number(s)
    return new Date(n > 9_999_999_999 ? n : n * 1000).toISOString()
  }

  return s
}

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const tables = ['items', 'enemies', 'shop_listings', 'talents', 'companions', 'combat_skills']

      for (const table of tables) {
        if (!(await db.schema.hasTable(table))) continue

        const cols = await db.rawQuery(`PRAGMA table_info('${table}')`)
        const colNames = cols.map((c: any) => c.name)
        const tsColumns = ['created_at', 'updated_at'].filter((c) => colNames.includes(c))

        if (tsColumns.length === 0) continue

        const rows = await db.from(table).select('id', ...tsColumns)

        for (const row of rows) {
          const updates: Record<string, string | null> = {}
          for (const col of tsColumns) {
            const normalized = normalizeTimestamp(row[col])
            if (normalized !== row[col]) {
              updates[col] = normalized
            }
          }
          if (Object.keys(updates).length > 0) {
            await db.from(table).where('id', row.id).update(updates)
          }
        }
      }
    })
  }

  async down() {}
}
