import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'maps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.integer('width').defaultTo(20)
      table.integer('height').defaultTo(20)
      table.text('collisions').nullable() // JSON string of un-walkable tiles
      table.string('background_image').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    this.schema.createTable('map_objects', (table) => {
      table.increments('id')
      table.integer('map_id').unsigned().references('id').inTable('maps').onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('type').notNullable() // 'shop', 'dungeon', 'teleport', 'npc'
      table.integer('x').notNullable()
      table.integer('y').notNullable()
      table.json('metadata').nullable() // Extra data like target_map_id for teleports
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable('map_objects')
    this.schema.dropTable(this.tableName)
  }
}
