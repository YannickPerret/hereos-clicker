import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Isometric dungeon definition (chain of rooms)
    this.schema.createTable('iso_dungeons', (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.string('description').notNullable().defaultTo('')
      table.integer('min_level').notNullable().defaultTo(1)
      table.integer('max_players').notNullable().defaultTo(1)
      table.string('icon').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('sort_order').notNullable().defaultTo(1)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    // Each room is an iso map within a dungeon
    this.schema.createTable('iso_dungeon_rooms', (table) => {
      table.increments('id').notNullable()
      table
        .integer('dungeon_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('iso_dungeons')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.integer('room_order').notNullable().defaultTo(1)
      table.boolean('is_boss_room').notNullable().defaultTo(false)

      // Map data (Tiled JSON import)
      table.integer('width').notNullable().defaultTo(16)
      table.integer('height').notNullable().defaultTo(16)
      table.integer('tile_width').notNullable().defaultTo(64)
      table.integer('tile_height').notNullable().defaultTo(32)
      table.string('tileset_key').nullable() // references iso_tilesets.key
      table.text('layer_ground').nullable() // JSON array of tile GIDs
      table.text('layer_walls').nullable() // JSON array of tile GIDs (depth sorted)
      table.text('layer_decor').nullable() // JSON array of tile GIDs (above player)
      table.text('collisions').nullable() // JSON array of {x,y}
      table.text('objects_json').nullable() // JSON array of {type, x, y, metadata}

      // Spawn & exit points
      table.integer('spawn_x').notNullable().defaultTo(0)
      table.integer('spawn_y').notNullable().defaultTo(0)
      table.integer('exit_x').nullable()
      table.integer('exit_y').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    // Reusable tileset registry
    this.schema.createTable('iso_tilesets', (table) => {
      table.increments('id').notNullable()
      table.string('key').notNullable().unique() // e.g. 'cyberpunk_floor'
      table.string('name').notNullable()
      table.string('image_path').notNullable() // relative to /assets/maps/tilesets/
      table.integer('tile_width').notNullable().defaultTo(64)
      table.integer('tile_height').notNullable().defaultTo(32)
      table.integer('columns').notNullable().defaultTo(8)
      table.integer('tile_count').notNullable().defaultTo(64)
      table.string('tileset_type').notNullable().defaultTo('isometric') // isometric | orthogonal
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    // Sprite registry (characters, NPCs, enemies)
    this.schema.createTable('iso_sprites', (table) => {
      table.increments('id').notNullable()
      table.string('key').notNullable().unique() // e.g. 'player_hacker', 'enemy_drone'
      table.string('name').notNullable()
      table.string('image_path').notNullable() // relative to /assets/sprites/
      table.integer('frame_width').notNullable().defaultTo(64)
      table.integer('frame_height').notNullable().defaultTo(64)
      table.integer('frame_count').notNullable().defaultTo(1)
      table.text('animations_json').nullable() // JSON: {idle: {start,end,rate}, walk_s: ...}
      table.string('sprite_type').notNullable().defaultTo('character') // character | enemy | npc
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })

    // Enemy placements per room
    this.schema.createTable('iso_room_enemies', (table) => {
      table.increments('id').notNullable()
      table
        .integer('room_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('iso_dungeon_rooms')
        .onDelete('CASCADE')
      table
        .integer('enemy_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('enemies')
        .onDelete('CASCADE')
      table.string('sprite_key').nullable() // iso_sprites.key override
      table.integer('grid_x').notNullable()
      table.integer('grid_y').notNullable()
      table.boolean('is_boss').notNullable().defaultTo(false)
      table.boolean('blocks_exit').notNullable().defaultTo(false)
    })

    // Active dungeon run state
    this.schema.createTable('iso_dungeon_runs', (table) => {
      table.increments('id').notNullable()
      table
        .integer('dungeon_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('iso_dungeons')
        .onDelete('CASCADE')
      table
        .integer('character_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('characters')
        .onDelete('CASCADE')
      table.integer('current_room_order').notNullable().defaultTo(1)
      table.integer('player_x').notNullable().defaultTo(0)
      table.integer('player_y').notNullable().defaultTo(0)
      table.string('status').notNullable().defaultTo('in_progress') // in_progress | victory | defeat | fled
      table.text('defeated_enemies_json').notNullable().defaultTo('[]') // JSON array of room_enemy IDs
      table.text('combat_log_json').notNullable().defaultTo('[]')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable('iso_dungeon_runs')
    this.schema.dropTable('iso_room_enemies')
    this.schema.dropTable('iso_sprites')
    this.schema.dropTable('iso_tilesets')
    this.schema.dropTable('iso_dungeon_rooms')
    this.schema.dropTable('iso_dungeons')
  }
}
