import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const characters = await db
        .from('characters')
        .select('id', 'level', 'credits_per_click')

      for (const character of characters) {
        const level = Math.max(1, Number(character.level) || 1)
        const currentCpc = Math.max(1, Number(character.credits_per_click) || 1)

        const baselineCpc = 1 + Math.floor(level / 3)
        const rawExtra = Math.max(0, currentCpc - baselineCpc)
        const safeExtra = Math.min(rawExtra, level * 4)
        const overflowExtra = Math.max(0, rawExtra - safeExtra)
        const compressedOverflow = Math.floor(Math.sqrt(overflowExtra) * 2)
        const rebalancedCpc = Math.max(
          baselineCpc,
          baselineCpc + safeExtra + compressedOverflow
        )

        if (rebalancedCpc < currentCpc) {
          await db
            .from('characters')
            .where('id', character.id)
            .update({ credits_per_click: rebalancedCpc })
        }
      }
    })
  }

  async down() {
    // Irreversible one-shot balance correction for live characters.
  }
}
