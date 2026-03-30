import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import EnemyProgramAssignment from '#models/enemy_program_assignment'

export default class EnemyProgram extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare nameEn: string | null

  @column()
  declare descriptionEn: string | null

  @column()
  declare effectType: string

  @column()
  declare effectValue: number

  @column()
  declare duration: number

  @column()
  declare cooldown: number

  @column()
  declare chancePercent: number

  @column()
  declare windupTurns: number

  @column()
  declare icon: string

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number

  @hasMany(() => EnemyProgramAssignment)
  declare assignments: HasMany<typeof EnemyProgramAssignment>
}
