import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Quest from '#models/quest'

export default class CharacterQuest extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare questId: number

  @column()
  declare status: 'active' | 'completed'

  @column()
  declare progress: number

  @column.dateTime()
  declare startedAt: DateTime

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => Quest)
  declare quest: BelongsTo<typeof Quest>
}
