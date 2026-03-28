import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class DungeonFloor extends BaseModel {
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
  declare floorNumber: number

  @column()
  declare minLevel: number

  @column()
  declare enemyIds: string

  @column()
  declare bossEnemyId: number | null

  @column()
  declare minPlayers: number

  @column()
  declare maxPlayers: number
}
