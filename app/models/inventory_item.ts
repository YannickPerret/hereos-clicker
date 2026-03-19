import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Item from '#models/item'

export default class InventoryItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare itemId: number

  @column()
  declare quantity: number

  @column()
  declare isEquipped: boolean

  @column.dateTime({ autoCreate: true })
  declare acquiredAt: DateTime

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => Item)
  declare item: BelongsTo<typeof Item>
}
