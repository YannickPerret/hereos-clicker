import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import ForumThread from '#models/forum_thread'
import User from '#models/user'

export default class ForumPost extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare forumThreadId: number

  @column()
  declare userId: number

  @column()
  declare parentPostId: number | null

  @column()
  declare body: string

  @column.dateTime()
  declare editedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ForumThread)
  declare thread: BelongsTo<typeof ForumThread>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => ForumPost, {
    foreignKey: 'parentPostId',
  })
  declare parentPost: BelongsTo<typeof ForumPost>

  @hasMany(() => ForumPost, {
    foreignKey: 'parentPostId',
  })
  declare replies: HasMany<typeof ForumPost>
}
