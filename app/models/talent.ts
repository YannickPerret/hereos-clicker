import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Talent extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare spec: 'hacker' | 'netrunner' | 'samurai' | 'chrome_dealer'

  @column()
  declare tier: number

  @column()
  declare icon: string

  @column()
  declare effectType: string

  @column()
  declare effectValue: number

  @column()
  declare cost: number

  @column()
  declare requiresTalentId: number | null

  @column()
  declare requiresLevel: number

  @belongsTo(() => Talent, { foreignKey: 'requiresTalentId' })
  declare prerequisite: BelongsTo<typeof Talent>
}
