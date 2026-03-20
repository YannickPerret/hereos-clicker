import { BaseSeeder } from '@adonisjs/lucid/seeders'
import EnemyLootTable from '#models/enemy_loot_table'
import Enemy from '#models/enemy'
import Item from '#models/item'

export default class extends BaseSeeder {
  async run() {
    const enemies = await Enemy.query().select('id', 'name')
    const items = await Item.query().select('id', 'name')
    const enemyIdByName = new Map<string, number>()
    const itemIdByName = new Map<string, number>()

    for (const enemy of enemies) enemyIdByName.set(enemy.name, enemy.id)
    for (const item of items) itemIdByName.set(item.name, item.id)

    const entries = [
      // Tier 1 enemies drop common items
      { enemyName: 'Glitched Drone', itemName: 'Stim Pack', dropChance: 0.3 },
      { enemyName: 'Glitched Drone', itemName: 'Finger Servos', dropChance: 0.1 },
      { enemyName: 'Neon Rat', itemName: 'Stim Pack', dropChance: 0.2 },
      { enemyName: 'Street Thug', itemName: 'Plasma Pistol MK-I', dropChance: 0.15 },
      { enemyName: 'Street Thug', itemName: 'Kevlar Vest', dropChance: 0.1 },

      // Tier 2 enemies drop uncommon items
      { enemyName: 'Rogue AI Drone', itemName: 'Neural Disruptor', dropChance: 0.15 },
      { enemyName: 'Rogue AI Drone', itemName: 'Neural Accelerator', dropChance: 0.1 },
      { enemyName: 'Cyber Jackal', itemName: 'Nanoweave Jacket', dropChance: 0.15 },
      { enemyName: 'DataWraith', itemName: 'Haptic Amplifier', dropChance: 0.12 },
      { enemyName: 'DataWraith', itemName: 'MedGel Capsule', dropChance: 0.2 },

      // Tier 3 enemies drop rare items
      { enemyName: 'Corp Security Bot', itemName: 'Titanium Exosuit', dropChance: 0.12 },
      { enemyName: 'Netrunner Assassin', itemName: 'Railgun X-7', dropChance: 0.1 },
      { enemyName: 'Netrunner Assassin', itemName: 'Synaptic Overdrive', dropChance: 0.08 },
      { enemyName: 'Mech Walker', itemName: 'Neural Click Matrix', dropChance: 0.1 },
      { enemyName: 'Mech Walker', itemName: 'Phoenix Serum', dropChance: 0.15 },

      // Tier 4 bosses drop epic/legendary items
      { enemyName: 'ARCHON - Rogue Superintelligence', itemName: 'Void Cannon', dropChance: 0.2 },
      { enemyName: 'ARCHON - Rogue Superintelligence', itemName: 'Quantum Consciousness', dropChance: 0.15 },
      { enemyName: 'Chrome Dragon', itemName: 'Quantum Shield Matrix', dropChance: 0.2 },
      { enemyName: 'Chrome Dragon', itemName: 'Quantum Tap Interface', dropChance: 0.15 },
      { enemyName: 'The Void King', itemName: 'OMEGA Protocol', dropChance: 0.1 },
      { enemyName: 'The Void King', itemName: 'Ghost Shell', dropChance: 0.1 },
      { enemyName: 'The Void King', itemName: 'Singularity Core', dropChance: 0.08 },

      // Tier 5 enemies start dropping the new midgame line
      { enemyName: 'Black ICE Hound', itemName: 'Kiroshi Pulse Sync', dropChance: 0.12 },
      { enemyName: 'Black ICE Hound', itemName: 'Sandevistan Lite', dropChance: 0.08 },
      { enemyName: 'Maelstrom Ripper', itemName: 'Budget Arms Unity+', dropChance: 0.1 },
      { enemyName: 'Maelstrom Ripper', itemName: 'Tyger Claws Reinforced Coat', dropChance: 0.1 },
      { enemyName: 'Militech Suppressor', itemName: 'Kang Tao Shock Carbine', dropChance: 0.1 },
      { enemyName: 'Militech Suppressor', itemName: 'Trauma Team Ballistic Mesh', dropChance: 0.1 },

      // Tier 6 enemies feed the rare / epic chase
      { enemyName: 'Arasaka Counter-Intel', itemName: 'Militech Bastion Frame', dropChance: 0.1 },
      { enemyName: 'Arasaka Counter-Intel', itemName: 'QianT Synapse Rail', dropChance: 0.08 },
      { enemyName: 'Sandevistan Duelist', itemName: 'QianT Synapse Rail', dropChance: 0.12 },
      { enemyName: 'Sandevistan Duelist', itemName: 'Mantis Driver Suite', dropChance: 0.06 },
      { enemyName: 'Cyberpsycho Dragoon', itemName: 'Militech Crusher Custom', dropChance: 0.1 },
      { enemyName: 'Cyberpsycho Dragoon', itemName: 'Mantis Driver Suite', dropChance: 0.08 },
      { enemyName: 'Cerberus Siege Frame', itemName: 'Arasaka Revenant Smartgun', dropChance: 0.1 },
      { enemyName: 'Cerberus Siege Frame', itemName: 'Arasaka Specter Weave', dropChance: 0.08 },

      // Apex drops
      { enemyName: 'Blackwall Seraph', itemName: 'Blackwall Breacher', dropChance: 0.08 },
      { enemyName: 'Blackwall Seraph', itemName: 'Relic Overclock Kernel', dropChance: 0.06 },
      { enemyName: 'Mikoshi Warden', itemName: 'Mikoshi Nullskin', dropChance: 0.08 },
      { enemyName: 'Mikoshi Warden', itemName: 'Militech Apogee Sandevistan', dropChance: 0.06 },
      { enemyName: 'Soulkiller Prime', itemName: 'Blackwall Breacher', dropChance: 0.12 },
      { enemyName: 'Soulkiller Prime', itemName: 'Mikoshi Nullskin', dropChance: 0.12 },
      { enemyName: 'Soulkiller Prime', itemName: 'Militech Apogee Sandevistan', dropChance: 0.08 },
      { enemyName: 'Soulkiller Prime', itemName: 'Relic Overclock Kernel', dropChance: 0.08 },
    ] as const

    for (const entry of entries) {
      const enemyId = enemyIdByName.get(entry.enemyName)
      const itemId = itemIdByName.get(entry.itemName)
      if (!enemyId || !itemId) continue

      await EnemyLootTable.updateOrCreate(
        { enemyId, itemId },
        { enemyId, itemId, dropChance: entry.dropChance }
      )
    }
  }
}
