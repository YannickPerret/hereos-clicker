import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Companion from '#models/companion'

export default class CharacterCompanion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare companionId: number

  @column()
  declare isActive: boolean

  @column()
  declare level: number

  @column()
  declare xp: number

  @column.dateTime()
  declare acquiredAt: DateTime

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => Companion)
  declare companion: BelongsTo<typeof Companion>
}
