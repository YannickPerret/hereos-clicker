import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Party from '#models/party'
import Character from '#models/character'

export default class PartyInvite extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare partyId: number

  @column()
  declare invitedByCharacterId: number

  @column()
  declare invitedCharacterId: number

  @column()
  declare status: 'pending' | 'accepted' | 'declined' | 'expired'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Party)
  declare party: BelongsTo<typeof Party>

  @belongsTo(() => Character, { foreignKey: 'invitedByCharacterId' })
  declare invitedBy: BelongsTo<typeof Character>

  @belongsTo(() => Character, { foreignKey: 'invitedCharacterId' })
  declare invitedCharacter: BelongsTo<typeof Character>
}
