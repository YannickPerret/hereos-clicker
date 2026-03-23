import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class IsoTileset extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare name: string

  @column()
  declare imagePath: string

  @column()
  declare tileWidth: number

  @column()
  declare tileHeight: number

  @column()
  declare columns: number

  @column()
  declare tileCount: number

  @column()
  declare tilesetType: 'isometric' | 'orthogonal'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
