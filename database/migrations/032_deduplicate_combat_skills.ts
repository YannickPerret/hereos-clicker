import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const rows = await db
        .from('combat_skills')
        .select('id', 'name', 'spec')
        .orderBy('id', 'asc')

      const keepByKey = new Map<string, number>()
      const duplicateIds: number[] = []

      for (const row of rows) {
        const key = `${row.spec}:${row.name}`
        if (keepByKey.has(key)) {
          duplicateIds.push(row.id)
        } else {
          keepByKey.set(key, row.id)
        }
      }

      if (duplicateIds.length > 0) {
        await db.from('combat_skills').whereIn('id', duplicateIds).delete()
      }
    })
  }

  async down() {
    // Irreversible cleanup of duplicate combat skills.
  }
}
