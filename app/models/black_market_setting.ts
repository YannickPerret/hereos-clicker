import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class BlackMarketSetting extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare value: string
}
