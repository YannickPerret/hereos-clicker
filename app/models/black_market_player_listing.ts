import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Item from '#models/item'

export default class BlackMarketPlayerListing extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare sellerCharacterId: number

  @column()
  declare itemId: number

  @column()
  declare listingType: 'direct' | 'auction'

  @column()
  declare quantityTotal: number

  @column()
  declare quantityAvailable: number

  @column()
  declare pricePerItem: number | null

  @column()
  declare startingBid: number | null

  @column()
  declare currentBid: number | null

  @column()
  declare currentBidderCharacterId: number | null

  @column()
  declare bidCount: number

  @column()
  declare listingTax: number

  @column()
  declare status: 'active' | 'sold' | 'expired' | 'cancelled'

  @column()
  declare startsAt: number

  @column()
  declare endsAt: number

  @belongsTo(() => Character, { foreignKey: 'sellerCharacterId' })
  declare seller: BelongsTo<typeof Character>

  @belongsTo(() => Character, { foreignKey: 'currentBidderCharacterId' })
  declare currentBidder: BelongsTo<typeof Character>

  @belongsTo(() => Item)
  declare item: BelongsTo<typeof Item>
}
