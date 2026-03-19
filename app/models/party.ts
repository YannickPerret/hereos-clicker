import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import PartyMember from '#models/party_member'

export default class Party extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare leaderId: number

  @column()
  declare maxSize: number

  @column()
  declare status: 'waiting' | 'countdown' | 'in_dungeon' | 'disbanded'

  @column()
  declare countdownStart: number | null

  @column()
  declare dungeonRunId: number | null

  @column()
  declare dungeonFloorId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Character, { foreignKey: 'leaderId' })
  declare leader: BelongsTo<typeof Character>

  @hasMany(() => PartyMember)
  declare members: HasMany<typeof PartyMember>
}
