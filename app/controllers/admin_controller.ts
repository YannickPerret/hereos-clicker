import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Character from '#models/character'
import Role from '#models/role'
import Item from '#models/item'
import InventoryItem from '#models/inventory_item'
import ShopListing from '#models/shop_listing'
import Enemy from '#models/enemy'
import EnemyLootTable from '#models/enemy_loot_table'
import SystemMessage from '#models/system_message'

export default class AdminController {
  async dashboard({ inertia, auth }: HttpContext) {
    const totalUsers = await User.query().count('* as total')
    const totalCharacters = await Character.query().count('* as total')
    const totalItems = await Item.query().count('* as total')
    const topCredits = await Character.query().orderBy('credits', 'desc').limit(5)

    await auth.user!.load('role')

    return inertia.render('admin/dashboard', {
      currentUser: {
        ...auth.user!.serialize(),
        role: auth.user!.role.name,
      },
      stats: {
        totalUsers: Number(totalUsers[0].$extras.total),
        totalCharacters: Number(totalCharacters[0].$extras.total),
        totalItems: Number(totalItems[0].$extras.total),
      },
      topCredits: topCredits.map((c) => c.serialize()),
    })
  }

  async users({ inertia }: HttpContext) {
    const users = await User.query()
      .preload('role')
      .preload('characters')
      .orderBy('createdAt', 'desc')

    return inertia.render('admin/users', {
      users: users.map((u) => ({
        ...u.serialize(),
        role: u.role.name,
        roleLabel: u.role.label,
        characters: u.characters.map((c) => ({
          ...c.serialize(),
          chosenSpec: c.chosenSpec,
        })),
      })),
    })
  }

  async updateRole({ params, request, auth, response, session }: HttpContext) {
    if (Number(params.id) === auth.user!.id) {
      session.flash('errors', { message: 'Tu ne peux pas modifier ton propre role' })
      return response.redirect('/admin/users')
    }

    const user = await User.findOrFail(params.id)
    const roleName = request.input('role')

    const role = await Role.findBy('name', roleName)
    if (!role) {
      session.flash('errors', { message: 'Role invalide' })
      return response.redirect('/admin/users')
    }

    user.roleId = role.id
    await user.save()

    session.flash('success', `Role de ${user.username} mis a jour: ${role.label}`)
    return response.redirect('/admin/users')
  }

  async banUser({ params, auth, response, session }: HttpContext) {
    if (Number(params.id) === auth.user!.id) {
      session.flash('errors', { message: 'Tu ne peux pas te bannir toi-meme' })
      return response.redirect('/admin/users')
    }

    const user = await User.findOrFail(params.id)

    // Delete inventory, talents, characters then user
    const characters = await Character.query().where('userId', user.id)
    for (const char of characters) {
      await InventoryItem.query().where('characterId', char.id).delete()
      await char.related('characterTalents').query().delete()
      await char.delete()
    }
    await user.delete()

    session.flash('success', `${user.username} a ete banni et supprime`)
    return response.redirect('/admin/users')
  }

  // ── Character management ──

  async editCharacter({ params, inertia }: HttpContext) {
    const character = await Character.findOrFail(params.characterId)
    await character.load('user')
    await character.load('inventoryItems', (query) => query.preload('item'))
    await character.load('characterTalents')

    const items = await Item.query().orderBy('type').orderBy('name')

    return inertia.render('admin/character', {
      character: {
        ...character.serialize(),
        username: character.user.username,
        userId: character.user.id,
        inventory: character.inventoryItems.map((inv) => ({
          id: inv.id,
          itemId: inv.item.id,
          name: inv.item.name,
          type: inv.item.type,
          rarity: inv.item.rarity,
          icon: inv.item.icon,
          quantity: inv.quantity,
          isEquipped: inv.isEquipped,
        })),
        talentCount: character.characterTalents.length,
      },
      items: items.map((i) => i.serialize()),
    })
  }

