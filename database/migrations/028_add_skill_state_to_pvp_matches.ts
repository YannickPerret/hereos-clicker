import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasSkillCooldowns = await db.schema.hasColumn('pvp_matches', 'skill_cooldowns')
      const hasActiveEffects = await db.schema.hasColumn('pvp_matches', 'active_effects')

      if (!hasSkillCooldowns || !hasActiveEffects) {
        await db.schema.alterTable('pvp_matches', (table) => {
          if (!hasSkillCooldowns) {
            table.text('skill_cooldowns').notNullable().defaultTo('{}')
          }

          if (!hasActiveEffects) {
            table.text('active_effects').notNullable().defaultTo('[]')
          }
        })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasSkillCooldowns = await db.schema.hasColumn('pvp_matches', 'skill_cooldowns')
      const hasActiveEffects = await db.schema.hasColumn('pvp_matches', 'active_effects')

      if (hasSkillCooldowns || hasActiveEffects) {
        await db.schema.alterTable('pvp_matches', (table) => {
          if (hasSkillCooldowns) {
            table.dropColumn('skill_cooldowns')
          }

          if (hasActiveEffects) {
            table.dropColumn('active_effects')
          }
        })
      }
    })
  }
}
