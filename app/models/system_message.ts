import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SystemMessage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare message: string

  @column()
  declare messageEn: string | null

  @column()
  declare intervalMinutes: number

  @column()
  declare isActive: boolean

  @column()
  declare channel: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
