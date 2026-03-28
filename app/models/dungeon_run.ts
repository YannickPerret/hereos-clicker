import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import DungeonFloor from '#models/dungeon_floor'

export default class DungeonRun extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare dungeonFloorId: number

  @column()
  declare status: 'in_progress' | 'victory' | 'defeat' | 'fled'

  @column()
  declare currentEnemyHp: number

  @column()
  declare currentEnemyId: number | null

  @column()
  declare enemiesDefeated: number

  @column()
  declare partyId: number | null

  @column()
  declare currentTurnId: number | null

  @column()
  declare turnDeadline: number | null

  @column()
  declare combatLog: string

  @column()
  declare skillCooldowns: string

  @column()
  declare activeEffects: string

  @column()
  declare afkPenalties: string

  @column()
  declare pendingRewards: string

  @column.dateTime({ autoCreate: true })
  declare startedAt: DateTime

  @column.dateTime()
  declare endedAt: DateTime | null

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => DungeonFloor)
  declare dungeonFloor: BelongsTo<typeof DungeonFloor>
}
