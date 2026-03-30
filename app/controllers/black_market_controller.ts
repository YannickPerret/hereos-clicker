import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import BlackMarketService from '#services/black_market_service'
import { localize } from '#services/locale_service'

export default class BlackMarketController {
  private async getUnlockedCharacter(userId: number) {
    const character = await Character.query().where('userId', userId).firstOrFail()

    const minLevel = await BlackMarketService.getMinLevel()
    if (character.level < minLevel) {
      throw new Error(`Marche noir verrouille jusqu'au niveau ${minLevel}`)
    }

    return character
  }

  async index({ inertia, auth, response, session, locale }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const marketState = await BlackMarketService.getMarketState(character)
      const localizedState = {
        ...marketState,
        vendors: marketState.vendors.map((vendor: any) => ({
          ...vendor,
          deals: vendor.deals.map((deal: any) => ({
            ...deal,
            item: localize(deal.item, locale, ['name', 'description']),
          })),
        })),
        playerMarket: {
          ...marketState.playerMarket,
          listings: marketState.playerMarket.listings.map((listing: any) => ({
            ...listing,
            item: localize(listing.item, locale, ['name', 'description']),
          })),
          myListings: marketState.playerMarket.myListings.map((listing: any) => ({
            ...listing,
            item: localize(listing.item, locale, ['name', 'description']),
          })),
          inventory: marketState.playerMarket.inventory.map((entry: any) => ({
            ...entry,
            item: localize(entry.item, locale, ['name', 'description']),
          })),
        },
      }
      return inertia.render('black_market/index', localizedState)
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Erreur marche noir',
      })
      return response.redirect('/play')
    }
  }

  async buy({ params, request, auth, response, session }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const quantity = Number(request.input('quantity', 1)) || 1
      const result = await BlackMarketService.buyDeal(character, Number(params.id), quantity)
      session.flash(
        'success',
        `Black market: ${result.quantity}x ${result.itemName} achete chez ${result.vendorName}`
      )
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Erreur marche noir',
      })
    }

    return response.redirect('/black-market')
  }

  async clean({ request, auth, response, session }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const result = await BlackMarketService.cleanHeat(
        character,
        String(request.input('cleanerKey', ''))
      )
      session.flash('success', `${result.cleanerName}: -${result.heatReduced} chaleur`)
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Erreur marche noir',
      })
    }

    return response.redirect('/black-market')
  }

  async createListing({ request, auth, response, session }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const inventoryItemId = Number(request.input('inventoryItemId', 0)) || 0
      const quantity = Number(request.input('quantity', 1)) || 1
      const listingType =
        request.input('listingType', 'direct') === 'auction' ? 'auction' : 'direct'
      const price = Number(request.input('price', 1)) || 1
      const durationHours = Number(request.input('durationHours', 24)) || 24
      const result = await BlackMarketService.createPlayerListing(
        character,
        inventoryItemId,
        quantity,
        listingType,
        price,
        durationHours
      )
      session.flash(
        'success',
        `${result.quantity}x ${result.itemName} mis en vente (${listingType === 'auction' ? 'enchere' : 'achat direct'})`
      )
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Erreur marche noir',
      })
    }

    return response.redirect('/black-market')
  }

  async buyListing({ params, request, auth, response, session }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const quantity = Number(request.input('quantity', 1)) || 1
      const result = await BlackMarketService.buyPlayerListing(
        character,
        Number(params.id),
        quantity
      )
      session.flash(
        'success',
        `${result.quantity}x ${result.itemName} achete a ${result.sellerName}`
      )
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Erreur marche noir',
      })
    }

    return response.redirect('/black-market')
  }

  async bid({ params, request, auth, response, session }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const bidAmount = Number(request.input('bidAmount', 0)) || 0
      const result = await BlackMarketService.placePlayerBid(
        character,
        Number(params.id),
        bidAmount
      )
      session.flash('success', `Enchere posee sur ${result.itemName}: ${result.bidAmount} credits`)
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Erreur marche noir',
      })
    }

    return response.redirect('/black-market')
  }

  async cancelListing({ params, auth, response, session }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const result = await BlackMarketService.cancelPlayerListing(character, Number(params.id))
      session.flash(
        'success',
        `Annonce annulee: ${result.returnedQuantity}x ${result.itemName} retour inventaire`
      )
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Erreur marche noir',
      })
    }

    return response.redirect('/black-market')
  }
}
