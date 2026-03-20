import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Item from '#models/item'
import ShopListing from '#models/shop_listing'
import InventoryItem from '#models/inventory_item'
import EnemyLootTable from '#models/enemy_loot_table'
import DailyMission from '#models/daily_mission'
import Enemy from '#models/enemy'
import DungeonFloor from '#models/dungeon_floor'
import DungeonRun from '#models/dungeon_run'
import Companion from '#models/companion'
import CharacterCompanion from '#models/character_companion'
import CombatSkill from '#models/combat_skill'

type DedupeStats = {
  itemGroups: number
  enemyGroups: number
  companionGroups: number
  floorGroups: number
  skillGroups: number
  itemsDeleted: number
  enemiesDeleted: number
  companionsDeleted: number
  floorsDeleted: number
  skillsDeleted: number
  rowsRemapped: number
  shopRowsMerged: number
  inventoryRowsMerged: number
  lootRowsMerged: number
  companionRowsMerged: number
}

export default class DedupeItems extends BaseCommand {
  static commandName = 'items:dedupe'
  static description = 'Merge duplicate content (items, enemies, companions, dungeon floors, combat skills)'
  static options: CommandOptions = { startApp: true }

  async run() {
    const stats: DedupeStats = {
      itemGroups: 0,
      enemyGroups: 0,
      companionGroups: 0,
      floorGroups: 0,
      skillGroups: 0,
      itemsDeleted: 0,
      enemiesDeleted: 0,
      companionsDeleted: 0,
      floorsDeleted: 0,
      skillsDeleted: 0,
      rowsRemapped: 0,
      shopRowsMerged: 0,
      inventoryRowsMerged: 0,
      lootRowsMerged: 0,
      companionRowsMerged: 0,
    }

    await this.dedupeItems(stats)
    await this.dedupeEnemies(stats)
    await this.dedupeCompanions(stats)
    await this.dedupeDungeonFloors(stats)
    await this.dedupeCombatSkills(stats)

    this.logger.success(
      `Done. groups -> items:${stats.itemGroups}, enemies:${stats.enemyGroups}, companions:${stats.companionGroups}, floors:${stats.floorGroups}, skills:${stats.skillGroups}; deleted -> items:${stats.itemsDeleted}, enemies:${stats.enemiesDeleted}, companions:${stats.companionsDeleted}, floors:${stats.floorsDeleted}, skills:${stats.skillsDeleted}; remapped rows:${stats.rowsRemapped}; merged rows -> shop:${stats.shopRowsMerged}, inventory:${stats.inventoryRowsMerged}, loot:${stats.lootRowsMerged}, character_companions:${stats.companionRowsMerged}`
    )
  }

  private async dedupeItems(stats: DedupeStats) {
    const items = await Item.query().orderBy('id', 'asc')
    const groupsByName = new Map<string, Item[]>()

    for (const item of items) {
      const key = item.name.trim().toLowerCase()
      const group = groupsByName.get(key)
      if (group) {
        group.push(item)
      } else {
        groupsByName.set(key, [item])
      }
    }

    const duplicateGroups = [...groupsByName.values()].filter((group) => group.length > 1)

    if (duplicateGroups.length === 0) {
      this.logger.info('No duplicate items found')
      return
    }

    stats.itemGroups = duplicateGroups.length

    for (const group of duplicateGroups) {
      const keeper = group[0]
      const duplicates = group.slice(1)
      this.logger.info(
        `Merging "${keeper.name}" -> keep #${keeper.id}, remove [${duplicates.map((d) => d.id).join(', ')}]`
      )

      for (const duplicate of duplicates) {
        stats.rowsRemapped += await this.remapReferences(duplicate.id, keeper.id)
        await duplicate.delete()
        stats.itemsDeleted += 1
      }

      stats.shopRowsMerged += await this.mergeShopListings(keeper.id)
      stats.inventoryRowsMerged += await this.mergeInventoryRows(keeper.id)
      stats.lootRowsMerged += await this.mergeEnemyLootRows(keeper.id)
    }
  }

