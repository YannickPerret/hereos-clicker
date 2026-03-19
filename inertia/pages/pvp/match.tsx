import { router } from '@inertiajs/react'
import { useState, useEffect, useRef } from 'react'
import GameLayout from '~/components/layout'

interface Fighter {
  id: number
  name: string
  level: number
  attack: number
  defense: number
  critChance: number
  critDamage: number
  pvpRating: number
}

interface LogEntry {
  round: number
  attackerId: number
  attackerName: string
  defenderId: number
  defenderName: string
  damage: number
  isCrit: boolean
  forfeit?: boolean
  challengerHp: number
  defenderHp: number
}

interface MatchState {
  id: number
  status: string
  challengerHp: number
  challengerHpMax: number
  defenderHp: number
  defenderHpMax: number
  currentTurnId: number | null
  winnerId: number | null
  ratingChange: number
  log: LogEntry[]
}

interface Props {
  myId: number
  match: MatchState
  challenger: Fighter
  defender: Fighter | null
}

export default function PvpMatch({ myId, match: initialMatch, challenger: initialChallenger, defender: initialDefender }: Props) {
  const [match, setMatch] = useState(initialMatch)
  const [challenger] = useState(initialChallenger)
  const [defender, setDefender] = useState(initialDefender)
  const [isAttacking, setIsAttacking] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isMyTurn = match.currentTurnId === myId
  const isOver = match.status === 'completed' || match.status === 'cancelled'
  const isWaiting = match.status === 'waiting'
  const amChallenger = challenger.id === myId

  // Poll for match state updates
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/pvp/match/${match.id}/state`)
        const data = await res.json()
        setMatch(data.match)
        if (data.defender && !defender) {
          setDefender(data.defender)
        }
      } catch {}
    }

    pollRef.current = setInterval(poll, 1500)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [match.id, defender])

  // Sync from props on Inertia reload
  useEffect(() => {
    setMatch(initialMatch)
    if (initialDefender) setDefender(initialDefender)
  }, [initialMatch, initialDefender])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [match.log])

  const handleAttack = () => {
    if (!isMyTurn || isAttacking) return
    setIsAttacking(true)
    router.post(`/pvp/match/${match.id}/attack`, {}, {
      onFinish: () => setIsAttacking(false),
    })
  }

  const handleForfeit = () => {
    if (confirm('Abandonner le combat ? Tu perdras du ELO.')) {
      router.post(`/pvp/match/${match.id}/forfeit`)
    }
  }

  const myFighter = amChallenger ? challenger : defender
  const opponentFighter = amChallenger ? defender : challenger
  const myHp = amChallenger ? match.challengerHp : match.defenderHp
  const myHpMax = amChallenger ? match.challengerHpMax : match.defenderHpMax
  const opponentHp = amChallenger ? match.defenderHp : match.challengerHp
  const opponentHpMax = amChallenger ? match.defenderHpMax : match.challengerHpMax

  return (
    <GameLayout>
      <div className="max-w-4xl mx-auto">
        {/* Waiting */}
        {isWaiting && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 animate-pulse">⚔️</div>
            <h2 className="text-xl font-bold text-cyber-yellow tracking-widest mb-4">
              EN ATTENTE D'ADVERSAIRE...
            </h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-cyber-yellow animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-cyber-yellow animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-2 h-2 rounded-full bg-cyber-yellow animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <p className="text-xs text-gray-600 mb-6">
              {challenger.name} (ELO {challenger.pvpRating}) — Recherche d'un adversaire de niveau similaire...
            </p>
            <button
              onClick={() => router.post('/pvp/leave-queue')}
              className="px-6 py-2 border border-gray-700 text-gray-500 rounded text-xs hover:text-gray-300 hover:border-gray-500 transition-all"
            >
              ANNULER
            </button>
          </div>
        )}

        {/* Active fight */}
        {match.status === 'in_progress' && defender && (
          <>
            {/* Turn indicator */}
            <div className="text-center mb-4">
              <span className={`text-xs px-4 py-1.5 rounded-full border ${isMyTurn ? 'bg-cyber-green/10 border-cyber-green/50 text-cyber-green' : 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red'}`}>
                {isMyTurn ? 'TON TOUR — ATTAQUE!' : `Tour de ${opponentFighter?.name}...`}
              </span>
            </div>

            {/* Fighters */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Me */}
              <div className={`bg-cyber-dark border rounded-lg p-4 ${isMyTurn ? 'border-cyber-green/50' : 'border-gray-800'}`}>
                <h3 className="text-cyber-blue font-bold text-center text-sm mb-3 tracking-widest">
                  {myFighter?.name} (TOI)
                </h3>
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>HP</span>
                    <span>{myHp}/{myHpMax}</span>
                  </div>
                  <div className="h-4 bg-cyber-black rounded-full overflow-hidden border border-cyber-green/20">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-green to-cyber-blue transition-all duration-500"
                      style={{ width: `${(myHp / myHpMax) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="text-center"><span className="text-gray-600">ATK</span> <span className="text-cyber-red font-bold ml-1">{myFighter?.attack}</span></div>
                  <div className="text-center"><span className="text-gray-600">DEF</span> <span className="text-cyber-blue font-bold ml-1">{myFighter?.defense}</span></div>
                  <div className="text-center"><span className="text-gray-600">CRIT%</span> <span className="text-cyber-yellow font-bold ml-1">{myFighter?.critChance}%</span></div>
                  <div className="text-center"><span className="text-gray-600">ELO</span> <span className="text-cyber-yellow font-bold ml-1">{myFighter?.pvpRating}</span></div>
                </div>
              </div>

              {/* VS + Actions */}
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="text-4xl font-bold text-cyber-pink neon-text-pink tracking-widest">VS</div>
                <button
                  onClick={handleAttack}
                  disabled={!isMyTurn || isAttacking}
                  className={`w-full py-3 rounded border font-bold uppercase tracking-widest text-sm transition-all ${
                    isMyTurn && !isAttacking
                      ? 'bg-cyber-red/20 border-cyber-red text-cyber-red hover:bg-cyber-red/30 animate-pulse'
                      : 'bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  {isAttacking ? 'ATTAQUE...' : isMyTurn ? '[ ATTAQUER ]' : 'EN ATTENTE...'}
                </button>
                <button
                  onClick={handleForfeit}
                  className="text-[10px] text-gray-700 hover:text-cyber-red transition-colors"
                >
                  ABANDONNER
                </button>
              </div>

              {/* Opponent */}
              <div className={`bg-cyber-dark border rounded-lg p-4 ${!isMyTurn ? 'border-cyber-red/50' : 'border-gray-800'}`}>
                <h3 className="text-cyber-red font-bold text-center text-sm mb-3 tracking-widest">
                  {opponentFighter?.name}
                </h3>
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>HP</span>
                    <span>{opponentHp}/{opponentHpMax}</span>
                  </div>
                  <div className="h-4 bg-cyber-black rounded-full overflow-hidden border border-cyber-red/20">
                    <div
                      className="h-full bg-gradient-to-r from-cyber-red to-cyber-orange transition-all duration-500"
                      style={{ width: `${(opponentHp / opponentHpMax) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="text-center"><span className="text-gray-600">ATK</span> <span className="text-cyber-red font-bold ml-1">{opponentFighter?.attack}</span></div>
                  <div className="text-center"><span className="text-gray-600">DEF</span> <span className="text-cyber-blue font-bold ml-1">{opponentFighter?.defense}</span></div>
                  <div className="text-center"><span className="text-gray-600">CRIT%</span> <span className="text-cyber-yellow font-bold ml-1">{opponentFighter?.critChance}%</span></div>
                  <div className="text-center"><span className="text-gray-600">ELO</span> <span className="text-cyber-yellow font-bold ml-1">{opponentFighter?.pvpRating}</span></div>
                </div>
              </div>
            </div>

            {/* Combat Log */}
            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-4">
              <h3 className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Combat Log</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {match.log.map((entry, i) => (
                  <div key={i} className={`text-xs p-2 rounded ${entry.isCrit ? 'bg-cyber-yellow/10 border border-cyber-yellow/20' : entry.attackerId === myId ? 'bg-cyber-blue/5' : 'bg-cyber-red/5'}`}>
                    <span className={entry.attackerId === myId ? 'text-cyber-blue' : 'text-cyber-red'}>
                      {entry.attackerName}
                    </span>
                    {entry.forfeit ? (
                      <span className="text-gray-500 ml-1">a abandonne</span>
                    ) : (
                      <>
                        <span className="text-gray-500 ml-1">frappe</span>
                        <span className="text-white font-bold ml-1">-{entry.damage}</span>
                        {entry.isCrit && <span className="text-cyber-yellow font-bold ml-1">CRIT!</span>}
                      </>
                    )}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </>
        )}

        {/* Match Over */}
        {isOver && match.winnerId && (
          <div className="text-center py-16">
            <h2 className={`text-3xl font-bold tracking-widest mb-4 ${match.winnerId === myId ? 'text-cyber-green' : 'text-cyber-red'}`}>
              {match.winnerId === myId ? 'VICTOIRE!' : 'DEFAITE'}
            </h2>
            <div className="space-y-2 mb-6">
              <div className={`text-lg font-bold ${match.winnerId === myId ? 'text-cyber-green' : 'text-cyber-red'}`}>
                {match.winnerId === myId ? '+' : '-'}{match.ratingChange} ELO
              </div>
            </div>

            {/* Final log */}
            {match.log.length > 0 && (
              <div className="max-w-md mx-auto bg-cyber-dark border border-gray-800 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Replay</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {match.log.map((entry, i) => (
                    <div key={i} className={`text-[10px] p-1.5 rounded ${entry.isCrit ? 'bg-cyber-yellow/10' : 'bg-cyber-black/30'}`}>
                      <span className={entry.attackerId === myId ? 'text-cyber-blue' : 'text-cyber-red'}>
                        {entry.attackerName}
                      </span>
                      {entry.forfeit ? (
                        <span className="text-gray-500 ml-1">abandon</span>
                      ) : (
                        <>
                          <span className="text-gray-600 ml-1">→ -{entry.damage}</span>
                          {entry.isCrit && <span className="text-cyber-yellow ml-1">CRIT</span>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.visit('/pvp')}
              className="px-8 py-3 bg-cyber-blue/20 border border-cyber-blue text-cyber-blue font-bold uppercase tracking-widest rounded hover:bg-cyber-blue/30 transition-all"
            >
              [ RETOUR A L'ARENE ]
            </button>
          </div>
        )}
      </div>
    </GameLayout>
  )
}
