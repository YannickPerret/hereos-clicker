import { BaseSchema } from '@adonisjs/lucid/schema'

const ENEMY_XP_BY_NAME: Record<string, number> = {
  'Glitched Drone': 8,
  'Neon Rat': 6,
  'Street Thug': 10,
  'Rogue AI Drone': 18,
  'Cyber Jackal': 16,
  DataWraith: 20,
  'Corp Security Bot': 30,
  'Netrunner Assassin': 34,
  'Mech Walker': 40,
  'ARCHON - Rogue Superintelligence': 70,
  'Chrome Dragon': 120,
  'The Void King': 180,
  'Black ICE Hound': 110,
  'Maelstrom Ripper': 125,
  'Militech Suppressor': 145,
  'Arasaka Counter-Intel': 170,
  'Sandevistan Duelist': 185,
  'Cyberpsycho Dragoon': 195,
  'Cerberus Siege Frame': 225,
  'Blackwall Seraph': 280,
  'Mikoshi Warden': 340,
  'Soulkiller Prime': 420,
}

const FLOOR_MIN_LEVELS: Record<number, number> = {
  1: 1,
  2: 4,
  3: 6,
  4: 9,
  5: 13,
  6: 18,
  7: 24,
  8: 30,
  9: 36,
  10: 43,
  11: 50,
  12: 60,
}

export default class extends BaseSchema {
  protected tableName = 'characters'

  async up() {
    this.defer(async (db) => {
      for (const [name, xpReward] of Object.entries(ENEMY_XP_BY_NAME)) {
        await db.from('enemies').where('name', name).update({ xp_reward: xpReward })
      }

      for (const [floorNumber, minLevel] of Object.entries(FLOOR_MIN_LEVELS)) {
        await db
          .from('dungeon_floors')
          .where('floor_number', Number(floorNumber))
          .update({ min_level: minLevel })
      }
    })
  }

  async down() {}
}
