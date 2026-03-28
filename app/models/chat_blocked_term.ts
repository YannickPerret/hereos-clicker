import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ChatBlockedTerm extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare term: string

  @column()
  declare language: 'all' | 'fr' | 'en'

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