  async updateCharacter({ params, request, response, session }: HttpContext) {
    const character = await Character.findOrFail(params.characterId)

    const fields = request.only([
      'name',
      'level',
      'xp',
      'credits',
      'creditsPerClick',
      'creditsPerSecond',
      'hpMax',
      'hpCurrent',
      'attack',
      'defense',
      'talentPoints',
      'critChance',
      'critDamage',
    ])

    character.name = fields.name ?? character.name
    character.level = Math.max(1, Number(fields.level) || character.level)
    character.xp = Math.max(0, Number(fields.xp) || 0)
    character.credits = Math.max(0, Number(fields.credits) || 0)
    character.creditsPerClick = Math.max(1, Number(fields.creditsPerClick) || character.creditsPerClick)
    character.creditsPerSecond = Math.max(0, Number(fields.creditsPerSecond) || 0)
    character.hpMax = Math.max(1, Number(fields.hpMax) || character.hpMax)
    character.hpCurrent = Math.min(character.hpMax, Math.max(0, Number(fields.hpCurrent) || character.hpCurrent))
    character.attack = Math.max(0, Number(fields.attack) || character.attack)
    character.defense = Math.max(0, Number(fields.defense) || character.defense)
    character.talentPoints = Math.max(0, Number(fields.talentPoints) || 0)
    character.critChance = Math.max(0, Math.min(100, Number(fields.critChance) || character.critChance))
    character.critDamage = Math.max(100, Number(fields.critDamage) || character.critDamage)

    await character.save()

    session.flash('success', `${character.name} mis a jour`)
    return response.redirect(`/admin/characters/${character.id}`)
  }

  async deleteCharacter({ params, response, session }: HttpContext) {
    const character = await Character.findOrFail(params.characterId)
    const name = character.name

    await InventoryItem.query().where('characterId', character.id).delete()
    await character.related('characterTalents').query().delete()
    await character.delete()

    session.flash('success', `Personnage ${name} supprime`)
    return response.redirect('/admin/users')
  }

  async resetTalents({ params, response, session }: HttpContext) {
    const character = await Character.findOrFail(params.characterId)
    const talentCount = await character.related('characterTalents').query().count('* as total')
    const refund = Number(talentCount[0].$extras.total)

    await character.related('characterTalents').query().delete()
    character.talentPoints += refund
    character.chosenSpec = null
    await character.save()

    session.flash('success', `Talents de ${character.name} reinitialises (+${refund} points)`)
    return response.redirect(`/admin/characters/${character.id}`)
  }

  // ── Inventory management ──

  async addItem({ params, request, response, session }: HttpContext) {
    const character = await Character.findOrFail(params.characterId)
    const itemId = Number(request.input('itemId'))
    const quantity = Math.max(1, Number(request.input('quantity', 1)))

    const item = await Item.findOrFail(itemId)

    // Check if character already has this item
    const existing = await InventoryItem.query()
      .where('characterId', character.id)
      .where('itemId', itemId)
      .first()

    if (existing) {
      existing.quantity += quantity
      await existing.save()
    } else {
      await InventoryItem.create({
        characterId: character.id,
        itemId: item.id,
        quantity,
        isEquipped: false,
      })
    }

    session.flash('success', `${quantity}x ${item.name} ajoute a ${character.name}`)
    return response.redirect(`/admin/characters/${character.id}`)
  }

  async removeItem({ params, response, session }: HttpContext) {
    const inv = await InventoryItem.findOrFail(params.inventoryId)
    await inv.load('item')
    const name = inv.item.name
    const charId = inv.characterId

    await inv.delete()

    session.flash('success', `${name} retire de l'inventaire`)
    return response.redirect(`/admin/characters/${charId}`)
  }

  async updateItemQuantity({ params, request, response, session }: HttpContext) {
    const inv = await InventoryItem.findOrFail(params.inventoryId)
    const quantity = Math.max(1, Number(request.input('quantity', 1)))

    inv.quantity = quantity
    await inv.save()

    session.flash('success', `Quantite mise a jour: ${quantity}`)
    return response.redirect(`/admin/characters/${inv.characterId}`)
  }

