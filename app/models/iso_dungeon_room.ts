import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import IsoDungeon from '#models/iso_dungeon'
import IsoRoomEnemy from '#models/iso_room_enemy'

export default class IsoDungeonRoom extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare dungeonId: number

  @column()
  declare name: string

  @column()
  declare roomOrder: number

  @column()
  declare isBossRoom: boolean

  @column()
  declare width: number

  @column()
  declare height: number

  @column()
  declare tileWidth: number

  @column()
  declare tileHeight: number

  @column()
  declare tilesetKey: string | null

  @column()
  declare layerGround: string | null

  @column()
  declare layerWalls: string | null

  @column()
  declare layerDecor: string | null

  @column()
  declare collisions: string | null

  @column()
  declare objectsJson: string | null

  @column()
  declare spawnX: number

  @column()
  declare spawnY: number

  @column()
  declare exitX: number | null

  @column()
  declare exitY: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => IsoDungeon, { foreignKey: 'dungeonId' })
  declare dungeon: BelongsTo<typeof IsoDungeon>

  @hasMany(() => IsoRoomEnemy, { foreignKey: 'roomId' })
  declare enemies: HasMany<typeof IsoRoomEnemy>
}
