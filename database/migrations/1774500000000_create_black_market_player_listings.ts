import { BaseSchema } from '@adonisjs/lucid/schema'

const PLAYER_MARKET_SETTINGS = [
  { key: 'player_listing_tax_per_item', value: '2500' },
  { key: 'player_listing_min_duration_hours', value: '6' },
  { key: 'player_listing_max_duration_hours', value: '72' },
]

export default class extends BaseSchema {
  protected tableName = 'black_market_player_listings'

  async up() {
    this.defer(async (db) => {
      const hasTable = await db.schema.hasTable(this.tableName)

      if (!hasTable) {
        await db.schema.createTable(this.tableName, (table) => {
          table.increments('id').notNullable()
          table
            .integer('seller_character_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('characters')
            .onDelete('CASCADE')
          table
            .integer('item_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('items')
            .onDelete('CASCADE')
          table.string('listing_type').notNullable()
          table.integer('quantity_total').notNullable()
          table.integer('quantity_available').notNullable()
          table.integer('price_per_item').nullable()
          table.integer('starting_bid').nullable()
          table.integer('current_bid').nullable()
          table
            .integer('current_bidder_character_id')
            .unsigned()
            .nullable()
            .references('id')
            .inTable('characters')
            .onDelete('SET NULL')
          table.integer('bid_count').notNullable().defaultTo(0)
          table.integer('listing_tax').notNullable().defaultTo(0)
          table.string('status').notNullable().defaultTo('active')
          table.bigInteger('starts_at').notNullable()
          table.bigInteger('ends_at').notNullable()
          table.index(['status', 'ends_at'])
          table.index(['seller_character_id', 'status'])
        })
      }

      for (const setting of PLAYER_MARKET_SETTINGS) {
        const existing = await db.from('black_market_settings').where('key', setting.key).first()

        if (!existing) {
          await db.table('black_market_settings').insert(setting)
        }
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      await db
        .from('black_market_settings')
        .whereIn(
          'key',
          PLAYER_MARKET_SETTINGS.map((setting) => setting.key)
        )
        .delete()

      const hasTable = await db.schema.hasTable(this.tableName)

      if (hasTable) {
        await db.schema.dropTable(this.tableName)
      }
    })
  }
}
