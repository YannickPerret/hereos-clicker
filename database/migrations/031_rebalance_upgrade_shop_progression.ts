import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const upgradeConfig = [
        { name: 'Finger Servos', effectValue: 1, basePrice: 5000, priceOverride: 5000, stock: 10, isActive: true },
        { name: 'Haptic Amplifier', effectValue: 3, basePrice: 50000, priceOverride: 50000, stock: 10, isActive: true },
        { name: 'Neural Click Matrix', effectValue: 5, basePrice: 500000, priceOverride: 500000, stock: 10, isActive: false },
        { name: 'Quantum Tap Interface', effectValue: 8, basePrice: 5000000, priceOverride: 5000000, stock: 10, isActive: false },
      ] as const

      const items = await db
        .from('items')
        .whereIn('name', upgradeConfig.map((entry) => entry.name))
        .select('id', 'name')

      const itemIdByName = new Map<string, number>()
      for (const item of items) {
        itemIdByName.set(item.name, item.id)
      }

      for (const entry of upgradeConfig) {
        const itemId = itemIdByName.get(entry.name)
        if (!itemId) continue

        await db
          .from('items')
          .where('id', itemId)
          .update({
            effect_value: entry.effectValue,
            base_price: entry.basePrice,
          })

        const listing = await db
          .from('shop_listings')
          .where('item_id', itemId)
          .first()

        if (listing) {
          await db
            .from('shop_listings')
            .where('item_id', itemId)
            .update({
              price_override: entry.priceOverride,
              stock: entry.stock,
              is_active: entry.isActive,
            })
        }
      }
    })
  }

  async down() {
    // Irreversible live balance update for upgrade pricing and shop progression.
  }
}
