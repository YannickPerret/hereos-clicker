import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const PlayController = () => import('#controllers/play_controller')
const InventoryController = () => import('#controllers/inventory_controller')
const ShopController = () => import('#controllers/shop_controller')
const DungeonController = () => import('#controllers/dungeon_controller')
const TalentController = () => import('#controllers/talent_controller')
const PartyController = () => import('#controllers/party_controller')
const PvpController = () => import('#controllers/pvp_controller')
const MissionController = () => import('#controllers/mission_controller')
const CompanionController = () => import('#controllers/companion_controller')
const ChatController = () => import('#controllers/chat_controller')
const BugReportController = () => import('#controllers/bug_report_controller')

// Transmit SSE routes
transmit.registerRoutes()

// Guest routes
router.group(() => {
  router.get('/login', [AuthController, 'showLogin'])
  router.post('/login', [AuthController, 'login'])
  router.get('/register', [AuthController, 'showRegister'])
  router.post('/register', [AuthController, 'register'])
}).use(middleware.guest())

// Auth routes
router.group(() => {
  router.post('/logout', [AuthController, 'logout'])

  // Play / Clicker
  router.get('/play', [PlayController, 'index'])
  router.post('/play/character', [PlayController, 'createCharacter'])
  router.post('/play/click', [PlayController, 'click'])
  router.post('/play/tick', [PlayController, 'autoTick'])

  // Inventory
  router.get('/inventory', [InventoryController, 'index'])
  router.post('/inventory/:id/equip', [InventoryController, 'equip'])
  router.post('/inventory/:id/unequip', [InventoryController, 'unequip'])
  router.post('/inventory/:id/use', [InventoryController, 'use'])

  // Shop
  router.get('/shop', [ShopController, 'index'])
  router.post('/shop/:id/buy', [ShopController, 'buy'])

  // Dungeon
  router.get('/dungeon', [DungeonController, 'index'])
  router.post('/dungeon/enter/:floorId', [DungeonController, 'enter'])
  router.get('/dungeon/run/:runId', [DungeonController, 'show'])
  router.get('/dungeon/run/:runId/state', [DungeonController, 'runState'])
  router.post('/dungeon/run/:runId/attack', [DungeonController, 'attack'])
  router.post('/dungeon/run/:runId/skill', [DungeonController, 'useSkill'])
  router.post('/dungeon/run/:runId/use-item', [DungeonController, 'useItem'])
  router.post('/dungeon/run/:runId/flee', [DungeonController, 'flee'])

  // Talents
  router.get('/talents', [TalentController, 'index'])
  router.post('/talents/unlock', [TalentController, 'unlock'])
  router.post('/talents/respec', [TalentController, 'respec'])

  // Party
  router.get('/party', [PartyController, 'index'])
  router.get('/party/state/:partyId', [PartyController, 'state'])
  router.get('/party/invitations', [PartyController, 'invitations'])
  router.post('/party/create', [PartyController, 'create'])
  router.post('/party/join', [PartyController, 'join'])
  router.post('/party/invite', [PartyController, 'invite'])
  router.post('/party/invitations/:inviteId/accept', [PartyController, 'acceptInvite'])
  router.post('/party/invitations/:inviteId/decline', [PartyController, 'declineInvite'])
  router.post('/party/ready', [PartyController, 'ready'])
  router.post('/party/leave', [PartyController, 'leave'])
  router.post('/party/start-dungeon', [PartyController, 'startDungeon'])

  // PvP Arena
  router.get('/pvp', [PvpController, 'index'])
  router.post('/pvp/queue', [PvpController, 'queue'])
  router.post('/pvp/leave-queue', [PvpController, 'leaveQueue'])
  router.get('/pvp/match/:matchId', [PvpController, 'show'])
  router.get('/pvp/match/:matchId/state', [PvpController, 'state'])
  router.post('/pvp/match/:matchId/attack', [PvpController, 'attack'])
  router.post('/pvp/match/:matchId/skill', [PvpController, 'useSkill'])
  router.post('/pvp/match/:matchId/forfeit', [PvpController, 'forfeit'])

  // Missions quotidiennes
  router.get('/missions', [MissionController, 'index'])
  router.post('/missions/daily-reward/claim', [MissionController, 'claimDailyReward'])
  router.post('/missions/:missionId/claim', [MissionController, 'claim'])

  // Compagnons
  router.get('/companions', [CompanionController, 'index'])
  router.post('/companions/:id/buy', [CompanionController, 'buy'])
  router.post('/companions/:id/activate', [CompanionController, 'activate'])
  router.post('/companions/:id/deactivate', [CompanionController, 'deactivate'])

  // Chat (API JSON pour le composant flottant)
  router.get('/chat/channels', [ChatController, 'channels'])
  router.get('/chat/messages', [ChatController, 'messages'])
  router.post('/chat/send', [ChatController, 'send'])
  router.post('/chat/channels/create', [ChatController, 'createChannel'])
  router.post('/chat/channels/join', [ChatController, 'joinChannel'])

  // Bug Reports (user)
  router.post('/report', [BugReportController, 'create'])
  router.get('/reports', [BugReportController, 'myReports'])

  // Leaderboard
  router.get('/leaderboard', [DungeonController, 'leaderboard'])
}).use(middleware.auth())

