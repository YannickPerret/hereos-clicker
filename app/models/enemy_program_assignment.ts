import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Enemy from '#models/enemy'
import EnemyProgram from '#models/enemy_program'

export default class EnemyProgramAssignment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare enemyId: number

  @column()
  declare enemyProgramId: number

  @column()
  declare sortOrder: number

  @belongsTo(() => Enemy)
  declare enemy: BelongsTo<typeof Enemy>

  @belongsTo(() => EnemyProgram)
  declare program: BelongsTo<typeof EnemyProgram>
}
