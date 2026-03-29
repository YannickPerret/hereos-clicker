import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'seasons'

  async up() {
    this.defer(async (db) => {
      const hasBossRushFlag = await db.schema.hasColumn(this.tableName, 'is_boss_rush_enabled')
      if (!hasBossRushFlag) {
        await db.schema.alterTable(this.tableName, (table) => {
          table.boolean('is_boss_rush_enabled').notNullable().defaultTo(false)
        })
      }

      const hasBossRushRuns = await db.schema.hasTable('boss_rush_runs')
      if (!hasBossRushRuns) {
        await db.schema.createTable('boss_rush_runs', (table) => {
          table.increments('id')
          table.integer('character_id').unsigned().notNullable().references('id').inTable('characters').onDelete('CASCADE')
          table.integer('season_id').unsigned().nullable().references('id').inTable('seasons').onDelete('SET NULL')
          table.string('status').notNullable().defaultTo('in_progress')
          table.integer('current_floor').notNullable().defaultTo(1)
          table.integer('bosses_defeated').notNullable().defaultTo(0)
          table.integer('current_enemy_id').unsigned().nullable().references('id').inTable('enemies').onDelete('SET NULL')
          table.integer('current_enemy_hp').notNullable().defaultTo(0)
          table.text('combat_log').notNullable().defaultTo('[]')
          table.text('skill_cooldowns').notNullable().defaultTo('{}')
          table.text('active_effects').notNullable().defaultTo('[]')
          table.text('pending_rewards').notNullable().defaultTo('{}')
          table.timestamp('started_at').notNullable().defaultTo(this.now())
          table.timestamp('ended_at').nullable()
        })
      }

      const hasBossRushStats = await db.schema.hasTable('character_boss_rush_season_stats')
      if (!hasBossRushStats) {
        await db.schema.createTable('character_boss_rush_season_stats', (table) => {
          table.increments('id')
          table.integer('character_id').unsigned().notNullable().references('id').inTable('characters').onDelete('CASCADE')
          table.integer('season_id').unsigned().notNullable().references('id').inTable('seasons').onDelete('CASCADE')
          table.integer('best_floor').notNullable().defaultTo(0)
          table.integer('runs_played').notNullable().defaultTo(0)
          table.integer('total_bosses_killed').notNullable().defaultTo(0)
          table.integer('final_rank').nullable()
          table.integer('reward_credits').notNullable().defaultTo(0)
          table.string('reward_tier').nullable()
          table.boolean('reward_claimed').notNullable().defaultTo(false)
          table.timestamp('finalized_at').nullable()
          table.timestamp('created_at').notNullable().defaultTo(this.now())
          table.timestamp('updated_at').notNullable().defaultTo(this.now())
          table.unique(['character_id', 'season_id'])
        })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      if (await db.schema.hasTable('character_boss_rush_season_stats')) {
        await db.schema.dropTable('character_boss_rush_season_stats')
      }

      if (await db.schema.hasTable('boss_rush_runs')) {
        await db.schema.dropTable('boss_rush_runs')
      }

      if (await db.schema.hasColumn(this.tableName, 'is_boss_rush_enabled')) {
        await db.schema.alterTable(this.tableName, (table) => {
          table.dropColumn('is_boss_rush_enabled')
        })
      }
    })
  }
}
