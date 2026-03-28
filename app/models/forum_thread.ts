import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import ForumCategory from '#models/forum_category'
import ForumPost from '#models/forum_post'
import User from '#models/user'

export default class ForumThread extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare forumCategoryId: number

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare body: string

  @column()
  declare isPinned: boolean

  @column()
  declare isLocked: boolean

  @column()
  declare replyCount: number

  @column.dateTime()
  declare lastPostedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => ForumCategory)
  declare category: BelongsTo<typeof ForumCategory>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => ForumPost)
  declare posts: HasMany<typeof ForumPost>
}