  // ── Credits ──

  async giveCredits({ params, request, response, session }: HttpContext) {
    const character = await Character.findOrFail(params.characterId)
    const amount = Number(request.input('amount', 0))

    character.credits = Math.max(0, character.credits + amount)
    await character.save()

    const action = amount >= 0 ? 'donnes a' : 'retires de'
    session.flash('success', `${Math.abs(amount)} credits ${action} ${character.name}`)
    return response.redirect().back()
  }

  // ── Items & Shop management ──

  async items({ inertia }: HttpContext) {
    const items = await Item.query().orderBy('type').orderBy('rarity').orderBy('name')
    const shopListings = await ShopListing.query().preload('item')

    const shopMap: Record<number, { id: number; priceOverride: number | null; stock: number | null; isActive: boolean }> = {}
    for (const sl of shopListings) {
      shopMap[sl.itemId] = { id: sl.id, priceOverride: sl.priceOverride, stock: sl.stock, isActive: sl.isActive }
    }

    return inertia.render('admin/items', {
      items: items.map((i) => ({
        ...i.serialize(),
        shop: shopMap[i.id] || null,
      })),
    })
  }

  async createItem({ request, response, session }: HttpContext) {
    const data = request.only(['name', 'description', 'type', 'rarity', 'icon', 'effectType', 'effectValue', 'basePrice'])

    await Item.create({
      name: data.name,
      description: data.description || '',
      type: data.type,
      rarity: data.rarity || 'common',
      icon: data.icon || 'default',
      effectType: data.effectType || null,
      effectValue: data.effectValue ? Number(data.effectValue) : null,
      basePrice: Number(data.basePrice) || 0,
    })

    session.flash('success', `Item "${data.name}" cree`)
    return response.redirect('/admin/items')
  }

  async updateItem({ params, request, response, session }: HttpContext) {
    const item = await Item.findOrFail(params.id)
    const data = request.only(['name', 'description', 'type', 'rarity', 'icon', 'effectType', 'effectValue', 'basePrice'])

    item.name = data.name || item.name
    item.description = data.description ?? item.description
    item.type = data.type || item.type
    item.rarity = data.rarity || item.rarity
    item.icon = data.icon || item.icon
    item.effectType = data.effectType || null
    item.effectValue = data.effectValue !== undefined && data.effectValue !== '' ? Number(data.effectValue) : null
    item.basePrice = Number(data.basePrice) || item.basePrice
    await item.save()

    session.flash('success', `Item "${item.name}" mis a jour`)
    return response.redirect('/admin/items')
  }

  async deleteItem({ params, response, session }: HttpContext) {
    const item = await Item.findOrFail(params.id)
    const name = item.name

    // Clean up references
    await ShopListing.query().where('itemId', item.id).delete()
    await EnemyLootTable.query().where('itemId', item.id).delete()
    await InventoryItem.query().where('itemId', item.id).delete()
    await item.delete()

    session.flash('success', `Item "${name}" supprime`)
    return response.redirect('/admin/items')
  }

  // Shop listing management
  async addToShop({ params, request, response, session }: HttpContext) {
    const item = await Item.findOrFail(params.id)
    const existing = await ShopListing.query().where('itemId', item.id).first()
    if (existing) {
      session.flash('errors', { message: 'Cet item est deja dans le shop' })
      return response.redirect('/admin/items')
    }

    const priceOverride = request.input('priceOverride')
    const stock = request.input('stock')

    await ShopListing.create({
      itemId: item.id,
      priceOverride: priceOverride ? Number(priceOverride) : null,
      stock: stock ? Number(stock) : null,
      isActive: true,
    })

    session.flash('success', `"${item.name}" ajoute au shop`)
    return response.redirect('/admin/items')
  }

