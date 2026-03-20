import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'

export default class Friendship extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare requesterCharacterId: number

  @column()
  declare addresseeCharacterId: number

  @column()
  declare status: 'pending' | 'accepted' | 'declined'

  @column.dateTime()
  declare acceptedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Character, { foreignKey: 'requesterCharacterId' })
  declare requester: BelongsTo<typeof Character>

  @belongsTo(() => Character, { foreignKey: 'addresseeCharacterId' })
  declare addressee: BelongsTo<typeof Character>
}
