import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Item from '#models/item'

export default class ShopListing extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare itemId: number

  @column()
  declare priceOverride: number | null

  @column()
  declare stock: number | null

  @column()
  declare isActive: boolean

  @belongsTo(() => Item)
  declare item: BelongsTo<typeof Item>
}
