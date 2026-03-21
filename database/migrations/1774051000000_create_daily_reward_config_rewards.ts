import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('daily_reward_config_rewards', (table) => {
      table.increments('id').notNullable()
      table
        .integer('daily_reward_config_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('daily_reward_configs')
        .onDelete('CASCADE')
      table.string('reward_type').notNullable()
      table.integer('reward_value').notNullable().defaultTo(1)
      table
        .integer('reward_item_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('items')
        .onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    // Migrate existing reward data from daily_reward_configs into the new table
    this.defer(async (db) => {
      const configs = await db.from('daily_reward_configs').select('*')
      const now = new Date().toISOString()

      for (const config of configs) {
        if (config.reward_type && config.reward_value) {
          await db.table('daily_reward_config_rewards').insert({
            daily_reward_config_id: config.id,
            reward_type: config.reward_type,
            reward_value: config.reward_value,
            reward_item_id: config.reward_item_id || null,
            created_at: now,
            updated_at: now,
          })
        }
      }
    })
  }

  async down() {
    this.schema.dropTable('daily_reward_config_rewards')
  }
}
