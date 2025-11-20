# PvP & Online Gang Wars - Design Document

## Overview
Enable player-vs-player combat and gang-vs-gang territory wars in From Dusk to Don. This document outlines the minimal backend infrastructure and client integration needed for multiplayer competitive features.

## Goals
- **Endgame Competition**: PvP becomes the primary late-game content for money, power, and reputation
- **Gang Wars**: Guilds/gangs compete for territory control with real stakes (dirty money payouts)
- **Fair Play**: Server-authoritative combat to prevent cheating
- **Scalable**: Start simple (duels) and expand to full territory wars

---

## Architecture

### Backend (Node.js + WebSocket + REST)

#### Core Services
1. **Authentication & Session Management**
   - Lightweight auth via signed session tokens (JWT or HMAC-signed cookies)
   - Player state sync on connect (fetch from localStorage, validate server-side)
   - Rate limiting per player IP and session ID

2. **Matchmaking Service**
   - **Friendly Duels**: Quick 1v1 matches, no stakes
   - **Ranked Duels**: Competitive 1v1 with clean money wagering
   - **Territory Wars**: Scheduled gang battles for district control
   - Queue system: match players by level/reputation ±20%

3. **Combat Resolution (Server Authority)**
   - Combat formulas run server-side to prevent client manipulation
   - Inputs: player stats (level, skills, gear, perks)
   - Outputs: winner, damage dealt, rewards, reputation changes
   - Anti-cheat: validate stat values against player history

4. **World State Sync**
   - Real-time territory control updates
   - Gang member online status and jail states
   - Active heists and gang operations
   - Global leaderboards (reputation, territory, wealth)

#### API Endpoints (REST)
```
POST /api/auth/login
  → Validate player, return session token

GET /api/world/state
  → Return current districts, gangs, events

POST /api/duel/queue
  → Join matchmaking queue
  → Body: { type: 'friendly'|'ranked', wager?: number }

POST /api/duel/accept
  → Accept incoming duel challenge

POST /api/territory/challenge
  → Challenge district owner for control
  → Body: { districtId, gangId }

GET /api/leaderboard
  → Return top players by reputation/wealth
```

#### WebSocket Events (Real-time)
```
CLIENT → SERVER:
  - player_sync: Update player state (money, level, jail status)
  - duel_queue: Join PvP matchmaking
  - duel_action: Submit combat move
  - territory_attack: Initiate gang war
  - chat_message: Global or gang chat

SERVER → CLIENT:
  - match_found: Duel opponent assigned
  - combat_result: Round-by-round combat log
  - territory_update: District ownership changed
  - player_arrested: Someone went to jail
  - jailbreak_attempt: Gang member helping escape
  - world_sync: Periodic state broadcast
```

---

## Client Integration

### New UI States
1. **PvP Lobby**
   - Queue status: "Searching for opponent..." with timer
   - Active duels list (spectate mode future feature)
   - Daily/weekly PvP challenges

2. **Duel Arena**
   - Combat interface: player stats vs opponent stats
   - Action buttons: Attack, Defend, Special Move, Flee
   - Real-time health bars and damage log
   - Victory/defeat modal with rewards

3. **Territory War Map**
   - Visual district map with gang colors
   - "Challenge" button on enemy districts
   - Scheduled war times (e.g., Friday/Saturday 8-10pm)
   - War results: casualties, payouts, territory flips

4. **Gang War Queue**
   - Join as gang member (min 3 online members)
   - See enemy gang lineup
   - Countdown to battle start

### Client Sync Flow
```
1. Player opens PvP screen
   → Send WebSocket: { type: 'request_world_state' }
   ← Receive: districts, active wars, leaderboard

2. Player queues for duel
   → Send: { type: 'duel_queue', wagered: 10000 }
   ← Receive: { type: 'queue_joined', position: 5 }
   ← Receive: { type: 'match_found', opponentId, opponentStats }

3. Combat loop
   → Send: { type: 'duel_action', action: 'attack' }
   ← Receive: { type: 'combat_result', damage: 35, opponentHealth: 65 }
   (Repeat until winner decided)

4. Rewards
   ← Receive: { type: 'duel_complete', winner: clientId, payout: 20000, repGain: 15 }
   → Update local player state (money += payout)
```

---

## Combat System

### Duel Formula (Server-Side)
```javascript
function resolveCombat(player1, player2) {
  // Base power from level and skills
  const p1Power = player1.level * 10 
                + player1.skills.combat * 5 
                + (player1.inventory.weapon?.damage || 0);
  const p2Power = player2.level * 10 
                + player2.skills.combat * 5 
                + (player2.inventory.weapon?.damage || 0);
  
  // Randomness ±20%
  const p1Roll = p1Power * (0.8 + Math.random() * 0.4);
  const p2Roll = p2Power * (0.8 + Math.random() * 0.4);
  
  const winner = p1Roll > p2Roll ? player1 : player2;
  const loser = winner === player1 ? player2 : player1;
  
  return {
    winner: winner.id,
    loser: loser.id,
    damage: Math.floor((winner === player1 ? p1Roll : p2Roll) - (winner === player1 ? p2Roll : p1Roll))
  };
}
```

