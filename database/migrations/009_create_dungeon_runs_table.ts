import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dungeon_runs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('character_id').unsigned().references('id').inTable('characters').onDelete('CASCADE')
      table.integer('dungeon_floor_id').unsigned().references('id').inTable('dungeon_floors')
      table.string('status').defaultTo('in_progress')
      table.integer('current_enemy_hp').defaultTo(0)
      table.integer('current_enemy_id').nullable()
      table.integer('enemies_defeated').defaultTo(0)
      table.timestamp('started_at').notNullable()
      table.timestamp('ended_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
