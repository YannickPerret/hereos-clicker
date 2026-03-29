import Character from '#models/character'
import PartyMember from '#models/party_member'
import DungeonRun from '#models/dungeon_run'
import BossRushRun from '#models/boss_rush_run'
import IsoDungeonRun from '#models/iso_dungeon_run'
import PvpMatchParticipant from '#models/pvp_match_participant'

export type ActiveActivity = {
  type: 'dungeon' | 'pvp'
  mode: 'dungeon' | 'iso_dungeon' | 'boss_rush' | 'pvp'
  returnPath: string
}

export default class ActiveActivityService {
  static async getForUser(userId: number): Promise<ActiveActivity | null> {
    const character = await Character.query().where('userId', userId).first()
    if (!character) return null

    return this.getForCharacter(character.id)
  }

  static async getForCharacter(characterId: number): Promise<ActiveActivity | null> {
    const partyMembership = await PartyMember.query()
      .where('characterId', characterId)
      .whereHas('party', (query) => query.where('status', 'in_dungeon'))
      .preload('party')
      .first()

    if (partyMembership) {
      const partyRun = await DungeonRun.query()
        .where('partyId', partyMembership.partyId)
        .where('status', 'in_progress')
        .orderBy('id', 'desc')
        .first()

      if (partyRun) {
        return {
          type: 'dungeon',
          mode: 'dungeon',
          returnPath: `/dungeon/run/${partyRun.id}`,
        }
      }
    }

    const soloRun = await DungeonRun.query()
      .where('characterId', characterId)
      .whereNull('partyId')
      .where('status', 'in_progress')
      .orderBy('id', 'desc')
      .first()

    if (soloRun) {
      return {
        type: 'dungeon',
        mode: 'dungeon',
        returnPath: `/dungeon/run/${soloRun.id}`,
      }
    }

    const isoRun = await IsoDungeonRun.query()
      .where('characterId', characterId)
      .where('status', 'in_progress')
      .orderBy('id', 'desc')
      .first()

    if (isoRun) {
      return {
        type: 'dungeon',
        mode: 'iso_dungeon',
        returnPath: `/iso-dungeon/run/${isoRun.id}`,
      }
    }

    const bossRushRun = await BossRushRun.query()
      .where('characterId', characterId)
      .where('status', 'in_progress')
      .orderBy('id', 'desc')
      .first()

    if (bossRushRun) {
      return {
        type: 'dungeon',
        mode: 'boss_rush',
        returnPath: `/boss-rush/run/${bossRushRun.id}`,
      }
    }

    const activePvpParticipant = await PvpMatchParticipant.query()
      .where('characterId', characterId)
      .whereHas('match', (query) => query.where('status', 'in_progress'))
      .preload('match')
      .orderBy('id', 'desc')
      .first()

    if (activePvpParticipant?.match) {
      return {
        type: 'pvp',
        mode: 'pvp',
        returnPath: `/pvp/match/${activePvpParticipant.match.id}`,
      }
    }

    return null
  }
}
