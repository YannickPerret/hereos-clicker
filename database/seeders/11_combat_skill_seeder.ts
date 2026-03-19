import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CombatSkill from '#models/combat_skill'

export default class extends BaseSeeder {
  async run() {
    await CombatSkill.createMany([
      // ═══════════════════════════════════════════
      // HACKER — Offensive hacking programs
      // ═══════════════════════════════════════════
      {
        name: 'Breach Protocol',
        description: 'Hack les defenses de l\'ennemi. Reduit sa DEF de 50% pendant 2 tours.',
        spec: 'hacker',
        tierRequired: 2,
        effectType: 'debuff_def',
        effectValue: 50,
        duration: 2,
        cooldown: 4,
        icon: 'breach',
      },
      {
        name: 'Short Circuit',
        description: 'Decharge electrique directe. Inflige des degats purs qui ignorent la DEF.',
        spec: 'hacker',
        tierRequired: 3,
        effectType: 'pure_damage',
        effectValue: 150,
        duration: 0,
        cooldown: 3,
        icon: 'circuit',
      },
      {
        name: 'Backdoor',
        description: 'Infiltre le systeme ennemi. Vole des credits et inflige des degats.',
        spec: 'hacker',
        tierRequired: 4,
        effectType: 'steal_damage',
        effectValue: 120,
        duration: 0,
        cooldown: 4,
        icon: 'backdoor',
      },
      {
        name: 'Kernel Panic',
        description: 'Crash total du systeme. Degats massifs + stun 1 tour.',
        spec: 'hacker',
        tierRequired: 5,
        effectType: 'damage_stun',
        effectValue: 200,
        duration: 1,
        cooldown: 5,
        icon: 'kernel',
      },

      // ═══════════════════════════════════════════
      // NETRUNNER — Control & support programs
      // ═══════════════════════════════════════════
      {
        name: 'Ping Scan',
        description: 'Analyse la cible. Ta prochaine attaque sera un coup critique garanti.',
        spec: 'netrunner',
        tierRequired: 2,
        effectType: 'guaranteed_crit',
        effectValue: 0,
        duration: 1,
        cooldown: 3,
        icon: 'ping',
      },
      {
        name: 'ICE Breaker',
        description: 'Brise les protections. Retire tous les buffs ennemis + degats moderes.',
        spec: 'netrunner',
        tierRequired: 3,
        effectType: 'purge_damage',
        effectValue: 80,
        duration: 0,
        cooldown: 3,
        icon: 'ice',
      },
      {
        name: 'Neural Overload',
        description: 'Surcharge le cortex de l\'ennemi. Stun 1 tour + degats.',
        spec: 'netrunner',
        tierRequired: 4,
        effectType: 'damage_stun',
        effectValue: 100,
        duration: 1,
        cooldown: 4,
        icon: 'overload',
      },
      {
        name: 'System Restore',
        description: 'Programme de soin avance. Restaure 40% des HP max.',
        spec: 'netrunner',
        tierRequired: 5,
        effectType: 'heal_percent',
        effectValue: 40,
        duration: 0,
        cooldown: 5,
        icon: 'restore',
      },

      // ═══════════════════════════════════════════
      // STREET SAMURAI — Physical combat techniques
      // ═══════════════════════════════════════════
      {
        name: 'Wired Reflexes',
        description: 'Implants de reflexes actives. Frappe deux fois d\'affilee.',
        spec: 'samurai',
        tierRequired: 2,
        effectType: 'double_hit',
        effectValue: 0,
        duration: 0,
        cooldown: 3,
        icon: 'reflex',
      },
      {
        name: 'Mono-Edge Slash',
        description: 'Lame monomoleculaire. Degats lourds + saignement pendant 3 tours.',
        spec: 'samurai',
        tierRequired: 3,
        effectType: 'damage_dot',
        effectValue: 130,
        duration: 3,
        cooldown: 4,
        icon: 'mono',
      },
      {
        name: 'Subdermal Shield',
        description: 'Active le blindage sous-cutane. Absorbe le prochain coup completement.',
        spec: 'samurai',
        tierRequired: 4,
        effectType: 'shield',
        effectValue: 0,
        duration: 1,
        cooldown: 5,
        icon: 'shield',
      },
      {
        name: 'Adrenaline Surge',
        description: 'Injection d\'adrenaline. Critique garanti + triple degats.',
        spec: 'samurai',
        tierRequired: 5,
        effectType: 'mega_strike',
        effectValue: 300,
        duration: 0,
        cooldown: 6,
        icon: 'adrenaline',
      },

      // ═══════════════════════════════════════════
      // CHROME DEALER — Tech utility programs
      // ═══════════════════════════════════════════
      {
        name: 'Deploy Turret',
        description: 'Deploie une tourelle automatique. Inflige des degats bonus pendant 3 tours.',
        spec: 'chrome_dealer',
        tierRequired: 2,
        effectType: 'turret',
        effectValue: 40,
        duration: 3,
        cooldown: 4,
        icon: 'turret',
      },
      {
        name: 'Repair Nanobots',
        description: 'Active les nanobots de reparation. Restaure 30% des HP max.',
        spec: 'chrome_dealer',
        tierRequired: 3,
        effectType: 'heal_percent',
        effectValue: 30,
        duration: 0,
        cooldown: 4,
        icon: 'nanobots',
      },
      {
        name: 'EMP Blast',
        description: 'Impulsion electromagnetique. Reduit l\'ATK de l\'ennemi de 50% pendant 2 tours.',
        spec: 'chrome_dealer',
        tierRequired: 4,
        effectType: 'debuff_atk',
        effectValue: 50,
        duration: 2,
        cooldown: 4,
        icon: 'emp',
      },
      {
        name: 'Chrome Overcharge',
        description: 'Suralimente tous tes implants. ATK et DEF +50% pendant 3 tours.',
        spec: 'chrome_dealer',
        tierRequired: 5,
        effectType: 'buff_all',
        effectValue: 50,
        duration: 3,
        cooldown: 6,
        icon: 'overcharge',
      },
    ])
  }
}
