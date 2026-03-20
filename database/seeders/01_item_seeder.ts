import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Item from '#models/item'

export default class extends BaseSeeder {
  async run() {
    const items = [
      // WEAPONS
      { name: 'Plasma Pistol MK-I', description: 'Standard issue sidearm. Fires superheated plasma rounds.', type: 'weapon', rarity: 'common', icon: 'pistol', effectType: 'attack_boost', effectValue: 5, basePrice: 100 },
      { name: 'Vibro-Blade', description: 'Monomolecular edge that cuts through steel like butter.', type: 'weapon', rarity: 'common', icon: 'blade', effectType: 'attack_boost', effectValue: 8, basePrice: 200 },
      { name: 'Budget Arms Unity+', description: 'A tuned street pistol with smart recoil dampers and black market firmware.', type: 'weapon', rarity: 'common', icon: 'unity', effectType: 'attack_boost', effectValue: 11, basePrice: 350 },
      { name: 'Neural Disruptor', description: 'Fires concentrated EMP bursts that fry neural circuits.', type: 'weapon', rarity: 'uncommon', icon: 'disruptor', effectType: 'attack_boost', effectValue: 15, basePrice: 500 },
      { name: 'Kang Tao Shock Carbine', description: 'Compact corporate carbine that dumps a violent electric burst into soft targets.', type: 'weapon', rarity: 'uncommon', icon: 'carbine', effectType: 'attack_boost', effectValue: 22, basePrice: 1400 },
      { name: 'Railgun X-7', description: 'Magnetically accelerated tungsten slugs. Devastating.', type: 'weapon', rarity: 'rare', icon: 'railgun', effectType: 'attack_boost', effectValue: 25, basePrice: 1500 },
      { name: 'Militech Crusher Custom', description: 'A brutal tactical shotgun refitted for close-quarters suppression.', type: 'weapon', rarity: 'rare', icon: 'crusher', effectType: 'attack_boost', effectValue: 38, basePrice: 8500 },
      { name: 'Void Cannon', description: 'Fires miniature black holes. Illegal in 47 sectors.', type: 'weapon', rarity: 'epic', icon: 'cannon', effectType: 'attack_boost', effectValue: 50, basePrice: 5000 },
      { name: 'Arasaka Revenant Smartgun', description: 'Prototype smart weapon that stitches targeting lines directly into your optic feed.', type: 'weapon', rarity: 'epic', icon: 'smartgun', effectType: 'attack_boost', effectValue: 78, basePrice: 52000 },
      { name: 'OMEGA Protocol', description: 'Military-grade AI-guided weapon system. One shot, one kill.', type: 'weapon', rarity: 'legendary', icon: 'omega', effectType: 'attack_boost', effectValue: 100, basePrice: 20000 },
      { name: 'Blackwall Breacher', description: 'A forbidden platform built to punch through daemons, steel, and people alike.', type: 'weapon', rarity: 'legendary', icon: 'blackwall', effectType: 'attack_boost', effectValue: 155, basePrice: 240000 },

      // ARMOR
      { name: 'Kevlar Vest', description: 'Basic ballistic protection. Better than nothing.', type: 'armor', rarity: 'common', icon: 'vest', effectType: 'defense_boost', effectValue: 3, basePrice: 80 },
      { name: 'Tyger Claws Reinforced Coat', description: 'Street armor lined with ceramic weave and enough plating to survive bad odds.', type: 'armor', rarity: 'common', icon: 'coat', effectType: 'defense_boost', effectValue: 6, basePrice: 300 },
      { name: 'Nanoweave Jacket', description: 'Self-repairing carbon nanotube armor.', type: 'armor', rarity: 'uncommon', icon: 'jacket', effectType: 'defense_boost', effectValue: 10, basePrice: 400 },
      { name: 'Trauma Team Ballistic Mesh', description: 'Emergency response body mesh rated for urban firefights and patient extraction.', type: 'armor', rarity: 'uncommon', icon: 'mesh', effectType: 'defense_boost', effectValue: 15, basePrice: 1250 },
      { name: 'Titanium Exosuit', description: 'Full-body powered armor. Military surplus.', type: 'armor', rarity: 'rare', icon: 'exosuit', effectType: 'defense_boost', effectValue: 20, basePrice: 1200 },
      { name: 'Militech Bastion Frame', description: 'Heavy tactical plating with servo-assisted bracing for sustained fire.', type: 'armor', rarity: 'rare', icon: 'bastion', effectType: 'defense_boost', effectValue: 30, basePrice: 7800 },
      { name: 'Quantum Shield Matrix', description: 'Phase-shifts incoming projectiles to another dimension.', type: 'armor', rarity: 'epic', icon: 'shield', effectType: 'defense_boost', effectValue: 40, basePrice: 4000 },
      { name: 'Arasaka Specter Weave', description: 'Reactive corporate armor that stiffens milliseconds before impact.', type: 'armor', rarity: 'epic', icon: 'specter', effectType: 'defense_boost', effectValue: 58, basePrice: 47000 },
      { name: 'Ghost Shell', description: 'Experimental cloaking armor. You become untouchable.', type: 'armor', rarity: 'legendary', icon: 'ghost', effectType: 'defense_boost', effectValue: 80, basePrice: 18000 },
      { name: 'Mikoshi Nullskin', description: 'A ghost-white combat shell threaded with forbidden engram shielding.', type: 'armor', rarity: 'legendary', icon: 'nullskin', effectType: 'defense_boost', effectValue: 125, basePrice: 210000 },

      // IMPLANTS (boost clicks per second)
      { name: 'Reflex Booster v1', description: 'Spinal implant. Faster reflexes, faster clicks.', type: 'implant', rarity: 'common', icon: 'chip', effectType: 'click_multiplier', effectValue: 2, basePrice: 150 },
      { name: 'Kiroshi Pulse Sync', description: 'A cheap optic-rhythm mod that smooths your hand timing and micro-inputs.', type: 'implant', rarity: 'common', icon: 'pulse', effectType: 'click_multiplier', effectValue: 4, basePrice: 400 },
      { name: 'Neural Accelerator', description: 'Overclocks your brain. Time feels slower.', type: 'implant', rarity: 'uncommon', icon: 'brain', effectType: 'click_multiplier', effectValue: 5, basePrice: 600 },
      { name: 'Sandevistan Lite', description: 'A stripped-down time dilation implant with enough kick to feel unfair.', type: 'implant', rarity: 'uncommon', icon: 'sandevistan', effectType: 'click_multiplier', effectValue: 8, basePrice: 1600 },
      { name: 'Synaptic Overdrive', description: 'Military-grade neural enhancement. Warning: may cause nosebleeds.', type: 'implant', rarity: 'rare', icon: 'synapse', effectType: 'click_multiplier', effectValue: 10, basePrice: 2000 },
      { name: 'QianT Synapse Rail', description: 'Corporate-grade neural threading for relentless output and cleaner burst execution.', type: 'implant', rarity: 'rare', icon: 'qiant', effectType: 'click_multiplier', effectValue: 15, basePrice: 9200 },
      { name: 'Quantum Consciousness', description: 'Process information in parallel dimensions.', type: 'implant', rarity: 'epic', icon: 'quantum', effectType: 'click_multiplier', effectValue: 25, basePrice: 8000 },
      { name: 'Mantis Driver Suite', description: 'A combat cognition stack that keeps your nervous system running past safe limits.', type: 'implant', rarity: 'epic', icon: 'mantis', effectType: 'click_multiplier', effectValue: 36, basePrice: 56000 },
      { name: 'Singularity Core', description: 'Your mind becomes a black hole of productivity.', type: 'implant', rarity: 'legendary', icon: 'singularity', effectType: 'click_multiplier', effectValue: 50, basePrice: 25000 },
      { name: 'Militech Apogee Sandevistan', description: 'A top-tier time dilation system that turns combat into a slow-motion execution reel.', type: 'implant', rarity: 'legendary', icon: 'apogee', effectType: 'click_multiplier', effectValue: 95, basePrice: 320000 },
      { name: 'Relic Overclock Kernel', description: 'A relic-derived shard that lets your brain chew through impossible action density.', type: 'implant', rarity: 'legendary', icon: 'relic', effectType: 'click_multiplier', effectValue: 82, basePrice: 260000 },

      // CONSUMABLES
      { name: 'Stim Pack', description: 'Quick heal. Tastes like burning.', type: 'consumable', rarity: 'common', icon: 'syringe', effectType: 'hp_restore', effectValue: 30, basePrice: 25 },
      { name: 'MedGel Capsule', description: 'Advanced nanite healing compound.', type: 'consumable', rarity: 'uncommon', icon: 'capsule', effectType: 'hp_restore', effectValue: 75, basePrice: 80 },
      { name: 'Phoenix Serum', description: 'Full cellular regeneration. Back from the dead.', type: 'consumable', rarity: 'rare', icon: 'phoenix', effectType: 'hp_restore', effectValue: 999, basePrice: 300 },
      { name: 'CyberBoost Energy', description: 'Doubles your click power for the next 100 clicks.', type: 'consumable', rarity: 'uncommon', icon: 'drink', effectType: 'temp_click_boost', effectValue: 2, basePrice: 100 },
      { name: 'XP Chip', description: 'Downloadable experience. Instant knowledge.', type: 'consumable', rarity: 'rare', icon: 'xpchip', effectType: 'xp_boost', effectValue: 500, basePrice: 400 },

      // UPGRADES (permanent click power)
      { name: 'Finger Servos', description: 'Mechanical finger enhancement. Grants a modest permanent CPC boost.', type: 'upgrade', rarity: 'common', icon: 'servo', effectType: 'permanent_click', effectValue: 1, basePrice: 5000 },
      { name: 'Haptic Amplifier', description: 'Feedback loops amplify every contact. Limited stock, bigger permanent CPC gain.', type: 'upgrade', rarity: 'uncommon', icon: 'amp', effectType: 'permanent_click', effectValue: 3, basePrice: 50000 },
      { name: 'Neural Click Matrix', description: 'A high-end matrix that permanently lifts click throughput once unlocked.', type: 'upgrade', rarity: 'rare', icon: 'matrix', effectType: 'permanent_click', effectValue: 5, basePrice: 500000 },
      { name: 'Quantum Tap Interface', description: 'Late-game tap resonance hardware. Expensive, scarce, and permanent.', type: 'upgrade', rarity: 'epic', icon: 'qtap', effectType: 'permanent_click', effectValue: 8, basePrice: 5000000 },

      // RESPEC ITEM
      { name: 'Neural Respec Chip', description: 'Efface tes talents et libere tes points. Procedure douloureuse. Irreversible.', type: 'consumable', rarity: 'legendary', icon: 'respec', effectType: 'talent_respec', effectValue: 1, basePrice: 50000 },
    ] as const

    for (const item of items) {
      await Item.updateOrCreate({ name: item.name }, item)
    }
  }
}
