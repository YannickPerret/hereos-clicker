import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import PvpMatch from '#models/pvp_match'

export default class PvpMatchParticipant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare matchId: number

  @column()
  declare characterId: number

  @column()
  declare team: number

  @column()
  declare slot: number

  @column()
  declare currentHp: number

  @column()
  declare hpMax: number

  @column()
  declare isEliminated: boolean

  @column()
  declare createdAt: number

  @belongsTo(() => PvpMatch, { foreignKey: 'matchId' })
  declare match: BelongsTo<typeof PvpMatch>

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>
}
