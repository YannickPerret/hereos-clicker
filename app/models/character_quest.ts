import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Character from '#models/character'
import Quest from '#models/quest'
import QuestFlowStep from '#models/quest_flow_step'

export default class CharacterQuest extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare characterId: number

  @column()
  declare questId: number

  @column()
  declare status: 'active' | 'completed'

  @column()
  declare progress: number

  @column()
  declare currentStepId: number | null

  @column()
  declare stepStateJson: string | null

  @column.dateTime()
  declare startedAt: DateTime

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Character)
  declare character: BelongsTo<typeof Character>

  @belongsTo(() => Quest)
  declare quest: BelongsTo<typeof Quest>

  @belongsTo(() => QuestFlowStep, { foreignKey: 'currentStepId' })
  declare currentStep: BelongsTo<typeof QuestFlowStep>

  get stepState() {
    try {
      return this.stepStateJson ? JSON.parse(this.stepStateJson) : null
    } catch {
      return null
    }
  }
}
