import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CharacterBlackMarketReputation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare vendorKey: string

  @column()
  declare reputation: number
}
