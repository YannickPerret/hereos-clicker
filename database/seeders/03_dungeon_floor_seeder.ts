import { BaseSeeder } from '@adonisjs/lucid/seeders'
import DungeonFloor from '#models/dungeon_floor'
import Enemy from '#models/enemy'

export default class extends BaseSeeder {
  async run() {
    const enemies = await Enemy.query().select('id', 'name')
    const enemyIdByName = new Map<string, number>()
    for (const enemy of enemies) {
      enemyIdByName.set(enemy.name, enemy.id)
    }

    const floors = [
      // Solo or group
      { name: 'Neon Alley', description: 'Ruelles sombres eclairees par des neons tremblants. Le danger rode.', floorNumber: 1, minLevel: 1, enemyNames: ['Glitched Drone', 'Neon Rat', 'Street Thug'], bossName: null, minPlayers: 1, maxPlayers: 4 },
      { name: 'Abandoned Metro', description: 'L\'ancien metro. Des machines errantes et pire encore.', floorNumber: 2, minLevel: 3, enemyNames: ['Glitched Drone', 'Neon Rat', 'Street Thug', 'Rogue AI Drone'], bossName: null, minPlayers: 1, maxPlayers: 4 },
      { name: 'Data Catacombs', description: 'Serveurs souterrains. L\'air vibre de donnees corrompues.', floorNumber: 3, minLevel: 5, enemyNames: ['Rogue AI Drone', 'Cyber Jackal', 'DataWraith'], bossName: 'ARCHON - Rogue Superintelligence', minPlayers: 1, maxPlayers: 4 },

      // Group required (2+)
      { name: 'Corporate Spire - Lower', description: 'La tour megacorp. Securite letale. Venez accompagne.', floorNumber: 4, minLevel: 8, enemyNames: ['Cyber Jackal', 'DataWraith', 'Corp Security Bot', 'Netrunner Assassin'], bossName: null, minPlayers: 2, maxPlayers: 4 },
      { name: 'Corporate Spire - Upper', description: 'Etages superieurs. Le vrai pouvoir. Minimum 2 runners.', floorNumber: 5, minLevel: 10, enemyNames: ['Corp Security Bot', 'Netrunner Assassin', 'Mech Walker'], bossName: 'Chrome Dragon', minPlayers: 2, maxPlayers: 4 },

      // Raid (3+)
      { name: 'The Void', description: 'Au-dela de la realite. Raid de 3+ runners obligatoire.', floorNumber: 6, minLevel: 15, enemyNames: ['Mech Walker', 'ARCHON - Rogue Superintelligence', 'Chrome Dragon'], bossName: 'The Void King', minPlayers: 3, maxPlayers: 4 },

      // Mid / endgame escalation
      { name: 'Pacifica Black Site', description: 'Un laboratoire noye sous Pacifica, rempli de glace noire et de survivants armes jusqu aux dents.', floorNumber: 7, minLevel: 20, enemyNames: ['Black ICE Hound', 'Maelstrom Ripper', 'Militech Suppressor'], bossName: null, minPlayers: 2, maxPlayers: 4 },
      { name: 'Dogtown Kill Corridors', description: 'Couloirs militarises, drones de suppression, extraction impossible sans equipe solide.', floorNumber: 8, minLevel: 24, enemyNames: ['Black ICE Hound', 'Militech Suppressor', 'Arasaka Counter-Intel'], bossName: 'Cyberpsycho Dragoon', minPlayers: 2, maxPlayers: 4 },
      { name: 'Arasaka Counterintel Vault', description: 'Un coffre-fort de contre-mesures humaines et numeriques. Tout ici veut t effacer.', floorNumber: 9, minLevel: 29, enemyNames: ['Militech Suppressor', 'Arasaka Counter-Intel', 'Sandevistan Duelist', 'Cyberpsycho Dragoon'], bossName: null, minPlayers: 2, maxPlayers: 4 },
      { name: 'Cynosure Relay', description: 'Une station de relais oubliee ou les machines autonomes defendent encore des ordres morts.', floorNumber: 10, minLevel: 34, enemyNames: ['Arasaka Counter-Intel', 'Sandevistan Duelist', 'Cyberpsycho Dragoon', 'Cerberus Siege Frame'], bossName: 'Blackwall Seraph', minPlayers: 3, maxPlayers: 4 },
      { name: 'Mikoshi Access Spine', description: 'La colonne d acces vers Mikoshi. Les corps tombent, les engrammes restent.', floorNumber: 11, minLevel: 40, enemyNames: ['Cerberus Siege Frame', 'Blackwall Seraph', 'Mikoshi Warden'], bossName: null, minPlayers: 3, maxPlayers: 4 },
      { name: 'Blackwall Breach', description: 'Le dernier cran avant la rupture. Si vous ouvrez trop grand, quelque chose repond.', floorNumber: 12, minLevel: 48, enemyNames: ['Blackwall Seraph', 'Mikoshi Warden', 'Soulkiller Prime'], bossName: 'Soulkiller Prime', minPlayers: 4, maxPlayers: 4 },
    ] as const

    for (const floor of floors) {
      const enemyIds = floor.enemyNames
        .map((name) => enemyIdByName.get(name))
        .filter((id): id is number => typeof id === 'number')

      const bossEnemyId = floor.bossName ? enemyIdByName.get(floor.bossName) ?? null : null

      await DungeonFloor.updateOrCreate(
        { floorNumber: floor.floorNumber },
        {
          name: floor.name,
          description: floor.description,
          floorNumber: floor.floorNumber,
          minLevel: floor.minLevel,
          enemyIds: JSON.stringify(enemyIds),
          bossEnemyId,
          minPlayers: floor.minPlayers,
          maxPlayers: floor.maxPlayers,
        }
      )
    }
  }
}
