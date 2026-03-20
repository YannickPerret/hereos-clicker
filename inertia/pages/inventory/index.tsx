import { router, usePage } from '@inertiajs/react'
import GameLayout from '~/components/layout'

interface Item {
  id: number
  name: string
  description: string
  type: string
  rarity: string
  icon: string
  effectType: string | null
  effectValue: number | null
  basePrice: number
}

interface InventoryEntry {
  id: number
  itemId: number
  quantity: number
  isEquipped: boolean
  item: Item
}

interface Props {
  character: {
    id: number
    name: string
    credits: number
    level: number
    hpCurrent: number
    hpMax: number
    attack: number
    defense: number
    creditsPerClick: number
  }
  inventory: InventoryEntry[]
  equipBonuses: { clickBonus: number; attackBonus: number; defenseBonus: number }
  talentBonuses: { atkFlat: number; defFlat: number; cpcFlat: number; cpcPercent: number }
}

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-600 bg-gray-900/50',
  uncommon: 'border-cyber-green/50 bg-cyber-green/5',
  rare: 'border-cyber-blue/50 bg-cyber-blue/5',
  epic: 'border-cyber-purple/50 bg-cyber-purple/5',
  legendary: 'border-cyber-yellow/50 bg-cyber-yellow/5',
}

const RARITY_TEXT: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-cyber-green',
  rare: 'text-cyber-blue',
  epic: 'text-cyber-purple',
  legendary: 'text-cyber-yellow',
}

const TYPE_LABELS: Record<string, string> = {
  weapon: 'ARME',
  armor: 'ARMURE',
  implant: 'IMPLANT',
  consumable: 'CONSO',
  upgrade: 'UPGRADE',
}

const TYPE_ORDER = ['weapon', 'armor', 'consumable', 'implant', 'upgrade'] as const

const EFFECT_LABELS: Record<string, string> = {
  attack_boost: 'ATK',
  defense_boost: 'DEF',
  click_multiplier: 'CPC',
  permanent_click: 'CPC',
  hp_restore: 'HP',
  temp_click_boost: 'BOOST',
  xp_boost: 'XP',
}

