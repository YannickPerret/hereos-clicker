import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import MapService from '#services/map_service'

export default class MapImport extends BaseCommand {
  static commandName = 'map:import'
  static description = 'Import a Tiled or LDtk JSON map into the database'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Path to the JSON file' })
  declare path: string

  @args.string({ description: 'Name of the map (Tiled) or Level Identifier (LDtk)' })
  declare name: string

  @args.string({ description: 'Slug for the map' })
  declare slug: string

  @flags.string({ description: 'Format of the map file (tiled, ldtk)', default: 'tiled' })
  declare format: string

  async run() {
    const mapService = await this.app.container.make(MapService)
    
    this.logger.info(`Importing ${this.format} map from ${this.path}...`)
    
    try {
      let map
      if (this.format === 'ldtk') {
        map = await mapService.importFromLDtk(this.path, this.name, this.slug)
      } else {
        map = await mapService.importFromTiled(this.path, this.name, this.slug)
      }
      
      this.logger.success(`Map "${map.name}" imported successfully (ID: ${map.id})`)
      this.logger.info(`Dimensions: ${map.width}x${map.height} | Format: ${this.format.toUpperCase()}`)
    } catch (error) {
      this.logger.error(`Failed to import map: ${error.message}`)
    }
  }
}
