import { BaseSeeder } from '@adonisjs/lucid/seeders'
import DailyMission from '#models/daily_mission'

export default class extends BaseSeeder {
  async run() {
    const missions = [
      // Click missions
      { name: 'Routine de hack', nameEn: 'Hack Routine', description: 'Effectue 100 clics', descriptionEn: 'Perform 100 clicks', type: 'click', targetValue: 100, rewardType: 'credits', rewardValue: 200, icon: 'click' },
      { name: 'Hack intensif', nameEn: 'Intensive Hack', description: 'Effectue 500 clics', descriptionEn: 'Perform 500 clicks', type: 'click', targetValue: 500, rewardType: 'credits', rewardValue: 1000, icon: 'click' },
      { name: 'Overdrive', nameEn: 'Overdrive', description: 'Effectue 1000 clics', descriptionEn: 'Perform 1000 clicks', type: 'click', targetValue: 1000, rewardType: 'xp', rewardValue: 500, icon: 'click' },

      // Kill missions
      { name: 'Nettoyage de rue', nameEn: 'Street Cleanup', description: 'Elimine 3 ennemis en donjon', descriptionEn: 'Eliminate 3 enemies in a dungeon', type: 'kill', targetValue: 3, rewardType: 'credits', rewardValue: 500, icon: 'kill' },
      { name: 'Chasseur de primes', nameEn: 'Bounty Hunter', description: 'Elimine 10 ennemis en donjon', descriptionEn: 'Eliminate 10 enemies in a dungeon', type: 'kill', targetValue: 10, rewardType: 'credits', rewardValue: 2000, icon: 'kill' },
      { name: 'Exterminateur', nameEn: 'Exterminator', description: 'Elimine 20 ennemis en donjon', descriptionEn: 'Eliminate 20 enemies in a dungeon', type: 'kill', targetValue: 20, rewardType: 'xp', rewardValue: 1000, icon: 'kill' },

      // Dungeon clear
      { name: 'Exploration', nameEn: 'Exploration', description: 'Termine 1 etage de donjon', descriptionEn: 'Complete 1 dungeon floor', type: 'dungeon_clear', targetValue: 1, rewardType: 'credits', rewardValue: 800, icon: 'dungeon' },
      { name: 'Plongee profonde', nameEn: 'Deep Dive', description: 'Termine 3 etages de donjon', descriptionEn: 'Complete 3 dungeon floors', type: 'dungeon_clear', targetValue: 3, rewardType: 'credits', rewardValue: 3000, icon: 'dungeon' },

      // Earn credits
      { name: 'Premier million... enfin presque', nameEn: 'First million... almost', description: 'Gagne 5000 credits', descriptionEn: 'Earn 5000 credits', type: 'earn_credits', targetValue: 5000, rewardType: 'xp', rewardValue: 300, icon: 'credits' },
      { name: 'Flux de données', nameEn: 'Data Flow', description: 'Gagne 20000 credits', descriptionEn: 'Earn 20000 credits', type: 'earn_credits', targetValue: 20000, rewardType: 'credits', rewardValue: 5000, icon: 'credits' },

      // PvP
      { name: 'Gladiateur', nameEn: 'Gladiator', description: 'Gagne 1 combat PvP', descriptionEn: 'Win 1 PvP fight', type: 'pvp_win', targetValue: 1, rewardType: 'credits', rewardValue: 1000, icon: 'pvp' },
      { name: 'Champion de l\'arene', nameEn: 'Arena Champion', description: 'Gagne 3 combats PvP', descriptionEn: 'Win 3 PvP fights', type: 'pvp_win', targetValue: 3, rewardType: 'credits', rewardValue: 5000, icon: 'pvp' },
    ] as const

    for (const mission of missions) {
      await DailyMission.updateOrCreate({ name: mission.name }, mission)
    }
  }
}