  private async remapReferences(fromItemId: number, toItemId: number) {
    let total = 0
    const shopUpdated = await ShopListing.query().where('itemId', fromItemId).update({ itemId: toItemId })
    const inventoryUpdated = await InventoryItem.query()
      .where('itemId', fromItemId)
      .update({ itemId: toItemId })
    const lootUpdated = await EnemyLootTable.query().where('itemId', fromItemId).update({ itemId: toItemId })
    const missionUpdated = await DailyMission.query()
      .where('rewardItemId', fromItemId)
      .update({ rewardItemId: toItemId })

    total += this.toAffectedCount(shopUpdated)
    total += this.toAffectedCount(inventoryUpdated)
    total += this.toAffectedCount(lootUpdated)
    total += this.toAffectedCount(missionUpdated)
    return total
  }

  private toAffectedCount(result: unknown): number {
    if (typeof result === 'number') return result
    if (Array.isArray(result)) return result.length
    return 0
  }

  private async mergeShopListings(itemId: number) {
    const rows = await ShopListing.query().where('itemId', itemId).orderBy('id', 'asc')
    if (rows.length <= 1) return 0

    const keeper = rows[0]
    let removed = 0

    for (const row of rows.slice(1)) {
      if (keeper.priceOverride === null && row.priceOverride !== null) {
        keeper.priceOverride = row.priceOverride
      }
      if (keeper.stock === null && row.stock !== null) {
        keeper.stock = row.stock
      }
      keeper.isActive = keeper.isActive || row.isActive
      await row.delete()
      removed += 1
    }

    await keeper.save()
    return removed
  }

  private async mergeInventoryRows(itemId: number) {
    const rows = await InventoryItem.query()
      .where('itemId', itemId)
      .orderBy('characterId', 'asc')
      .orderBy('id', 'asc')
    if (rows.length <= 1) return 0

    const byCharacter = new Map<number, InventoryItem[]>()
    for (const row of rows) {
      const list = byCharacter.get(row.characterId)
      if (list) {
        list.push(row)
      } else {
        byCharacter.set(row.characterId, [row])
      }
    }

    let removed = 0
    for (const sameCharacterRows of byCharacter.values()) {
      if (sameCharacterRows.length <= 1) continue

      const keeper = sameCharacterRows[0]
      keeper.quantity = sameCharacterRows.reduce((sum, row) => sum + row.quantity, 0)
      keeper.isEquipped = sameCharacterRows.some((row) => row.isEquipped)

      for (const row of sameCharacterRows.slice(1)) {
        await row.delete()
        removed += 1
      }

      await keeper.save()
    }

    return removed
  }

  private async mergeEnemyLootRows(itemId: number) {
    const rows = await EnemyLootTable.query().where('itemId', itemId).orderBy('enemyId', 'asc').orderBy('id', 'asc')
    if (rows.length <= 1) return 0

    const byEnemy = new Map<number, EnemyLootTable[]>()
    for (const row of rows) {
      const list = byEnemy.get(row.enemyId)
      if (list) {
        list.push(row)
      } else {
        byEnemy.set(row.enemyId, [row])
      }
    }

    let removed = 0
    for (const sameEnemyRows of byEnemy.values()) {
      if (sameEnemyRows.length <= 1) continue

      const keeper = sameEnemyRows[0]
      keeper.dropChance = Math.max(...sameEnemyRows.map((row) => row.dropChance))

      for (const row of sameEnemyRows.slice(1)) {
        await row.delete()
        removed += 1
      }

      await keeper.save()
    }

    return removed
  }

  private async dedupeEnemies(stats: DedupeStats) {
    const enemies = await Enemy.query().orderBy('id', 'asc')
    const groupsByName = new Map<string, Enemy[]>()

    for (const enemy of enemies) {
      const key = enemy.name.trim().toLowerCase()
      const group = groupsByName.get(key)
      if (group) {
        group.push(enemy)
      } else {
        groupsByName.set(key, [enemy])
      }
    }

    const duplicateGroups = [...groupsByName.values()].filter((group) => group.length > 1)
    if (duplicateGroups.length === 0) {
      this.logger.info('No duplicate enemies found')
      return
    }

    stats.enemyGroups = duplicateGroups.length

    for (const group of duplicateGroups) {
      const keeper = group[0]
      const duplicates = group.slice(1)

      this.logger.info(
        `Merging enemy "${keeper.name}" -> keep #${keeper.id}, remove [${duplicates.map((d) => d.id).join(', ')}]`
      )

      for (const duplicate of duplicates) {
        const lootUpdated = await EnemyLootTable.query()
          .where('enemyId', duplicate.id)
          .update({ enemyId: keeper.id })
        const runsUpdated = await DungeonRun.query()
          .where('currentEnemyId', duplicate.id)
          .update({ currentEnemyId: keeper.id })

        stats.rowsRemapped += this.toAffectedCount(lootUpdated)
        stats.rowsRemapped += this.toAffectedCount(runsUpdated)
        stats.rowsRemapped += await this.remapEnemyIdInDungeonFloors(duplicate.id, keeper.id)

        await duplicate.delete()
        stats.enemiesDeleted += 1
      }
    }

    stats.lootRowsMerged += await this.mergeEnemyLootDuplicates()
  }

