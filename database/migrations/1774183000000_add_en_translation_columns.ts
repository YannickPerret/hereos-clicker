import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('items', (table) => {
      table.string('name_en', 255).nullable()
      table.text('description_en').nullable()
    })

    this.schema.alterTable('enemies', (table) => {
      table.string('name_en', 255).nullable()
      table.text('description_en').nullable()
    })

    this.schema.alterTable('talents', (table) => {
      table.string('name_en', 255).nullable()
      table.text('description_en').nullable()
    })

    this.schema.alterTable('combat_skills', (table) => {
      table.string('name_en', 255).nullable()
      table.string('description_en', 500).nullable()
    })

    this.schema.alterTable('companions', (table) => {
      table.string('name_en', 255).nullable()
      table.text('description_en').nullable()
    })

    this.schema.alterTable('daily_missions', (table) => {
      table.string('name_en', 255).nullable()
      table.text('description_en').nullable()
    })

    this.schema.alterTable('dungeon_floors', (table) => {
      table.string('name_en', 255).nullable()
      table.text('description_en').nullable()
    })

    this.schema.alterTable('quests', (table) => {
      table.string('title_en', 255).nullable()
      table.text('summary_en').nullable()
      table.text('narrative_en').nullable()
    })

    this.schema.alterTable('system_messages', (table) => {
      table.string('message_en', 500).nullable()
    })

    this.schema.alterTable('seasons', (table) => {
      table.string('name_en', 255).nullable()
      table.string('campaign_title_en', 255).nullable()
      table.text('story_intro_en').nullable()
      table.text('story_outro_en').nullable()
    })
  }

  async down() {
    this.schema.alterTable('items', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('description_en')
    })

    this.schema.alterTable('enemies', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('description_en')
    })

    this.schema.alterTable('talents', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('description_en')
    })

    this.schema.alterTable('combat_skills', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('description_en')
    })

    this.schema.alterTable('companions', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('description_en')
    })

    this.schema.alterTable('daily_missions', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('description_en')
    })

    this.schema.alterTable('dungeon_floors', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('description_en')
    })

    this.schema.alterTable('quests', (table) => {
      table.dropColumn('title_en')
      table.dropColumn('summary_en')
      table.dropColumn('narrative_en')
    })

    this.schema.alterTable('system_messages', (table) => {
      table.dropColumn('message_en')
    })

    this.schema.alterTable('seasons', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('campaign_title_en')
      table.dropColumn('story_intro_en')
      table.dropColumn('story_outro_en')
    })
  }
}
