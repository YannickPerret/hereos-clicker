import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('daily_missions', (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('description').notNullable()
      table.string('type').notNullable() // click, kill, dungeon_clear, earn_credits, buy_item, pvp_win
      table.integer('target_value').notNullable()
      table.string('reward_type').notNullable() // credits, xp, item
      table.integer('reward_value').notNullable()
      table.integer('reward_item_id').unsigned().references('id').inTable('items').nullable()
      table.string('icon').defaultTo('mission')
    })

    this.schema.createTable('character_daily_missions', (table) => {
      table.increments('id')
      table.integer('character_id').unsigned().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('daily_mission_id').unsigned().references('id').inTable('daily_missions').onDelete('CASCADE')
      table.integer('progress').defaultTo(0)
      table.boolean('completed').defaultTo(false)
      table.boolean('claimed').defaultTo(false)
      table.timestamp('assigned_at').notNullable()
      table.timestamp('completed_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('character_daily_missions')
    this.schema.dropTable('daily_missions')
  }
}
