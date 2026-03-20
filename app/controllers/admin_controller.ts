import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Character from '#models/character'
import Role from '#models/role'
import Item from '#models/item'
import InventoryItem from '#models/inventory_item'
import BlackMarketCatalogEntry from '#models/black_market_catalog_entry'
import BlackMarketCleaner from '#models/black_market_cleaner'
import BlackMarketSetting from '#models/black_market_setting'
import ShopListing from '#models/shop_listing'
import Enemy from '#models/enemy'
import EnemyLootTable from '#models/enemy_loot_table'
import SystemMessage from '#models/system_message'
import DailyRewardConfig from '#models/daily_reward_config'
import Season from '#models/season'
import Quest from '#models/quest'
import BlackMarketService from '#services/black_market_service'
import SeasonService from '#services/season_service'

type AdminQuestReward = {
  type: 'credits' | 'xp' | 'talent_points' | 'item'
  value: number
  itemId: number | null
  itemName: string | null
}

export default class AdminController {
  private normalizeQuestInput(request: HttpContext['request'], fallback: Partial<Quest> = {}) {
    const key = String(request.input('key', fallback.key || '')).trim().toLowerCase().replace(/\s+/g, '_')
    const questType = request.input('questType', fallback.questType || 'main') === 'seasonal'
      ? 'seasonal'
      : 'main'
    const rawSeasonId = request.input('seasonId', fallback.seasonId ?? '')
    const seasonId = rawSeasonId === '' || rawSeasonId === null || rawSeasonId === undefined
      ? null
      : Number(rawSeasonId)
    const rawParentQuestId = request.input('parentQuestId', fallback.parentQuestId ?? '')
    const parentQuestId = rawParentQuestId === '' || rawParentQuestId === null || rawParentQuestId === undefined
      ? null
      : Number(rawParentQuestId)
    const arcKey = String(request.input('arcKey', fallback.arcKey || '')).trim().toLowerCase().replace(/\s+/g, '_')
    const arcTitle = String(request.input('arcTitle', fallback.arcTitle || '')).trim()
    const giverName = String(request.input('giverName', fallback.giverName || '')).trim()
    const title = String(request.input('title', fallback.title || '')).trim()
    const summary = String(request.input('summary', fallback.summary || '')).trim()
    const narrative = String(request.input('narrative', fallback.narrative || '')).trim()
    const objectiveType = String(request.input('objectiveType', fallback.objectiveType || 'hack_clicks')).trim()
    const targetValue = Math.max(1, Number(request.input('targetValue', fallback.targetValue || 1)) || 1)
    const icon = String(request.input('icon', fallback.icon || 'terminal')).trim()
    const sortOrder = Math.max(1, Number(request.input('sortOrder', fallback.sortOrder || 1)) || 1)

    return {
      key,
      questType: questType as 'main' | 'seasonal',
      seasonId,
      parentQuestId,
      arcKey,
      arcTitle,
      giverName: giverName || null,
      title,
      summary,
      narrative: narrative || null,
      objectiveType,
      targetValue,
      icon,
      sortOrder,
      requiredQuestKey: fallback.requiredQuestKey || null,
    }
  }

  private getQuestRewards(quest: Quest): AdminQuestReward[] {
    if (quest.rewardsJson) {
      try {
        const parsed = JSON.parse(quest.rewardsJson)
        if (Array.isArray(parsed)) {
          return parsed.map((reward) => ({
            type: reward.type,
            value: Math.max(0, Number(reward.value || 0)),
            itemId: reward.itemId ? Number(reward.itemId) : null,
            itemName: reward.itemName ? String(reward.itemName) : null,
          }))
        }
      } catch {}
    }

    if ((quest.rewardValue || 0) > 0) {
      return [{
        type: quest.rewardType as AdminQuestReward['type'],
        value: quest.rewardValue,
        itemId: null,
        itemName: null,
      }]
    }

    return []
  }

  private async normalizeQuestRewards(request: HttpContext['request']) {
    const rawRewards = request.input('rewards', [])
    const rewards = Array.isArray(rawRewards) ? rawRewards : []
    const normalized: AdminQuestReward[] = []

    for (const rawReward of rewards) {
      const type = String(rawReward?.type || '').trim() as AdminQuestReward['type']
      const value = Math.max(0, Number(rawReward?.value || 0) || 0)

      if (!type) {
        continue
      }

      if (type === 'item') {
        const itemId = Number(rawReward?.itemId || 0) || 0
        const item = itemId > 0 ? await Item.find(itemId) : null

        normalized.push({
          type,
          value: Math.max(1, value || 1),
          itemId: item?.id || null,
          itemName: item?.name || null,
        })
        continue
      }

      normalized.push({
        type,
        value,
        itemId: null,
        itemName: null,
      })
    }

    return normalized.filter((reward) => reward.type === 'item' || reward.value > 0)
  }

