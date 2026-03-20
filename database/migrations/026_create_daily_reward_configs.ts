import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('daily_reward_configs', (table) => {
      table.increments('id').notNullable()
      table.integer('day_number').notNullable().unique()
      table.string('reward_type').notNullable()
      table.integer('reward_value').notNullable().defaultTo(1)
      table.integer('reward_item_id').unsigned().nullable().references('id').inTable('items').onDelete('SET NULL')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    const now = new Date()
    await this.db.table('daily_reward_configs').insert([
      { day_number: 1, reward_type: 'credits', reward_value: 250, reward_item_id: null, is_active: true, created_at: now, updated_at: now },
      { day_number: 2, reward_type: 'credits', reward_value: 500, reward_item_id: null, is_active: true, created_at: now, updated_at: now },
      { day_number: 3, reward_type: 'credits', reward_value: 750, reward_item_id: null, is_active: true, created_at: now, updated_at: now },
      { day_number: 4, reward_type: 'credits', reward_value: 1000, reward_item_id: null, is_active: true, created_at: now, updated_at: now },
      { day_number: 5, reward_type: 'xp', reward_value: 250, reward_item_id: null, is_active: true, created_at: now, updated_at: now },
      { day_number: 6, reward_type: 'credits', reward_value: 2000, reward_item_id: null, is_active: true, created_at: now, updated_at: now },
      { day_number: 7, reward_type: 'credits', reward_value: 3500, reward_item_id: null, is_active: true, created_at: now, updated_at: now },
    ])
  }

  async down() {
    this.schema.dropTable('daily_reward_configs')
  }
}
