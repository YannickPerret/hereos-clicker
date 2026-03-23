import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import IsoDungeonRoom from '#models/iso_dungeon_room'
import Enemy from '#models/enemy'

export default class IsoRoomEnemy extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare roomId: number

  @column()
  declare enemyId: number

  @column()
  declare spriteKey: string | null

  @column()
  declare gridX: number

  @column()
  declare gridY: number

  @column()
  declare isBoss: boolean

  @column()
  declare blocksExit: boolean

  @belongsTo(() => IsoDungeonRoom, { foreignKey: 'roomId' })
  declare room: BelongsTo<typeof IsoDungeonRoom>

  @belongsTo(() => Enemy)
  declare enemy: BelongsTo<typeof Enemy>
}
