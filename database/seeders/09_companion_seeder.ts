import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Companion from '#models/companion'

export default class extends BaseSeeder {
  async run() {
    const companions = [
      // Common
      { name: 'Micro-Drone MK1', description: 'Un petit drone de surveillance reconverti. Ameliore tes revenus de hack.', rarity: 'common', bonusType: 'cpc_flat', bonusValue: 2, icon: '🤖', basePrice: 500 },
      { name: 'Rat Cybernétique', description: 'Un rat des egouts avec un implant neural. Genere des credits passivement.', rarity: 'common', bonusType: 'cps_flat', bonusValue: 1, icon: '🐀', basePrice: 800 },
      { name: 'Bot Bouclier', description: 'Un mini-robot defensif qui renforce tes defenses.', rarity: 'common', bonusType: 'def_flat', bonusValue: 3, icon: '🛡️', basePrice: 600 },

      // Uncommon
      { name: 'Falcon Electrique', description: 'Un rapace mecanique rapide. Augmente tes chances de critique.', rarity: 'uncommon', bonusType: 'crit_chance', bonusValue: 3, icon: '🦅', basePrice: 2500 },
      { name: 'Spider-Bot', description: 'Un arachnide robotique. Ameliore tes attaques avec du poison digital.', rarity: 'uncommon', bonusType: 'atk_flat', bonusValue: 5, icon: '🕷️', basePrice: 3000 },
      { name: 'Nanites Collecteurs', description: 'Un essaim de nanites qui ramasse des credits autour de toi.', rarity: 'uncommon', bonusType: 'cps_flat', bonusValue: 3, icon: '✨', basePrice: 3500 },

      // Rare
      { name: 'Drone Tactique V2', description: 'Un drone militaire reprogramme. Booste significativement tes clics.', rarity: 'rare', bonusType: 'cpc_flat', bonusValue: 8, icon: '🚁', basePrice: 10000 },
      { name: 'Loup Chrome', description: 'Un predateur cybernetique loyal. Augmente l\'attaque en combat.', rarity: 'rare', bonusType: 'atk_flat', bonusValue: 10, icon: '🐺', basePrice: 12000 },
      { name: 'Medic-Bot', description: 'Un robot medecin de champ de bataille. Augmente tes HP max.', rarity: 'rare', bonusType: 'hp_flat', bonusValue: 50, icon: '💉', basePrice: 8000 },

      // Epic
      { name: 'Phoenix Digital', description: 'Une IA de combat sous forme d\'oiseau de feu. Degats critiques devastateurs.', rarity: 'epic', bonusType: 'crit_chance', bonusValue: 8, icon: '🔥', basePrice: 35000 },
      { name: 'Golem de Données', description: 'Un construct massif fait de donnees corrompues. Defense titanesque.', rarity: 'epic', bonusType: 'def_flat', bonusValue: 20, icon: '🗿', basePrice: 40000 },

      // Legendary
      { name: 'NEXUS - IA Rogue', description: 'Une intelligence artificielle rogue qui a choisi de te suivre. Booste tout.', rarity: 'legendary', bonusType: 'cpc_flat', bonusValue: 20, icon: '👁️', basePrice: 100000 },
      { name: 'Dragon Holographique', description: 'Un dragon fait de lumiere pure. Chance critique extreme.', rarity: 'legendary', bonusType: 'crit_chance', bonusValue: 15, icon: '🐉', basePrice: 150000 },
    ] as const

    for (const companion of companions) {
      await Companion.updateOrCreate({ name: companion.name }, companion)
    }
  }
}
