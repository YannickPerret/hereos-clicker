import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasMatchesTable = await db.schema.hasTable('pvp_matches')
      const hasParticipantsTable = await db.schema.hasTable('pvp_match_participants')

      if (hasMatchesTable) {
        const hasAcceptDeadline = await db.schema.hasColumn('pvp_matches', 'accept_deadline_at')
        if (!hasAcceptDeadline) {
          await db.schema.alterTable('pvp_matches', (table) => {
            table.bigInteger('accept_deadline_at').nullable()
          })
        }
      }

      if (hasParticipantsTable) {
        const hasReadyAccepted = await db.schema.hasColumn(
          'pvp_match_participants',
          'ready_accepted'
        )
        if (!hasReadyAccepted) {
          await db.schema.alterTable('pvp_match_participants', (table) => {
            table.boolean('ready_accepted').notNullable().defaultTo(false)
          })
        }
      }
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasMatchesTable = await db.schema.hasTable('pvp_matches')
      const hasParticipantsTable = await db.schema.hasTable('pvp_match_participants')

      if (hasParticipantsTable) {
        const hasReadyAccepted = await db.schema.hasColumn(
          'pvp_match_participants',
          'ready_accepted'
        )
        if (hasReadyAccepted) {
          await db.schema.alterTable('pvp_match_participants', (table) => {
            table.dropColumn('ready_accepted')
          })
        }
      }

      if (hasMatchesTable) {
        const hasAcceptDeadline = await db.schema.hasColumn('pvp_matches', 'accept_deadline_at')
        if (hasAcceptDeadline) {
          await db.schema.alterTable('pvp_matches', (table) => {
            table.dropColumn('accept_deadline_at')
          })
        }
      }
    })
  }
}
