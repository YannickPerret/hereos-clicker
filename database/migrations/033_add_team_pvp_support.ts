import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasQueueMode = await db.schema.hasColumn('pvp_matches', 'queue_mode')
      const hasTeamSize = await db.schema.hasColumn('pvp_matches', 'team_size')
      const hasChallengerPartyId = await db.schema.hasColumn('pvp_matches', 'challenger_party_id')
      const hasDefenderPartyId = await db.schema.hasColumn('pvp_matches', 'defender_party_id')
      const hasWinnerTeam = await db.schema.hasColumn('pvp_matches', 'winner_team')

      if (!hasQueueMode || !hasTeamSize || !hasChallengerPartyId || !hasDefenderPartyId || !hasWinnerTeam) {
        await db.schema.alterTable('pvp_matches', (table) => {
          if (!hasQueueMode) table.string('queue_mode').notNullable().defaultTo('solo')
          if (!hasTeamSize) table.integer('team_size').notNullable().defaultTo(1)
          if (!hasChallengerPartyId) table.integer('challenger_party_id').unsigned().nullable().references('id').inTable('parties').onDelete('SET NULL')
          if (!hasDefenderPartyId) table.integer('defender_party_id').unsigned().nullable().references('id').inTable('parties').onDelete('SET NULL')
          if (!hasWinnerTeam) table.integer('winner_team').nullable()
        })
      }

      const hasParticipantsTable = await db.schema.hasTable('pvp_match_participants')
      if (!hasParticipantsTable) {
        await db.schema.createTable('pvp_match_participants', (table) => {
          table.increments('id').notNullable()
          table.integer('match_id').unsigned().notNullable().references('id').inTable('pvp_matches').onDelete('CASCADE')
          table.integer('character_id').unsigned().notNullable().references('id').inTable('characters').onDelete('CASCADE')
          table.integer('team').notNullable()
          table.integer('slot').notNullable()
          table.integer('current_hp').notNullable().defaultTo(0)
          table.integer('hp_max').notNullable().defaultTo(0)
          table.boolean('is_eliminated').notNullable().defaultTo(false)
          table.timestamp('created_at').notNullable()
          table.unique(['match_id', 'character_id'])
        })
      }

      const matches = await db
        .from('pvp_matches')
        .select(
          'id',
          'challenger_id',
          'defender_id',
          'winner_id',
          'challenger_hp',
          'challenger_hp_max',
          'defender_hp',
          'defender_hp_max'
        )

      const characters = await db.from('characters').select('id', 'hp_max')
      const hpMaxById = new Map<number, number>()
      for (const character of characters) {
        hpMaxById.set(character.id, Number(character.hp_max) || 0)
      }

      for (const match of matches) {
        const existingParticipants = await db
          .from('pvp_match_participants')
          .where('match_id', match.id)

        if (existingParticipants.length === 0) {
          const inserts: Array<Record<string, unknown>> = []

          if (match.challenger_id) {
            const hpMax = Number(match.challenger_hp_max) || hpMaxById.get(match.challenger_id) || 1
            inserts.push({
              match_id: match.id,
              character_id: match.challenger_id,
              team: 1,
              slot: 1,
              current_hp: Math.max(0, Number(match.challenger_hp) || hpMax),
              hp_max: hpMax,
              is_eliminated: Math.max(0, Number(match.challenger_hp) || hpMax) <= 0,
              created_at: new Date(),
            })
          }

          if (match.defender_id) {
            const hpMax = Number(match.defender_hp_max) || hpMaxById.get(match.defender_id) || 1
            inserts.push({
              match_id: match.id,
              character_id: match.defender_id,
              team: 2,
              slot: 1,
              current_hp: Math.max(0, Number(match.defender_hp) || hpMax),
              hp_max: hpMax,
              is_eliminated: Math.max(0, Number(match.defender_hp) || hpMax) <= 0,
              created_at: new Date(),
            })
          }

          if (inserts.length > 0) {
            await db.table('pvp_match_participants').insert(inserts)
          }
        }

        if (match.winner_id) {
          const winnerTeam = match.winner_id === match.challenger_id ? 1 : match.winner_id === match.defender_id ? 2 : null
          if (winnerTeam) {
            await db.from('pvp_matches').where('id', match.id).update({ winner_team: winnerTeam })
          }
        }
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasParticipantsTable = await db.schema.hasTable('pvp_match_participants')
      if (hasParticipantsTable) {
        await db.schema.dropTable('pvp_match_participants')
      }

      const hasQueueMode = await db.schema.hasColumn('pvp_matches', 'queue_mode')
      const hasTeamSize = await db.schema.hasColumn('pvp_matches', 'team_size')
      const hasChallengerPartyId = await db.schema.hasColumn('pvp_matches', 'challenger_party_id')
      const hasDefenderPartyId = await db.schema.hasColumn('pvp_matches', 'defender_party_id')
      const hasWinnerTeam = await db.schema.hasColumn('pvp_matches', 'winner_team')

      if (hasQueueMode || hasTeamSize || hasChallengerPartyId || hasDefenderPartyId || hasWinnerTeam) {
        await db.schema.alterTable('pvp_matches', (table) => {
          if (hasQueueMode) table.dropColumn('queue_mode')
          if (hasTeamSize) table.dropColumn('team_size')
          if (hasChallengerPartyId) table.dropColumn('challenger_party_id')
          if (hasDefenderPartyId) table.dropColumn('defender_party_id')
          if (hasWinnerTeam) table.dropColumn('winner_team')
        })
      }
    })
  }
}
