import { router } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface Item {
  id: number
  name: string
  description: string
  type: string
  rarity: string
  effectType: string | null
  effectValue: number | null
}

interface Listing {
  id: number
  itemId: number
  stock: number | null
  isActive: boolean
  item: Item
  price: number
}

interface Props {
  character: { id: number; credits: number; level: number }
  listings: Listing[]
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-600',
  uncommon: 'border-cyber-green/50',
  rare: 'border-cyber-blue/50',
  epic: 'border-cyber-purple/50',
  legendary: 'border-cyber-yellow/50',
}

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-cyber-green',
  rare: 'text-cyber-blue',
  epic: 'text-cyber-purple',
  legendary: 'text-cyber-yellow',
}

const RARITY_GLOW: Record<string, string> = {
  common: '',
  uncommon: 'hover:shadow-[0_0_15px_rgba(0,255,65,0.2)]',
  rare: 'hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]',
  epic: 'hover:shadow-[0_0_15px_rgba(184,41,221,0.2)]',
  legendary: 'hover:shadow-[0_0_15px_rgba(255,255,0,0.3)]',
}

const TYPE_LABELS: Record<string, string> = {
  weapon: 'ARME',
  armor: 'ARMURE',
  implant: 'IMPLANT',
  consumable: 'CONSOMMABLE',
  upgrade: 'AMELIORATION',
}

export default function Shop({ character, listings }: Props) {
  const categories = ['weapon', 'armor', 'implant', 'consumable', 'upgrade']

  return (
    <GameLayout>
      {/* Credits display */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-cyber-pink neon-text-pink tracking-widest">NETMARKET</h1>
        <div className="bg-cyber-dark border border-cyber-yellow/30 rounded-lg px-4 py-2">
          <span className="text-xs text-gray-500 mr-2">CREDITS:</span>
          <span className="text-cyber-yellow font-bold text-lg">{character.credits.toLocaleString()}</span>
        </div>
      </div>

      {categories.map((cat) => {
        const items = listings.filter((l) => l.item.type === cat)
        if (items.length === 0) return null

        return (
          <div key={cat} className="mb-8">
            <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-800 pb-2">
              {TYPE_LABELS[cat]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((listing) => {
                const canAfford = character.credits >= listing.price
                const outOfStock = listing.stock !== null && listing.stock <= 0

                return (
                  <div
                    key={listing.id}
                    className={`bg-cyber-dark border rounded-lg p-4 transition-all ${RARITY_COLORS[listing.item.rarity]} ${RARITY_GLOW[listing.item.rarity]}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className={`font-bold text-sm ${RARITY_TEXT[listing.item.rarity]}`}>
                          {listing.item.name}
                        </h3>
                        <span className="text-[10px] uppercase text-gray-600">{listing.item.rarity}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${canAfford ? 'text-cyber-yellow' : 'text-cyber-red'}`}>
                          {listing.price.toLocaleString()}c
                        </div>
                        {listing.stock !== null && (
                          <div className="text-[10px] text-gray-600">
                            Stock: {listing.stock}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">{listing.item.description}</p>

                    {listing.item.effectType && (
                      <div className="text-xs text-cyber-green mb-3">
                        Effet: +{listing.item.effectValue} {listing.item.effectType.replace(/_/g, ' ')}
                      </div>
                    )}

                    <button
                      onClick={() => router.post(`/shop/${listing.id}/buy`)}
                      disabled={!canAfford || outOfStock}
                      className={`w-full py-2 text-xs uppercase tracking-widest rounded font-bold transition-all ${
                        outOfStock
                          ? 'bg-gray-900 border border-gray-700 text-gray-700 cursor-not-allowed'
                          : canAfford
                            ? 'bg-cyber-yellow/10 border border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/20'
                            : 'bg-cyber-red/10 border border-cyber-red/30 text-cyber-red/50 cursor-not-allowed'
                      }`}
                    >
                      {outOfStock ? '[ RUPTURE ]' : canAfford ? '[ ACHETER ]' : '[ FONDS INSUFFISANTS ]'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </GameLayout>
  )
}
