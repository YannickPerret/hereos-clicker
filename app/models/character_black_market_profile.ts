import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CharacterBlackMarketProfile extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare heat: number

  @column()
  declare lastHeatDecayAt: number
}
