import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import CharacterPvpSeasonStat from '#models/character_pvp_season_stat'

export default class Season extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare theme: string

  @column()
  declare campaignTitle: string | null

  @column()
  declare storyIntro: string | null

  @column()
  declare storyOutro: string | null

  @column()
  declare bannerImage: string | null

  @column()
  declare primaryColor: string | null

  @column()
  declare secondaryColor: string | null

  @column()
  declare status: 'draft' | 'scheduled' | 'active' | 'ended' | 'archived'

  @column()
  declare sortOrder: number

  @column()
  declare isRankedPvpEnabled: boolean

  @column()
  declare isWorldBossEnabled: boolean

  @column()
  declare isPlayerMarketEnabled: boolean

  @column()
  declare isBlackMarketBonusEnabled: boolean

  @column.dateTime()
  declare startsAt: DateTime | null

  @column.dateTime()
  declare endsAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => CharacterPvpSeasonStat)
  declare pvpStats: HasMany<typeof CharacterPvpSeasonStat>
}
