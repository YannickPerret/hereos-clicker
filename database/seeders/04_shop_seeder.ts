import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ShopListing from '#models/shop_listing'
import Item from '#models/item'

export default class extends BaseSeeder {
  async run() {
    const listings = [
      // Weapons
      { itemName: 'Plasma Pistol MK-I', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Vibro-Blade', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Neural Disruptor', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Railgun X-7', priceOverride: null, stock: 3, isActive: true },
      { itemName: 'Void Cannon', priceOverride: null, stock: 1, isActive: true },
      // Armor
      { itemName: 'Kevlar Vest', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Nanoweave Jacket', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Titanium Exosuit', priceOverride: null, stock: 3, isActive: true },
      // Implants
      { itemName: 'Reflex Booster v1', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Neural Accelerator', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Synaptic Overdrive', priceOverride: null, stock: 2, isActive: true },
      // Consumables
      { itemName: 'Stim Pack', priceOverride: null, stock: null, isActive: true },
      { itemName: 'MedGel Capsule', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Phoenix Serum', priceOverride: null, stock: 10, isActive: true },
      { itemName: 'CyberBoost Energy', priceOverride: null, stock: null, isActive: true },
      // Upgrades
      { itemName: 'Finger Servos', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Haptic Amplifier', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Neural Click Matrix', priceOverride: null, stock: 5, isActive: true },
      // Respec
      { itemName: 'Neural Respec Chip', priceOverride: 50000, stock: null, isActive: true },
    ] as const

    for (const listing of listings) {
      const item = await Item.findBy('name', listing.itemName)
      if (!item) continue

      await ShopListing.updateOrCreate(
        { itemId: item.id },
        {
          itemId: item.id,
          priceOverride: listing.priceOverride,
          stock: listing.stock,
          isActive: listing.isActive,
        }
      )
    }
  }
}
