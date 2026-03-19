import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Item from '#models/item'

export default class extends BaseSeeder {
  async run() {
    await Item.createMany([
      // WEAPONS
      { name: 'Plasma Pistol MK-I', description: 'Standard issue sidearm. Fires superheated plasma rounds.', type: 'weapon', rarity: 'common', icon: 'pistol', effectType: 'attack_boost', effectValue: 5, basePrice: 100 },
      { name: 'Vibro-Blade', description: 'Monomolecular edge that cuts through steel like butter.', type: 'weapon', rarity: 'common', icon: 'blade', effectType: 'attack_boost', effectValue: 8, basePrice: 200 },
      { name: 'Neural Disruptor', description: 'Fires concentrated EMP bursts that fry neural circuits.', type: 'weapon', rarity: 'uncommon', icon: 'disruptor', effectType: 'attack_boost', effectValue: 15, basePrice: 500 },
      { name: 'Railgun X-7', description: 'Magnetically accelerated tungsten slugs. Devastating.', type: 'weapon', rarity: 'rare', icon: 'railgun', effectType: 'attack_boost', effectValue: 25, basePrice: 1500 },
      { name: 'Void Cannon', description: 'Fires miniature black holes. Illegal in 47 sectors.', type: 'weapon', rarity: 'epic', icon: 'cannon', effectType: 'attack_boost', effectValue: 50, basePrice: 5000 },
      { name: 'OMEGA Protocol', description: 'Military-grade AI-guided weapon system. One shot, one kill.', type: 'weapon', rarity: 'legendary', icon: 'omega', effectType: 'attack_boost', effectValue: 100, basePrice: 20000 },

      // ARMOR
      { name: 'Kevlar Vest', description: 'Basic ballistic protection. Better than nothing.', type: 'armor', rarity: 'common', icon: 'vest', effectType: 'defense_boost', effectValue: 3, basePrice: 80 },
      { name: 'Nanoweave Jacket', description: 'Self-repairing carbon nanotube armor.', type: 'armor', rarity: 'uncommon', icon: 'jacket', effectType: 'defense_boost', effectValue: 10, basePrice: 400 },
      { name: 'Titanium Exosuit', description: 'Full-body powered armor. Military surplus.', type: 'armor', rarity: 'rare', icon: 'exosuit', effectType: 'defense_boost', effectValue: 20, basePrice: 1200 },
      { name: 'Quantum Shield Matrix', description: 'Phase-shifts incoming projectiles to another dimension.', type: 'armor', rarity: 'epic', icon: 'shield', effectType: 'defense_boost', effectValue: 40, basePrice: 4000 },
      { name: 'Ghost Shell', description: 'Experimental cloaking armor. You become untouchable.', type: 'armor', rarity: 'legendary', icon: 'ghost', effectType: 'defense_boost', effectValue: 80, basePrice: 18000 },

      // IMPLANTS (boost clicks per second)
      { name: 'Reflex Booster v1', description: 'Spinal implant. Faster reflexes, faster clicks.', type: 'implant', rarity: 'common', icon: 'chip', effectType: 'click_multiplier', effectValue: 2, basePrice: 150 },
      { name: 'Neural Accelerator', description: 'Overclocks your brain. Time feels slower.', type: 'implant', rarity: 'uncommon', icon: 'brain', effectType: 'click_multiplier', effectValue: 5, basePrice: 600 },
      { name: 'Synaptic Overdrive', description: 'Military-grade neural enhancement. Warning: may cause nosebleeds.', type: 'implant', rarity: 'rare', icon: 'synapse', effectType: 'click_multiplier', effectValue: 10, basePrice: 2000 },
      { name: 'Quantum Consciousness', description: 'Process information in parallel dimensions.', type: 'implant', rarity: 'epic', icon: 'quantum', effectType: 'click_multiplier', effectValue: 25, basePrice: 8000 },
      { name: 'Singularity Core', description: 'Your mind becomes a black hole of productivity.', type: 'implant', rarity: 'legendary', icon: 'singularity', effectType: 'click_multiplier', effectValue: 50, basePrice: 25000 },

      // CONSUMABLES
      { name: 'Stim Pack', description: 'Quick heal. Tastes like burning.', type: 'consumable', rarity: 'common', icon: 'syringe', effectType: 'hp_restore', effectValue: 30, basePrice: 25 },
      { name: 'MedGel Capsule', description: 'Advanced nanite healing compound.', type: 'consumable', rarity: 'uncommon', icon: 'capsule', effectType: 'hp_restore', effectValue: 75, basePrice: 80 },
      { name: 'Phoenix Serum', description: 'Full cellular regeneration. Back from the dead.', type: 'consumable', rarity: 'rare', icon: 'phoenix', effectType: 'hp_restore', effectValue: 999, basePrice: 300 },
      { name: 'CyberBoost Energy', description: 'Doubles your click power for the next 100 clicks.', type: 'consumable', rarity: 'uncommon', icon: 'drink', effectType: 'temp_click_boost', effectValue: 2, basePrice: 100 },
      { name: 'XP Chip', description: 'Downloadable experience. Instant knowledge.', type: 'consumable', rarity: 'rare', icon: 'xpchip', effectType: 'xp_boost', effectValue: 500, basePrice: 400 },

      // UPGRADES (permanent click power)
      { name: 'Finger Servos', description: 'Mechanical finger enhancement. Click harder.', type: 'upgrade', rarity: 'common', icon: 'servo', effectType: 'permanent_click', effectValue: 1, basePrice: 50 },
      { name: 'Haptic Amplifier', description: 'Every touch generates more credits.', type: 'upgrade', rarity: 'uncommon', icon: 'amp', effectType: 'permanent_click', effectValue: 3, basePrice: 250 },
      { name: 'Neural Click Matrix', description: 'Your brain clicks for you. Subconsciously.', type: 'upgrade', rarity: 'rare', icon: 'matrix', effectType: 'permanent_click', effectValue: 10, basePrice: 1000 },
      { name: 'Quantum Tap Interface', description: 'Each click resonates across quantum states.', type: 'upgrade', rarity: 'epic', icon: 'qtap', effectType: 'permanent_click', effectValue: 25, basePrice: 5000 },

      // RESPEC ITEM
      { name: 'Neural Respec Chip', description: 'Efface tes talents et libere tes points. Procedure douloureuse. Irreversible.', type: 'consumable', rarity: 'legendary', icon: 'respec', effectType: 'talent_respec', effectValue: 1, basePrice: 50000 },
    ])
  }
}
