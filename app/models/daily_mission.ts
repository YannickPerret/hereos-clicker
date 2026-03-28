import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class DailyMission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare nameEn: string | null

  @column()
  declare descriptionEn: string | null

  @column()
  declare type: string

  @column()
  declare targetValue: number

  @column()
  declare rewardType: string

  @column()
  declare rewardValue: number

  @column()
  declare rewardItemId: number | null

  @column()
  declare icon: string
}
