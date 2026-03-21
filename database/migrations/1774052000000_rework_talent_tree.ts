import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add choice_group column to talents
    this.schema.alterTable('talents', (table) => {
      table.integer('choice_group').notNullable().defaultTo(1)
    })

    // Auto-respec all characters: refund talent points, clear unlocks, reset spec
    this.defer(async (db) => {
      const characterTalents = await db
        .from('character_talents')
        .join('talents', 'talents.id', 'character_talents.talent_id')
        .select('character_talents.character_id', 'talents.cost', 'character_talents.rank')

      // Sum refunds per character
      const refunds: Record<number, number> = {}
      for (const ct of characterTalents) {
        const charId = ct.character_id
        refunds[charId] = (refunds[charId] || 0) + ct.cost * ct.rank
      }

      // Apply refunds
      for (const [charId, points] of Object.entries(refunds)) {
        await db
          .from('characters')
          .where('id', Number(charId))
          .increment('talent_points', points)
        await db.from('characters').where('id', Number(charId)).update({ chosen_spec: null })
      }

      // Clear all character talents
      await db.from('character_talents').delete()
    })
  }

  async down() {
    this.schema.alterTable('talents', (table) => {
      table.dropColumn('choice_group')
    })
  }
}
