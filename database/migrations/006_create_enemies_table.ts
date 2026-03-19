import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'enemies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.text('description').notNullable()
      table.integer('hp').notNullable()
      table.integer('attack').notNullable()
      table.integer('defense').notNullable()
      table.integer('xp_reward').notNullable()
      table.integer('credits_reward_min').notNullable()
      table.integer('credits_reward_max').notNullable()
      table.string('icon').notNullable()
      table.integer('tier').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
