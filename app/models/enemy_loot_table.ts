import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Enemy from '#models/enemy'
import Item from '#models/item'

export default class EnemyLootTable extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare enemyId: number

  @column()
  declare itemId: number

  @column()
  declare dropChance: number

  @belongsTo(() => Enemy)
  declare enemy: BelongsTo<typeof Enemy>

  @belongsTo(() => Item)
  declare item: BelongsTo<typeof Item>
}
