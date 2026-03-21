import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Item extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare type:
    | 'weapon'
    | 'armor'
    | 'implant'
    | 'clothes_hair'
    | 'clothes_face'
    | 'clothes_outer'
    | 'clothes_legs'
    | 'consumable'
    | 'upgrade'

  @column()
  declare rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

  @column()
  declare icon: string

  @column()
  declare effectType: string | null

  @column()
  declare effectValue: number | null

  @column()
  declare basePrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
