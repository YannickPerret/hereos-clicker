import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Enemy from '#models/enemy'

export default class extends BaseSeeder {
  async run() {
    await Enemy.createMany([
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
    ])
  }
}
