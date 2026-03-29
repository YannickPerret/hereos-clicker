import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Enemy from '#models/enemy'

export default class CharacterEnemyCodex extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare enemyId: number

  @column()
  declare encounters: number

  @column()
  declare defeats: number

  @column.dateTime()
  declare firstSeenAt: DateTime

  @column.dateTime()
  declare lastSeenAt: DateTime

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => Enemy)
  declare enemy: BelongsTo<typeof Enemy>
}
