import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Party from '#models/party'
import Character from '#models/character'

export default class PartyMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare partyId: number

  @column()
  declare characterId: number

  @column()
  declare isReady: boolean

  @column.dateTime({ autoCreate: true })
  declare joinedAt: DateTime

  @belongsTo(() => Party)
  declare party: BelongsTo<typeof Party>

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>
}
