import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Item from '#models/item'

export default class BlackMarketCatalogEntry extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare vendorKey: string

  @column()
  declare itemId: number

  @column()
  declare basePrice: number

  @column()
  declare stock: number

  @column()
  declare heatValue: number

  @column()
  declare reputationRequired: number

  @column()
  declare requiredSpec: string | null

  @column()
  declare isFeatured: boolean

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number

  @belongsTo(() => Item)
  declare item: BelongsTo<typeof Item>
}
