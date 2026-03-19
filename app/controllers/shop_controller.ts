import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import ShopListing from '#models/shop_listing'
import InventoryItem from '#models/inventory_item'

export default class ShopController {
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

  async buy({ params, auth, response, session }: HttpContext) {
    const character = await Character.query()
      .where('userId', auth.user!.id)
      .firstOrFail()

    const listing = await ShopListing.query()
      .where('id', params.id)
      .where('isActive', true)
      .preload('item')
      .firstOrFail()

    const price = listing.priceOverride ?? listing.item.basePrice

    if (character.credits < price) {
      session.flash('errors', { message: 'Not enough credits' })
      return response.redirect('/shop')
    }

    if (listing.stock !== null && listing.stock <= 0) {
      session.flash('errors', { message: 'Out of stock' })
      return response.redirect('/shop')
    }

    // Deduct credits
    character.credits -= price
    await character.save()

    // Reduce stock
    if (listing.stock !== null) {
      listing.stock -= 1
      if (listing.stock <= 0) {
        listing.isActive = false
      }
      await listing.save()
    }

    // Add to inventory
    const existing = await InventoryItem.query()
      .where('characterId', character.id)
      .where('itemId', listing.itemId)
      .first()

    if (existing) {
      existing.quantity += 1
      await existing.save()
    } else {
      await InventoryItem.create({
        characterId: character.id,
        itemId: listing.itemId,
        quantity: 1,
        isEquipped: false,
      })
    }

    session.flash('success', `Purchased ${listing.item.name}`)
    return response.redirect('/shop')
  }
}
