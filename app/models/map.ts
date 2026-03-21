import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import MapObject from '#models/map_object'
import Character from '#models/character'

export default class Map extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare width: number

  @column()
  declare height: number

  @column()
  declare collisions: string | null

  @column()
  declare backgroundImage: string | null

  @column()
  declare tilesetImage: string | null

  @column()
  declare tileWidth: number

  @column()
  declare tileHeight: number

  @column()
  declare layerData: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => MapObject)
  declare objects: HasMany<typeof MapObject>

  @hasMany(() => Character, { foreignKey: 'currentMapId' })
  declare characters: HasMany<typeof Character>
}
