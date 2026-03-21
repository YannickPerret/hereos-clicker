import Map from '#models/map'
import MapObject from '#models/map_object'
import Character from '#models/character'
import transmit from '@adonisjs/transmit/services/main'
import fs from 'node:fs/promises'

export default class MapService {
  /**
   * Importe une map depuis un fichier JSON exporté par LDtk
   */
  async importFromLDtk(jsonPath: string, levelIdentifier: string, slug: string) {
    const rawData = await fs.readFile(jsonPath, 'utf-8')
    const ldtkData = JSON.parse(rawData)

    // LDtk peut avoir plusieurs niveaux dans un seul fichier
    const level = ldtkData.levels.find((l: any) => l.identifier === levelIdentifier)
    if (!level) throw new Error(`Level "${levelIdentifier}" not found in LDtk file`)

    const width = level.pxWid / ldtkData.defaultGridSize
    const height = level.pxHei / ldtkData.defaultGridSize
    const collisions: { x: number; y: number }[] = []
    const mapObjects: any[] = []
    let baseLayerData: number[] = []
    let tilesetImage: string | null = null

    // Parcourir les couches (layers) du niveau
    for (const layer of level.layerInstances) {
      if (layer.__type === 'IntGrid' && layer.identifier === 'Collisions') {
        // LDtk utilise un tableau 'intGridCsv' pour les collisions
        layer.intGridCsv.forEach((val: number, index: number) => {
          if (val > 0) {
            collisions.push({
              x: index % layer.__cWid,
              y: Math.floor(index / layer.__cWid),
            })
          }
        })
      } else if (layer.__type === 'Tiles' || layer.__type === 'AutoLayer') {
        // On récupère les tuiles pour le rendu
        // Note: LDtk est plus complexe pour le rendu multi-couche, 
        // ici on prend la grille simplifiée pour l'exemple
        if (!tilesetImage && layer.__tilesetRelPath) {
          tilesetImage = layer.__tilesetRelPath.split('/').pop()
        }
        // Conversion du format LDtk Tiles vers notre format GID simplifié
        baseLayerData = new Array(width * height).fill(0)
        layer.gridTiles.forEach((tile: any) => {
          const idx = (tile.px[1] / layer.__gridSize) * layer.__cWid + (tile.px[0] / layer.__gridSize)
          baseLayerData[idx] = tile.t + 1 // +1 car 0 est vide dans notre système
        })
      } else if (layer.__type === 'Entities') {
        // Extraction des entités (Teleport, Shop, etc.)
        for (const entity of layer.entityInstances) {
          const gridX = Math.floor(entity.px[0] / layer.__gridSize)
          const gridY = Math.floor(entity.px[1] / layer.__gridSize)
          
          const metadata: any = {}
          entity.fieldInstances.forEach((f: any) => {
            metadata[f.__identifier] = f.__value
          })

          mapObjects.push({
            name: entity.__identifier,
            type: entity.__identifier.toLowerCase(),
            x: gridX,
            y: gridY,
            metadata: metadata
          })
        }
      }
    }

    // Sauvegarde en DB
    const map = await Map.updateOrCreate(
      { slug },
      {
        name: levelIdentifier,
        width,
        height,
        collisions: JSON.stringify(collisions),
        layerData: JSON.stringify(baseLayerData),
        tilesetImage,
        tileWidth: ldtkData.defaultGridSize,
        tileHeight: ldtkData.defaultGridSize,
      }
    )

    await MapObject.query().where('mapId', map.id).delete()
    if (mapObjects.length > 0) {
      await map.related('objects').createMany(mapObjects)
    }

    return map
  }

  // --- Méthode d'import Tiled existante (maintenue pour compatibilité) ---
  async importFromTiled(jsonPath: string, mapName: string, slug: string) {
    const rawData = await fs.readFile(jsonPath, 'utf-8')
    const tiledData = JSON.parse(rawData)
    const { width, height, layers, tilesets, tilewidth, tileheight } = tiledData
    const collisions: { x: number; y: number }[] = []
    const mapObjects: any[] = []
    let baseLayerData: number[] = []

    for (const layer of layers) {
      if (layer.name === 'Collisions') {
        layer.data.forEach((gid: number, index: number) => {
          if (gid > 0) collisions.push({ x: index % width, y: Math.floor(index / width) })
        })
      } else if (layer.name === 'Base' || layer.name === 'Ground') {
        baseLayerData = layer.data
      } else if (layer.type === 'objectgroup') {
        for (const obj of layer.objects) {
          const gridX = Math.floor(obj.x / tilewidth)
          const gridY = Math.floor(obj.y / tileheight)
          const metadata: any = {}
          if (obj.properties) obj.properties.forEach((p: any) => { metadata[p.name] = p.value })
          mapObjects.push({ name: obj.name || obj.type, type: (obj.type || obj.name).toLowerCase(), x: gridX, y: gridY, metadata: metadata })
        }
      }
    }

    const tilesetImage = tilesets && tilesets.length > 0 ? tilesets[0].image : null
    const map = await Map.updateOrCreate({ slug }, { name: mapName, width, height, collisions: JSON.stringify(collisions), layerData: JSON.stringify(baseLayerData), tilesetImage, tileWidth: tilewidth, tileHeight: tileheight })
    await MapObject.query().where('mapId', map.id).delete()
    if (mapObjects.length > 0) await map.related('objects').createMany(mapObjects)
    return map
  }