// Admin routes
const AdminController = () => import('#controllers/admin_controller')
router.group(() => {
  router.get('/admin', [AdminController, 'dashboard'])
  router.get('/admin/users', [AdminController, 'users'])
  router.post('/admin/users/:id/role', [AdminController, 'updateRole'])
  router.post('/admin/users/:id/ban', [AdminController, 'banUser'])

  // Character management
  router.get('/admin/characters/:characterId', [AdminController, 'editCharacter'])
  router.post('/admin/characters/:characterId/update', [AdminController, 'updateCharacter'])
  router.post('/admin/characters/:characterId/delete', [AdminController, 'deleteCharacter'])
  router.post('/admin/characters/:characterId/reset-talents', [AdminController, 'resetTalents'])
  router.post('/admin/characters/:characterId/give-credits', [AdminController, 'giveCredits'])

  // Inventory management
  router.post('/admin/characters/:characterId/add-item', [AdminController, 'addItem'])
  router.post('/admin/inventory/:inventoryId/remove', [AdminController, 'removeItem'])
  router.post('/admin/inventory/:inventoryId/quantity', [AdminController, 'updateItemQuantity'])

  // Bug Reports (admin)
  router.get('/admin/reports', [BugReportController, 'adminIndex'])
  router.post('/admin/reports/:id/update', [BugReportController, 'adminUpdate'])

  // Items & Shop
  router.get('/admin/items', [AdminController, 'items'])
  router.post('/admin/items/create', [AdminController, 'createItem'])
  router.post('/admin/items/:id/update', [AdminController, 'updateItem'])
  router.post('/admin/items/:id/delete', [AdminController, 'deleteItem'])
  router.post('/admin/items/:id/add-to-shop', [AdminController, 'addToShop'])
  router.post('/admin/shop/:id/update', [AdminController, 'updateShopListing'])
  router.post('/admin/shop/:id/remove', [AdminController, 'removeFromShop'])

  // Enemies & Loot
  router.get('/admin/enemies', [AdminController, 'enemies'])
  router.post('/admin/enemies/create', [AdminController, 'createEnemy'])
  router.post('/admin/enemies/:id/update', [AdminController, 'updateEnemy'])
  router.post('/admin/enemies/:id/delete', [AdminController, 'deleteEnemy'])
  router.post('/admin/enemies/:id/add-loot', [AdminController, 'addLootEntry'])
  router.post('/admin/loot/:id/update', [AdminController, 'updateLootEntry'])
  router.post('/admin/loot/:id/delete', [AdminController, 'deleteLootEntry'])

  // System Messages (auto-chat)
  router.get('/admin/system-messages', [AdminController, 'systemMessages'])
  router.post('/admin/system-messages/create', [AdminController, 'createSystemMessage'])
  router.post('/admin/system-messages/:id/update', [AdminController, 'updateSystemMessage'])
  router.post('/admin/system-messages/:id/toggle', [AdminController, 'toggleSystemMessage'])
  router.post('/admin/system-messages/:id/delete', [AdminController, 'deleteSystemMessage'])

  // Daily rewards
  router.get('/admin/daily-rewards', [AdminController, 'dailyRewards'])
  router.post('/admin/daily-rewards/create', [AdminController, 'createDailyReward'])
  router.post('/admin/daily-rewards/:id/update', [AdminController, 'updateDailyReward'])
  router.post('/admin/daily-rewards/:id/delete', [AdminController, 'deleteDailyReward'])
}).use([middleware.auth(), middleware.role({ roles: ['admin', 'moderator'] })])

// Redirect root
router.get('/', ({ response }) => response.redirect('/play'))
