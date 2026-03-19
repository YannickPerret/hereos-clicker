import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import DailyMission from '#models/daily_mission'

export default class CharacterDailyMission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare dailyMissionId: number

  @column()
  declare progress: number

  @column()
  declare completed: boolean

  @column()
  declare claimed: boolean

  @column.dateTime()
  declare assignedAt: DateTime

  @column.dateTime()
  declare completedAt: DateTime | null

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => DailyMission)
  declare dailyMission: BelongsTo<typeof DailyMission>
}
