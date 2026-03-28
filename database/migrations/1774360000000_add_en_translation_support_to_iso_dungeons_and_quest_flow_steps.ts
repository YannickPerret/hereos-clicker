import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('iso_dungeons', (table) => {
      table.string('name_en', 255).nullable()
      table.text('description_en').nullable()
    })

    this.schema.alterTable('quest_flow_steps', (table) => {
      table.text('content_json_en').nullable()
    })
  }

  async down() {
    this.schema.alterTable('iso_dungeons', (table) => {
      table.dropColumn('name_en')
      table.dropColumn('description_en')
    })

    this.schema.alterTable('quest_flow_steps', (table) => {
      table.dropColumn('content_json_en')
    })
  }
}
