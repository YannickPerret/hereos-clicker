import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add mode column to quests
    this.schema.alterTable('quests', (table) => {
      table.string('mode').notNullable().defaultTo('simple')
    })

    // Create quest_flow_steps table
    this.schema.createTable('quest_flow_steps', (table) => {
      table.increments('id').notNullable()
      table
        .integer('quest_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('quests')
        .onDelete('CASCADE')
      table.string('step_type').notNullable() // narration, conversation, objective, wait, choice
      table.integer('sort_order').notNullable().defaultTo(1)
      table.text('content_json').notNullable().defaultTo('{}')
      table
        .integer('next_step_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('quest_flow_steps')
        .onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    // Add flow tracking to character_quests
    this.schema.alterTable('character_quests', (table) => {
      table
        .integer('current_step_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('quest_flow_steps')
        .onDelete('SET NULL')
      table.text('step_state_json').nullable()
    })
  }

  async down() {
    this.schema.alterTable('character_quests', (table) => {
      table.dropColumn('current_step_id')
      table.dropColumn('step_state_json')
    })
    this.schema.dropTable('quest_flow_steps')
    this.schema.alterTable('quests', (table) => {
      table.dropColumn('mode')
    })
  }
}
