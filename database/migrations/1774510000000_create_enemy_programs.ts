import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected enemyProgramsTableName = 'enemy_programs'
  protected enemyAssignmentsTableName = 'enemy_program_assignments'
  protected dungeonRunsTableName = 'dungeon_runs'

  async up() {
    this.defer(async (db) => {
      const hasEnemyProgramsTable = await db.schema.hasTable(this.enemyProgramsTableName)

      if (!hasEnemyProgramsTable) {
        await db.schema.createTable(this.enemyProgramsTableName, (table) => {
          table.increments('id').notNullable()
          table.string('name').notNullable()
          table.text('description').notNullable().defaultTo('')
          table.string('name_en').nullable()
          table.text('description_en').nullable()
          table.string('effect_type').notNullable()
          table.integer('effect_value').notNullable().defaultTo(0)
          table.integer('duration').notNullable().defaultTo(1)
          table.integer('cooldown').notNullable().defaultTo(0)
          table.integer('chance_percent').notNullable().defaultTo(100)
          table.integer('windup_turns').notNullable().defaultTo(0)
          table.string('icon').notNullable().defaultTo('skull')
          table.boolean('is_active').notNullable().defaultTo(true)
          table.integer('sort_order').notNullable().defaultTo(1)
          table.index(['is_active', 'sort_order'])
        })
      }

      const hasEnemyAssignmentsTable = await db.schema.hasTable(this.enemyAssignmentsTableName)

      if (!hasEnemyAssignmentsTable) {
        await db.schema.createTable(this.enemyAssignmentsTableName, (table) => {
          table.increments('id').notNullable()
          table
            .integer('enemy_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('enemies')
            .onDelete('CASCADE')
          table
            .integer('enemy_program_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable(this.enemyProgramsTableName)
            .onDelete('CASCADE')
          table.integer('sort_order').notNullable().defaultTo(1)
          table.unique(['enemy_id', 'enemy_program_id'])
          table.index(['enemy_id', 'sort_order'])
        })
      }

      const hasEnemyStateColumn = await db.schema.hasColumn(this.dungeonRunsTableName, 'enemy_state')

      if (!hasEnemyStateColumn) {
        await db.schema.alterTable(this.dungeonRunsTableName, (table) => {
          table.text('enemy_state').nullable()
        })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasEnemyStateColumn = await db.schema.hasColumn(this.dungeonRunsTableName, 'enemy_state')

      if (hasEnemyStateColumn) {
        await db.schema.alterTable(this.dungeonRunsTableName, (table) => {
          table.dropColumn('enemy_state')
        })
      }

      const hasEnemyAssignmentsTable = await db.schema.hasTable(this.enemyAssignmentsTableName)

      if (hasEnemyAssignmentsTable) {
        await db.schema.dropTable(this.enemyAssignmentsTableName)
      }

      const hasEnemyProgramsTable = await db.schema.hasTable(this.enemyProgramsTableName)

      if (hasEnemyProgramsTable) {
        await db.schema.dropTable(this.enemyProgramsTableName)
      }
    })
  }
}
