import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('character_daily_reward_states', (table) => {
      table.increments('id').notNullable()
      table.integer('character_id').unsigned().notNullable().unique().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('current_streak').notNullable().defaultTo(0)
      table.integer('highest_streak').notNullable().defaultTo(0)
      table.timestamp('last_claimed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('character_daily_reward_states')
  }
}
