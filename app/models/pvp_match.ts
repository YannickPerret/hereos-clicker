import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import PvpMatchParticipant from '#models/pvp_match_participant'

export default class PvpMatch extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare challengerId: number

  @column()
  declare defenderId: number | null

  @column()
  declare challengerPartyId: number | null

  @column()
  declare defenderPartyId: number | null

  @column()
  declare winnerId: number | null

  @column()
  declare winnerTeam: number | null

  @column()
  declare status: string

  @column()
  declare queueMode: 'solo' | 'duo' | 'trio'

  @column()
  declare teamSize: number

  @column()
  declare currentTurnId: number | null

  @column()
  declare challengerHp: number

  @column()
  declare challengerHpMax: number

  @column()
  declare defenderHp: number

  @column()
  declare defenderHpMax: number

  @column()
  declare log: string

  @column()
  declare skillCooldowns: string

  @column()
  declare activeEffects: string

  @column()
  declare ratingChange: number

  @column()
  declare createdAt: number

  @column()
  declare updatedAt: number | null

  @belongsTo(() => Character, { foreignKey: 'challengerId' })
  declare challenger: BelongsTo<typeof Character>

  @belongsTo(() => Character, { foreignKey: 'defenderId' })
  declare defender: BelongsTo<typeof Character>

  @hasMany(() => PvpMatchParticipant, { foreignKey: 'matchId' })
  declare participants: HasMany<typeof PvpMatchParticipant>
}
