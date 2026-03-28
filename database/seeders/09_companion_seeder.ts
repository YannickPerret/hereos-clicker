import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Companion from '#models/companion'

export default class extends BaseSeeder {
  async run() {
    const companions = [
      // Common
      { name: 'Micro-Drone MK1', nameEn: 'Micro-Drone MK1', description: 'Un petit drone de surveillance reconverti. Ameliore tes revenus de hack.', descriptionEn: 'A repurposed small surveillance drone. Boosts your hack income.', rarity: 'common', bonusType: 'cpc_flat', bonusValue: 2, icon: '🤖', basePrice: 500 },
      { name: 'Rat Cybernétique', nameEn: 'Cybernetic Rat', description: 'Un rat des egouts avec un implant neural. Genere des credits passivement.', descriptionEn: 'A sewer rat with a neural implant. Generates credits passively.', rarity: 'common', bonusType: 'cps_flat', bonusValue: 1, icon: '🐀', basePrice: 800 },
      { name: 'Bot Bouclier', nameEn: 'Shield Bot', description: 'Un mini-robot defensif qui renforce tes defenses.', descriptionEn: 'A defensive mini-bot that reinforces your defenses.', rarity: 'common', bonusType: 'def_flat', bonusValue: 3, icon: '🛡️', basePrice: 600 },

      // Uncommon
      { name: 'Falcon Electrique', nameEn: 'Electric Falcon', description: 'Un rapace mecanique rapide. Augmente tes chances de critique.', descriptionEn: 'A fast mechanical raptor. Increases your crit chance.', rarity: 'uncommon', bonusType: 'crit_chance', bonusValue: 3, icon: '🦅', basePrice: 2500 },
      { name: 'Spider-Bot', nameEn: 'Spider-Bot', description: 'Un arachnide robotique. Ameliore tes attaques avec du poison digital.', descriptionEn: 'A robotic arachnid. Enhances your attacks with digital poison.', rarity: 'uncommon', bonusType: 'atk_flat', bonusValue: 5, icon: '🕷️', basePrice: 3000 },
      { name: 'Nanites Collecteurs', nameEn: 'Collector Nanites', description: 'Un essaim de nanites qui ramasse des credits autour de toi.', descriptionEn: 'A nanite swarm that collects credits around you.', rarity: 'uncommon', bonusType: 'cps_flat', bonusValue: 3, icon: '✨', basePrice: 3500 },

      // Rare
      { name: 'Drone Tactique V2', nameEn: 'Tactical Drone V2', description: 'Un drone militaire reprogramme. Booste significativement tes clics.', descriptionEn: 'A reprogrammed military drone. Significantly boosts your clicks.', rarity: 'rare', bonusType: 'cpc_flat', bonusValue: 8, icon: '🚁', basePrice: 10000 },
      { name: 'Loup Chrome', nameEn: 'Chrome Wolf', description: 'Un predateur cybernetique loyal. Augmente l\'attaque en combat.', descriptionEn: 'A loyal cybernetic predator. Increases attack in combat.', rarity: 'rare', bonusType: 'atk_flat', bonusValue: 10, icon: '🐺', basePrice: 12000 },
      { name: 'Medic-Bot', nameEn: 'Medic-Bot', description: 'Un robot medecin de champ de bataille. Augmente tes HP max.', descriptionEn: 'A battlefield medic robot. Increases your max HP.', rarity: 'rare', bonusType: 'hp_flat', bonusValue: 50, icon: '💉', basePrice: 8000 },

      // Epic
      { name: 'Phoenix Digital', nameEn: 'Digital Phoenix', description: 'Une IA de combat sous forme d\'oiseau de feu. Degats critiques devastateurs.', descriptionEn: 'A combat AI in the form of a firebird. Devastating critical damage.', rarity: 'epic', bonusType: 'crit_chance', bonusValue: 8, icon: '🔥', basePrice: 35000 },
      { name: 'Golem de Données', nameEn: 'Data Golem', description: 'Un construct massif fait de donnees corrompues. Defense titanesque.', descriptionEn: 'A massive construct made of corrupted data. Titanic defense.', rarity: 'epic', bonusType: 'def_flat', bonusValue: 20, icon: '🗿', basePrice: 40000 },

      // Legendary
      { name: 'NEXUS - IA Rogue', nameEn: 'NEXUS - Rogue AI', description: 'Une intelligence artificielle rogue qui a choisi de te suivre. Booste tout.', descriptionEn: 'A rogue artificial intelligence that chose to follow you. Boosts everything.', rarity: 'legendary', bonusType: 'cpc_flat', bonusValue: 20, icon: '👁️', basePrice: 100000 },
      { name: 'Dragon Holographique', nameEn: 'Holographic Dragon', description: 'Un dragon fait de lumiere pure. Chance critique extreme.', descriptionEn: 'A dragon made of pure light. Extreme crit chance.', rarity: 'legendary', bonusType: 'crit_chance', bonusValue: 15, icon: '🐉', basePrice: 150000 },
    ] as const

    for (const companion of companions) {
      await Companion.updateOrCreate({ name: companion.name }, companion)
    }
  }
}
