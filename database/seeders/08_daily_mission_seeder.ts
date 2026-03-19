import { BaseSeeder } from '@adonisjs/lucid/seeders'
import DailyMission from '#models/daily_mission'

export default class extends BaseSeeder {
  async run() {
    const missions = [
      // Click missions
      { name: 'Routine de hack', description: 'Effectue 100 clics', type: 'click', targetValue: 100, rewardType: 'credits', rewardValue: 200, icon: 'click' },
      { name: 'Hack intensif', description: 'Effectue 500 clics', type: 'click', targetValue: 500, rewardType: 'credits', rewardValue: 1000, icon: 'click' },
      { name: 'Overdrive', description: 'Effectue 1000 clics', type: 'click', targetValue: 1000, rewardType: 'xp', rewardValue: 500, icon: 'click' },

      // Kill missions
      { name: 'Nettoyage de rue', description: 'Elimine 3 ennemis en donjon', type: 'kill', targetValue: 3, rewardType: 'credits', rewardValue: 500, icon: 'kill' },
      { name: 'Chasseur de primes', description: 'Elimine 10 ennemis en donjon', type: 'kill', targetValue: 10, rewardType: 'credits', rewardValue: 2000, icon: 'kill' },
      { name: 'Exterminateur', description: 'Elimine 20 ennemis en donjon', type: 'kill', targetValue: 20, rewardType: 'xp', rewardValue: 1000, icon: 'kill' },

      // Dungeon clear
      { name: 'Exploration', description: 'Termine 1 etage de donjon', type: 'dungeon_clear', targetValue: 1, rewardType: 'credits', rewardValue: 800, icon: 'dungeon' },
      { name: 'Plongee profonde', description: 'Termine 3 etages de donjon', type: 'dungeon_clear', targetValue: 3, rewardType: 'credits', rewardValue: 3000, icon: 'dungeon' },

      // Earn credits
      { name: 'Premier million... enfin presque', description: 'Gagne 5000 credits', type: 'earn_credits', targetValue: 5000, rewardType: 'xp', rewardValue: 300, icon: 'credits' },
      { name: 'Flux de données', description: 'Gagne 20000 credits', type: 'earn_credits', targetValue: 20000, rewardType: 'credits', rewardValue: 5000, icon: 'credits' },

      // PvP
      { name: 'Gladiateur', description: 'Gagne 1 combat PvP', type: 'pvp_win', targetValue: 1, rewardType: 'credits', rewardValue: 1000, icon: 'pvp' },
      { name: 'Champion de l\'arene', description: 'Gagne 3 combats PvP', type: 'pvp_win', targetValue: 3, rewardType: 'credits', rewardValue: 5000, icon: 'pvp' },
    ] as const

    for (const mission of missions) {
      await DailyMission.updateOrCreate({ name: mission.name }, mission)
    }
  }
}
