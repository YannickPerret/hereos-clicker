import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import InventoryItem from '#models/inventory_item'
import CharacterTalent from '#models/character_talent'
import CharacterCompanion from '#models/character_companion'
import ClickerService from '#services/clicker_service'
import TalentService from '#services/talent_service'
import QuestService from '#services/quest_service'
import PartyMember from '#models/party_member'
import DungeonRun from '#models/dungeon_run'

export default class PlayController {
  private async getLeaderboardData() {
    const leaderboard = await Character.query()
      .orderBy('credits', 'desc')
      .limit(10)
      .select('id', 'name', 'credits', 'level', 'totalClicks')

    return leaderboard.map((character) => character.serialize())
  }

  async index({ inertia, auth }: HttpContext) {
    const characters = await Character.query().where('userId', auth.user!.id)
    const activeCharacter = characters[0] || null

    const leaderboard = await this.getLeaderboardData()

    let bonuses = { clickBonus: 0, attackBonus: 0, defenseBonus: 0 }
    let talentBonuses = {
      cpcFlat: 0, cpcPercent: 0, cpsFlat: 0, cpsPercent: 0,
      atkFlat: 0, defFlat: 0, hpFlat: 0, combatPercent: 0,
      shopDiscount: 0, lootBonus: 0, dungeonCredits: 0,
    }
    let offlineCredits = 0
    let effectiveCpc = 1
    let effectiveCps = 0
    let equippedItems: any[] = []
    let questSummary: any = null

    if (activeCharacter) {
      // Collect offline earnings
      offlineCredits = await TalentService.collectOfflineCredits(activeCharacter)
      questSummary = await QuestService.getPlaySummary(activeCharacter)
      await activeCharacter.refresh()

      bonuses = await ClickerService.calculateEquipBonuses(activeCharacter)
      talentBonuses = await TalentService.getCharacterBonuses(activeCharacter.id)
      effectiveCpc = TalentService.computeEffectiveCpc(
        activeCharacter.creditsPerClick,
        bonuses.clickBonus,
        talentBonuses
      )
      effectiveCps = TalentService.computeEffectiveCps(
        activeCharacter.creditsPerSecond,
        talentBonuses
      )

      equippedItems = await InventoryItem.query()
        .where('characterId', activeCharacter.id)
        .where('isEquipped', true)
        .preload('item')
        .orderBy('id', 'asc')
    }

    // Fetch party info if in a group
    let partyData: any = null
    if (activeCharacter) {
      const membership = await PartyMember.query()
        .where('characterId', activeCharacter.id)
        .whereHas('party', (q) => q.whereIn('status', ['waiting', 'countdown', 'in_dungeon']))
        .preload('party', (q) => q.preload('members', (mq) => mq.preload('character')))
        .first()

      if (membership) {
        const party = membership.party
        let activeDungeonRunId: number | null = null

        if (party.status === 'in_dungeon') {
          const run = await DungeonRun.query()
            .where('partyId', party.id)
            .where('status', 'in_progress')
            .first()
          activeDungeonRunId = run?.id ?? null
        }

        partyData = {
          id: party.id,
          name: party.name,
          status: party.status,
          activeDungeonRunId,
          members: party.members.map((m) => ({
            id: m.character.id,
            name: m.character.name,
            level: m.character.level,
            isReady: m.isReady,
            isLeader: m.characterId === party.leaderId,
          })),
        }
      }
    }

    return inertia.render('play/index', {
      characters: characters.map((c) => c.serialize()),
      activeCharacter: activeCharacter?.serialize() || null,
      leaderboard,
      bonuses,
      talentBonuses,
      effectiveCpc,
      effectiveCps,
      offlineCredits,
      equippedItems: equippedItems.map((entry) => ({
        ...entry.serialize(),
        item: entry.item.serialize(),
      })),
      party: partyData,
      questSummary,
    })
  }

  async createCharacter({ request, auth, response }: HttpContext) {
    const name = request.input('name', 'NetRunner')
    const count = await Character.query().where('userId', auth.user!.id).count('* as total')
    if (Number(count[0].$extras.total) >= 3) {
      return response.redirect('/play')
    }

    await Character.create({
      userId: auth.user!.id,
      name: name.substring(0, 50),
      credits: 0,
      creditsPerClick: 1,
      creditsPerSecond: 0,
      level: 1,
      xp: 0,
      hpMax: 100,
      hpCurrent: 100,
      attack: 10,
      defense: 5,
      totalClicks: 0,
      talentPoints: 1,
      lastTickAt: Date.now(),
    })

    return response.redirect('/play')
  }

  async click({ request, auth, response }: HttpContext) {
    const characterId = request.input('characterId')
    const clicks = request.input('clicks', 1)

    // Anti-cheat check
    const antiCheat = ClickerService.checkAntiCheat(auth.user!.id, clicks)
    if (!antiCheat.allowed) {
      return response.status(429).json({
        error: antiCheat.reason,
        penaltySeconds: antiCheat.penaltySeconds || 0,
        blocked: true,
      })
    }

    const character = await Character.query()
      .where('id', characterId)
      .where('userId', auth.user!.id)
      .firstOrFail()

    const result = await ClickerService.processClicks(character, clicks)
    return response.json(result)
  }

  async autoTick({ request, auth, response }: HttpContext) {
    const characterId = request.input('characterId')
    const character = await Character.query()
      .where('id', characterId)
      .where('userId', auth.user!.id)
      .firstOrFail()

    const result = await ClickerService.tick(character)
    return response.json(result)
  }

  async leaderboardState({ response }: HttpContext) {
    return response.json(await this.getLeaderboardData())
  }

  async profile({ params, inertia, response }: HttpContext) {
    const characterName = decodeURIComponent(params.name)

    const character = await Character.query()
      .whereRaw('LOWER(name) = ?', [characterName.toLowerCase()])
      .first()

    if (!character) {
      return response.notFound('Personnage introuvable')
    }

    const equippedItems = await InventoryItem.query()
      .where('characterId', character.id)
      .where('isEquipped', true)
      .preload('item')

    const unlockedTalents = await CharacterTalent.query()
      .where('characterId', character.id)
      .preload('talent')

    const companions = await CharacterCompanion.query()
      .where('characterId', character.id)
      .preload('companion')

    return inertia.render('profile/show', {
      character: character.serialize(),
      equippedItems: equippedItems.map((entry) => ({
        ...entry.serialize(),
        item: entry.item.serialize(),
      })),
      talents: unlockedTalents.map((entry) => ({
        id: entry.talent.id,
        name: entry.talent.name,
        spec: entry.talent.spec,
        tier: entry.talent.tier,
        effectType: entry.talent.effectType,
        effectValue: entry.talent.effectValue,
      })),
      companions: companions.map((entry) => ({
        id: entry.id,
        companionId: entry.companion.id,
        name: entry.companion.name,
        description: entry.companion.description,
        rarity: entry.companion.rarity,
        bonusType: entry.companion.bonusType,
        bonusValue: entry.companion.bonusValue * entry.level,
        icon: entry.companion.icon,
        isActive: entry.isActive,
        level: entry.level,
      })),
    })
  }
}
