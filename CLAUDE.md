# HereOS - Cyberpunk Multiplayer Clicker RPG

## Stack
- **Backend**: AdonisJS 6 + Inertia v3 + Transmit (SSE)
- **Frontend**: React (TSX) via Inertia + Tailwind CSS v4
- **DB**: SQLite (better-sqlite3)
- **Build**: Vite 6 + @vitejs/plugin-react v4

## Commands
```bash
make dev        # Start dev server (HMR)
make up         # Docker (port 5080)
make fresh      # Reset DB + seed
make migrate    # Run migrations
make seed       # Run seeders
node ace user:promote <username>  # Promote user to admin (SYSOP)
```

## Architecture

### Backend (app/)
- `controllers/` - auth, play, inventory, shop, dungeon, talent, party, pvp, mission, companion, chat, bug_report, admin
- `models/` - user, role, character, item, inventory_item, shop_listing, enemy, enemy_loot_table, dungeon_floor, dungeon_run, talent, character_talent, party, party_member, pvp_match, daily_mission, character_daily_mission, companion, character_companion, chat_message, chat_channel, bug_report, system_message, combat_skill
- `services/` - clicker_service (anti-cheat, batch clicks, rate limiting), combat_service (turn-based, crits, combat skills), talent_service (bonuses calc), pvp_service (real-time matchmaking, ELO), daily_mission_service (tracking, rewards)
- `middleware/` - auth, guest, role

### Frontend (inertia/)
- `pages/` - auth/, play/, inventory/, shop/, dungeon/, talents/, party/, pvp/, missions/, companions/, report/, leaderboard/, admin/
- `components/` - layout.tsx (nav + floating chat), floating_chat.tsx (IRC-style chat widget)
- `css/` - app.css (cyberpunk theme with Tailwind)

### Key patterns
- Clicks are batched client-side (500ms) then POSTed to server
- Auto-click (CPS) runs via setInterval on client, syncs every 10s
- Offline earnings capped at 4h, collected on login
- Talent bonuses are computed server-side in TalentService
- Party system uses JSON polling for real-time updates (every 2s, 1s during countdown)
- Dungeon enemies scale HP by party size (x0.5 per extra member)
- Some dungeon floors require min 2-3 players
- Critical hits: characters + enemies have critChance (%) and critDamage (%)
- PvP: real-time matchmaking queue, tour par tour, ELO rating (K=32), poll every 1.5s
- Daily missions: 3 random missions/day, auto-tracked via clicker/combat/pvp services
- Companions: 1 active at a time, bonus scales with level, bought with credits
- Chat: floating widget (bottom-left), public/private channels, password-protected rooms, party auto-channel, poll every 3s/10s
- Bug reports: users submit, admins manage (status + notes)
- SSE notifications: PvP results, dungeon clears, companion acquisitions

### Combat system
- Turn-based combat in dungeons (solo and group)
- Group runs: turn rotation with 30s timeout, auto-attack on timeout
- Combat stats: base stats + equipment bonuses + talent bonuses + active skill effects
- **Combat skills (Programmes)**: 4 skills per spec, unlocked via talent tiers (2-5)
  - **Hacker**: Breach Protocol, Short Circuit, Backdoor, Kernel Panic
  - **Netrunner**: Ping Scan, ICE Breaker, Neural Overload, System Restore
  - **Samurai**: Wired Reflexes, Mono-Edge Slash, Subdermal Shield, Adrenaline Surge
  - **Chrome Dealer**: Deploy Turret, Repair Nanobots, EMP Blast, Chrome Overcharge
- Skill effects: damage, pure_damage, debuff_def, debuff_atk, stun, heal, DOT, shield, guaranteed_crit, double_hit, mega_strike, turret, buff_all
- Cooldowns tracked per character per run in `skill_cooldowns` JSON field
- Active effects (buffs/debuffs/DOTs) stored in `active_effects` JSON field
- Enemy loot drops via `enemy_loot_tables` with configurable drop chances

### Level up (RPG scaling)
- Centralized in `Character.levelUp()` method
- HP: +8 + level×1.5
- ATK: +2 + level/5
- DEF: +1 + level/5
- Every 3 levels: +1 CPC
- Every 5 levels: +1% crit chance, +5% crit damage
- Every 10 levels: +1 CPS
- +1 talent point always

### Party system
- Party status flow: `waiting` → `countdown` → `in_dungeon` → `waiting`/`disbanded`
- 5-4-3-2-1 countdown visible to all members before dungeon launch
- Auto-redirect all members to dungeon on launch
- Party chat channel auto-created/deleted with party lifecycle
- Party state polling via `/party/state/:partyId` JSON endpoint

### Anti-cheat
- Click batching: max 50 clicks per batch (`MAX_CLICKS_PER_BATCH`)
- Rate limiting: max 5 click requests per second per user
- Pattern detection: flags identical click counts with near-perfect timing (std dev < 30ms)
- Progressive warnings: 3 warnings = 30s penalty (clicks blocked)
- Auto-recovery: warnings decay after 10s of normal behavior

### System messages (auto-chat)
- Configurable via admin panel (`/admin/system-messages`)
- Message, interval (minutes), target channel, active/inactive toggle
- Preload `start/system_chat.ts` runs intervals, reloads on admin changes
- Displayed as `[SYSTEM]` in yellow/italic in chat

### Admin panel
- `/admin` — Dashboard with stats
- `/admin/users` — User management (roles, bans, character editing)
- `/admin/characters/:id` — Character stats editing, inventory management, talent reset
- `/admin/items` — Item CRUD, shop listing management (price override, stock, active toggle)
- `/admin/enemies` — Enemy stats editing, loot table management (add/remove items, drop chances)
- `/admin/reports` — Bug report management
- `/admin/system-messages` — Auto-chat message configuration

### Roles
- `user` (RUNNER) — default
- `moderator` (ENFORCER) — access to admin panel
- `admin` (SYSOP) — full access
- Roles stored in `roles` table, users have `role_id` FK
- Role middleware protects admin routes

### DB
- SQLite file at `tmp/db.sqlite3`
- Migrations in `database/migrations/` (numbered 001-024)
- Seeders in `database/seeders/` (01-11)

### Conventions
- French UI text
- All routes use Inertia (server-side rendering via Edge template + React hydration)
- JSON API for `/play/click`, `/play/tick`, `/chat/*`, `/party/state/*`, `/dungeon/run/*/state`, `/pvp/match/*/state` endpoints
- CSRF via XSRF-TOKEN cookie
- Inventory stats show effective values (base + equipment + talents) with bonus in green
