import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'

export default class PvpMatch extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare challengerId: number

  @column()
  declare defenderId: number | null

  @column()
  declare winnerId: number | null

  @column()
  declare status: string

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Character, { foreignKey: 'challengerId' })
  declare challenger: BelongsTo<typeof Character>

  @belongsTo(() => Character, { foreignKey: 'defenderId' })
  declare defender: BelongsTo<typeof Character>
}
