import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasQuestType = await db.schema.hasColumn('quests', 'quest_type')
      const hasSeasonId = await db.schema.hasColumn('quests', 'season_id')
      const hasParentQuestId = await db.schema.hasColumn('quests', 'parent_quest_id')

      await db.schema.alterTable('quests', (table) => {
        if (!hasQuestType) {
          table.string('quest_type').notNullable().defaultTo('main')
        }
        if (!hasSeasonId) {
          table.integer('season_id').unsigned().nullable()
        }
        if (!hasParentQuestId) {
          table.integer('parent_quest_id').unsigned().nullable()
        }
      })

      await db.from('quests').whereNull('quest_type').update({ quest_type: 'main' })

      const quests = await db.from('quests').select('id', 'key', 'required_quest_key', 'parent_quest_id')
      const questByKey = new Map(quests.map((quest) => [String(quest.key), Number(quest.id)]))

      for (const quest of quests) {
        if (quest.parent_quest_id || !quest.required_quest_key) {
          continue
        }

        const parentQuestId = questByKey.get(String(quest.required_quest_key))
        if (!parentQuestId) {
          continue
        }

        await db.from('quests').where('id', quest.id).update({ parent_quest_id: parentQuestId })
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasQuestType = await db.schema.hasColumn('quests', 'quest_type')
      const hasSeasonId = await db.schema.hasColumn('quests', 'season_id')
      const hasParentQuestId = await db.schema.hasColumn('quests', 'parent_quest_id')

      await db.schema.alterTable('quests', (table) => {
        if (hasParentQuestId) {
          table.dropColumn('parent_quest_id')
        }
        if (hasSeasonId) {
          table.dropColumn('season_id')
        }
        if (hasQuestType) {
          table.dropColumn('quest_type')
        }
      })
    })
  }
}
