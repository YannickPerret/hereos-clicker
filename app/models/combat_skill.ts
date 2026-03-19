import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CombatSkill extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare spec: 'hacker' | 'netrunner' | 'samurai' | 'chrome_dealer'

  @column()
  declare tierRequired: number

  @column()
  declare effectType: string

  @column()
  declare effectValue: number

  @column()
  declare duration: number

  @column()
  declare cooldown: number

  @column()
  declare icon: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
