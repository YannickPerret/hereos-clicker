import { useState, useEffect, useCallback, useRef } from 'react'
import { Head, router } from '@inertiajs/react'
import { Transmit } from '@adonisjs/transmit-client'
import Layout from '~/components/layout'

interface Character {
  id: number
  name: string
  posX: number
  posY: number
  chosenSpec: string | null
}

interface MapObject {
  id: number
  name: string
  type: string
  x: number
  y: number
  metadata: any
}

interface MapData {
  id: number
  name: string
  width: number
  height: number
  backgroundImage: string | null
  tilesetImage: string | null
  tileWidth: number
  tileHeight: number
  layerData: string | null
  collisions: string | null
  objects: MapObject[]
  characters: Character[]
}

interface Props {
  mapData: MapData
  character: Character
}

export default function MapPage({ mapData, character: initialCharacter }: Props) {
  const [map, setMap] = useState(mapData)
  const [character, setCharacter] = useState(initialCharacter)
  const [moving, setMoving] = useState(false)
  const [hoverPath, setHoverPath] = useState<{ x: number, y: number }[]>([])
  
  const transmitRef = useRef<Transmit | null>(null)

  // Calcule la position d'une tuile dans le tileset
  const getTileStyle = (gid: number) => {
    if (!gid || gid === 0 || !map.tilesetImage) return {}
    
    // Supposons une image de tileset standard, on doit calculer X et Y
    // Pour simplifier ici, on part du principe que le tileset fait 256px de large (8 tuiles de 32px)
    // Idéalement, il faudrait passer le 'columns' du JSON Tiled au frontend
    const columns = 8 
    const x = ((gid - 1) % columns) * map.tileWidth
    const y = Math.floor((gid - 1) / columns) * map.tileHeight

    return {
      backgroundImage: `url('/assets/maps/tilesets/${map.tilesetImage}')`,
      backgroundPosition: `-${x}px -${y}px`,
      backgroundSize: 'auto', // Important pour garder l'échelle
    }
  }

  const animatePath = useCallback((characterId: number, path: {x: number, y: number}[], onComplete?: () => void) => {
    let i = 0
    const interval = setInterval(() => {
      if (i >= path.length) {
        clearInterval(interval)
        if (onComplete) onComplete()
        return
      }
      const step = path[i]
      if (characterId === character.id) setCharacter(prev => ({ ...prev, posX: step.x, posY: step.y }))
      setMap((prev) => ({
        ...prev,
        characters: prev.characters.map((c) => c.id === characterId ? { ...c, posX: step.x, posY: step.y } : c),
      }))
      i++
    }, 150)
  }, [character.id])

  useEffect(() => {
    const transmit = new Transmit({ baseUrl: window.location.origin })
    transmitRef.current = transmit
    const subscription = transmit.subscription(`map:${map.id}`)
    subscription.create()
    subscription.onMessage((data: any) => {
      if (data.type === 'PLAYER_MOVED') {
        if (data.path) animatePath(data.characterId, data.path)
      } else if (data.type === 'PLAYER_JOINED') {
        setMap(prev => ({ ...prev, characters: [...prev.characters.filter(c => c.id !== data.character.id), data.character] }))
      } else if (data.type === 'PLAYER_LEFT') {
        setMap(prev => ({ ...prev, characters: prev.characters.filter(c => c.id !== data.characterId) }))
      }
    })
    return () => {
      subscription.delete()
      transmit.close()
      if (transmitRef.current === transmit) {
        transmitRef.current = null
      }
    }
  }, [map.id, animatePath])

  const findAStarPath = (startX: number, startY: number, endX: number, endY: number) => {
    const collisions = map.collisions ? JSON.parse(map.collisions) : []
    const isObstacle = (x: number, y: number) => collisions.some((c: any) => c.x === x && c.y === y)
    const openSet: any[] = [{ x: startX, y: startY, g: 0, f: 0 }]
    const closedSet = new Set<string>()
    const parentMap = new Map<string, any>()
    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()
      if (current.x === endX && current.y === endY) {
        const path = []
        let curr = current
        while (curr) { path.unshift({ x: curr.x, y: curr.y }); curr = parentMap.get(`${curr.x},${curr.y}`) }
        return path
      }
      closedSet.add(`${current.x},${current.y}`)
      const neighbors = [{x:current.x+1,y:current.y},{x:current.x-1,y:current.y},{x:current.x,y:current.y+1},{x:current.x,y:current.y-1}]
      for (const n of neighbors) {
        if (n.x<0||n.x>=map.width||n.y<0||n.y>=map.height||isObstacle(n.x,n.y)||closedSet.has(`${n.x},${n.y}`)) continue
        const g = current.g + 1
        if (!openSet.find(o => o.x===n.x && o.y===n.y)) {
          const h = Math.abs(n.x-endX) + Math.abs(n.y-endY)
          openSet.push({ ...n, g, f: g+h }); parentMap.set(`${n.x},${n.y}`, current)
        }
      }
    }
    return []
  }

  const handleTileClick = async (x: number, y: number) => {
    if (moving || (character.posX === x && character.posY === y)) return
    const path = findAStarPath(character.posX, character.posY, x, y)
    if (path.length === 0) return
    setMoving(true); setHoverPath([])
    try {
      const response = await fetch('/map/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '') },
        body: JSON.stringify({ x, y }),
      })
      const result = await response.json()
      if (response.ok) {
        animatePath(character.id, path, () => {
          setMoving(false)
          if (result.status === 'teleport') router.reload()
        })
      } else { setMoving(false) }
    } catch { setMoving(false) }
  }

  const renderTiles = () => {
    const tiles = []
    const collisions = map.collisions ? JSON.parse(map.collisions) : []
    const layerData = map.layerData ? JSON.parse(map.layerData) : null

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const isCollision = collisions.some((c: any) => c.x === x && c.y === y)
        const obj = map.objects.find((o) => o.x === x && o.y === y)
        const charsAtTile = map.characters.filter((c) => c.posX === x && c.posY === y && c.id !== character.id)
        const isMe = character.posX === x && character.posY === y
        const isInPath = hoverPath.some(p => p.x === x && p.y === y)
        const gid = layerData ? layerData[y * map.width + x] : 0

        tiles.push(
          <div
            key={`${x}-${y}`}
            onClick={() => handleTileClick(x, y)}
            onMouseEnter={() => !moving && setHoverPath(findAStarPath(character.posX, character.posY, x, y))}
            className={`relative border border-white/5 flex items-center justify-center transition-all duration-75 ${isCollision ? 'bg-red-900/10' : 'hover:bg-white/10 cursor-pointer'} ${isInPath && !isMe ? 'bg-cyber-green/20' : ''}`}
            style={{ width: '100%', aspectRatio: '1/1', ...getTileStyle(gid) }}
          >
            {isInPath && !isMe && !isCollision && <div className="w-1.5 h-1.5 bg-cyber-green/40 rounded-full" />}
            {obj && (
              <div onClick={(e) => { e.stopPropagation(); obj.type === 'shop' ? router.visit('/shop') : obj.type === 'dungeon' ? router.visit('/dungeon') : null }}
                className={`z-10 w-4/5 h-4/5 flex items-center justify-center rounded cursor-pointer border ${obj.type === 'teleport' ? 'bg-cyber-yellow/20 border-cyber-yellow animate-pulse shadow-[0_0_10px_orange]' : 'bg-cyber-blue/20 border-cyber-blue'}`}>
                <span className="text-xs">{obj.type === 'shop' ? '🏪' : obj.type === 'dungeon' ? '🏰' : '✨'}</span>
              </div>
            )}
            {charsAtTile.map(other => <div key={other.id} className="absolute z-20 w-3/5 h-3/5 bg-cyber-purple border border-cyber-purple shadow-[0_0_10px_purple] rounded-full" title={other.name} />)}
            {isMe && <div className="absolute z-30 w-3/4 h-3/4 bg-cyber-green border-2 border-white shadow-[0_0_15px_#00ff00] rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-black rounded-full" /></div>}
          </div>
        )
      }
    }
    return tiles
  }

  return (
    <Layout>
      <Head title={`Map - ${map.name}`} />
      <div className="flex flex-col h-full bg-cyber-black p-4">
        <div className="flex justify-between items-center mb-4 border-b border-cyber-green/20 pb-2">
          <div><h1 className="text-xl font-bold text-cyber-green tracking-tighter uppercase italic">{map.name}</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">X: {character.posX} | Y: {character.posY} {moving && ' - EN MOUVEMENT...'}</p></div>
          <div className="text-right"><p className="text-[10px] text-gray-500 uppercase">Reseau</p><p className="text-sm font-bold text-cyber-blue">SYNCHRONISÉ</p></div>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-cyber-dark/50 border border-cyber-green/10 rounded-lg select-none">
          <div className="grid shadow-2xl bg-black/40" style={{ display: 'grid', gridTemplateColumns: `repeat(${map.width}, minmax(40px, 1fr))`, width: `${map.width * 50}px`, maxWidth: '100%' }} onMouseLeave={() => setHoverPath([])}>
            {renderTiles()}
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-[10px] uppercase tracking-widest text-gray-500">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyber-green rounded-full" /> Vous</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyber-purple rounded-full" /> Autres Joueurs</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyber-yellow border border-cyber-yellow rounded animate-pulse" /> Portail</div>
        </div>
      </div>
    </Layout>
  )
}
