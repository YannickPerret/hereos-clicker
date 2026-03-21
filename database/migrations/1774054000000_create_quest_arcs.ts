import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('quest_arcs', (table) => {
      table.increments('id').notNullable()
      table.string('key').notNullable().unique()
      table.string('title').notNullable()
      table
        .integer('parent_arc_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('quest_arcs')
        .onDelete('SET NULL')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('sort_order').notNullable().defaultTo(1)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    // Migrate existing arcs from quests table
    this.defer(async (db) => {
      const quests = await db.from('quests').select('arc_key', 'arc_title').groupBy('arc_key')
      const now = new Date().toISOString()

      for (let i = 0; i < quests.length; i++) {
        const q = quests[i]
        await db.table('quest_arcs').insert({
          key: q.arc_key,
          title: q.arc_title,
          parent_arc_id: null,
          is_active: true,
          sort_order: i + 1,
          created_at: now,
          updated_at: now,
        })
      }

      // Add quest_arc_id column to quests
      if (!(await db.schema.hasColumn('quests', 'quest_arc_id'))) {
        await db.schema.alterTable('quests', (table) => {
          table.integer('quest_arc_id').unsigned().nullable()
        })
      }

      // Link existing quests to their arcs
      const arcs = await db.from('quest_arcs').select('id', 'key')
      for (const arc of arcs) {
        await db.from('quests').where('arc_key', arc.key).update({ quest_arc_id: arc.id })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      if (await db.schema.hasColumn('quests', 'quest_arc_id')) {
        await db.schema.alterTable('quests', (table) => {
          table.dropColumn('quest_arc_id')
        })
      }
    })
    this.schema.dropTable('quest_arcs')
  }
}
