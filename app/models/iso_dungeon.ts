import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import IsoDungeonRoom from '#models/iso_dungeon_room'

export default class IsoDungeon extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string

  @column()
  declare nameEn: string | null

  @column()
  declare descriptionEn: string | null

  @column()
  declare minLevel: number

  @column()
  declare maxPlayers: number

  @column()
  declare icon: string | null

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => IsoDungeonRoom, { foreignKey: 'dungeonId' })
  declare rooms: HasMany<typeof IsoDungeonRoom>
}
