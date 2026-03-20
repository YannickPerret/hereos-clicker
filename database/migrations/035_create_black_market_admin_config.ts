import { BaseSchema } from '@adonisjs/lucid/schema'

const DEFAULT_SETTINGS = [
  { key: 'min_level', value: '12' },
  { key: 'rotation_hours', value: '12' },
]

const DEFAULT_CLEANERS = [
  {
    key: 'trace_scrub',
    name: 'Trace Scrub',
    description: 'A fast cleanup through burner relays and two disposable shell corps.',
    base_price: 20000,
    heat_reduction: 15,
    is_active: true,
    sort_order: 1,
  },
  {
    key: 'signal_fog',
    name: 'Signal Fog',
    description: 'Ghost your movements behind fake pings, dead cameras, and a bribed subnet tech.',
    base_price: 65000,
    heat_reduction: 40,
    is_active: true,
    sort_order: 2,
  },
  {
    key: 'burn_notice',
    name: 'Burn Notice',
    description: 'The expensive option. People disappear, records rot, and the city forgets your last week.',
    base_price: 180000,
    heat_reduction: 90,
    is_active: true,
    sort_order: 3,
  },
]

const DEFAULT_CATALOG = [
  { vendor_key: 'ghostline', item_name: 'Blackwall Needle', base_price: 260000, stock: 1, heat_value: 18, reputation_required: 12, required_spec: 'netrunner', is_featured: true, is_active: true, sort_order: 1 },
  { vendor_key: 'ghostline', item_name: 'Sandevistan Falcon S', base_price: 210000, stock: 1, heat_value: 14, reputation_required: 8, required_spec: 'samurai', is_featured: false, is_active: true, sort_order: 2 },
  { vendor_key: 'ghostline', item_name: 'NeuroSpike Suite', base_price: 225000, stock: 2, heat_value: 12, reputation_required: 6, required_spec: 'hacker', is_featured: false, is_active: true, sort_order: 3 },
  { vendor_key: 'ghostline', item_name: 'Ghost Ping Suite', base_price: 175000, stock: 3, heat_value: 10, reputation_required: 4, required_spec: 'netrunner', is_featured: false, is_active: true, sort_order: 4 },
  { vendor_key: 'ghostline', item_name: 'Black ICE Capsule', base_price: 95000, stock: 5, heat_value: 7, reputation_required: 0, required_spec: null, is_featured: false, is_active: true, sort_order: 5 },

  { vendor_key: 'rook', item_name: 'Militech Cinder Baton', base_price: 140000, stock: 2, heat_value: 8, reputation_required: 0, required_spec: null, is_featured: false, is_active: true, sort_order: 1 },
  { vendor_key: 'rook', item_name: 'Arasaka Kinetic Weave', base_price: 220000, stock: 2, heat_value: 11, reputation_required: 6, required_spec: null, is_featured: false, is_active: true, sort_order: 2 },
  { vendor_key: 'rook', item_name: 'Gorilla Arms Overclocked', base_price: 290000, stock: 1, heat_value: 18, reputation_required: 14, required_spec: 'samurai', is_featured: true, is_active: true, sort_order: 3 },
  { vendor_key: 'rook', item_name: 'Trauma Team Crashgel', base_price: 120000, stock: 4, heat_value: 6, reputation_required: 0, required_spec: null, is_featured: false, is_active: true, sort_order: 4 },
  { vendor_key: 'rook', item_name: 'Quantum Tap Illegal', base_price: 340000, stock: 2, heat_value: 20, reputation_required: 18, required_spec: 'chrome_dealer', is_featured: false, is_active: true, sort_order: 5 },

  { vendor_key: 'velvet', item_name: 'Ghostshell Trenchcoat', base_price: 190000, stock: 1, heat_value: 9, reputation_required: 7, required_spec: null, is_featured: true, is_active: true, sort_order: 1 },
  { vendor_key: 'velvet', item_name: 'Mirage Visor', base_price: 105000, stock: 2, heat_value: 5, reputation_required: 0, required_spec: null, is_featured: false, is_active: true, sort_order: 2 },
  { vendor_key: 'velvet', item_name: 'Monochrome Razorcut', base_price: 95000, stock: 2, heat_value: 4, reputation_required: 0, required_spec: null, is_featured: false, is_active: true, sort_order: 3 },
  { vendor_key: 'velvet', item_name: 'ShimmerThread Slacks', base_price: 98000, stock: 2, heat_value: 4, reputation_required: 0, required_spec: null, is_featured: false, is_active: true, sort_order: 4 },
  { vendor_key: 'velvet', item_name: 'Counterfeit Corpo Badge', base_price: 85000, stock: 3, heat_value: 8, reputation_required: 3, required_spec: 'chrome_dealer', is_featured: false, is_active: true, sort_order: 5 },
]

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasSettings = await db.schema.hasTable('black_market_settings')
      if (!hasSettings) {
        await db.schema.createTable('black_market_settings', (table) => {
          table.increments('id').notNullable()
          table.string('key').notNullable().unique()
          table.string('value').notNullable()
        })
      }

      const hasCatalog = await db.schema.hasTable('black_market_catalog_entries')
      if (!hasCatalog) {
        await db.schema.createTable('black_market_catalog_entries', (table) => {
          table.increments('id').notNullable()
          table.string('vendor_key').notNullable()
          table.integer('item_id').unsigned().notNullable().references('id').inTable('items').onDelete('CASCADE')
          table.integer('base_price').notNullable()
          table.integer('stock').notNullable().defaultTo(1)
          table.integer('heat_value').notNullable().defaultTo(0)
          table.integer('reputation_required').notNullable().defaultTo(0)
          table.string('required_spec').nullable()
          table.boolean('is_featured').notNullable().defaultTo(false)
          table.boolean('is_active').notNullable().defaultTo(true)
          table.integer('sort_order').notNullable().defaultTo(0)
          table.unique(['vendor_key', 'item_id'])
        })
      }

      const hasCleaners = await db.schema.hasTable('black_market_cleaners')
      if (!hasCleaners) {
        await db.schema.createTable('black_market_cleaners', (table) => {
          table.increments('id').notNullable()
          table.string('key').notNullable().unique()
          table.string('name').notNullable()
          table.text('description').notNullable()
          table.integer('base_price').notNullable()
          table.integer('heat_reduction').notNullable()
          table.boolean('is_active').notNullable().defaultTo(true)
          table.integer('sort_order').notNullable().defaultTo(0)
        })
      }

      for (const setting of DEFAULT_SETTINGS) {
        const existing = await db.from('black_market_settings').where('key', setting.key).first()
        if (!existing) {
          await db.table('black_market_settings').insert(setting)
        }
      }

      for (const cleaner of DEFAULT_CLEANERS) {
        const existing = await db.from('black_market_cleaners').where('key', cleaner.key).first()
        if (!existing) {
          await db.table('black_market_cleaners').insert(cleaner)
        }
      }

      for (const entry of DEFAULT_CATALOG) {
        const item = await db.from('items').where('name', entry.item_name).first()
        if (!item) continue

        const existing = await db
          .from('black_market_catalog_entries')
          .where('vendor_key', entry.vendor_key)
          .where('item_id', item.id)
          .first()

        if (!existing) {
          await db.table('black_market_catalog_entries').insert({
            vendor_key: entry.vendor_key,
            item_id: item.id,
            base_price: entry.base_price,
            stock: entry.stock,
            heat_value: entry.heat_value,
            reputation_required: entry.reputation_required,
            required_spec: entry.required_spec,
            is_featured: entry.is_featured,
            is_active: entry.is_active,
            sort_order: entry.sort_order,
          })
        }
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasCleaners = await db.schema.hasTable('black_market_cleaners')
      if (hasCleaners) {
        await db.schema.dropTable('black_market_cleaners')
      }

      const hasCatalog = await db.schema.hasTable('black_market_catalog_entries')
      if (hasCatalog) {
        await db.schema.dropTable('black_market_catalog_entries')
      }

      const hasSettings = await db.schema.hasTable('black_market_settings')
      if (hasSettings) {
        await db.schema.dropTable('black_market_settings')
      }
    })
  }
}
