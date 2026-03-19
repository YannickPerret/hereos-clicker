import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Item from '#models/item'
import ShopListing from '#models/shop_listing'
import InventoryItem from '#models/inventory_item'
import EnemyLootTable from '#models/enemy_loot_table'
import DailyMission from '#models/daily_mission'

type DedupeStats = {
  groups: number
  itemsDeleted: number
  rowsRemapped: number
  shopRowsMerged: number
  inventoryRowsMerged: number
  lootRowsMerged: number
}

export default class DedupeItems extends BaseCommand {
  static commandName = 'items:dedupe'
  static description = 'Merge duplicate items by name and remap references'
  static options: CommandOptions = { startApp: true }

  async run() {
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
      this.logger.success('No duplicate items found')
      return
    }

    const stats: DedupeStats = {
      groups: duplicateGroups.length,
      itemsDeleted: 0,
      rowsRemapped: 0,
      shopRowsMerged: 0,
      inventoryRowsMerged: 0,
      lootRowsMerged: 0,
    }

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

    this.logger.success(
      `Done. Groups: ${stats.groups}, items deleted: ${stats.itemsDeleted}, rows remapped: ${stats.rowsRemapped}, merged rows -> shop: ${stats.shopRowsMerged}, inventory: ${stats.inventoryRowsMerged}, loot: ${stats.lootRowsMerged}`
    )
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
}
