import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import CharacterQuest from '#models/character_quest'
import Season from '#models/season'
import QuestArc from '#models/quest_arc'

export default class Quest extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare questType: 'main' | 'seasonal'

  @column()
  declare seasonId: number | null

  @column()
  declare parentQuestId: number | null

  @column()
  declare arcKey: string

  @column()
  declare arcTitle: string

  @column()
  declare questArcId: number | null

  @column()
  declare giverName: string | null

  @column()
  declare title: string

  @column()
  declare summary: string

  @column()
  declare narrative: string | null

  @column()
  declare objectiveType: string

  @column()
  declare targetValue: number

  @column()
  declare rewardType: string

  @column()
  declare rewardValue: number

  @column()
  declare rewardsJson: string | null

  @column()
  declare icon: string

  @column()
  declare sortOrder: number

  @column()
  declare requiredQuestKey: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => CharacterQuest)
  declare characterQuests: HasMany<typeof CharacterQuest>

  @belongsTo(() => Season)
  declare season: BelongsTo<typeof Season>

  @belongsTo(() => QuestArc)
  declare questArc: BelongsTo<typeof QuestArc>

  @belongsTo(() => Quest, {
    foreignKey: 'parentQuestId',
  })
  declare parentQuest: BelongsTo<typeof Quest>

  @hasMany(() => Quest, {
    foreignKey: 'parentQuestId',
  })
  declare childQuests: HasMany<typeof Quest>
}
