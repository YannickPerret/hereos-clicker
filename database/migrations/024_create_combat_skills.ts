import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('combat_skills', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('description', 500).notNullable()
      table.string('spec').notNullable() // hacker, netrunner, samurai, chrome_dealer
      table.integer('tier_required').notNullable() // talent tier needed to unlock
      table.string('effect_type').notNullable() // damage, debuff_def, stun, heal, dot, buff_atk, double_hit, etc.
      table.integer('effect_value').notNullable().defaultTo(0)
      table.integer('duration').defaultTo(0) // turns the effect lasts
      table.integer('cooldown').notNullable().defaultTo(3) // turns before reuse
      table.string('icon').notNullable()
      table.timestamp('created_at').notNullable()
    })

    // Add skill_cooldowns JSON field to dungeon_runs
    this.schema.alterTable('dungeon_runs', (table) => {
      table.text('skill_cooldowns').nullable() // JSON: { [characterId]: { [skillId]: turnsLeft } }
      table.text('active_effects').nullable() // JSON: [{ type, value, turnsLeft, sourceCharId, targetType }]
    })
  }

  async down() {
    this.schema.dropTable('combat_skills')
    this.schema.alterTable('dungeon_runs', (table) => {
      table.dropColumn('skill_cooldowns')
      table.dropColumn('active_effects')
    })
  }
}
