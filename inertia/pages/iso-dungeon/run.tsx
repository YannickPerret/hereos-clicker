import { useState, useCallback } from 'react'
import { router } from '@inertiajs/react'
import GameLayout from '~/components/layout'
import IsoGame, { type RoomData, type RoomEnemy, type TilesetData, type SpriteData } from '~/components/iso_game'

function getCsrfToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]
}

async function postJson(url: string, body: any = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken() || ''),
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

interface Props {
  character: { id: number; name: string; level: number; hp: number; maxHp: number }
  run: {
    id: number
    status: string
    currentRoomOrder: number
    playerX: number
    playerY: number
    defeatedEnemies: number[]
  }
  dungeon: { id: number; name: string; totalRooms: number }
  room: RoomData
  tilesets: TilesetData[]
  sprites: SpriteData[]
}

export default function IsoDungeonRun({ character, run, dungeon, room, tilesets, sprites }: Props) {
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [status, setStatus] = useState(run.status)

  const handleMove = useCallback(async (x: number, y: number) => {
    await postJson(`/iso-dungeon/run/${run.id}/move`, { x, y })
  }, [run.id])

  const handleEnemyClick = useCallback(async (enemy: RoomEnemy) => {
    setCombatLog((prev) => [...prev, `>> Combat contre ${enemy.name}${enemy.isBoss ? ' (BOSS)' : ''}...`])

    const result = await postJson(`/iso-dungeon/run/${run.id}/engage`, { roomEnemyId: enemy.id })

    if (result.status === 'defeated') {
      const credits = Math.floor(Math.random() * (result.creditsMax - result.creditsMin + 1)) + result.creditsMin
      setCombatLog((prev) => [
        ...prev,
        `${result.enemyName} vaincu ! +${result.xpReward} XP, +${credits} credits`,
      ])
      // Reload to update enemies list
      router.reload()
    } else {
      setCombatLog((prev) => [...prev, `Erreur: ${result.error || 'inconnu'}`])
    }
  }, [run.id])

  const handleExitReached = useCallback(async () => {
    const result = await postJson(`/iso-dungeon/run/${run.id}/next-room`)

    if (result.status === 'victory') {
      setStatus('victory')
      setCombatLog((prev) => [...prev, '=== DONJON TERMINE ! VICTOIRE ! ==='])
    } else if (result.status === 'next_room') {
      setCombatLog((prev) => [...prev, `>> Passage a la salle suivante...`])
      router.reload()
    } else if (result.status === 'blocked') {
      setCombatLog((prev) => [...prev, `!! ${result.message}`])
    }
  }, [run.id])

  if (status === 'victory') {
    return (
      <GameLayout>
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="text-6xl mb-6">🏆</div>
          <h1 className="text-3xl font-bold text-cyber-green uppercase tracking-widest mb-4">Victoire !</h1>
          <p className="text-gray-400 mb-2">{dungeon.name} termine</p>
          <p className="text-sm text-gray-500 mb-8">{dungeon.totalRooms} salle(s) franchie(s)</p>
          <button onClick={() => router.visit('/iso-dungeon')}
            className="px-6 py-3 border border-cyber-green/40 text-cyber-green rounded text-xs uppercase tracking-widest hover:bg-cyber-green/10">
            Retour aux donjons
          </button>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-purple/20 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-cyber-purple">{dungeon.name}</div>
              <div className="text-sm font-bold text-white">{room.name} {room.isBossRoom && <span className="text-cyber-red">★ BOSS</span>}</div>
            </div>
            <div className="text-[10px] text-gray-500 uppercase">
              Salle {run.currentRoomOrder}/{dungeon.totalRooms}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.post(`/iso-dungeon/run/${run.id}/flee`)}
              className="px-3 py-1.5 border border-cyber-red/30 text-cyber-red rounded text-[10px] uppercase tracking-widest hover:bg-cyber-red/10">
              Fuir
            </button>
          </div>
        </div>

        {/* Game + Log */}
        <div className="flex-1 flex min-h-0">
          {/* Phaser canvas */}
          <div className="flex-1 min-h-0">
            <IsoGame
              room={room}
              tilesets={tilesets}
              sprites={sprites}
              playerX={run.playerX}
              playerY={run.playerY}
              onMove={handleMove}
              onEnemyClick={handleEnemyClick}
              onExitReached={handleExitReached}
            />
          </div>

          {/* Combat log sidebar */}
          <div className="w-64 border-l border-gray-800 bg-cyber-black/50 p-3 overflow-y-auto shrink-0 hidden lg:block">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Journal de combat</div>
            <div className="space-y-1">
              {combatLog.length === 0 && (
                <div className="text-[10px] text-gray-600">Cliquez sur un ennemi pour combattre. Atteignez la sortie pour passer a la salle suivante.</div>
              )}
              {combatLog.map((line, i) => (
                <div key={i} className={`text-[10px] ${line.startsWith('>>') ? 'text-cyber-blue' : line.startsWith('!!') ? 'text-cyber-red' : line.startsWith('===') ? 'text-cyber-green font-bold' : 'text-gray-400'}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  )
}
