# HereOS - Cyberpunk Multiplayer Clicker

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
- `models/` - user, role, character, item, inventory_item, shop_listing, enemy, enemy_loot_table, dungeon_floor, dungeon_run, talent, character_talent, party, party_member, pvp_match, daily_mission, character_daily_mission, companion, character_companion, chat_message, chat_channel, bug_report
- `services/` - clicker_service (anti-cheat, batch clicks), combat_service (turn-based, crits), talent_service (bonuses calc), pvp_service (real-time matchmaking, ELO), daily_mission_service (tracking, rewards)
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
- Party system uses Transmit SSE for real-time updates
- Dungeon enemies scale HP by party size (x0.5 per extra member)
- Some dungeon floors require min 2-3 players
- Critical hits: characters + enemies have critChance (%) and critDamage (%)
- PvP: real-time matchmaking queue, tour par tour, ELO rating (K=32), poll every 1.5s
- Daily missions: 3 random missions/day, auto-tracked via clicker/combat/pvp services
- Companions: 1 active at a time, bonus scales with level, bought with credits
- Chat: floating widget (bottom-left), public/private channels, password-protected rooms, poll every 3s/10s
- Bug reports: users submit, admins manage (status + notes)
- SSE notifications: PvP results, dungeon clears, companion acquisitions

### Roles
- `user` (RUNNER) — default
- `moderator` (ENFORCER) — access to admin panel
- `admin` (SYSOP) — full access
- Roles stored in `roles` table, users have `role_id` FK
- Role middleware protects admin routes

### DB
- SQLite file at `tmp/db.sqlite3`
- Migrations in `database/migrations/` (numbered 001-020)
- Seeders in `database/seeders/` (01-10)

### Conventions
- French UI text
- All routes use Inertia (server-side rendering via Edge template + React hydration)
- JSON API for `/play/click`, `/play/tick`, `/chat/*` endpoints
- CSRF via XSRF-TOKEN cookie
