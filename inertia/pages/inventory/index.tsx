import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CyberpunkAvatar from '~/components/cyberpunk_avatar'
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
    chosenSpec: string | null
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

const TYPE_ORDER = [
  'weapon',
  'armor',
  'implant',
  'clothes_hair',
  'clothes_face',
  'clothes_outer',
  'clothes_legs',
  'consumable',
  'upgrade',
] as const

export default function Inventory({ character, inventory, equipBonuses, talentBonuses }: Props) {
  const { t } = useTranslation(['inventory', 'common'])
  const { props } = usePage<{ errors?: { message?: string }; success?: string }>()
  const [discardTarget, setDiscardTarget] = useState<InventoryEntry | null>(null)
  const [discardQuantity, setDiscardQuantity] = useState('1')
  const inventoryActionOptions = {
    only: ['character', 'inventory', 'equipBonuses', 'talentBonuses', 'errors', 'success'],
    preserveScroll: true,
    preserveState: true,
  } as const
  const equipped = inventory.filter((i) => i.isEquipped)
  const backpack = inventory.filter((i) => !i.isEquipped)
  const groupedBackpack = TYPE_ORDER.map((type) => ({
    type,
    entries: backpack
      .filter((entry) => entry.item.type === type)
      .sort((a, b) => a.item.name.localeCompare(b.item.name)),
  })).filter((group) => group.entries.length > 0)

  const formatEffect = (entry: InventoryEntry) => {
    if (!entry.item.effectType || entry.item.effectValue === null) return null
    if (entry.item.effectType === 'permanent_click') {
      return `${t(`common:effects.${entry.item.effectType}`)}: +${entry.item.effectValue}%`
    }

    return `${t(`common:effects.${entry.item.effectType}`)}: +${entry.item.effectValue}`
  }

  const openDiscardModal = (entry: InventoryEntry) => {
    setDiscardTarget(entry)
    setDiscardQuantity('1')
  }

  const closeDiscardModal = () => {
    setDiscardTarget(null)
    setDiscardQuantity('1')
  }

  const getDiscardQuantity = () => {
    if (!discardTarget) return 1
    const parsed = Number.parseInt(discardQuantity, 10)
    if (!Number.isFinite(parsed) || parsed <= 0) return 1
    return Math.min(parsed, discardTarget.quantity)
  }

  const setDiscardQuantityValue = (quantity: number) => {
    if (!discardTarget) return
    setDiscardQuantity(String(Math.max(1, Math.min(Math.floor(quantity), discardTarget.quantity))))
  }

  const setDiscardQuantityInput = (value: string) => {
    if (!discardTarget) return
    if (value === '') {
      setDiscardQuantity('')
      return
    }

    const parsed = Number.parseInt(value, 10)
    setDiscardQuantityValue(Number.isFinite(parsed) ? parsed : 1)
  }

  const submitDiscard = () => {
    if (!discardTarget) return
    const quantity = getDiscardQuantity()
    const inventoryId = discardTarget.id
    closeDiscardModal()
    router.post(`/inventory/${inventoryId}/discard`, { quantity }, inventoryActionOptions)
  }

  return (
    <GameLayout>
      {props.success && (
        <div className="mb-4 rounded-lg border border-cyber-green/50 bg-cyber-green/10 px-4 py-3 text-sm text-cyber-green">
          {props.success as string}
        </div>
      )}
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
              {t('inventory:equipped')}
            </h2>
            <div className="mb-4">
              <CyberpunkAvatar
                name={character.name}
                chosenSpec={character.chosenSpec}
                equippedItems={equipped}
              />
            </div>
            <div className="space-y-3">
              {[
                'weapon',
                'armor',
                'implant',
                'clothes_hair',
                'clothes_face',
                'clothes_outer',
                'clothes_legs',
              ].map((type) => {
                const item = equipped.find((e) => e.item.type === type)
                return (
                  <div
                    key={type}
                    className={`border rounded-lg p-3 ${item ? RARITY_COLORS[item.item.rarity] : 'border-gray-800 bg-cyber-black/50'}`}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">
                      {t(`common:types.${type}`)}
                    </div>
                    {item ? (
                      <div>
                        <div className={`text-sm font-bold ${RARITY_TEXT[item.item.rarity]}`}>
                          {item.item.name}
                        </div>
                        {formatEffect(item) && (
                          <div className="text-xs text-gray-500 mt-1">{formatEffect(item)}</div>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() =>
                              router.post(`/inventory/${item.id}/unequip`, {}, inventoryActionOptions)
                            }
                            className="text-[10px] text-cyber-red hover:underline uppercase"
                          >
                            {t('inventory:unequip')}
                          </button>
                          <button
                            onClick={() => openDiscardModal(item)}
                            className="text-[10px] text-cyber-orange hover:underline uppercase"
                          >
                            {t('inventory:discard')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-700">{t('inventory:emptySlot')}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Character Stats */}
            <div className="mt-6 space-y-1 text-xs">
              <h3 className="text-sm uppercase tracking-widest text-cyber-green mb-2 text-center">
                {t('inventory:stats')}
              </h3>
              {(() => {
                const totalAtk = character.attack + equipBonuses.attackBonus + talentBonuses.atkFlat
                const totalDef =
                  character.defense + equipBonuses.defenseBonus + talentBonuses.defFlat
                const baseCpc =
                  character.creditsPerClick + equipBonuses.clickBonus + talentBonuses.cpcFlat
                const totalCpc = Math.floor(baseCpc * (1 + talentBonuses.cpcPercent / 100))
                const atkBonus = equipBonuses.attackBonus + talentBonuses.atkFlat
                const defBonus = equipBonuses.defenseBonus + talentBonuses.defFlat
                const cpcBonus = totalCpc - character.creditsPerClick

                return [
                  {
                    label: t('common:stats.credits'),
                    value: character.credits.toLocaleString(),
                    bonus: '',
                    color: 'text-cyber-yellow',
                  },
                  {
                    label: t('common:stats.atk'),
                    value: totalAtk,
                    bonus: atkBonus > 0 ? `+${atkBonus}` : '',
                    color: 'text-cyber-red',
                  },
                  {
                    label: t('common:stats.def'),
                    value: totalDef,
                    bonus: defBonus > 0 ? `+${defBonus}` : '',
                    color: 'text-cyber-blue',
                  },
                  {
                    label: t('common:stats.hp'),
                    value: `${character.hpCurrent}/${character.hpMax}`,
                    bonus: '',
                    color: 'text-cyber-green',
                  },
                  {
                    label: 'CPC',
                    value: totalCpc,
                    bonus: cpcBonus > 0 ? `+${cpcBonus}` : '',
                    color: 'text-cyber-pink',
                  },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between">
                    <span className="text-gray-500">{s.label}</span>
                    <span className={s.color}>
                      {s.value}
                      {s.bonus && (
                        <span className="text-cyber-green text-[10px] ml-1">({s.bonus})</span>
                      )}
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
            {t('inventory:title', { count: backpack.length })}
          </h2>

          {backpack.length === 0 ? (
            <div className="bg-cyber-dark border border-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-sm">
                {t('inventory:empty')}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedBackpack.map((group) => (
                <div key={group.type}>
                  <div className="mb-3 flex items-center justify-between border-b border-gray-800 pb-2">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500">
                      {t(`common:types.${group.type}`)}
                    </h3>
                    <span className="text-[10px] text-gray-700">
                      {group.entries.length} objet{group.entries.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {group.entries.map((entry) => {
                      return (
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
                          <p className="text-[10px] text-gray-500 mb-2 line-clamp-2">
                            {entry.item.description}
                          </p>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="uppercase text-gray-600">
                              {t(`common:types.${entry.item.type}`)}
                            </span>
                            {formatEffect(entry) && (
                              <span className="text-cyber-green">{formatEffect(entry)}</span>
                            )}
                          </div>

                          <div className="flex gap-1 mt-2">
                            {entry.item.type !== 'consumable' && entry.item.type !== 'upgrade' && (
                              <button
                                onClick={() =>
                                  router.post(`/inventory/${entry.id}/equip`, {}, inventoryActionOptions)
                                }
                                className="flex-1 text-[10px] py-1 bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue rounded hover:bg-cyber-blue/20 transition-all uppercase"
                              >
                                {t('inventory:equip')}
                              </button>
                            )}
                            {(entry.item.type === 'consumable' ||
                              entry.item.type === 'upgrade') && (
                              <button
                                onClick={() =>
                                  router.post(`/inventory/${entry.id}/use`, {}, inventoryActionOptions)
                                }
                                className="flex-1 text-[10px] py-1 bg-cyber-green/10 border border-cyber-green/30 text-cyber-green rounded hover:bg-cyber-green/20 transition-all uppercase"
                              >
                                {t('inventory:use')}
                              </button>
                            )}
                            <button
                              onClick={() => openDiscardModal(entry)}
                              className="flex-1 text-[10px] py-1 bg-cyber-orange/10 border border-cyber-orange/30 text-cyber-orange rounded hover:bg-cyber-orange/20 transition-all uppercase"
                            >
                              {t('inventory:discard')}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {discardTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={closeDiscardModal}
        >
          <div
            className="w-full max-w-md rounded-lg border border-cyber-orange/30 bg-cyber-dark p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-gray-600">
              {t('inventory:discardConfirm')}
            </div>
            <h3 className="text-lg font-bold text-cyber-orange">{discardTarget.item.name}</h3>
            <p className="mt-2 text-sm text-gray-400">
              {t('inventory:discardMessage')}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDiscardQuantityValue(getDiscardQuantity() - 1)}
                disabled={getDiscardQuantity() <= 1}
                className="h-10 w-10 rounded border border-gray-700 bg-cyber-black text-sm font-bold text-gray-300 transition hover:border-cyber-orange/50 hover:text-cyber-orange disabled:cursor-not-allowed disabled:opacity-40"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={discardTarget.quantity}
                inputMode="numeric"
                value={discardQuantity}
                onChange={(e) => setDiscardQuantityInput(e.target.value)}
                className="h-10 flex-1 rounded border border-gray-800 bg-cyber-black px-3 text-center text-sm font-bold text-white focus:border-cyber-orange/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setDiscardQuantityValue(getDiscardQuantity() + 1)}
                disabled={getDiscardQuantity() >= discardTarget.quantity}
                className="h-10 w-10 rounded border border-gray-700 bg-cyber-black text-sm font-bold text-gray-300 transition hover:border-cyber-orange/50 hover:text-cyber-orange disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>

            <div className="mt-2 text-[10px] uppercase tracking-widest text-gray-600">
              {t('inventory:discardStock', { stock: discardTarget.quantity, quantity: getDiscardQuantity() })}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={closeDiscardModal}
                className="flex-1 rounded border border-gray-700 px-3 py-2 text-xs uppercase tracking-widest text-gray-400 transition hover:border-gray-500 hover:text-white"
              >
                {t('common:buttons.cancel')}
              </button>
              <button
                type="button"
                onClick={submitDiscard}
                className="flex-1 rounded border border-cyber-orange/40 bg-cyber-orange/10 px-3 py-2 text-xs uppercase tracking-widest text-cyber-orange transition hover:bg-cyber-orange/20"
              >
                {t('common:buttons.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  )
}
