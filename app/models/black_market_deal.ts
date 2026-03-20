import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Item from '#models/item'

export default class BlackMarketDeal extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare rotationKey: number

  @column()
  declare vendorKey: string

  @column()
  declare slot: number

  @column()
  declare itemId: number

  @column()
  declare price: number

  @column()
  declare stock: number

  @column()
  declare heatValue: number

  @column()
  declare reputationRequired: number

  @column()
  declare requiredSpec: string | null

  @column()
  declare featured: boolean

  @column()
  declare startsAt: number

  @column()
  declare endsAt: number

  @belongsTo(() => Item)
  declare item: BelongsTo<typeof Item>
}
