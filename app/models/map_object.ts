import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Map from '#models/map'

export default class MapObject extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare mapId: number

  @column()
  declare name: string

  @column()
  declare type: string

  @column()
  declare x: number

  @column()
  declare y: number

  @column()
  declare metadata: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Map)
  declare map: BelongsTo<typeof Map>
}