  async updateShopListing({ params, request, response, session }: HttpContext) {
    const listing = await ShopListing.findOrFail(params.id)
    const priceOverride = request.input('priceOverride')
    const stock = request.input('stock')
    const isActive = request.input('isActive')

    listing.priceOverride = priceOverride !== undefined && priceOverride !== '' ? Number(priceOverride) : null
    listing.stock = stock !== undefined && stock !== '' ? Number(stock) : null
    listing.isActive = isActive === 'true' || isActive === true
    await listing.save()

    session.flash('success', 'Shop listing mis a jour')
    return response.redirect('/admin/items')
  }

  async removeFromShop({ params, response, session }: HttpContext) {
    const listing = await ShopListing.findOrFail(params.id)
    await listing.delete()

    session.flash('success', 'Item retire du shop')
    return response.redirect('/admin/items')
  }

  // ── Enemies management ──

  async enemies({ inertia }: HttpContext) {
    const enemies = await Enemy.query().orderBy('tier').orderBy('name')
    const lootEntries = await EnemyLootTable.query().preload('item')
    const items = await Item.query().orderBy('name')

    const lootMap: Record<number, { id: number; itemId: number; itemName: string; dropChance: number }[]> = {}
    for (const entry of lootEntries) {
      if (!lootMap[entry.enemyId]) lootMap[entry.enemyId] = []
      lootMap[entry.enemyId].push({
        id: entry.id,
        itemId: entry.itemId,
        itemName: entry.item.name,
        dropChance: entry.dropChance,
      })
    }

    return inertia.render('admin/enemies', {
      enemies: enemies.map((e) => ({
        ...e.serialize(),
        loot: lootMap[e.id] || [],
      })),
      items: items.map((i) => ({ id: i.id, name: i.name, rarity: i.rarity })),
    })
  }

  async createEnemy({ request, response, session }: HttpContext) {
    const data = request.only(['name', 'description', 'hp', 'attack', 'defense', 'xpReward', 'creditsRewardMin', 'creditsRewardMax', 'tier', 'critChance', 'critDamage', 'icon'])

    await Enemy.create({
      name: data.name,
      description: data.description || '',
      hp: Number(data.hp) || 50,
      attack: Number(data.attack) || 10,
      defense: Number(data.defense) || 5,
      xpReward: Number(data.xpReward) || 10,
      creditsRewardMin: Number(data.creditsRewardMin) || 5,
      creditsRewardMax: Number(data.creditsRewardMax) || 15,
      tier: Number(data.tier) || 1,
      critChance: Number(data.critChance) || 5,
      critDamage: Number(data.critDamage) || 150,
      icon: data.icon || 'enemy',
    })

    session.flash('success', `Ennemi "${data.name}" cree`)
    return response.redirect('/admin/enemies')
  }

  async updateEnemy({ params, request, response, session }: HttpContext) {
    const enemy = await Enemy.findOrFail(params.id)
    const data = request.only(['name', 'description', 'hp', 'attack', 'defense', 'xpReward', 'creditsRewardMin', 'creditsRewardMax', 'tier', 'critChance', 'critDamage'])

    enemy.name = data.name || enemy.name
    enemy.description = data.description ?? enemy.description
    enemy.hp = Number(data.hp) || enemy.hp
    enemy.attack = Number(data.attack) || enemy.attack
    enemy.defense = Number(data.defense) || enemy.defense
    enemy.xpReward = Number(data.xpReward) || enemy.xpReward
    enemy.creditsRewardMin = Number(data.creditsRewardMin) || enemy.creditsRewardMin
    enemy.creditsRewardMax = Number(data.creditsRewardMax) || enemy.creditsRewardMax
    enemy.tier = Number(data.tier) || enemy.tier
    enemy.critChance = Number(data.critChance) ?? enemy.critChance
    enemy.critDamage = Number(data.critDamage) || enemy.critDamage
    await enemy.save()

    session.flash('success', `Ennemi "${enemy.name}" mis a jour`)
    return response.redirect('/admin/enemies')
  }

