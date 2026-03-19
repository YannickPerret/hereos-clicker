import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import InventoryItem from '#models/inventory_item'
import CharacterTalent from '#models/character_talent'
import CharacterCompanion from '#models/character_companion'
import CharacterDailyMission from '#models/character_daily_mission'

export default class Character extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare name: string

  @column()
  declare credits: number

  @column()
  declare creditsPerClick: number

  @column()
  declare level: number

  @column()
  declare xp: number

  @column()
  declare hpMax: number

  @column()
  declare hpCurrent: number

  @column()
  declare attack: number

  @column()
  declare defense: number

  @column()
  declare totalClicks: number

  @column()
  declare creditsPerSecond: number

  @column()
  declare talentPoints: number

  @column()
  declare lastTickAt: number

  @column()
  declare chosenSpec: string | null

  @column()
  declare critChance: number

  @column()
  declare critDamage: number

  @column()
  declare pvpRating: number

  @column()
  declare pvpWins: number

  @column()
  declare pvpLosses: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => InventoryItem)
  declare inventoryItems: HasMany<typeof InventoryItem>

  @hasMany(() => CharacterTalent)
  declare characterTalents: HasMany<typeof CharacterTalent>

  @hasMany(() => CharacterCompanion)
  declare companions: HasMany<typeof CharacterCompanion>

  @hasMany(() => CharacterDailyMission)
  declare dailyMissions: HasMany<typeof CharacterDailyMission>

  /** Apply level up bonuses — RPG style scaling */
  levelUp() {
    this.xp -= this.level * 100
    this.level += 1
    this.talentPoints += 1

    // Base stats
    this.hpMax += 8 + Math.floor(this.level * 1.5)
    this.hpCurrent = this.hpMax
    this.attack += 2 + Math.floor(this.level / 5)
    this.defense += 1 + Math.floor(this.level / 5)

    // Every 5 levels: bonus crit
    if (this.level % 5 === 0) {
      this.critChance = Math.min(50, (this.critChance || 5) + 1)
      this.critDamage = (this.critDamage || 150) + 5
    }

    // Every 3 levels: bonus CPC
    if (this.level % 3 === 0) {
      this.creditsPerClick += 1
    }

    // Every 10 levels: bonus CPS
    if (this.level % 10 === 0) {
      this.creditsPerSecond += 1
    }
  }
}