  private async validateQuestPayload(
    payload: ReturnType<AdminController['normalizeQuestInput']>,
    rewards: AdminQuestReward[],
    currentQuestId?: number
  ) {
    if (!payload.key || !payload.arcKey || !payload.arcTitle || !payload.title || !payload.summary) {
      return 'Les champs cle, arc, titre et resume sont obligatoires'
    }

    const allowedObjectives = [
      'hack_clicks',
      'hack_credits',
      'reach_level',
      'shop_purchase',
      'companion_purchase',
      'companion_activate',
      'pvp_match',
      'dungeon_floor_clear',
    ]
    if (!allowedObjectives.includes(payload.objectiveType)) {
      return 'Type d objectif invalide'
    }

    const allowedQuestTypes = ['main', 'seasonal']
    if (!allowedQuestTypes.includes(payload.questType)) {
      return 'Type de quete invalide'
    }

    const allowedRewards = ['credits', 'xp', 'talent_points', 'item']
    for (const reward of rewards) {
      if (!allowedRewards.includes(reward.type)) {
        return 'Type de recompense invalide'
      }

      if (reward.type === 'item' && !reward.itemId) {
        return 'Choisis un item pour une recompense item'
      }
    }

    let season: Season | null = null
    if (payload.questType === 'seasonal') {
      if (!payload.seasonId) {
        return 'Choisis une saison pour une quete saisonniere'
      }

      season = await Season.find(payload.seasonId)
      if (!season) {
        return 'Saison introuvable'
      }
    }

    const duplicateKey = await Quest.query()
      .where('key', payload.key)
      .if(currentQuestId !== undefined, (query) => query.whereNot('id', currentQuestId!))
      .first()

    if (duplicateKey) {
      return `La cle ${payload.key} existe deja`
    }

    if (payload.parentQuestId) {
      if (currentQuestId !== undefined && payload.parentQuestId === currentQuestId) {
        return 'Une quete ne peut pas avoir elle-meme comme parent'
      }

      const parentQuest = await Quest.find(payload.parentQuestId)
      if (!parentQuest) {
        return 'Quete parente introuvable'
      }

      if (parentQuest.arcKey !== payload.arcKey) {
        return 'La quete parente doit etre dans le meme arc'
      }

      if (parentQuest.questType !== payload.questType) {
        return 'La quete parente doit etre du meme type'
      }

      if (payload.questType === 'seasonal' && parentQuest.seasonId !== payload.seasonId) {
        return 'La quete parente doit appartenir a la meme saison'
      }

      if (payload.questType === 'main' && parentQuest.seasonId) {
        return 'Une quete principale ne peut pas dependre d une quete de saison'
      }
    }

    return null
  }

  async dashboard({ inertia, auth }: HttpContext) {
    const totalUsers = await User.query().count('* as total')
    const totalCharacters = await Character.query().count('* as total')
    const totalItems = await Item.query().count('* as total')
    const topCredits = await Character.query().orderBy('credits', 'desc').limit(5)
    let totalSeasons = 0
    let activeSeason = null

    try {
      const seasonCount = await Season.query().count('* as total')
      totalSeasons = Number(seasonCount[0]?.$extras.total || 0)
      activeSeason = await SeasonService.getActiveSeason().catch(() => null)
    } catch {
      totalSeasons = 0
      activeSeason = null
    }

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
        totalSeasons,
      },
      topCredits: topCredits.map((c) => c.serialize()),
      activeSeason: SeasonService.serializeSummary(activeSeason),
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

  // ── Seasons management ──

  async seasons({ inertia }: HttpContext) {
    const seasons = await Season.query()
      .orderBy('sortOrder', 'desc')
      .orderBy('startsAt', 'desc')
      .orderBy('id', 'desc')

    const activeSeason = await SeasonService.getActiveSeason().catch(() => null)

    return inertia.render('admin/seasons', {
      seasons: seasons.map((season) => ({
        ...season.serialize(),
      })),
      activeSeason: SeasonService.serializeSummary(activeSeason),
    })
  }