  // ... (Reste des méthodes findPath, moveCharacter, joinMap inchangées)
  async getMapData(mapId: number) {
    const map = await Map.query().where('id', mapId).preload('objects').preload('characters', (q) => q.select('id', 'name', 'posX', 'posY', 'chosenSpec')).firstOrFail()
    return map
  }

  private findPath(startX: number, startY: number, endX: number, endY: number, map: Map) {
    const width = map.width; const height = map.height
    const collisions = map.collisions ? JSON.parse(map.collisions) : []
    const isObstacle = (x: number, y: number) => collisions.some((c: any) => c.x === x && c.y === y)
    const openSet: any[] = [{ x: startX, y: startY, g: 0, h: this.heuristic(startX, startY, endX, endY), f: 0 }]
    const closedSet = new Set<string>()
    const parentMap = new Map<string, any>()
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()
      if (current.x === endX && current.y === endY) {
        const path = []; let curr = current
        while (curr) { path.unshift({ x: curr.x, y: curr.y }); curr = parentMap.get(`${curr.x},${curr.y}`) }
        return path
      }
      closedSet.add(`${current.x},${current.y}`)
      const neighbors = [{ x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y }, { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 }]
      for (const neighbor of neighbors) {
        if (neighbor.x < 0 || neighbor.x >= width || neighbor.y < 0 || neighbor.y >= height || isObstacle(neighbor.x, neighbor.y) || closedSet.has(`${neighbor.x},${neighbor.y}`)) continue
        const gScore = current.g + 1
        const existingNeighbor = openSet.find((o) => o.x === neighbor.x && o.y === neighbor.y)
        if (!existingNeighbor) {
          const h = this.heuristic(neighbor.x, neighbor.y, endX, endY)
          const newNeighbor = { ...neighbor, g: gScore, h, f: gScore + h }; openSet.push(newNeighbor); parentMap.set(`${neighbor.x},${neighbor.y}`, current)
        } else if (gScore < existingNeighbor.g) {
          existingNeighbor.g = gScore; existingNeighbor.f = gScore + existingNeighbor.h; parentMap.set(`${neighbor.x},${neighbor.y}`, current)
        }
      }
    }
    return null
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number) { return Math.abs(x1 - x2) + Math.abs(y1 - y2) }

  async moveCharacter(character: Character, targetX: number, targetY: number) {
    if (!character.currentMapId) throw new Error('Character is not on a map')
    const map = await Map.query().where('id', character.currentMapId).preload('objects').firstOrFail()
    const path = this.findPath(character.posX, character.posY, targetX, targetY, map)
    if (!path) throw new Error('No path found')
    if (path.length > 20) throw new Error('Movement too far')
    character.posX = targetX; character.posY = targetY; await character.save()
    transmit.broadcast(`map:${map.id}`, { type: 'PLAYER_MOVED', characterId: character.id, name: character.name, x: targetX, y: targetY, path: path })
    const portal = map.objects.find(obj => obj.type === 'teleport' && obj.x === targetX && obj.y === targetY)
    if (portal) {
      const metadata = typeof portal.metadata === 'string' ? JSON.parse(portal.metadata) : portal.metadata
      if (metadata && metadata.targetMapId) return { status: 'teleport', targetMapId: metadata.targetMapId, targetX: metadata.targetX ?? 0, targetY: metadata.targetY ?? 0 }
    }
    return { status: 'moved', x: targetX, y: targetY }
  }

  async joinMap(character: Character, mapId: number, startX?: number, startY?: number) {
    const map = await Map.findOrFail(mapId); const oldMapId = character.currentMapId
    character.currentMapId = map.id; character.posX = startX ?? Math.floor(map.width / 2); character.posY = startY ?? Math.floor(map.height / 2); await character.save()
    if (oldMapId) transmit.broadcast(`map:${oldMapId}`, { type: 'PLAYER_LEFT', characterId: character.id })
    transmit.broadcast(`map:${map.id}`, { type: 'PLAYER_JOINED', character: { id: character.id, name: character.name, posX: character.posX, posY: character.posY, chosenSpec: character.chosenSpec } })
    return map
  }
}
