import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import ShopListing from '#models/shop_listing'
import InventoryItem from '#models/inventory_item'
import Item from '#models/item'

export default class ShopController {
  private getNextUpgradeName(itemName: string) {
    const nextByName: Record<string, string | undefined> = {
      'Finger Servos': 'Haptic Amplifier',
      'Haptic Amplifier': 'Neural Click Matrix',
      'Neural Click Matrix': 'Quantum Tap Interface',
    }

    return nextByName[itemName] || null
  }

  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const listings = await ShopListing.query()
      .where('isActive', true)
      .preload('item')

    return inertia.render('shop/index', {
      character: character.serialize(),
      listings: listings.map((l) => ({
        ...l.serialize(),
        item: l.item.serialize(),
        price: l.priceOverride ?? l.item.basePrice,
      })),
    })
  }

  async buy({ params, request, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const listing = await ShopListing.query()
      .where('id', params.id)
      .where('isActive', true)
      .preload('item')
      .firstOrFail()

    const quantity = Math.max(1, Math.floor(Number(request.input('quantity', 1)) || 1))
    const price = listing.priceOverride ?? listing.item.basePrice
    const totalPrice = price * quantity

    if (character.credits < totalPrice) {
      session.flash('errors', { message: 'Not enough credits' })
      return response.redirect('/shop')
    }

    if (listing.stock !== null && listing.stock < quantity) {
      session.flash('errors', { message: 'Out of stock' })
      return response.redirect('/shop')
    }

    // Deduct credits
    character.credits -= totalPrice
    await character.save()

    let unlockedUpgradeName: string | null = null

    // Reduce stock
    if (listing.stock !== null) {
      listing.stock -= quantity
      if (listing.stock <= 0) {
        listing.isActive = false

        if (listing.item.type === 'upgrade') {
          const nextUpgradeName = this.getNextUpgradeName(listing.item.name)
          if (nextUpgradeName) {
            const nextItem = await Item.findBy('name', nextUpgradeName)
            if (nextItem) {
              const nextListing = await ShopListing.findBy('itemId', nextItem.id)
              if (nextListing && !nextListing.isActive && (nextListing.stock === null || nextListing.stock > 0)) {
                nextListing.isActive = true
                await nextListing.save()
                unlockedUpgradeName = nextUpgradeName
              }
            }
          }
        }
      }
      await listing.save()
    }

    // Add to inventory
    const existing = await InventoryItem.query()
      .where('characterId', character.id)
      .where('itemId', listing.itemId)
      .first()

    if (existing) {
      existing.quantity += quantity
      await existing.save()
    } else {
      await InventoryItem.create({
        characterId: character.id,
        itemId: listing.itemId,
        quantity,
        isEquipped: false,
      })
    }

    const successMessage = unlockedUpgradeName
      ? `Purchased ${quantity}x ${listing.item.name}. ${unlockedUpgradeName} unlocked in shop`
      : `Purchased ${quantity}x ${listing.item.name}`

    session.flash('success', successMessage)
    return response.redirect('/shop')
  }
}
