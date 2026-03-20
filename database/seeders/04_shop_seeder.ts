import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ShopListing from '#models/shop_listing'
import Item from '#models/item'

export default class extends BaseSeeder {
  async run() {
    const listings = [
      // Weapons
      { itemName: 'Plasma Pistol MK-I', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Vibro-Blade', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Budget Arms Unity+', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Neural Disruptor', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Kang Tao Shock Carbine', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Railgun X-7', priceOverride: null, stock: 3, isActive: true },
      { itemName: 'Militech Crusher Custom', priceOverride: null, stock: 3, isActive: true },
      { itemName: 'Void Cannon', priceOverride: null, stock: 1, isActive: true },
      { itemName: 'Arasaka Revenant Smartgun', priceOverride: 64000, stock: 1, isActive: true },
      { itemName: 'Blackwall Breacher', priceOverride: 290000, stock: 1, isActive: true },
      // Armor
      { itemName: 'Kevlar Vest', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Tyger Claws Reinforced Coat', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Nanoweave Jacket', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Trauma Team Ballistic Mesh', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Titanium Exosuit', priceOverride: null, stock: 3, isActive: true },
      { itemName: 'Militech Bastion Frame', priceOverride: null, stock: 3, isActive: true },
      { itemName: 'Arasaka Specter Weave', priceOverride: 58000, stock: 1, isActive: true },
      { itemName: 'Mikoshi Nullskin', priceOverride: 260000, stock: 1, isActive: true },
      // Implants
      { itemName: 'Reflex Booster v1', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Kiroshi Pulse Sync', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Neural Accelerator', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Sandevistan Lite', priceOverride: null, stock: 5, isActive: true },
      { itemName: 'Synaptic Overdrive', priceOverride: null, stock: 2, isActive: true },
      { itemName: 'QianT Synapse Rail', priceOverride: null, stock: 3, isActive: true },
      { itemName: 'Mantis Driver Suite', priceOverride: 62000, stock: 1, isActive: true },
      { itemName: 'Militech Apogee Sandevistan', priceOverride: 380000, stock: 1, isActive: true },
      { itemName: 'Relic Overclock Kernel', priceOverride: 330000, stock: 1, isActive: true },
      // Clothes
      { itemName: 'Static Mohawk', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Acid Bob', priceOverride: null, stock: 6, isActive: true },
      { itemName: 'Ghost Braids', priceOverride: null, stock: 4, isActive: true },
      { itemName: 'Chromehawk Crown', priceOverride: 28000, stock: 2, isActive: true },
      { itemName: 'Kiroshi Night Visor', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Carbon Half Mask', priceOverride: null, stock: 6, isActive: true },
      { itemName: 'Oni Signal Mask', priceOverride: null, stock: 4, isActive: true },
      { itemName: 'Blackwall Respirator', priceOverride: 32000, stock: 2, isActive: true },
      { itemName: 'Hexline Jacket', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Nightglass Trench', priceOverride: null, stock: 4, isActive: true },
      { itemName: 'Chrome Bolero', priceOverride: 33000, stock: 2, isActive: true },
      { itemName: 'Holo Weave Shell', priceOverride: 79000, stock: 1, isActive: true },
      { itemName: 'Backalley Cargos', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Techwear Striders', priceOverride: null, stock: 6, isActive: true },
      { itemName: 'Zero-G Runners', priceOverride: null, stock: 4, isActive: true },
      { itemName: 'Exo-Leg Rails', priceOverride: 36000, stock: 2, isActive: true },
      // Consumables
      { itemName: 'Stim Pack', priceOverride: null, stock: null, isActive: true },
      { itemName: 'MedGel Capsule', priceOverride: null, stock: null, isActive: true },
      { itemName: 'Phoenix Serum', priceOverride: null, stock: 10, isActive: true },
      { itemName: 'CyberBoost Energy', priceOverride: null, stock: null, isActive: true },
      // Upgrades
      { itemName: 'Finger Servos', priceOverride: 5000, stock: 10, isActive: true },
      { itemName: 'Haptic Amplifier', priceOverride: 50000, stock: 10, isActive: true },
      { itemName: 'Neural Click Matrix', priceOverride: 500000, stock: 10, isActive: false },
      { itemName: 'Quantum Tap Interface', priceOverride: 5000000, stock: 10, isActive: false },
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
