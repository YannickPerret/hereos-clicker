import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import EnemyLootTable from '#models/enemy_loot_table'

export default class Enemy extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare hp: number

  @column()
  declare attack: number

  @column()
  declare defense: number

  @column()
  declare xpReward: number

  @column()
  declare creditsRewardMin: number

  @column()
  declare creditsRewardMax: number

  @column()
  declare icon: string

  @column()
  declare tier: number

  @column()
  declare critChance: number

  @column()
  declare critDamage: number

  @hasMany(() => EnemyLootTable)
  declare lootTable: HasMany<typeof EnemyLootTable>
}
