import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'maps'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('tileset_image').nullable()
      table.integer('tile_width').defaultTo(32)
      table.integer('tile_height').defaultTo(32)
      table.text('layer_data').nullable() // Pour stocker les GIDs si on veut faire du rendu multicouche
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('tileset_image')
      table.dropColumn('tile_width')
      table.dropColumn('tile_height')
      table.dropColumn('layer_data')
    })
  }
}
