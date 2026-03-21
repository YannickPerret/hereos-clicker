import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import DailyRewardConfigReward from '#models/daily_reward_config_reward'

export default class DailyRewardConfig extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare dayNumber: number

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => DailyRewardConfigReward)
  declare rewards: HasMany<typeof DailyRewardConfigReward>
}
