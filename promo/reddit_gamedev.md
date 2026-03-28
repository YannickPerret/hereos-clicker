# POST — r/gamedev  (ou r/indiegaming)

**Title:**
I built a cyberpunk multiplayer clicker RPG in the browser — HereOS [Showoff Saturday / Feedback Friday]

---

**Body:**

Hey r/gamedev! Sharing **HereOS**, a browser-based cyberpunk clicker RPG I've been working on solo.

**Link → https://www.hereos.yannickperret.com**

---

### Tech stack

- **Backend**: AdonisJS 6 + Inertia v3 + SSE (real-time via Transmit)
- **Frontend**: React TSX + Tailwind CSS v4 via Inertia
- **DB**: SQLite (better-sqlite3)
- **Build**: Vite 6

---

### What I built

The core loop is a clicker (click to earn credits), but wrapped in a full RPG:

- **Turn-based dungeon combat** with a party system — other players join your run, turns rotate, there's a 30s timeout with auto-attack
- **4 specs** with unique combat skills (called "Programmes" in-world) — damage, DOTs, shields, stuns, heals
- **Real-time PvP** matchmaking with ELO
- **Anti-cheat system** — click batching, rate limiting, pattern detection, progressive warnings
- **Offline earnings** — capped at 4h, claimable manually
- **Quest chains, talent trees, companions, daily missions, leaderboard**
- **IRC-style chat** with public/private channels, party auto-channel, password-protected rooms

### Challenges I faced

The hardest part was the **group dungeon system** — real-time turn rotation across multiple clients, AFK penalties, 30s timeout, auto-redirect all party members on launch. Keeping state consistent without WebSockets (using SSE + polling) was tricky.

The **anti-cheat** was also fun to build — standard deviation analysis on click timing to flag bot-like patterns, progressive penalty system.

---

Happy to discuss any technical decisions. And if you want to try the game: **https://www.hereos.yannickperret.com**
