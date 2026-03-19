import { BaseSeeder } from '@adonisjs/lucid/seeders'
import EnemyLootTable from '#models/enemy_loot_table'

export default class extends BaseSeeder {
  async run() {
    await EnemyLootTable.createMany([
      // Tier 1 enemies drop common items
      { enemyId: 1, itemId: 17, dropChance: 0.3 },  // Glitched Drone -> Stim Pack
      { enemyId: 1, itemId: 22, dropChance: 0.1 },  // Glitched Drone -> Finger Servos
      { enemyId: 2, itemId: 17, dropChance: 0.2 },  // Neon Rat -> Stim Pack
      { enemyId: 3, itemId: 1, dropChance: 0.15 },   // Street Thug -> Plasma Pistol
      { enemyId: 3, itemId: 7, dropChance: 0.1 },    // Street Thug -> Kevlar Vest

      // Tier 2 enemies drop uncommon items
      { enemyId: 4, itemId: 3, dropChance: 0.15 },   // Rogue AI Drone -> Neural Disruptor
      { enemyId: 4, itemId: 13, dropChance: 0.1 },   // Rogue AI Drone -> Neural Accelerator
      { enemyId: 5, itemId: 8, dropChance: 0.15 },   // Cyber Jackal -> Nanoweave Jacket
      { enemyId: 6, itemId: 23, dropChance: 0.12 },  // DataWraith -> Haptic Amplifier
      { enemyId: 6, itemId: 18, dropChance: 0.2 },   // DataWraith -> MedGel Capsule

      // Tier 3 enemies drop rare items
      { enemyId: 7, itemId: 9, dropChance: 0.12 },   // Corp Security -> Titanium Exosuit
      { enemyId: 8, itemId: 4, dropChance: 0.1 },    // Netrunner -> Railgun X-7
      { enemyId: 8, itemId: 14, dropChance: 0.08 },  // Netrunner -> Synaptic Overdrive
      { enemyId: 9, itemId: 24, dropChance: 0.1 },   // Mech Walker -> Neural Click Matrix
      { enemyId: 9, itemId: 19, dropChance: 0.15 },  // Mech Walker -> Phoenix Serum

      // Tier 4 bosses drop epic/legendary items
      { enemyId: 10, itemId: 5, dropChance: 0.2 },   // ARCHON -> Void Cannon
      { enemyId: 10, itemId: 15, dropChance: 0.15 }, // ARCHON -> Quantum Consciousness
      { enemyId: 11, itemId: 10, dropChance: 0.2 },  // Chrome Dragon -> Quantum Shield
      { enemyId: 11, itemId: 25, dropChance: 0.15 }, // Chrome Dragon -> Quantum Tap
      { enemyId: 12, itemId: 6, dropChance: 0.1 },   // Void King -> OMEGA Protocol
      { enemyId: 12, itemId: 11, dropChance: 0.1 },  // Void King -> Ghost Shell
      { enemyId: 12, itemId: 16, dropChance: 0.08 }, // Void King -> Singularity Core
    ])
  }
}
