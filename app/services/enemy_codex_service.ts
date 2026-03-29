import { DateTime } from 'luxon'
import CharacterEnemyCodex from '#models/character_enemy_codex'
import Enemy from '#models/enemy'
import EnemyLootTable from '#models/enemy_loot_table'
import PartyMember from '#models/party_member'
import { localize, localizeAll } from '#services/locale_service'

export default class EnemyCodexService {
  private static async getParticipantIds(partyId: number | null, fallbackCharacterId: number) {
    if (!partyId) {
      return [fallbackCharacterId]
    }

    const members = await PartyMember.query().where('partyId', partyId)
    const ids = members.map((member) => member.characterId)
    return ids.length > 0 ? ids : [fallbackCharacterId]
  }

  private static async touchCodexEntry(
    characterId: number,
    enemyId: number,
    mode: 'encounter' | 'defeat'
  ) {
    const now = DateTime.now()
    const existing = await CharacterEnemyCodex.query()
      .where('characterId', characterId)
      .where('enemyId', enemyId)
      .first()

    if (existing) {
      existing.lastSeenAt = now
      if (mode === 'encounter') {
        existing.encounters += 1
      } else {
        existing.defeats += 1
      }
      await existing.save()
      return
    }

    await CharacterEnemyCodex.create({
      characterId,
      enemyId,
      encounters: mode === 'encounter' ? 1 : 0,
      defeats: mode === 'defeat' ? 1 : 0,
      firstSeenAt: now,
      lastSeenAt: now,
    })
  }

  static async recordEncounterForRun(
    partyId: number | null,
    fallbackCharacterId: number,
    enemyId: number
  ) {
    const participantIds = await this.getParticipantIds(partyId, fallbackCharacterId)
    for (const characterId of participantIds) {
      await this.touchCodexEntry(characterId, enemyId, 'encounter')
    }
  }

  static async recordDefeatForRun(
    partyId: number | null,
    fallbackCharacterId: number,
    enemyId: number
  ) {
    const participantIds = await this.getParticipantIds(partyId, fallbackCharacterId)
    for (const characterId of participantIds) {
      await this.touchCodexEntry(characterId, enemyId, 'defeat')
    }
  }

  static async getBestiary(characterId: number, locale: string) {
    const [enemies, codexEntries, lootEntries] = await Promise.all([
      Enemy.query().orderBy('tier', 'asc').orderBy('id', 'asc'),
      CharacterEnemyCodex.query().where('characterId', characterId),
      EnemyLootTable.query().preload('item').orderBy('dropChance', 'desc').orderBy('id', 'asc'),
    ])

    const codexByEnemyId = new Map(codexEntries.map((entry) => [entry.enemyId, entry]))
    const lootByEnemyId = new Map<number, EnemyLootTable[]>()

    for (const entry of lootEntries) {
      if (!lootByEnemyId.has(entry.enemyId)) {
        lootByEnemyId.set(entry.enemyId, [])
      }
      lootByEnemyId.get(entry.enemyId)!.push(entry)
    }

    return enemies.map((enemy) => {
      const codex = codexByEnemyId.get(enemy.id) || null
      const discovered = Boolean(codex)
      const localizedEnemy = localize(enemy.serialize(), locale, ['name', 'description'])
      const loot = discovered
        ? localizeAll(
            (lootByEnemyId.get(enemy.id) || []).map((entry) => ({
              ...entry.item.serialize(),
              dropChance: entry.dropChance,
            })),
            locale,
            ['name', 'description']
          )
        : []

      return {
        id: enemy.id,
        tier: enemy.tier,
        icon: enemy.icon,
        discovered,
        encounters: codex?.encounters || 0,
        defeats: codex?.defeats || 0,
        name: discovered ? localizedEnemy.name : null,
        description: discovered ? localizedEnemy.description : null,
        stats: discovered
          ? {
              hp: enemy.hp,
              attack: enemy.attack,
              defense: enemy.defense,
              critChance: enemy.critChance,
              critDamage: enemy.critDamage,
            }
          : null,
        loot: loot.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          rarity: item.rarity,
          type: item.type,
          effectType: item.effectType,
          effectValue: item.effectValue,
        })),
      }
    })
  }
}