  async createSeason({ request, response, session }: HttpContext) {
    const payload = SeasonService.normalizePayload(
      request.only([
        'key',
        'name',
        'slug',
        'theme',
        'campaignTitle',
        'storyIntro',
        'storyOutro',
        'bannerImage',
        'primaryColor',
        'secondaryColor',
        'status',
        'sortOrder',
        'isRankedPvpEnabled',
        'isWorldBossEnabled',
        'isPlayerMarketEnabled',
        'isBlackMarketBonusEnabled',
        'startsAt',
        'endsAt',
      ])
    )

    if (!payload.name || !payload.key || !payload.slug) {
      session.flash('errors', { message: 'Nom, key et slug sont obligatoires' })
      return response.redirect('/admin/seasons')
    }

    const keyExists = await Season.findBy('key', payload.key)
    if (keyExists) {
      session.flash('errors', { message: 'Une saison avec cette key existe deja' })
      return response.redirect('/admin/seasons')
    }

    const slugExists = await Season.findBy('slug', payload.slug)
    if (slugExists) {
      session.flash('errors', { message: 'Une saison avec ce slug existe deja' })
      return response.redirect('/admin/seasons')
    }

    await Season.create(payload)

    session.flash('success', `Saison "${payload.name}" creee`)
    return response.redirect('/admin/seasons')
  }

