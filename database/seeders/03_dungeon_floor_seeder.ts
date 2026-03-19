import { BaseSeeder } from '@adonisjs/lucid/seeders'
import DungeonFloor from '#models/dungeon_floor'

export default class extends BaseSeeder {
  async run() {
    await DungeonFloor.createMany([
      // Solo or group
      { name: 'Neon Alley', description: 'Ruelles sombres eclairees par des neons tremblants. Le danger rode.', floorNumber: 1, minLevel: 1, enemyIds: JSON.stringify([1, 2, 3]), bossEnemyId: null, minPlayers: 1, maxPlayers: 4 },
      { name: 'Abandoned Metro', description: 'L\'ancien metro. Des machines errantes et pire encore.', floorNumber: 2, minLevel: 3, enemyIds: JSON.stringify([1, 2, 3, 4]), bossEnemyId: null, minPlayers: 1, maxPlayers: 4 },
      { name: 'Data Catacombs', description: 'Serveurs souterrains. L\'air vibre de donnees corrompues.', floorNumber: 3, minLevel: 5, enemyIds: JSON.stringify([4, 5, 6]), bossEnemyId: 10, minPlayers: 1, maxPlayers: 4 },

      // Group required (2+)
      { name: 'Corporate Spire - Lower', description: 'La tour megacorp. Securite letale. Venez accompagne.', floorNumber: 4, minLevel: 8, enemyIds: JSON.stringify([5, 6, 7, 8]), bossEnemyId: null, minPlayers: 2, maxPlayers: 4 },
      { name: 'Corporate Spire - Upper', description: 'Etages superieurs. Le vrai pouvoir. Minimum 2 runners.', floorNumber: 5, minLevel: 10, enemyIds: JSON.stringify([7, 8, 9]), bossEnemyId: 11, minPlayers: 2, maxPlayers: 4 },

      // Raid (3+)
      { name: 'The Void', description: 'Au-dela de la realite. Raid de 3+ runners obligatoire.', floorNumber: 6, minLevel: 15, enemyIds: JSON.stringify([9, 10, 11]), bossEnemyId: 12, minPlayers: 3, maxPlayers: 4 },
    ])
  }
}