  private async remapEnemyIdInDungeonFloors(fromEnemyId: number, toEnemyId: number) {
    const floors = await DungeonFloor.query()
    let changed = 0

    for (const floor of floors) {
      let enemyIds: number[]
      try {
        enemyIds = JSON.parse(floor.enemyIds) as number[]
      } catch {
        enemyIds = []
      }

      const mapped = enemyIds.map((id) => (id === fromEnemyId ? toEnemyId : id))
      const deduped = [...new Set(mapped)]
      const bossEnemyId = floor.bossEnemyId === fromEnemyId ? toEnemyId : floor.bossEnemyId

      const enemyIdsChanged = JSON.stringify(enemyIds) !== JSON.stringify(deduped)
      const bossChanged = bossEnemyId !== floor.bossEnemyId
      if (!enemyIdsChanged && !bossChanged) continue

      floor.enemyIds = JSON.stringify(deduped)
      floor.bossEnemyId = bossEnemyId
      await floor.save()
      changed += 1
    }

    return changed
  }

  private async mergeEnemyLootDuplicates() {
    const rows = await EnemyLootTable.query().orderBy('enemyId', 'asc').orderBy('itemId', 'asc').orderBy('id', 'asc')
    if (rows.length <= 1) return 0

    const byPair = new Map<string, EnemyLootTable[]>()
    for (const row of rows) {
      const key = `${row.enemyId}:${row.itemId}`
      const list = byPair.get(key)
      if (list) {
        list.push(row)
      } else {
        byPair.set(key, [row])
      }
    }

    let removed = 0
    for (const sameRows of byPair.values()) {
      if (sameRows.length <= 1) continue

      const keeper = sameRows[0]
      keeper.dropChance = Math.max(...sameRows.map((row) => row.dropChance))
      await keeper.save()

      for (const row of sameRows.slice(1)) {
        await row.delete()
        removed += 1
      }
    }

    return removed
  }

  private async dedupeCompanions(stats: DedupeStats) {
    const companions = await Companion.query().orderBy('id', 'asc')
    const groupsByName = new Map<string, Companion[]>()

    for (const companion of companions) {
      const key = companion.name.trim().toLowerCase()
      const group = groupsByName.get(key)
      if (group) {
        group.push(companion)
      } else {
        groupsByName.set(key, [companion])
      }
    }

    const duplicateGroups = [...groupsByName.values()].filter((group) => group.length > 1)
    if (duplicateGroups.length === 0) {
      this.logger.info('No duplicate companions found')
      return
    }

    stats.companionGroups = duplicateGroups.length

    for (const group of duplicateGroups) {
      const keeper = group[0]
      const duplicates = group.slice(1)

      this.logger.info(
        `Merging companion "${keeper.name}" -> keep #${keeper.id}, remove [${duplicates.map((d) => d.id).join(', ')}]`
      )

      for (const duplicate of duplicates) {
        const remapped = await CharacterCompanion.query()
          .where('companionId', duplicate.id)
          .update({ companionId: keeper.id })
        stats.rowsRemapped += this.toAffectedCount(remapped)

        await duplicate.delete()
        stats.companionsDeleted += 1
      }

      stats.companionRowsMerged += await this.mergeCharacterCompanionRows(keeper.id)
    }
  }

