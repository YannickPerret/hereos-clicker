import { Link, router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import GameLayout from '~/components/layout'

interface FriendEntry {
  id: number
  characterId: number
  name: string
  level: number
  pvpRating: number
  chosenSpec: string | null
  acceptedAt?: string | null
  createdAt?: string | null
}

interface Props {
  character: {
    id: number
    name: string
  }
  friends: FriendEntry[]
  incomingRequests: FriendEntry[]
  outgoingRequests: FriendEntry[]
}

function CharacterCard({
  entry,
  rightSlot,
}: {
  entry: FriendEntry
  rightSlot: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-cyber-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">{entry.name}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-gray-500">
            LVL {entry.level} • ELO {entry.pvpRating}
            {entry.chosenSpec ? ` • ${entry.chosenSpec}` : ''}
          </div>
        </div>
        <div className="shrink-0">{rightSlot}</div>
      </div>
      <div className="mt-3">
        <Link
          href={`/profile/${encodeURIComponent(entry.name)}`}
          className="text-[10px] uppercase tracking-widest text-cyber-blue transition hover:text-white"
        >
          Voir le profil
        </Link>
      </div>
    </div>
  )
}

export default function FriendsIndex({
  character,
  friends,
  incomingRequests,
  outgoingRequests,
}: Props) {
  const { errors } = usePage().props as any
  const [characterName, setCharacterName] = useState('')

  return (
    <GameLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-gray-500">Social</div>
            <h1 className="mt-2 text-2xl font-bold tracking-widest text-cyber-green">AMIS</h1>
            <div className="mt-1 text-xs text-gray-500">Reseau actif de {character.name}</div>
          </div>
        </div>

        {errors?.message && (
          <div className="mb-4 rounded-lg border border-cyber-red/40 bg-cyber-red/10 px-4 py-3 text-sm text-cyber-red">
            {errors.message}
          </div>
        )}

        <div className="mb-6 rounded-lg border border-cyber-green/20 bg-cyber-dark p-4">
          <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-gray-500">Ajouter un ami</div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!characterName.trim()) return
              router.post('/friends/request', { characterName })
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="text"
              value={characterName}
              onChange={(event) => setCharacterName(event.target.value)}
              placeholder="Nom du personnage..."
              className="flex-1 rounded border border-gray-800 bg-cyber-black px-4 py-2.5 text-sm text-white focus:border-cyber-green/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!characterName.trim()}
              className="rounded border border-cyber-green/30 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.24em] text-cyber-green transition hover:bg-cyber-green/10 disabled:opacity-40"
            >
              ENVOYER
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="xl:col-span-1">
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-cyber-orange">
              Demandes entrantes
            </div>
            <div className="space-y-3">
              {incomingRequests.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-cyber-dark px-4 py-6 text-center text-xs text-gray-600">
                  Aucune demande en attente
                </div>
              ) : (
                incomingRequests.map((entry) => (
                  <CharacterCard
                    key={entry.id}
                    entry={entry}
                    rightSlot={
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => router.post(`/friends/${entry.id}/accept`)}
                          className="rounded border border-cyber-green/30 px-2 py-1 text-[10px] uppercase tracking-widest text-cyber-green hover:bg-cyber-green/10"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => router.post(`/friends/${entry.id}/decline`)}
                          className="rounded border border-cyber-red/30 px-2 py-1 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
                        >
                          NON
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section className="xl:col-span-1">
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-cyber-blue">
              Amis
            </div>
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-cyber-dark px-4 py-6 text-center text-xs text-gray-600">
                  Aucun ami pour le moment
                </div>
              ) : (
                friends.map((entry) => (
                  <CharacterCard
                    key={entry.id}
                    entry={entry}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Retirer ${entry.name} de tes amis ?`)) {
                            router.post(`/friends/${entry.id}/remove`)
                          }
                        }}
                        className="rounded border border-cyber-red/30 px-2 py-1 text-[10px] uppercase tracking-widest text-cyber-red hover:bg-cyber-red/10"
                      >
                        RETIRER
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section className="xl:col-span-1">
            <div className="mb-3 text-sm font-bold uppercase tracking-widest text-cyber-purple">
              Demandes envoyees
            </div>
            <div className="space-y-3">
              {outgoingRequests.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-cyber-dark px-4 py-6 text-center text-xs text-gray-600">
                  Aucune demande envoyee
                </div>
              ) : (
                outgoingRequests.map((entry) => (
                  <CharacterCard
                    key={entry.id}
                    entry={entry}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => router.post(`/friends/${entry.id}/cancel`)}
                        className="rounded border border-gray-700 px-2 py-1 text-[10px] uppercase tracking-widest text-gray-400 hover:border-gray-500 hover:text-white"
                      >
                        ANNULER
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </GameLayout>
  )
}
