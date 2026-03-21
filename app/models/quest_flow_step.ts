import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Quest from '#models/quest'

export default class QuestFlowStep extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare questId: number

  @column()
  declare stepType: 'narration' | 'conversation' | 'objective' | 'wait' | 'choice'

  @column()
  declare sortOrder: number

  @column()
  declare contentJson: string

  @column()
  declare nextStepId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Quest)
  declare quest: BelongsTo<typeof Quest>

  @belongsTo(() => QuestFlowStep, { foreignKey: 'nextStepId' })
  declare nextStep: BelongsTo<typeof QuestFlowStep>

  get content() {
    try {
      return JSON.parse(this.contentJson || '{}')
    } catch {
      return {}
    }
  }
}
