import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dungeon_floors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.text('description').notNullable()
      table.integer('floor_number').notNullable()
      table.integer('min_level').defaultTo(1)
      table.string('enemy_ids').notNullable() // JSON array of enemy IDs
      table.integer('boss_enemy_id').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
