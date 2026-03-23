import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class IsoSprite extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare name: string

  @column()
  declare imagePath: string

  @column()
  declare frameWidth: number

  @column()
  declare frameHeight: number

  @column()
  declare frameCount: number

  @column()
  declare animationsJson: string | null

  @column()
  declare spriteType: 'character' | 'enemy' | 'npc'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