  async activateSeason({ params, response, session }: HttpContext) {
    try {
      const season = await Season.findOrFail(params.id)
      await SeasonService.activateSeason(season)
      session.flash('success', `Saison "${season.name}" activee et ladder reinitialise`)
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Impossible d\'activer la saison',
      })
    }

    return response.redirect('/admin/seasons')
  }

  async completeSeason({ params, response, session }: HttpContext) {
    try {
      const season = await Season.findOrFail(params.id)
      await SeasonService.completeSeason(season)
      session.flash('success', `Saison "${season.name}" cloturee et recompenses preparees`)
    } catch (error) {
      session.flash('errors', {
        message: error instanceof Error ? error.message : 'Impossible de cloturer la saison',
      })
    }

    return response.redirect('/admin/seasons')
  }

  async updateSeason({ params, request, response, session }: HttpContext) {
    const season = await Season.findOrFail(params.id)
    const payload = SeasonService.normalizePayload(
      request.only([
        'key',
        'name',
        'slug',
        'theme',
        'campaignTitle',
        'storyIntro',
        'storyOutro',
        'bannerImage',
        'primaryColor',
        'secondaryColor',
        'status',
        'sortOrder',
        'isRankedPvpEnabled',
        'isWorldBossEnabled',
        'isPlayerMarketEnabled',
        'isBlackMarketBonusEnabled',
        'startsAt',
        'endsAt',
      ])
    )

    if (!payload.name || !payload.key || !payload.slug) {
      session.flash('errors', { message: 'Nom, key et slug sont obligatoires' })
      return response.redirect('/admin/seasons')
    }

    const keyExists = await Season.query().where('key', payload.key).whereNot('id', season.id).first()
    if (keyExists) {
      session.flash('errors', { message: 'Une autre saison utilise deja cette key' })
      return response.redirect('/admin/seasons')
    }

    const slugExists = await Season.query().where('slug', payload.slug).whereNot('id', season.id).first()
    if (slugExists) {
      session.flash('errors', { message: 'Une autre saison utilise deja ce slug' })
      return response.redirect('/admin/seasons')
    }

    season.merge(payload)
    await season.save()

    session.flash('success', `Saison "${season.name}" mise a jour`)
    return response.redirect('/admin/seasons')
  }

  async deleteSeason({ params, response, session }: HttpContext) {
    const season = await Season.findOrFail(params.id)
    const name = season.name
    await season.delete()

    session.flash('success', `Saison "${name}" supprimee`)
    return response.redirect('/admin/seasons')
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

  // ── Daily rewards ──

  async dailyRewards({ inertia }: HttpContext) {
    const rewards = await DailyRewardConfig.query().preload('rewardItem').orderBy('dayNumber', 'asc')
    const items = await Item.query().orderBy('name', 'asc')

    return inertia.render('admin/daily_rewards', {
      rewards: rewards.map((reward) => ({
        ...reward.serialize(),
        rewardItemName: reward.rewardItem?.name || null,
      })),
      items: items.map((item) => item.serialize()),
    })
  }

  async createDailyReward({ request, response, session }: HttpContext) {
    const dayNumber = Math.max(1, Number(request.input('dayNumber', 1)))
    const rewardType = request.input('rewardType', 'credits')
    const rewardValue = Math.max(1, Number(request.input('rewardValue', 1)))
    const rewardItemId = request.input('rewardItemId')
    const isActive = request.input('isActive') === 'true' || request.input('isActive') === true

    if (rewardType === 'item' && !rewardItemId) {
      session.flash('errors', { message: 'Choisis un item pour une recompense de type item' })
      return response.redirect('/admin/daily-rewards')
    }

    await DailyRewardConfig.updateOrCreate(
      { dayNumber },
      {
        rewardType,
        rewardValue,
        rewardItemId: rewardType === 'item' && rewardItemId ? Number(rewardItemId) : null,
        isActive,
      }
    )

    session.flash('success', `Recompense journaliere J${dayNumber} enregistree`)
    return response.redirect('/admin/daily-rewards')
  }

  async updateDailyReward({ params, request, response, session }: HttpContext) {
    const reward = await DailyRewardConfig.findOrFail(params.id)
    const dayNumber = Math.max(1, Number(request.input('dayNumber', reward.dayNumber)))
    const rewardType = request.input('rewardType', reward.rewardType)
    const rewardValue = Math.max(1, Number(request.input('rewardValue', reward.rewardValue)))
    const rewardItemId = request.input('rewardItemId')

    if (rewardType === 'item' && !rewardItemId) {
      session.flash('errors', { message: 'Choisis un item pour une recompense de type item' })
      return response.redirect('/admin/daily-rewards')
    }

    const duplicateDay = await DailyRewardConfig.query()
      .where('dayNumber', dayNumber)
      .whereNot('id', reward.id)
      .first()

    if (duplicateDay) {
      session.flash('errors', { message: `Le jour ${dayNumber} existe deja` })
      return response.redirect('/admin/daily-rewards')
    }

    reward.dayNumber = dayNumber
    reward.rewardType = rewardType
    reward.rewardValue = rewardValue
    reward.rewardItemId = rewardType === 'item' && rewardItemId ? Number(rewardItemId) : null
    reward.isActive = request.input('isActive') === 'true' || request.input('isActive') === true

    await reward.save()

    session.flash('success', `Recompense J${reward.dayNumber} mise a jour`)
    return response.redirect('/admin/daily-rewards')
  }

  async deleteDailyReward({ params, response, session }: HttpContext) {
    const reward = await DailyRewardConfig.findOrFail(params.id)
    const dayNumber = reward.dayNumber
    await reward.delete()

    session.flash('success', `Recompense J${dayNumber} supprimee`)
    return response.redirect('/admin/daily-rewards')
  }

  // ── Quests ──

  async quests({ inertia }: HttpContext) {
    const [quests, seasons, items] = await Promise.all([
      Quest.query()
        .preload('season')
        .preload('parentQuest')
        .orderBy('questType', 'asc')
        .orderBy('arcTitle', 'asc')
        .orderBy('sortOrder', 'asc')
        .orderBy('id', 'asc'),
      Season.query().orderBy('sortOrder', 'desc').orderBy('name', 'asc'),
      Item.query().orderBy('name', 'asc'),
    ])

    return inertia.render('admin/quests', {
      quests: quests.map((quest) => ({
        ...quest.serialize(),
        seasonName: quest.season?.name || null,
        parentQuestTitle: quest.parentQuest?.title || null,
        rewards: this.getQuestRewards(quest),
      })),
      questOptions: quests.map((quest) => ({
        id: quest.id,
        key: quest.key,
        title: quest.title,
        arcTitle: quest.arcTitle,
        questType: quest.questType,
        seasonId: quest.seasonId,
      })),
      seasons: seasons.map((season) => ({
        id: season.id,
        name: season.name,
        status: season.status,
      })),
      questTypes: [
        { value: 'main', label: 'Principale' },
        { value: 'seasonal', label: 'Saison' },
      ],
      objectiveTypes: [
        { value: 'hack_clicks', label: 'Clicks de hack' },
        { value: 'hack_credits', label: 'Credits siphonnes' },
        { value: 'reach_level', label: 'Niveau atteint' },
        { value: 'shop_purchase', label: 'Achats shop' },
        { value: 'companion_purchase', label: 'Achat de drone' },
        { value: 'companion_activate', label: 'Installation de drone' },
        { value: 'pvp_match', label: 'Combat PvP termine' },
        { value: 'dungeon_floor_clear', label: 'Floor terminee' },
      ],
      rewardTypes: [
        { value: 'credits', label: 'Credits' },
        { value: 'xp', label: 'XP' },
        { value: 'talent_points', label: 'Points de talent' },
        { value: 'item', label: 'Item' },
      ],
      items: items.map((item) => item.serialize()),
    })
  }

  async createQuest({ request, response, session }: HttpContext) {
    const payload = this.normalizeQuestInput(request)
    const rewards = await this.normalizeQuestRewards(request)
    const validationError = await this.validateQuestPayload(payload, rewards)

    if (validationError) {
      session.flash('errors', { message: validationError })
      return response.redirect('/admin/quests')
    }

    const parentQuest = payload.parentQuestId ? await Quest.find(payload.parentQuestId) : null

    await Quest.create({
      ...payload,
      seasonId: payload.questType === 'seasonal' ? payload.seasonId : null,
      rewardsJson: JSON.stringify(rewards),
      rewardType: rewards[0]?.type || 'credits',
      rewardValue: rewards[0]?.value || 0,
      requiredQuestKey: parentQuest?.key || null,
    })

    session.flash('success', `Quete ${payload.title} ajoutee`)
    return response.redirect('/admin/quests')
  }

  async updateQuest({ params, request, response, session }: HttpContext) {
    const quest = await Quest.findOrFail(params.id)
    const payload = this.normalizeQuestInput(request, quest)
    const rewards = await this.normalizeQuestRewards(request)
    const validationError = await this.validateQuestPayload(payload, rewards, quest.id)

    if (validationError) {
      session.flash('errors', { message: validationError })
      return response.redirect('/admin/quests')
    }

    const parentQuest = payload.parentQuestId ? await Quest.find(payload.parentQuestId) : null

    quest.merge({
      ...payload,
      seasonId: payload.questType === 'seasonal' ? payload.seasonId : null,
      rewardsJson: JSON.stringify(rewards),
      rewardType: rewards[0]?.type || 'credits',
      rewardValue: rewards[0]?.value || 0,
      requiredQuestKey: parentQuest?.key || null,
    })
    await quest.save()

    session.flash('success', `Quete ${quest.title} mise a jour`)
    return response.redirect('/admin/quests')
  }

  async deleteQuest({ params, response, session }: HttpContext) {
    const quest = await Quest.findOrFail(params.id)
    const title = quest.title
    await quest.delete()

    session.flash('success', `Quete ${title} supprimee`)
    return response.redirect('/admin/quests')
  }

  // ── Black Market ──

  async blackMarket({ inertia }: HttpContext) {
    const [settings, catalog, cleaners, items] = await Promise.all([
      BlackMarketSetting.query().orderBy('key', 'asc'),
      BlackMarketCatalogEntry.query().preload('item').orderBy('vendorKey', 'asc').orderBy('sortOrder', 'asc').orderBy('id', 'asc'),
      BlackMarketCleaner.query().orderBy('sortOrder', 'asc').orderBy('id', 'asc'),
      Item.query().orderBy('type', 'asc').orderBy('rarity', 'asc').orderBy('name', 'asc'),
    ])

    const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]))

    return inertia.render('admin/black_market', {
      settings: {
        minLevel: Number(settingsMap.get('min_level') || await BlackMarketService.getMinLevel()),
        rotationHours: Number(settingsMap.get('rotation_hours') || await BlackMarketService.getRotationHours()),
      },
      vendors: Object.entries(BlackMarketService.getVendorDefinitions()).map(([key, value]) => ({
        key,
        ...value,
      })),
      catalog: catalog.map((entry) => ({
        ...entry.serialize(),
        item: entry.item.serialize(),
      })),
      cleaners: cleaners.map((cleaner) => cleaner.serialize()),
      items: items.map((item) => item.serialize()),
    })
  }

  async updateBlackMarketSettings({ request, response, session }: HttpContext) {
    const minLevel = Math.max(1, Number(request.input('minLevel', 12)) || 12)
    const rotationHours = Math.max(1, Number(request.input('rotationHours', 12)) || 12)

    await BlackMarketSetting.updateOrCreate({ key: 'min_level' }, { value: String(minLevel) })
    await BlackMarketSetting.updateOrCreate({ key: 'rotation_hours' }, { value: String(rotationHours) })

    session.flash('success', 'Configuration globale du marche noir mise a jour')
    return response.redirect('/admin/black-market')
  }

  async createBlackMarketCatalogEntry({ request, response, session }: HttpContext) {
    const itemId = Number(request.input('itemId'))
    const vendorKey = String(request.input('vendorKey', 'ghostline'))

    await BlackMarketCatalogEntry.create({
      vendorKey,
      itemId,
      basePrice: Math.max(1000, Number(request.input('basePrice', 1000)) || 1000),
      stock: Math.max(1, Number(request.input('stock', 1)) || 1),
      heatValue: Math.max(0, Number(request.input('heatValue', 0)) || 0),
      reputationRequired: Math.max(0, Number(request.input('reputationRequired', 0)) || 0),
      requiredSpec: request.input('requiredSpec') || null,
      isFeatured: request.input('isFeatured') === 'true' || request.input('isFeatured') === true,
      isActive: request.input('isActive') === 'true' || request.input('isActive') === true,
      sortOrder: Math.max(0, Number(request.input('sortOrder', 0)) || 0),
    })

    session.flash('success', 'Entree du catalogue noir ajoutee')
    return response.redirect('/admin/black-market')
  }

  async updateBlackMarketCatalogEntry({ params, request, response, session }: HttpContext) {
    const entry = await BlackMarketCatalogEntry.findOrFail(params.id)

    entry.vendorKey = String(request.input('vendorKey', entry.vendorKey))
    entry.itemId = Number(request.input('itemId', entry.itemId)) || entry.itemId
    entry.basePrice = Math.max(1000, Number(request.input('basePrice', entry.basePrice)) || entry.basePrice)
    entry.stock = Math.max(1, Number(request.input('stock', entry.stock)) || entry.stock)
    entry.heatValue = Math.max(0, Number(request.input('heatValue', entry.heatValue)) || entry.heatValue)
    entry.reputationRequired = Math.max(0, Number(request.input('reputationRequired', entry.reputationRequired)) || entry.reputationRequired)
    entry.requiredSpec = request.input('requiredSpec') || null
    entry.isFeatured = request.input('isFeatured') === 'true' || request.input('isFeatured') === true
    entry.isActive = request.input('isActive') === 'true' || request.input('isActive') === true
    entry.sortOrder = Math.max(0, Number(request.input('sortOrder', entry.sortOrder)) || entry.sortOrder)

    await entry.save()

    session.flash('success', 'Entree du catalogue noir mise a jour')
    return response.redirect('/admin/black-market')
  }

  async deleteBlackMarketCatalogEntry({ params, response, session }: HttpContext) {
    const entry = await BlackMarketCatalogEntry.findOrFail(params.id)
    await entry.delete()

    session.flash('success', 'Entree du catalogue noir supprimee')
    return response.redirect('/admin/black-market')
  }

  async createBlackMarketCleaner({ request, response, session }: HttpContext) {
    await BlackMarketCleaner.create({
      key: String(request.input('key', '')).trim(),
      name: String(request.input('name', '')).trim(),
      description: String(request.input('description', '')).trim(),
      basePrice: Math.max(1000, Number(request.input('basePrice', 1000)) || 1000),
      heatReduction: Math.max(1, Number(request.input('heatReduction', 1)) || 1),
      isActive: request.input('isActive') === 'true' || request.input('isActive') === true,
      sortOrder: Math.max(0, Number(request.input('sortOrder', 0)) || 0),
    })

    session.flash('success', 'Cleaner du marche noir ajoute')
    return response.redirect('/admin/black-market')
  }

  async updateBlackMarketCleaner({ params, request, response, session }: HttpContext) {
    const cleaner = await BlackMarketCleaner.findOrFail(params.id)

    cleaner.key = String(request.input('key', cleaner.key)).trim()
    cleaner.name = String(request.input('name', cleaner.name)).trim()
    cleaner.description = String(request.input('description', cleaner.description)).trim()
    cleaner.basePrice = Math.max(1000, Number(request.input('basePrice', cleaner.basePrice)) || cleaner.basePrice)
    cleaner.heatReduction = Math.max(1, Number(request.input('heatReduction', cleaner.heatReduction)) || cleaner.heatReduction)
    cleaner.isActive = request.input('isActive') === 'true' || request.input('isActive') === true
    cleaner.sortOrder = Math.max(0, Number(request.input('sortOrder', cleaner.sortOrder)) || cleaner.sortOrder)

    await cleaner.save()

    session.flash('success', 'Cleaner du marche noir mis a jour')
    return response.redirect('/admin/black-market')
  }

  async deleteBlackMarketCleaner({ params, response, session }: HttpContext) {
    const cleaner = await BlackMarketCleaner.findOrFail(params.id)
    await cleaner.delete()

    session.flash('success', 'Cleaner du marche noir supprime')
    return response.redirect('/admin/black-market')
  }
}
