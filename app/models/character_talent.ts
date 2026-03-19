import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Talent from '#models/talent'

export default class CharacterTalent extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare talentId: number

  @column()
  declare rank: number

  @column()
  declare maxRank: number

  @column.dateTime({ autoCreate: true })
  declare unlockedAt: DateTime

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => Talent)
  declare talent: BelongsTo<typeof Talent>
}
