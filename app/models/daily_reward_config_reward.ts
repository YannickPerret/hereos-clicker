import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Item from '#models/item'
import DailyRewardConfig from '#models/daily_reward_config'

export default class DailyRewardConfigReward extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare dailyRewardConfigId: number

  @column()
  declare rewardType: 'credits' | 'xp' | 'item'

  @column()
  declare rewardValue: number

  @column()
  declare rewardItemId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => DailyRewardConfig)
  declare dailyRewardConfig: BelongsTo<typeof DailyRewardConfig>

  @belongsTo(() => Item, { foreignKey: 'rewardItemId' })
  declare rewardItem: BelongsTo<typeof Item>
}
