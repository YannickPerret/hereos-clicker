import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import IsoDungeon from '#models/iso_dungeon'
import Character from '#models/character'

export default class IsoDungeonRun extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare dungeonId: number

  @column()
  declare characterId: number

  @column()
  declare currentRoomOrder: number

  @column()
  declare playerX: number

  @column()
  declare playerY: number

  @column()
  declare status: 'in_progress' | 'victory' | 'defeat' | 'fled'

  @column()
  declare defeatedEnemiesJson: string

  @column()
  declare combatLogJson: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => IsoDungeon, { foreignKey: 'dungeonId' })
  declare dungeon: BelongsTo<typeof IsoDungeon>

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  get defeatedEnemies(): number[] {
    try { return JSON.parse(this.defeatedEnemiesJson || '[]') } catch { return [] }
  }
}
