import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Season from '#models/season'

export default class CharacterBossRushSeasonStat extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare seasonId: number

  @column()
  declare bestFloor: number

  @column()
  declare runsPlayed: number

  @column()
  declare totalBossesKilled: number

  @column()
  declare finalRank: number | null

  @column()
  declare rewardCredits: number

  @column()
  declare rewardTier: string | null

  @column()
  declare rewardClaimed: boolean

  @column.dateTime()
  declare finalizedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => Season)
  declare season: BelongsTo<typeof Season>
}
