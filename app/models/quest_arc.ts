import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Quest from '#models/quest'

export default class QuestArc extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare title: string

  @column()
  declare parentArcId: number | null

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => QuestArc, { foreignKey: 'parentArcId' })
  declare parentArc: BelongsTo<typeof QuestArc>

  @hasMany(() => QuestArc, { foreignKey: 'parentArcId' })
  declare childArcs: HasMany<typeof QuestArc>

  @hasMany(() => Quest, { foreignKey: 'questArcId' })
  declare quests: HasMany<typeof Quest>
}
