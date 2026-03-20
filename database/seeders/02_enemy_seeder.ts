import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Enemy from '#models/enemy'

export default class extends BaseSeeder {
  async run() {
    const enemies = [
      // TIER 1 - Street Level (low crit)
      { name: 'Glitched Drone', description: 'A malfunctioning surveillance drone. Sparks fly from its cracked chassis.', hp: 30, attack: 5, defense: 2, xpReward: 10, creditsRewardMin: 5, creditsRewardMax: 15, icon: 'drone', tier: 1, critChance: 3, critDamage: 130 },
      { name: 'Neon Rat', description: 'Mutated sewer rat with bioluminescent fur. Bites through steel.', hp: 20, attack: 8, defense: 1, xpReward: 8, creditsRewardMin: 3, creditsRewardMax: 10, icon: 'rat', tier: 1, critChance: 5, critDamage: 140 },
      { name: 'Street Thug', description: 'Low-level gang member with a rusty pipe. Desperate and dangerous.', hp: 50, attack: 7, defense: 3, xpReward: 15, creditsRewardMin: 10, creditsRewardMax: 25, icon: 'thug', tier: 1, critChance: 4, critDamage: 135 },

      // TIER 2 - Underground (moderate crit)
      { name: 'Rogue AI Drone', description: 'Self-aware combat drone. Its red eye tracks your every move.', hp: 80, attack: 15, defense: 8, xpReward: 30, creditsRewardMin: 20, creditsRewardMax: 50, icon: 'aidrone', tier: 2, critChance: 8, critDamage: 155 },
      { name: 'Cyber Jackal', description: 'Half-machine, half-beast. Hunts in the abandoned metro tunnels.', hp: 60, attack: 20, defense: 5, xpReward: 25, creditsRewardMin: 15, creditsRewardMax: 40, icon: 'jackal', tier: 2, critChance: 10, critDamage: 160 },
      { name: 'DataWraith', description: 'Ghost in the machine. A corrupted AI that manifests as static.', hp: 70, attack: 18, defense: 10, xpReward: 35, creditsRewardMin: 25, creditsRewardMax: 60, icon: 'wraith', tier: 2, critChance: 7, critDamage: 150 },

      // TIER 3 - Corporate (high crit)
      { name: 'Corp Security Bot', description: 'Heavy-armored corporate security automaton. Authorized to kill.', hp: 150, attack: 25, defense: 20, xpReward: 60, creditsRewardMin: 50, creditsRewardMax: 120, icon: 'secbot', tier: 3, critChance: 10, critDamage: 170 },
      { name: 'Netrunner Assassin', description: 'Elite hacker turned killer. Can fry your implants remotely.', hp: 100, attack: 35, defense: 12, xpReward: 70, creditsRewardMin: 60, creditsRewardMax: 150, icon: 'netrunner', tier: 3, critChance: 15, critDamage: 180 },
      { name: 'Mech Walker', description: 'Bipedal war machine. The ground shakes with each step.', hp: 200, attack: 30, defense: 25, xpReward: 80, creditsRewardMin: 80, creditsRewardMax: 200, icon: 'mech', tier: 3, critChance: 8, critDamage: 200 },

      // TIER 4 - Bosses (dangerous crit)
      { name: 'ARCHON - Rogue Superintelligence', description: 'A god-level AI that escaped containment. Reality bends around it.', hp: 500, attack: 50, defense: 30, xpReward: 200, creditsRewardMin: 300, creditsRewardMax: 800, icon: 'archon', tier: 4, critChance: 12, critDamage: 200 },
      { name: 'Chrome Dragon', description: 'Experimental bioweapon. 50 tons of titanium scales and plasma breath.', hp: 800, attack: 60, defense: 40, xpReward: 350, creditsRewardMin: 500, creditsRewardMax: 1500, icon: 'dragon', tier: 4, critChance: 15, critDamage: 220 },
      { name: 'The Void King', description: 'Nobody knows what it is. Those who see it dont come back.', hp: 1200, attack: 80, defense: 50, xpReward: 500, creditsRewardMin: 1000, creditsRewardMax: 3000, icon: 'voidking', tier: 4, critChance: 20, critDamage: 250 },

      // TIER 5 - Midgame pressure
      { name: 'Black ICE Hound', description: 'A predatory anti-intrusion construct unleashed from a buried net architecture.', hp: 1800, attack: 110, defense: 75, xpReward: 650, creditsRewardMin: 3500, creditsRewardMax: 6500, icon: 'icehound', tier: 5, critChance: 16, critDamage: 195 },
      { name: 'Maelstrom Ripper', description: 'A chrome-packed psycho ganger chasing heat, blood, and fresh implants.', hp: 2200, attack: 125, defense: 85, xpReward: 720, creditsRewardMin: 4000, creditsRewardMax: 7500, icon: 'maelstrom', tier: 5, critChance: 18, critDamage: 205 },
      { name: 'Militech Suppressor', description: 'Private military hardware wrapped in a man-shaped problem.', hp: 2600, attack: 135, defense: 95, xpReward: 820, creditsRewardMin: 5200, creditsRewardMax: 9000, icon: 'militech', tier: 5, critChance: 14, critDamage: 190 },

      // TIER 6 - Endgame corps and cyberpsychos
      { name: 'Arasaka Counter-Intel', description: 'A black-ops operative carrying encrypted kill-orders and zero patience.', hp: 3200, attack: 155, defense: 110, xpReward: 1000, creditsRewardMin: 7000, creditsRewardMax: 12000, icon: 'counterintel', tier: 6, critChance: 20, critDamage: 215 },
      { name: 'Sandevistan Duelist', description: 'A chrome assassin who flickers through gunfire and leaves only delayed blood behind.', hp: 3500, attack: 168, defense: 112, xpReward: 1080, creditsRewardMin: 7600, creditsRewardMax: 13500, icon: 'duelist', tier: 6, critChance: 25, critDamage: 230 },
      { name: 'Cyberpsycho Dragoon', description: 'A collapsed merc chassis driven only by combat implants and rage.', hp: 3900, attack: 175, defense: 120, xpReward: 1150, creditsRewardMin: 8500, creditsRewardMax: 15000, icon: 'dragoon', tier: 6, critChance: 22, critDamage: 225 },
      { name: 'Cerberus Siege Frame', description: 'Three redundant targeting cores, armored legs, and just enough ammo to erase a district.', hp: 4700, attack: 195, defense: 135, xpReward: 1325, creditsRewardMin: 11000, creditsRewardMax: 19000, icon: 'cerberus', tier: 6, critChance: 16, critDamage: 210 },

      // TIER 7 - Apex encounters
      { name: 'Blackwall Seraph', description: 'An impossible angel of broken code leaking through a forbidden breach.', hp: 6200, attack: 230, defense: 165, xpReward: 1750, creditsRewardMin: 18000, creditsRewardMax: 30000, icon: 'seraph', tier: 7, critChance: 24, critDamage: 235 },
      { name: 'Mikoshi Warden', description: 'A soul prison custodian turned execution engine for anyone trespassing too deep.', hp: 7800, attack: 255, defense: 185, xpReward: 2200, creditsRewardMin: 24000, creditsRewardMax: 42000, icon: 'warden', tier: 7, critChance: 26, critDamage: 245 },
      { name: 'Soulkiller Prime', description: 'The terminal weaponized. It does not kill the body first because it does not need to.', hp: 9800, attack: 285, defense: 220, xpReward: 2800, creditsRewardMin: 32000, creditsRewardMax: 55000, icon: 'soulkiller', tier: 7, critChance: 28, critDamage: 260 },
    ] as const

    for (const enemy of enemies) {
      await Enemy.updateOrCreate({ name: enemy.name }, enemy)
    }
  }
}
