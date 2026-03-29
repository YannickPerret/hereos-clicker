import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Enemy from '#models/enemy'
import Season from '#models/season'

export default class BossRushRun extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare seasonId: number | null

  @column()
  declare status: 'in_progress' | 'defeat' | 'fled'

  @column()
  declare currentFloor: number

  @column()
  declare bossesDefeated: number

  @column()
  declare currentEnemyId: number | null

  @column()
  declare currentEnemyHp: number

  @column()
  declare combatLog: string

  @column()
  declare skillCooldowns: string

  @column()
  declare activeEffects: string

  @column()
  declare pendingRewards: string

  @column.dateTime({ autoCreate: true })
  declare startedAt: DateTime

  @column.dateTime()
  declare endedAt: DateTime | null

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => Season)
  declare season: BelongsTo<typeof Season>

  @belongsTo(() => Enemy, {
    foreignKey: 'currentEnemyId',
  })
  declare currentEnemy: BelongsTo<typeof Enemy>
}