  async deleteEnemy({ params, response, session }: HttpContext) {
    const enemy = await Enemy.findOrFail(params.id)
    const name = enemy.name
    await EnemyLootTable.query().where('enemyId', enemy.id).delete()
    await enemy.delete()

    session.flash('success', `Ennemi "${name}" supprime`)
    return response.redirect('/admin/enemies')
  }

  async addLootEntry({ params, request, response, session }: HttpContext) {
    const enemyId = Number(params.id)
    const itemId = Number(request.input('itemId'))
    const dropChance = Math.min(1, Math.max(0, Number(request.input('dropChance', 0.1))))

    await EnemyLootTable.create({ enemyId, itemId, dropChance })

    session.flash('success', 'Loot ajoute')
    return response.redirect('/admin/enemies')
  }

  async updateLootEntry({ params, request, response, session }: HttpContext) {
    const entry = await EnemyLootTable.findOrFail(params.id)
    entry.dropChance = Math.min(1, Math.max(0, Number(request.input('dropChance', entry.dropChance))))
    await entry.save()

    session.flash('success', 'Drop chance mis a jour')
    return response.redirect('/admin/enemies')
  }

  async deleteLootEntry({ params, response, session }: HttpContext) {
    const entry = await EnemyLootTable.findOrFail(params.id)
    await entry.delete()

    session.flash('success', 'Loot retire')
    return response.redirect('/admin/enemies')
  }

  // ── System Messages (auto-chat) ──

  async systemMessages({ inertia }: HttpContext) {
    const messages = await SystemMessage.query().orderBy('createdAt', 'desc')

    return inertia.render('admin/system_messages', {
      messages: messages.map((m) => m.serialize()),
    })
  }

  async createSystemMessage({ request, response, session }: HttpContext) {
    const message = request.input('message', '').trim()
    const intervalMinutes = Math.max(1, Number(request.input('intervalMinutes', 10)))
    const channel = request.input('channel', 'global').trim() || 'global'

    if (!message || message.length > 500) {
      session.flash('errors', { message: 'Message invalide (1-500 caracteres)' })
      return response.redirect('/admin/system-messages')
    }

    await SystemMessage.create({
      message,
      intervalMinutes,
      channel,
      isActive: true,
    })

    // Reload the scheduler
    const { reloadSystemMessages } = await import('#start/system_chat')
    reloadSystemMessages()

    session.flash('success', 'Message systeme cree')
    return response.redirect('/admin/system-messages')
  }

  async updateSystemMessage({ params, request, response, session }: HttpContext) {
    const msg = await SystemMessage.findOrFail(params.id)

    msg.message = request.input('message', msg.message).trim()
    msg.intervalMinutes = Math.max(1, Number(request.input('intervalMinutes', msg.intervalMinutes)))
    msg.channel = request.input('channel', msg.channel).trim() || 'global'
    msg.isActive = request.input('isActive') === 'true' || request.input('isActive') === true

    await msg.save()

    const { reloadSystemMessages } = await import('#start/system_chat')
    reloadSystemMessages()

    session.flash('success', 'Message systeme mis a jour')
    return response.redirect('/admin/system-messages')
  }

  async toggleSystemMessage({ params, response }: HttpContext) {
    const msg = await SystemMessage.findOrFail(params.id)
    msg.isActive = !msg.isActive
    await msg.save()

    const { reloadSystemMessages } = await import('#start/system_chat')
    reloadSystemMessages()

    return response.redirect('/admin/system-messages')
  }

  async deleteSystemMessage({ params, response, session }: HttpContext) {
    const msg = await SystemMessage.findOrFail(params.id)
    await msg.delete()

    const { reloadSystemMessages } = await import('#start/system_chat')
    reloadSystemMessages()

    session.flash('success', 'Message systeme supprime')
    return response.redirect('/admin/system-messages')
  }
}
