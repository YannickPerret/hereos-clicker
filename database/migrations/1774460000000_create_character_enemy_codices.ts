import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'character_enemy_codices'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) return

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('character_id').unsigned().notNullable().references('characters.id').onDelete('CASCADE')
      table.integer('enemy_id').unsigned().notNullable().references('enemies.id').onDelete('CASCADE')
      table.integer('encounters').notNullable().defaultTo(0)
      table.integer('defeats').notNullable().defaultTo(0)
      table.timestamp('first_seen_at').notNullable()
      table.timestamp('last_seen_at').notNullable()
      table.unique(['character_id', 'enemy_id'])
    })
  }

  async down() {
    const exists = await this.schema.hasTable(this.tableName)
    if (!exists) return

    this.schema.dropTable(this.tableName)
  }
}
