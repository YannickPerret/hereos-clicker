import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class BlackMarketCleaner extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare basePrice: number

  @column()
  declare heatReduction: number

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number
}
