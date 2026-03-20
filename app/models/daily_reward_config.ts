import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Item from '#models/item'

export default class DailyRewardConfig extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare dayNumber: number

  @column()
  declare rewardType: 'credits' | 'xp' | 'item'

  @column()
  declare rewardValue: number

  @column()
  declare rewardItemId: number | null

  @column()
  declare isActive: boolean

  @column()
  declare createdAt: number

  @column()
  declare updatedAt: number

  @belongsTo(() => Item, { foreignKey: 'rewardItemId' })
  declare rewardItem: BelongsTo<typeof Item>
}
