import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'characters'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('name', 50).notNullable()
      table.bigInteger('credits').defaultTo(0)
      table.integer('credits_per_click').defaultTo(1)
      table.integer('level').defaultTo(1)
      table.integer('xp').defaultTo(0)
      table.integer('hp_max').defaultTo(100)
      table.integer('hp_current').defaultTo(100)
      table.integer('attack').defaultTo(10)
      table.integer('defense').defaultTo(5)
      table.bigInteger('total_clicks').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
