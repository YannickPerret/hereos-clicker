import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Map from '#models/map'
import MapObject from '#models/map_object'

export default class extends BaseSeeder {
  async run() {
    // 1. Create a few maps
    const map1 = await Map.create({
      name: 'Sector 4 - Slums',
      slug: 'sector-4',
      width: 15,
      height: 15,
      collisions: JSON.stringify([
        { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 5 },
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }
      ])
    })

    const map2 = await Map.create({
      name: 'Neon District',
      slug: 'neon-district',
      width: 20,
      height: 10,
    })

    // 2. Add some POIs
    await MapObject.createMany([
      {
        mapId: map1.id,
        name: 'General Shop',
        type: 'shop',
        x: 10,
        y: 10,
      },
      {
        mapId: map1.id,
        name: 'Main Dungeon',
        type: 'dungeon',
        x: 2,
        y: 12,
      },
      {
        mapId: map1.id,
        name: 'Portal to Neon District',
        type: 'teleport',
        x: 14,
        y: 7,
        metadata: { targetMapId: map2.id, targetX: 1, targetY: 5 }
      }
    ])
  }
}
