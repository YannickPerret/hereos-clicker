import { BaseSchema } from '@adonisjs/lucid/schema'

const BLACK_MARKET_ITEMS = [
  {
    name: 'Blackwall Needle',
    description: 'An outlaw neural spike built from stripped NetWatch hardware. It makes every click feel illegal.',
    type: 'implant',
    rarity: 'legendary',
    icon: 'blackwall',
    effect_type: 'click_multiplier',
    effect_value: 24,
    base_price: 240000,
  },
  {
    name: 'Sandevistan Falcon S',
    description: 'A combat-grade Sandevistan flashed with smuggled firmware for dirty urban kills.',
    type: 'implant',
    rarity: 'epic',
    icon: 'sandevistan',
    effect_type: 'click_multiplier',
    effect_value: 18,
    base_price: 185000,
  },
  {
    name: 'NeuroSpike Suite',
    description: 'Weaponized intrusion package hidden inside a sleek sidearm frame.',
    type: 'weapon',
    rarity: 'epic',
    icon: 'neurospike',
    effect_type: 'attack_boost',
    effect_value: 22,
    base_price: 210000,
  },
  {
    name: 'Ghost Ping Suite',
    description: 'A forbidden optimization shard that teaches your daemons to skim value from dead channels.',
    type: 'upgrade',
    rarity: 'epic',
    icon: 'ghost_ping',
    effect_type: 'permanent_click',
    effect_value: 6,
    base_price: 150000,
  },
  {
    name: 'Black ICE Capsule',
    description: 'Military-grade neurostim capsule. Burn bright, learn fast, forget the side effects.',
    type: 'consumable',
    rarity: 'rare',
    icon: 'black_ice',
    effect_type: 'xp_boost',
    effect_value: 1500,
    base_price: 90000,
  },
  {
    name: 'Militech Cinder Baton',
    description: 'Compact shock baton from a convoy that never reached its client.',
    type: 'weapon',
    rarity: 'rare',
    icon: 'cinder_baton',
    effect_type: 'attack_boost',
    effect_value: 18,
    base_price: 125000,
  },
  {
    name: 'Arasaka Kinetic Weave',
    description: 'Layered reactive armor harvested from a corpse-tagged corpo transport.',
    type: 'armor',
    rarity: 'epic',
    icon: 'kinetic_weave',
    effect_type: 'defense_boost',
    effect_value: 20,
    base_price: 205000,
  },
  {
    name: 'Gorilla Arms Overclocked',
    description: 'Illegal power limiters removed. Every strike starts to sound like broken concrete.',
    type: 'implant',
    rarity: 'legendary',
    icon: 'gorilla_arms',
    effect_type: 'attack_boost',
    effect_value: 28,
    base_price: 260000,
  },
  {
    name: 'Trauma Team Crashgel',
    description: 'Stolen emergency trauma foam with enough stimulants to pull you back from the floor.',
    type: 'consumable',
    rarity: 'epic',
    icon: 'crashgel',
    effect_type: 'hp_restore',
    effect_value: 180,
    base_price: 110000,
  },
  {
    name: 'Quantum Tap Illegal',
    description: 'Street-forged tap amp tuned for pure click extraction. Expensive, unstable, effective.',
    type: 'upgrade',
    rarity: 'legendary',
    icon: 'quantum_tap',
    effect_type: 'permanent_click',
    effect_value: 8,
    base_price: 320000,
  },
  {
    name: 'Ghostshell Trenchcoat',
    description: 'A heat-dispersing trenchcoat worn by fixers who never appear on camera.',
    type: 'clothes_outer',
    rarity: 'legendary',
    icon: 'ghostshell',
    effect_type: null,
    effect_value: null,
    base_price: 180000,
  },
  {
    name: 'Mirage Visor',
    description: 'Reflective visor mask tuned to blind cheap optics and flatter your killshot.',
    type: 'clothes_face',
    rarity: 'epic',
    icon: 'mirage_visor',
    effect_type: null,
    effect_value: null,
    base_price: 95000,
  },
  {
    name: 'Monochrome Razorcut',
    description: 'A salon-grade hair rig favored by braindance idols and gang lieutenants.',
    type: 'clothes_hair',
    rarity: 'epic',
    icon: 'razorcut',
    effect_type: null,
    effect_value: null,
    base_price: 85000,
  },
  {
    name: 'ShimmerThread Slacks',
    description: 'Designer lowerwear woven with contraband reflective filaments.',
    type: 'clothes_legs',
    rarity: 'epic',
    icon: 'shimmerthread',
    effect_type: null,
    effect_value: null,
    base_price: 90000,
  },
  {
    name: 'Counterfeit Corpo Badge',
    description: 'Forged access token that opens doors and lines your clicks with stolen clearance.',
    type: 'upgrade',
    rarity: 'rare',
    icon: 'corpo_badge',
    effect_type: 'permanent_click',
    effect_value: 4,
    base_price: 70000,
  },
]

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasProfiles = await db.schema.hasTable('character_black_market_profiles')
      if (!hasProfiles) {
        await db.schema.createTable('character_black_market_profiles', (table) => {
          table.increments('id').notNullable()
          table.integer('character_id').unsigned().notNullable().unique().references('id').inTable('characters').onDelete('CASCADE')
          table.integer('heat').notNullable().defaultTo(0)
          table.bigInteger('last_heat_decay_at').notNullable().defaultTo(0)
        })
      }

      const hasReputations = await db.schema.hasTable('character_black_market_reputations')
      if (!hasReputations) {
        await db.schema.createTable('character_black_market_reputations', (table) => {
          table.increments('id').notNullable()
          table.integer('character_id').unsigned().notNullable().references('id').inTable('characters').onDelete('CASCADE')
          table.string('vendor_key').notNullable()
          table.integer('reputation').notNullable().defaultTo(0)
          table.unique(['character_id', 'vendor_key'])
        })
      }

      const hasDeals = await db.schema.hasTable('black_market_deals')
      if (!hasDeals) {
        await db.schema.createTable('black_market_deals', (table) => {
          table.increments('id').notNullable()
          table.bigInteger('rotation_key').notNullable()
          table.string('vendor_key').notNullable()
          table.integer('slot').notNullable()
          table.integer('item_id').unsigned().notNullable().references('id').inTable('items').onDelete('CASCADE')
          table.integer('price').notNullable()
          table.integer('stock').notNullable().defaultTo(1)
          table.integer('heat_value').notNullable().defaultTo(0)
          table.integer('reputation_required').notNullable().defaultTo(0)
          table.string('required_spec').nullable()
          table.boolean('featured').notNullable().defaultTo(false)
          table.bigInteger('starts_at').notNullable()
          table.bigInteger('ends_at').notNullable()
          table.unique(['rotation_key', 'vendor_key', 'slot'])
        })
      }

      for (const item of BLACK_MARKET_ITEMS) {
        const existing = await db.from('items').where('name', item.name).first()
        if (!existing) {
          await db.table('items').insert({
            ...item,
            created_at: new Date(),
          })
        }
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.from('items').whereIn('name', BLACK_MARKET_ITEMS.map((item) => item.name)).delete()

      const hasDeals = await db.schema.hasTable('black_market_deals')
      if (hasDeals) {
        await db.schema.dropTable('black_market_deals')
      }

      const hasReputations = await db.schema.hasTable('character_black_market_reputations')
      if (hasReputations) {
        await db.schema.dropTable('character_black_market_reputations')
      }

      const hasProfiles = await db.schema.hasTable('character_black_market_profiles')
      if (hasProfiles) {
        await db.schema.dropTable('character_black_market_profiles')
      }
    })
  }
}
