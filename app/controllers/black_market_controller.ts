import type { HttpContext } from '@adonisjs/core/http'
import Character from '#models/character'
import BlackMarketService from '#services/black_market_service'
import { localize } from '#services/locale_service'

export default class BlackMarketController {
  private async getUnlockedCharacter(userId: number) {
    const character = await Character.query()
      .where('userId', userId)
      .firstOrFail()

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
      }
      return inertia.render('black_market/index', localizedState)
    } catch (error) {
      session.flash('errors', { message: error instanceof Error ? error.message : 'Erreur marche noir' })
      return response.redirect('/play')
    }
  }

  async buy({ params, request, auth, response, session }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const quantity = Number(request.input('quantity', 1)) || 1
      const result = await BlackMarketService.buyDeal(character, Number(params.id), quantity)
      session.flash('success', `Black market: ${result.quantity}x ${result.itemName} achete chez ${result.vendorName}`)
    } catch (error) {
      session.flash('errors', { message: error instanceof Error ? error.message : 'Erreur marche noir' })
    }

    return response.redirect('/black-market')
  }

  async clean({ request, auth, response, session }: HttpContext) {
    try {
      const character = await this.getUnlockedCharacter(auth.user!.id)
      const result = await BlackMarketService.cleanHeat(character, String(request.input('cleanerKey', '')))
      session.flash('success', `${result.cleanerName}: -${result.heatReduced} chaleur`)
    } catch (error) {
      session.flash('errors', { message: error instanceof Error ? error.message : 'Erreur marche noir' })
    }

    return response.redirect('/black-market')
  }
}