  private async mergeCharacterCompanionRows(companionId: number) {
    const rows = await CharacterCompanion.query()
      .where('companionId', companionId)
      .orderBy('characterId', 'asc')
      .orderBy('id', 'asc')

    if (rows.length <= 1) return 0

    const byCharacter = new Map<number, CharacterCompanion[]>()
    for (const row of rows) {
      const list = byCharacter.get(row.characterId)
      if (list) {
        list.push(row)
      } else {
        byCharacter.set(row.characterId, [row])
      }
    }

    let removed = 0
    for (const sameCharacterRows of byCharacter.values()) {
      if (sameCharacterRows.length <= 1) continue

      const keeper = sameCharacterRows[0]
      keeper.level = Math.max(...sameCharacterRows.map((row) => row.level))
      keeper.xp = Math.max(...sameCharacterRows.map((row) => row.xp))
      keeper.isActive = sameCharacterRows.some((row) => row.isActive)

      for (const row of sameCharacterRows.slice(1)) {
        await row.delete()
        removed += 1
      }

      await keeper.save()
    }

    return removed
  }

  private async dedupeDungeonFloors(stats: DedupeStats) {
    const floors = await DungeonFloor.query().orderBy('id', 'asc')
    const groupsByFloorNumber = new Map<number, DungeonFloor[]>()

    for (const floor of floors) {
      const group = groupsByFloorNumber.get(floor.floorNumber)
      if (group) {
        group.push(floor)
      } else {
        groupsByFloorNumber.set(floor.floorNumber, [floor])
      }
    }

    const duplicateGroups = [...groupsByFloorNumber.values()].filter((group) => group.length > 1)
    if (duplicateGroups.length === 0) {
      this.logger.info('No duplicate dungeon floors found')
      return
    }

    stats.floorGroups = duplicateGroups.length

    for (const group of duplicateGroups) {
      const keeper = group[0]
      const duplicates = group.slice(1)

      this.logger.info(
        `Merging floor #${keeper.floorNumber} -> keep #${keeper.id}, remove [${duplicates.map((d) => d.id).join(', ')}]`
      )

      for (const duplicate of duplicates) {
        const remapped = await DungeonRun.query()
          .where('dungeonFloorId', duplicate.id)
          .update({ dungeonFloorId: keeper.id })
        stats.rowsRemapped += this.toAffectedCount(remapped)

        await duplicate.delete()
        stats.floorsDeleted += 1
      }
    }
  }

  private async dedupeCombatSkills(stats: DedupeStats) {
    const skills = await CombatSkill.query().orderBy('id', 'asc')
    const groupsByKey = new Map<string, CombatSkill[]>()

    for (const skill of skills) {
      const key = `${skill.spec}:${skill.name.trim().toLowerCase()}`
      const group = groupsByKey.get(key)
      if (group) {
        group.push(skill)
      } else {
        groupsByKey.set(key, [skill])
      }
    }

    const duplicateGroups = [...groupsByKey.values()].filter((group) => group.length > 1)
    if (duplicateGroups.length === 0) {
      this.logger.info('No duplicate combat skills found')
      return
    }

    stats.skillGroups = duplicateGroups.length

    for (const group of duplicateGroups) {
      const keeper = group[0]
      const duplicates = group.slice(1)

      this.logger.info(
        `Merging skill "${keeper.spec}/${keeper.name}" -> keep #${keeper.id}, remove [${duplicates.map((d) => d.id).join(', ')}]`
      )

      for (const duplicate of duplicates) {
        stats.rowsRemapped += await this.remapSkillIdInRuns(duplicate.id, keeper.id)
        await duplicate.delete()
        stats.skillsDeleted += 1
      }
    }
  }

  private async remapSkillIdInRuns(fromSkillId: number, toSkillId: number) {
    const runs = await DungeonRun.query().whereNotNull('skillCooldowns')
    let changed = 0

    for (const run of runs) {
      let cooldowns: Record<string, Record<string, number>>
      try {
        cooldowns = JSON.parse(run.skillCooldowns || '{}')
      } catch {
        cooldowns = {}
      }

      let runChanged = false
      for (const characterId of Object.keys(cooldowns)) {
        const charCooldowns = cooldowns[characterId] || {}
        const existing = charCooldowns[String(fromSkillId)]
        if (existing === undefined) continue

        const currentTarget = charCooldowns[String(toSkillId)] || 0
        charCooldowns[String(toSkillId)] = Math.max(currentTarget, existing)
        delete charCooldowns[String(fromSkillId)]
        cooldowns[characterId] = charCooldowns
        runChanged = true
      }

      if (!runChanged) continue

      run.skillCooldowns = JSON.stringify(cooldowns)
      await run.save()
      changed += 1
    }

    return changed
  }
}
