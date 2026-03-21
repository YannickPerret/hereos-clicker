import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import MapService from '#services/map_service'
import Character from '#models/character'
import Map from '#models/map'

@inject()
export default class MapsController {
  constructor(protected mapService: MapService) {}

  /**
   * Main page for the map
   */
  async index({ inertia, auth }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    
    // If character doesn't have a map, assign to default (first map)
    if (!character.currentMapId) {
      let defaultMap = await Map.first()
      if (!defaultMap) {
        defaultMap = await Map.create({
          name: 'Sector 4 - Slums',
          slug: 'sector-4',
          width: 15,
          height: 15,
        })
      }
      await this.mapService.joinMap(character, defaultMap.id)
    }

    const mapData = await this.mapService.getMapData(character.currentMapId!)
    
    return inertia.render('map/index', {
      mapData,
      character: character.serialize(),
    })
  }

  /**
   * Handle movement request
   */
  async move({ auth, request, response }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const { x, y } = request.only(['x', 'y'])

    try {
      const result = await this.mapService.moveCharacter(character, x, y)
      
      if (result.status === 'teleport') {
        await this.mapService.joinMap(character, result.targetMapId, result.targetX, result.targetY)
        return response.ok({ status: 'teleport', mapId: result.targetMapId })
      }

      return response.ok({ status: 'moved', x, y })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * Teleport/Change map
   */
  async join({ auth, request, response }: HttpContext) {
    const character = await Character.query().where('userId', auth.user!.id).firstOrFail()
    const { mapId, x, y } = request.only(['mapId', 'x', 'y'])

    try {
      await this.mapService.joinMap(character, mapId, x, y)
      return response.ok({ status: 'joined' })
    } catch (error) {
      return response.badRequest({ error: error.message })
    }
  }
}