export default function Inventory({ character, inventory, equipBonuses, talentBonuses }: Props) {
  const { props } = usePage<{ errors?: { message?: string } }>()
  const equipped = inventory.filter((i) => i.isEquipped)
  const backpack = inventory.filter((i) => !i.isEquipped)
  const groupedBackpack = TYPE_ORDER
    .map((type) => ({
      type,
      entries: backpack
        .filter((entry) => entry.item.type === type)
        .sort((a, b) => a.item.name.localeCompare(b.item.name)),
    }))
    .filter((group) => group.entries.length > 0)

  return (
    <GameLayout>
      {props.errors?.message && (
        <div className="mb-4 bg-cyber-red/10 border border-cyber-red/50 rounded-lg px-4 py-3 text-cyber-red text-sm">
          {props.errors.message}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Equipment Panel */}
        <div className="lg:col-span-1">
          <div className="bg-cyber-dark border border-cyber-blue/30 rounded-lg p-4">
            <h2 className="text-sm uppercase tracking-widest text-cyber-blue neon-text mb-4 text-center">
              EQUIPE
            </h2>
            <div className="space-y-3">
              {['weapon', 'armor', 'implant'].map((type) => {
                const item = equipped.find((e) => e.item.type === type)
                return (
                  <div key={type} className={`border rounded-lg p-3 ${item ? RARITY_COLORS[item.item.rarity] : 'border-gray-800 bg-cyber-black/50'}`}>
                    <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">
                      {TYPE_LABELS[type]}
                    </div>
                    {item ? (
                      <div>
                        <div className={`text-sm font-bold ${RARITY_TEXT[item.item.rarity]}`}>
                          {item.item.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.item.effectType && EFFECT_LABELS[item.item.effectType]}: +{item.item.effectValue}
                        </div>
                        <button
                          onClick={() => router.post(`/inventory/${item.id}/unequip`)}
                          className="text-[10px] text-cyber-red mt-2 hover:underline uppercase"
                        >
                          Retirer
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-700">[ Vide ]</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Character Stats */}
            <div className="mt-6 space-y-1 text-xs">
              <h3 className="text-sm uppercase tracking-widest text-cyber-green mb-2 text-center">Stats</h3>
              {(() => {
                const totalAtk = character.attack + equipBonuses.attackBonus + talentBonuses.atkFlat
                const totalDef = character.defense + equipBonuses.defenseBonus + talentBonuses.defFlat
                const baseCpc = character.creditsPerClick + equipBonuses.clickBonus + talentBonuses.cpcFlat
                const totalCpc = Math.floor(baseCpc * (1 + talentBonuses.cpcPercent / 100))
                const atkBonus = equipBonuses.attackBonus + talentBonuses.atkFlat
                const defBonus = equipBonuses.defenseBonus + talentBonuses.defFlat
                const cpcBonus = totalCpc - character.creditsPerClick

                return [
                  { label: 'Credits', value: character.credits.toLocaleString(), bonus: '', color: 'text-cyber-yellow' },
                  { label: 'ATK', value: totalAtk, bonus: atkBonus > 0 ? `+${atkBonus}` : '', color: 'text-cyber-red' },
                  { label: 'DEF', value: totalDef, bonus: defBonus > 0 ? `+${defBonus}` : '', color: 'text-cyber-blue' },
                  { label: 'HP', value: `${character.hpCurrent}/${character.hpMax}`, bonus: '', color: 'text-cyber-green' },
                  { label: 'CPC', value: totalCpc, bonus: cpcBonus > 0 ? `+${cpcBonus}` : '', color: 'text-cyber-pink' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <span className="text-gray-500">{s.label}</span>
                    <span className={s.color}>
                      {s.value}
                      {s.bonus && <span className="text-cyber-green text-[10px] ml-1">({s.bonus})</span>}
                    </span>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="lg:col-span-3">
          <h2 className="text-sm uppercase tracking-widest text-cyber-pink neon-text-pink mb-4">
            INVENTAIRE ({backpack.length} objets)
          </h2>

          {backpack.length === 0 ? (
            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-sm">Inventaire vide. Visitez le Shop ou explorez les Donjons.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedBackpack.map((group) => (
                <div key={group.type}>
                  <div className="mb-3 flex items-center justify-between border-b border-gray-800 pb-2">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500">
                      {TYPE_LABELS[group.type]}
                    </h3>
                    <span className="text-[10px] text-gray-700">
                      {group.entries.length} objet{group.entries.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`border rounded-lg p-3 hover:scale-105 transition-transform ${RARITY_COLORS[entry.item.rarity]}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-xs font-bold ${RARITY_TEXT[entry.item.rarity]}`}>
                            {entry.item.name}
                          </span>
                          {entry.quantity > 1 && (
                            <span className="text-[10px] bg-cyber-black px-1.5 py-0.5 rounded text-gray-400">
                              x{entry.quantity}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mb-2 line-clamp-2">{entry.item.description}</p>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="uppercase text-gray-600">{TYPE_LABELS[entry.item.type]}</span>
                          {entry.item.effectType && (
                            <span className="text-cyber-green">
                              {EFFECT_LABELS[entry.item.effectType]}: +{entry.item.effectValue}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {entry.item.type !== 'consumable' && entry.item.type !== 'upgrade' && (
                            <button
                              onClick={() => router.post(`/inventory/${entry.id}/equip`)}
                              className="flex-1 text-[10px] py-1 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue rounded hover:bg-cyber-blue/20 transition-all uppercase"
                            >
                              Equiper
                            </button>
                          )}
                          {(entry.item.type === 'consumable' || entry.item.type === 'upgrade') && (
                            <button
                              onClick={() => router.post(`/inventory/${entry.id}/use`)}
                              className="flex-1 text-[10px] py-1 bg-cyber-green/10 border border-cyber-green/30 text-cyber-green rounded hover:bg-cyber-green/20 transition-all uppercase"
                            >
                              Utiliser
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  )
}
