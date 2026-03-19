import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Talent from '#models/talent'

export default class extends BaseSeeder {
  async run() {
    const talents = [
      // ═══════════════════════════════════════════
      // HACKER - Click power & burst damage
      // ═══════════════════════════════════════════
      { id: 1, name: 'Exploit Script', description: 'Tes doigts trouvent les failles. +2 credits par clic.', spec: 'hacker', tier: 1, icon: 'terminal', effectType: 'cpc_flat', effectValue: 2, cost: 1, requiresTalentId: null, requiresLevel: 1 },
      { id: 2, name: 'Buffer Overflow', description: 'Surcharge le systeme. +5 credits par clic.', spec: 'hacker', tier: 2, icon: 'overflow', effectType: 'cpc_flat', effectValue: 5, cost: 1, requiresTalentId: 1, requiresLevel: 3 },
      { id: 3, name: 'Zero-Day', description: 'Tu exploites ce que personne ne connait. Clics x1.5.', spec: 'hacker', tier: 3, icon: 'zeroday', effectType: 'cpc_percent', effectValue: 50, cost: 2, requiresTalentId: 2, requiresLevel: 5 },
      { id: 4, name: 'Brute Force', description: 'Puissance brute. +15 credits par clic.', spec: 'hacker', tier: 4, icon: 'bruteforce', effectType: 'cpc_flat', effectValue: 15, cost: 2, requiresTalentId: 3, requiresLevel: 8 },
      { id: 5, name: 'Kernel Panic', description: 'Ton clic fait crasher la matrice. Clics x2.', spec: 'hacker', tier: 5, icon: 'kernel', effectType: 'cpc_percent', effectValue: 100, cost: 3, requiresTalentId: 4, requiresLevel: 12 },

      // ═══════════════════════════════════════════
      // NETRUNNER - Auto-click / CPS (Credits Per Second)
      // ═══════════════════════════════════════════
      { id: 6, name: 'Daemon v1', description: 'Un script tourne en fond. +1 credit/sec.', spec: 'netrunner', tier: 1, icon: 'daemon', effectType: 'cps_flat', effectValue: 1, cost: 1, requiresTalentId: null, requiresLevel: 1 },
      { id: 7, name: 'Botnet Lite', description: 'Petit reseau de bots. +3 credits/sec.', spec: 'netrunner', tier: 2, icon: 'botnet', effectType: 'cps_flat', effectValue: 3, cost: 1, requiresTalentId: 6, requiresLevel: 3 },
      { id: 8, name: 'Neural Sync', description: 'Ton cerveau mine en dormant. CPS x1.5.', spec: 'netrunner', tier: 3, icon: 'sync', effectType: 'cps_percent', effectValue: 50, cost: 2, requiresTalentId: 7, requiresLevel: 5 },
      { id: 9, name: 'Distributed Network', description: 'Des milliers de nodes travaillent pour toi. +10 credits/sec.', spec: 'netrunner', tier: 4, icon: 'network', effectType: 'cps_flat', effectValue: 10, cost: 2, requiresTalentId: 8, requiresLevel: 8 },
      { id: 10, name: 'Singularity Protocol', description: 'L\'IA travaille pour toi. CPS x2.', spec: 'netrunner', tier: 5, icon: 'singularity', effectType: 'cps_percent', effectValue: 100, cost: 3, requiresTalentId: 9, requiresLevel: 12 },

      // ═══════════════════════════════════════════
      // STREET SAMURAI - Combat stats
      // ═══════════════════════════════════════════
      { id: 11, name: 'Cyber Reflexes', description: 'Reactions surhumaines. +5 ATK.', spec: 'samurai', tier: 1, icon: 'reflex', effectType: 'atk_flat', effectValue: 5, cost: 1, requiresTalentId: null, requiresLevel: 1 },
      { id: 12, name: 'Titanium Bones', description: 'Squelette renforce. +5 DEF, +20 HP max.', spec: 'samurai', tier: 2, icon: 'bones', effectType: 'def_flat', effectValue: 5, cost: 1, requiresTalentId: 11, requiresLevel: 3 },
      { id: 13, name: 'Berserker Chip', description: 'Mode rage. ATK +15, mais DEF -3.', spec: 'samurai', tier: 3, icon: 'berserker', effectType: 'atk_flat', effectValue: 15, cost: 2, requiresTalentId: 12, requiresLevel: 5 },
      { id: 14, name: 'Subdermal Armor', description: 'Blindage sous la peau. +15 DEF, +50 HP max.', spec: 'samurai', tier: 4, icon: 'subdermal', effectType: 'def_flat', effectValue: 15, cost: 2, requiresTalentId: 13, requiresLevel: 8 },
      { id: 15, name: 'Omega Warrior', description: 'Tu deviens une arme vivante. ATK x1.5, DEF x1.5.', spec: 'samurai', tier: 5, icon: 'omega', effectType: 'combat_percent', effectValue: 50, cost: 3, requiresTalentId: 14, requiresLevel: 12 },

      // ═══════════════════════════════════════════
      // CHROME DEALER - Economie & Loot
      // ═══════════════════════════════════════════
      { id: 16, name: 'Street Cred', description: 'Les marchands te respectent. -10% prix shop.', spec: 'chrome_dealer', tier: 1, icon: 'cred', effectType: 'shop_discount', effectValue: 10, cost: 1, requiresTalentId: null, requiresLevel: 1 },
      { id: 17, name: 'Scavenger Eye', description: 'Tu vois ce que les autres ratent. +15% loot chance.', spec: 'chrome_dealer', tier: 2, icon: 'eye', effectType: 'loot_bonus', effectValue: 15, cost: 1, requiresTalentId: 16, requiresLevel: 3 },
      { id: 18, name: 'Black Market Access', description: 'Contacts au marche noir. -20% prix shop.', spec: 'chrome_dealer', tier: 3, icon: 'market', effectType: 'shop_discount', effectValue: 20, cost: 2, requiresTalentId: 17, requiresLevel: 5 },
      { id: 19, name: 'Bounty Hunter', description: 'Credits bonus des ennemis. +50% credits donjon.', spec: 'chrome_dealer', tier: 4, icon: 'bounty', effectType: 'dungeon_credits', effectValue: 50, cost: 2, requiresTalentId: 18, requiresLevel: 8 },
      { id: 20, name: 'Corporate Insider', description: 'Tu connais les secrets. Loot x2, prix -30%.', spec: 'chrome_dealer', tier: 5, icon: 'insider', effectType: 'loot_bonus', effectValue: 100, cost: 3, requiresTalentId: 19, requiresLevel: 12 },
    ]

    for (const talent of talents) {
      await Talent.updateOrCreate({ id: talent.id }, talent as any)
    }
  }
}