### Territory War Formula
```javascript
function resolveGangWar(gang1, gang2) {
  // Aggregate gang power
  const g1Power = gang1.members.reduce((sum, m) => sum + (m.online ? m.level * 10 : 0), 0);
  const g2Power = gang2.members.reduce((sum, m) => sum + (m.online ? m.level * 10 : 0), 0);
  
  // Home turf advantage: defender +20%
  const defenderBonus = gang2.defendingDistrict ? g2Power * 0.2 : 0;
  
  const g1Roll = g1Power * (0.7 + Math.random() * 0.6);
  const g2Roll = (g2Power + defenderBonus) * (0.7 + Math.random() * 0.6);
  
  const winner = g1Roll > g2Roll ? gang1 : gang2;
  
  // Payout: district weekly income * 10 (dirty money)
  const payout = winner.district.weeklyIncome * 10;
  
  return { winner: winner.id, payout, casualtiesPercent: 10 + Math.floor(Math.random() * 20) };
}
```

---

## Phased Rollout

### Phase 1: Foundation (Week 1-2)
- ✅ Global chat (already implemented in `server.js`)
- ✅ Player state sync (jail, online status)
- ✅ Leaderboards
- **NEW**: Duel queue UI and matchmaking logic

### Phase 2: Friendly Duels (Week 3-4)
- No-stakes 1v1 combat for practice
- Combat UI with attack/defend buttons
- Real-time damage feedback
- Reputation rewards only (no money)

### Phase 3: Ranked Duels (Week 5-6)
- Wagering system: both players put up clean money
- Winner takes pot (minus 5% house fee)
- Ranked leaderboard for duel wins
- Daily challenges: "Win 3 duels today for bonus $50k"

### Phase 4: Territory Wars (Week 7-8)
- Gang creation/management UI
- District challenge system
- Scheduled war windows (Friday/Saturday prime time)
- Victory payouts in dirty money
- Territory perks: income bonuses, safe houses, recruitment buffs

---

## Security & Anti-Cheat

### Server-Side Validation
- All combat outcomes calculated on server
- Player stats verified against session history (detect sudden level spikes)
- Money transactions logged with timestamps
- Rate limits: max 10 duels/hour, 3 territory challenges/day

### Client Obfuscation
- Don't send opponent's exact stats until combat starts
- Combat actions submitted as encrypted payloads
- WebSocket heartbeat every 30s to detect disconnects

### Exploit Prevention
- Dirty money must be laundered before use in ranked duels
- Jail time prevents PvP participation
- Flee from duel = forfeit wager + reputation penalty
- Gang wars require min 3 online members (prevent solo exploits)

---

## Economic Integration

### Rewards Flow
| Activity | Payout Type | Amount |
|----------|-------------|--------|
| Friendly Duel | Reputation | +5 (win), +1 (loss) |
| Ranked Duel | Clean Money | Wager × 1.9 (winner) |
| Territory War | Dirty Money | District income × 10 |
| Gang Operation | Dirty Money | $50k - $500k |
| Jailbreak Assist | Reputation | +5 (success), -2 (caught) |

### Dirty Money Sink
- Laundering fees: 15-30% depending on method
- Gang upkeep: $10k/week per member
- Bribe cops to reduce wanted level: $5k per star

---

## Technical Stack

### Backend
- **Runtime**: Node.js 18+
- **WebSocket**: `ws` library (already in use)
- **HTTP**: Express.js for REST endpoints
- **Auth**: jsonwebtoken (JWT) or crypto HMAC
- **DB**: Optional Redis for session/queue state (start with in-memory Map)

### Hosting Options
1. **Heroku Free Tier** (start here)
   - Easy deploy via Git push
   - Auto-restart on crash
   - Free SSL

2. **Railway.app** (if Heroku limits hit)
   - Similar to Heroku but more generous free tier

3. **Azure App Service** (for mobile app backend)
   - Paid but scalable
   - Good integration with VS Code

### Mobile App Considerations
- WebSocket works on React Native / Flutter
- Store session token in AsyncStorage
- Handle reconnect on app resume
- Push notifications for match found / gang war starting

---

## Next Steps

1. **Immediate (This Week)**
   - [x] Fix dirty money enforcement in client code
   - [ ] Add duel queue UI to `multiplayer.js`
   - [ ] Implement `/api/duel/queue` endpoint in `server.js`
   - [ ] Test matchmaking with 2+ browser tabs

2. **Short-term (Next 2 Weeks)**
   - [ ] Build combat UI with health bars and action buttons
   - [ ] Server-side combat resolver function
   - [ ] Victory/defeat modal with animations
   - [ ] Ranked duel wagering system

3. **Medium-term (Month 2)**
   - [ ] Gang management screen (create, invite, kick)
   - [ ] Territory war scheduling system
   - [ ] District map with gang colors
   - [ ] War results broadcast to all players

4. **Long-term (Month 3+)**
   - [ ] Deploy backend to Heroku/Railway
   - [ ] Add authentication (username/password or GitHub OAuth)
   - [ ] Persistent database (MongoDB or PostgreSQL)
   - [ ] Mobile app version with React Native
   - [ ] Spectator mode for duels
   - [ ] Replay system for epic battles

---

## Open Questions
- **Matchmaking fairness**: Should we match by level, reputation, or both?
- **War scheduling**: Fixed times (8pm Fri/Sat) or gang-initiated anytime?
- **Gang size limits**: Max 10 members per gang? Max 3 gangs per district?
- **Dirty money in PvP**: Should ranked duels allow dirty money wagering (higher stakes, higher risk)?
- **Jailbreak cooldown**: How often can gang members attempt rescues? Once per arrest or unlimited?

---

## Success Metrics
- **Player engagement**: 50%+ of active users try PvP within first week
- **Retention**: Duel participants have 2x higher return rate
- **Economy health**: Territory wars generate 30%+ of total dirty money circulation
- **Balance**: Win rates within 45-55% for matched players (no dominant builds)
