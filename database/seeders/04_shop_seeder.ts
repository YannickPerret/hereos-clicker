import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ShopListing from '#models/shop_listing'

export default class extends BaseSeeder {
  async run() {
    await ShopListing.createMany([
      // Weapons
      { itemId: 1, priceOverride: null, stock: null, isActive: true },
      { itemId: 2, priceOverride: null, stock: null, isActive: true },
      { itemId: 3, priceOverride: null, stock: 5, isActive: true },
      { itemId: 4, priceOverride: null, stock: 3, isActive: true },
      { itemId: 5, priceOverride: null, stock: 1, isActive: true },
      // Armor
      { itemId: 7, priceOverride: null, stock: null, isActive: true },
      { itemId: 8, priceOverride: null, stock: 5, isActive: true },
      { itemId: 9, priceOverride: null, stock: 3, isActive: true },
      // Implants
      { itemId: 12, priceOverride: null, stock: null, isActive: true },
      { itemId: 13, priceOverride: null, stock: 5, isActive: true },
      { itemId: 14, priceOverride: null, stock: 2, isActive: true },
      // Consumables
      { itemId: 17, priceOverride: null, stock: null, isActive: true },
      { itemId: 18, priceOverride: null, stock: null, isActive: true },
      { itemId: 19, priceOverride: null, stock: 10, isActive: true },
      { itemId: 20, priceOverride: null, stock: null, isActive: true },
      // Upgrades
      { itemId: 22, priceOverride: null, stock: null, isActive: true },
      { itemId: 23, priceOverride: null, stock: null, isActive: true },
      { itemId: 24, priceOverride: null, stock: 5, isActive: true },
      // Respec
      { itemId: 26, priceOverride: 50000, stock: null, isActive: true },
    ])
  }
}
