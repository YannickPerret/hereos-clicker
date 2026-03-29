import { BaseSchema } from '@adonisjs/lucid/schema'

const LOOT_REBALANCE = [
  ['ARCHON - Rogue Superintelligence', 'Void Cannon', 0.04],
  ['ARCHON - Rogue Superintelligence', 'Quantum Consciousness', 0.025],
  ['Chrome Dragon', 'Quantum Shield Matrix', 0.04],
  ['Chrome Dragon', 'Quantum Tap Interface', 0.025],
  ['The Void King', 'QianT Synapse Rail', 0.06],
  ['The Void King', 'OMEGA Protocol', 0.006],
  ['The Void King', 'Ghost Shell', 0.006],
  ['The Void King', 'Singularity Core', 0.005],

  ['Arasaka Counter-Intel', 'Kang Tao Shock Carbine', 0.14],
  ['Arasaka Counter-Intel', 'Trauma Team Ballistic Mesh', 0.12],
  ['Arasaka Counter-Intel', 'Militech Bastion Frame', 0.05],
  ['Arasaka Counter-Intel', 'QianT Synapse Rail', 0.03],
  ['Sandevistan Duelist', 'Sandevistan Lite', 0.14],
  ['Sandevistan Duelist', 'QianT Synapse Rail', 0.05],
  ['Sandevistan Duelist', 'Mantis Driver Suite', 0.008],
  ['Cyberpsycho Dragoon', 'Budget Arms Unity+', 0.14],
  ['Cyberpsycho Dragoon', 'Militech Crusher Custom', 0.05],
  ['Cyberpsycho Dragoon', 'Mantis Driver Suite', 0.01],
  ['Cerberus Siege Frame', 'Trauma Team Ballistic Mesh', 0.12],
  ['Cerberus Siege Frame', 'Militech Bastion Frame', 0.05],
  ['Cerberus Siege Frame', 'Arasaka Revenant Smartgun', 0.01],
  ['Cerberus Siege Frame', 'Arasaka Specter Weave', 0.008],

  ['Blackwall Seraph', 'Kiroshi Pulse Sync', 0.14],
  ['Blackwall Seraph', 'QianT Synapse Rail', 0.05],
  ['Blackwall Seraph', 'Blackwall Breacher', 0.004],
  ['Blackwall Seraph', 'Relic Overclock Kernel', 0.0025],
  ['Mikoshi Warden', 'Trauma Team Ballistic Mesh', 0.12],
  ['Mikoshi Warden', 'Militech Bastion Frame', 0.05],
  ['Mikoshi Warden', 'Mikoshi Nullskin', 0.003],
  ['Mikoshi Warden', 'Militech Apogee Sandevistan', 0.002],
  ['Soulkiller Prime', 'QianT Synapse Rail', 0.06],
  ['Soulkiller Prime', 'Militech Crusher Custom', 0.05],
  ['Soulkiller Prime', 'Blackwall Breacher', 0.006],
  ['Soulkiller Prime', 'Mikoshi Nullskin', 0.005],
  ['Soulkiller Prime', 'Militech Apogee Sandevistan', 0.004],
  ['Soulkiller Prime', 'Relic Overclock Kernel', 0.003],
] as const

export default class extends BaseSchema {
  protected tableName = 'enemy_loot_tables'

  async up() {
    this.defer(async (db) => {
      for (const [enemyName, itemName, dropChance] of LOOT_REBALANCE) {
        const enemy = await db.from('enemies').where('name', enemyName).select('id').first()
        const item = await db.from('items').where('name', itemName).select('id').first()

        if (!enemy?.id || !item?.id) continue

        const existing = await db
          .from('enemy_loot_tables')
          .where('enemy_id', enemy.id)
          .where('item_id', item.id)
          .first()

        if (existing) {
          await db
            .from('enemy_loot_tables')
            .where('id', existing.id)
            .update({ drop_chance: dropChance })
        } else {
          await db.table('enemy_loot_tables').insert({
            enemy_id: enemy.id,
            item_id: item.id,
            drop_chance: dropChance,
          })
        }
      }
    })
  }

  async down() {}
}
