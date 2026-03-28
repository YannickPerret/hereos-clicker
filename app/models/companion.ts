import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Companion extends BaseModel {
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
  declare rarity: string

  @column()
  declare bonusType: string

  @column()
  declare bonusValue: number

  @column()
  declare icon: string

  @column()
  declare basePrice: number
}
