# PvP & Multiplayer Systems Audit

**Files audited:** `multiplayer.js` (4071 lines), `server.js` (2663 lines), `game.js` (20359 lines, grep-verified)  
**Date:** June 2025  
**Scope:** All PvP combat formulas, notification flow, leaderboard logic, anti-cheat/server validation, and client-trust vulnerabilities.

> **Key finding:** All PvP combat logic lives in `multiplayer.js` (client) and `server.js` (server). `game.js` contains zero PvP formulas — only a UI button that calls `showPVP()` (defined in `multiplayer.js`).

---

## A. PvP Combat Formulas

### A1. Player Challenge (1v1 Duel)

| Property | Value |
|----------|-------|
| **Server handler** | `server.js` → `handlePlayerChallenge` (~line 1230) |
| **Client sender** | `multiplayer.js` → `executePvpChallenge` (~line 3632) |
| **Energy cost** | 5 (deducted client-side before sending) |

**Formula (server-authoritative):**
```
challengerPower = level + (reputation / 10)
targetPower     = level + (reputation / 10)
victory = (challengerPower + Math.random()*20) > (targetPower + Math.random()*20)
```

**Rewards:**
- Winner: +5 reputation
- Loser: −2 reputation

**Data sent by client:** `playerName`, `level`, `reputation` — the server looks up the target from its own `gameState.players` map so the target's stats are server-side.

**⚠️ CRITICAL IMBALANCE:** This formula ignores:
- All skills (stealth, violence, intelligence)
- All gear (weapons, armor)
- Gang membership/size
- Health, power stat
- Attack/defense power (the values displayed to the player in the PVP Arena UI)

The displayed `calculateAttackPower` and `calculateDefensePower` functions (`multiplayer.js` ~lines 1963-1978) compute values like `(level*10) + (stealth*8) + (violence*12) + (intelligence*6) + (power*2)` — but these are **never used** by the server. Players see stats that have zero bearing on outcomes.

---

### A2. Territory War

| Property | Value |
|----------|-------|
| **Server handler** | `server.js` → `handleTerritoryWar` (~line 1060) |
| **Client sender** | `multiplayer.js` → `challengeForTerritory` (~line 850) |
| **Energy cost** | 40 (validated server-side) |
| **Requirements** | 5+ gang members, not in jail |

**Formula (server-authoritative):**
```
attackScore  = power + (gangMembers * 10) + (gangLoyalty * 0.5) + Math.random()*200
defenseScore = defenseRating + (level * 15) + (reputation * 0.5) + Math.random()*200

// Offline defender bonus
if (defender is offline) defenseScore += 150

victory = attackScore > defenseScore
```

**Where values come from:**
| Stat | Source | Capped? |
|------|--------|---------|
| `power` | Client-reported | Capped at 10000 |
| `gangMembers` | Client-reported | Capped at 100 |
| `gangLoyalty` | Client-reported | Capped at 100 |
| `defenseRating` | Server territory data | N/A |
| Defender `level`, `reputation` | Server `gameState.players` | N/A |

**Outcomes:**
| Result | Casualties | Health Loss | Wanted | Other |
|--------|-----------|-------------|--------|-------|
| Win | 10% gang members | 15–35 | +20 | Seize territory, +reputation |
| Loss | 25% gang members | 25–55 | +12 | 30% arrest chance |

**⚠️ VULNERABILITY:** `power`, `gangMembers`, and `gangLoyalty` are client-reported. Server caps them but cannot verify against actual player state. A modified client could report max values for all three.

---

### A3. Assassination

| Property | Value |
|----------|-------|
| **Server handler** | `server.js` → `handleAssassinationAttempt` (~line 2290) |
| **Client sender** | `multiplayer.js` → `attemptAssassination` (~line 3400) |
| **Energy cost** | 30 (validated server-side) |
| **Cooldown** | 10 minutes (server-enforced) |
| **Requirements** | 1+ gun, 3+ bullets, 1+ vehicle |

**Success Chance Formula (server-authoritative):**
```
base = 8%

+ bullets * 0.5        (max +15%)
+ bestGunPower * 0.05  (max +6%)
+ (gunCount-1) * 1     (max +5%)
+ vehicleCount * 2     (max +6%)
+ gangMembers * 0.5    (max +10%)
+ levelDiff * 0.5      (max +5%)    // attacker level - target level
+ power * 0.002        (max +5%)
- targetLevel * 0.3    (max -10%)

CLAMPED to [5%, 20%]
```

**Maximum theoretical chance: 20%** — intentionally very hard.

**Client-reported values (all capped server-side but unverified):**
- `bullets` (cap: 200)
- `gunCount` (cap: 20)
- `bestGunPower` (cap: 500)
- `vehicleCount` (cap: 10)
- `gangMembers` (cap: 100)
- `power` (cap: 10000)

**Outcomes:**
| Result | Money Stolen | Rep Change | Wanted | Health Dmg | Territories |
|--------|-------------|------------|--------|-----------|-------------|
| Success | 8–20% of target's cash | +10–25 | +25 | 30–60 | Seize ALL target territories |
| Failure | 0 | −3 to −5 | +15 | 20–50 | None |
| Failure (arrested) | 0 | −3 to −5 | +15 | 20–50 | 40% chance, jail 20–35s |

**⚠️ VULNERABILITY:** Same client-trust issue as territory wars — resource counts are self-reported.

---

### A4. Heist Execution

| Property | Value |
|----------|-------|
| **Server handler** | `server.js` → `executeHeist` (~line 2150) |
| **Trigger** | Timer-based or `forceStartHeist` after crew assembled |

**Formula (server-authoritative):**
```
successChance = (successBase / 100) + (crewSize - 1) * 0.05
// Capped at 0.95 (95%)
```

`successBase` comes from `HEIST_TARGETS` array defined in `multiplayer.js` (~line 12):
| Target | Base Success | Min Crew | Payout |
|--------|-------------|----------|--------|
| Corner Store | 80% | 1 | $500–$2,000 |
| Gas Station | 65% | 1 | $1,000–$5,000 |
| Jewelry Store | 50% | 2 | $5,000–$15,000 |
| Art Gallery | 40% | 2 | $10,000–$30,000 |
| Bank Vault | 25% | 3 | $25,000–$75,000 |
| Casino Heist | 15% | 4 | $50,000–$150,000 |
| Federal Reserve | 5% | 5 | $100,000–$500,000 |

**Rewards split evenly among crew.** +20 reputation each on success.

**✅ SECURE:** Heist logic is fully server-authoritative. No client-reported stats affect the outcome.

---

### A5. Jailbreak

| Property | Value |
|----------|-------|
| **Server handler** | `server.js` → `handleJailbreakAttempt` (~line 1575) |
| **Client sender** | `multiplayer.js` → `attemptPlayerJailbreak` (~line 1643) |
| **Energy cost** | 15 (deducted client-side) |

**Formula (server-authoritative):**
```
baseSuccessChance = 25
successChance = Math.min(75, baseSuccessChance + stealth * 3)
// stealth is capped at server (implicit in formula)
```

**Outcomes:**
- Success: Player freed, +2 reputation
- Failure: 30% arrest chance (extends jail), +3 wanted

**⚠️ MINOR ISSUE:** `stealth` value comes from the player state which can be influenced by `handlePlayerUpdate`.

---

## B. Notification System

### Notification Types Used

| Type | Implementation | Where |
|------|---------------|-------|
| **Toast/Brief** | `showBriefNotification(msg, duration)` | Assassination victim/survived alerts |
| **System Message** | `showSystemMessage(msg, color)` | Energy/connection errors, combat engagement |
| **Modal Popup** | DOM-created `<div>` overlays | PvP challenge confirm, combat results, assassination results, heist results, event participation |
| **Action Log** | `logAction(msg)` | All combat events, world events |
| **World Activity** | `addWorldEvent(msg)` | Territory seizures, assassinations, heists |
| **Global Chat** | Server-broadcast chat messages | Join/leave, territory claims, combat results |

### Notification Flow by Combat Type

**Player Challenge:**
1. Challenger sees toast: "Engaging {name} in combat..."
2. Both players receive `combat_result` → `showPvpResultModal()` renders a full modal with outcome, rep change
3. Global chat gets "[name] defeated [name]" or similar

**Territory War:**
1. Attacker gets `territory_war_result` → modal with outcome
2. Defender gets `territory_lost` / `territory_defended` (if online)
3. Territory ownership change broadcast to all via `world_update`

**Assassination:**
1. Attacker: `assassination_result` → full modal (success case shows stolen money, seized territories; fail shows health loss, arrest)
2. Target success: `assassination_victim` → toast + log ("You were assassinated by X!")
3. Target survived: `assassination_survived` → toast + log ("Survived a hit from X!")

### ⚠️ Missing Notifications
- **No sound effects** for any PvP event
- **No push notifications** — if tab is in background, events are missed
- **No persistent notification queue** — if multiple events fire, some may overlap/be hidden
- **Offline players** never see what happened to them (no inbox/mail system)

---

## C. Leaderboards

### Implementation

| Property | Value |
|----------|-------|
| **Generator** | `server.js` → `generateLeaderboard` (~line 2535) |
| **Sort metric** | Reputation (descending) |
| **Size** | Top 10 |
| **Persistence** | Saved in `worldState.leaderboard` → `world-state.json` via `worldPersistence.js` |
| **Broadcast** | Sent to all clients on changes, also included in `world_update` |

**Formula:**
```js
const sorted = Array.from(gameState.players.values())
    .filter(p => p.name && p.reputation > 0)
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 10);
```

**Client display:** `multiplayer.js` → `loadGlobalLeaderboard` (~line 2700) renders a styled table.

### ⚠️ Leaderboard Issues
1. **Single metric only** — reputation is the sole ranking factor; no secondary sort (level, money, territories, kills)
2. **No historical tracking** — no weekly/monthly resets, no "all-time" vs "current season"
3. **Reputation is inflatable** via client-trusted systems (see Section D)

---

## D. Anti-Cheat & Server Validation

### Server-Side Protections (Existing)

| Protection | Location | Details |
|-----------|----------|---------|
| Rate limiting | `server.js` ~line 270 | 5 messages per 5 seconds per connection |
| Heartbeat | `server.js` ~line 260 | 30s ping/pong, terminates dead connections |
| Name sanitization | `server.js` ~line 445 | Strip HTML, alphanumeric + spaces only, 20 char max |
| Profanity filter | `server.js` ~line 290 | Checks chat messages against word list |
| Chat limits | `server.js` ~line 735 | 200 char max, HTML stripped |
| Server-assigned IDs | `server.js` ~line 440 | `playerId` generated server-side, session-bound |
| Origin checking | `server.js` ~line 240 | WebSocket origin verification |
| Path traversal prevention | `server.js` ~line 35 | Static file serving checks `..` |

### Server-Authoritative Systems (✅ Good)

| System | Notes |
|--------|-------|
| Territory War resolution | Server computes attack/defense scores |
| Assassination resolution | Server computes hit chance |
| Heist execution | Fully server-side |
| Jailbreak resolution | Server computes success chance |
| Gift sending | Server validates sender has enough money, caps at $10,000 |
| Job system (via `job_intent`) | Server computes rewards, validates energy/jail |
| Territory tax | Server caps at `TAX_RATE` (10%) of gross income |

### Client-Trusted Systems (⚠️ VULNERABLE)

#### CRITICAL: `handlePlayerUpdate` Whitelist (`server.js` ~line 1500)

```js
// Server allows these fields from client:
const allowedFields = ['inJail', 'jailTime', 'health', 'energy', 'wantedLevel'];
```

**Exploitable fields:**
- **`health`** — Player can set health to max (100) at any time
- **`energy`** — Player can set energy to max, enabling unlimited actions
- **`inJail`** — Player could set `inJail = false` to escape jail
- **`jailTime`** — Player could set `jailTime = 0` to escape instantly
- **`wantedLevel`** — Player could set `wantedLevel = 0` to clear heat

#### CRITICAL: District Jobs (`multiplayer.js` ~line 2830, `doDistrictJob`)

The entire district job system runs CLIENT-SIDE:
```js
// Client computes rewards and applies them locally:
player.money += reward;
player.experience += xpGain;
player.reputation += repGain;
```
No `job_intent` message is sent to the server. Money, XP, and reputation are fabricated entirely on the client. A modified client could grant unlimited money/XP/rep.

#### CRITICAL: Event Participation (`multiplayer.js` ~line 3820, `participateInEvent`)

The entire city event participation system runs CLIENT-SIDE:
```js
// Client picks random scenario, rolls success, and applies rewards:
player.money += moneyEarned;      // up to $6,000 per event
player.reputation += repGain;     // up to +8 per event
gainExperience(scenario.xp);      // up to 45 XP per event
```
No server message sent. Fully exploitable.

#### CRITICAL: War Spectator Betting (`multiplayer.js` ~line 3700, `spectateWar`)

The turf war betting system is entirely client-side:
```js
player.money -= betAmount;  // deducted locally
// ... simulated battle runs on client ...
player.money += winnings;   // 2x payout added locally
```
The entire battle simulation is cosmetic. A modified client could always win bets.

#### HIGH: Combat Stat Self-Reporting

For Territory War and Assassination, the client reports its own combat stats:
- `power`, `gangMembers`, `gangLoyalty` (territory war)
- `bullets`, `gunCount`, `bestGunPower`, `vehicleCount`, `gangMembers`, `power` (assassination)

Server applies caps but **cannot verify** these against actual player inventory/gang state. The server has no independent record of what items a player owns.

#### MEDIUM: Energy Deducted Client-Side Before Server Validation

Multiple actions deduct energy on the client before sending to the server:
- `challengePlayer`: 5 energy deducted at `multiplayer.js` ~line 3637
- `attemptPlayerJailbreak`: 15 energy deducted at `multiplayer.js` ~line 1660
- `attemptAssassination`: energy not deducted client-side (correct — server handles it)

If the server rejects the action, the energy is not always refunded (exception: `executePvpChallenge` does refund on connection failure).

---

## E. Recommended Fixes (Prioritized)

### 🔴 CRITICAL Priority

#### E1. Remove `health`, `energy`, `inJail`, `jailTime`, `wantedLevel` from `handlePlayerUpdate` whitelist

**File:** `server.js` ~line 1500  
**Problem:** Players can set any of these to any value via WebSocket.  
**Fix:** Remove ALL gameplay-affecting fields from the client-writable whitelist. These should only be modified by server-authoritative actions. If the server needs to track these, compute them server-side.

```js
// BEFORE (vulnerable):
const allowedFields = ['inJail', 'jailTime', 'health', 'energy', 'wantedLevel'];

// AFTER (safe):
const allowedFields = []; // No gameplay fields writable by client
// Only use player_update for cosmetic/display data if needed
```

#### E2. Move District Jobs to Server

**File:** `multiplayer.js` ~line 2830 (`doDistrictJob`)  
**Problem:** Entire reward computation is client-side.  
**Fix:** Send a `district_job_intent` message to the server (similar to existing `job_intent`). Server computes rewards, validates energy/cooldowns, applies territory tax, and returns the result.

#### E3. Move Event Participation to Server

**File:** `multiplayer.js` ~line 3820 (`participateInEvent`)  
**Problem:** Entire event system is client-side with random rewards.  
**Fix:** Send `event_participate` intent to server. Server validates energy, picks scenario, rolls outcome, applies rewards, returns result to client for display.

#### E4. Move War Spectator Betting to Server

**File:** `multiplayer.js` ~line 3700 (`spectateWar`)  
**Problem:** Betting outcome is determined client-side.  
**Fix:** Either remove betting or make it server-authoritative. Server tracks bets, resolves outcomes based on actual territory war results (not a cosmetic client animation).

#### E5. Server-Side Inventory Verification for Combat

**Files:** `server.js` → `handleTerritoryWar` (~line 1060), `handleAssassinationAttempt` (~line 2290)  
**Problem:** Combat stats (guns, bullets, vehicles, gang size, power) are self-reported.  
**Fix:** The server needs to maintain an authoritative record of each player's inventory and gang. On combat actions, look up the player's actual resources server-side instead of trusting client-reported values.

This is the largest architectural change and requires:
1. Server-side player inventory storage (items, weapons, vehicles)
2. Server-side gang roster tracking
3. Sync inventory on connect, update on item acquire/use
4. All combat handlers read from server state, not message payload

---

### 🟡 HIGH Priority

#### E6. Overhaul Player Challenge Formula

**File:** `server.js` → `handlePlayerChallenge` (~line 1230)  
**Problem:** Formula uses only `level + reputation/10`, ignoring all other stats. Players invest in skills, gear, and gangs that have zero effect on 1v1 combat.  
**Fix:** Incorporate the stats players actually see and invest in:

```js
// PROPOSED formula (aligns with displayed attack/defense power):
function computeCombatPower(playerState) {
    const p = playerState;
    const attack  = (p.level*10) + (p.stealth*8) + (p.violence*12) + (p.intelligence*6) + (p.power*2);
    const defense = (p.level*10) + (p.reputation*0.5) + (p.power*2);
    return (attack + defense) / 2;
}

challengerPower = computeCombatPower(challenger) + Math.random()*50;
targetPower     = computeCombatPower(target) + Math.random()*50;
```

This requires the server to have access to skill values (see E5).

#### E7. Align Displayed Stats with Actual Formulas

**File:** `multiplayer.js` → `calculateAttackPower` (~line 1963), `calculateDefensePower` (~line 1972)  
**Problem:** These display values that are never used by any server formula. Players are misled about what matters for combat.  
**Fix:** Either (a) make the server use these formulas (E6), or (b) change the display to show what the server actually uses (level + rep/10). Option (a) is strongly preferred.

#### E8. Add Server-Side Energy Tracking

**Files:** `server.js` (new), `multiplayer.js` (multiple locations)  
**Problem:** Energy is deducted client-side, enabling infinite actions.  
**Fix:** Track energy server-side in `gameState.playerStates`. Validate energy on every action. Return current energy in responses for client sync.

---

### 🟢 MEDIUM Priority

#### E9. Add Offline Event Inbox

**Problem:** Offline players miss assassinations, territory losses, and war results.  
**Fix:** Store events per player in `gameState`. On reconnect, deliver queued events. Simple array of `{ type, message, timestamp }` per playerId.

#### E10. Add Notification Sound Hooks  

**Problem:** No audio feedback for PvP events.  
**Fix:** Add `playSound(type)` calls in `handleServerMessage` for combat results, assassination alerts, territory notifications. Even simple Web Audio API beeps would significantly improve awareness.

#### E11. Expand Leaderboard  

**Problem:** Single-metric (reputation), no seasons, no categories.  
**Fix:**
- Add secondary sort (level, then money) for ties
- Add category leaderboards: "Most Territories," "Richest," "Most Kills"
- Add weekly/monthly reset option alongside all-time

#### E12. Add Refund Logic for Failed Server Actions

**Problem:** Energy is deducted client-side before the server processes the action. If the server rejects (e.g., target not found, cooldown active), energy is sometimes not refunded.  
**Fix:** Either (a) don't deduct energy client-side — let the server deduct and report back, or (b) always refund on rejection. Option (a) is cleaner (aligns with E8).

#### E13. Prevent Jail Escape via `syncPlayerState`

**File:** `multiplayer.js` → `syncPlayerState` (~line 1980)  
**Problem:** `syncPlayerState` sends `inJail` and `jailTime` from client to server. A player could call `player.inJail = false; syncPlayerState()` from the console.  
**Fix:** Never accept jail state from the client. Server is already the authority for jailbreak outcomes — extend this to all jail state management.

---

## Summary Matrix

| System | Server-Auth? | Client Exploitable? | Formula Quality | Priority |
|--------|:----------:|:-------------------:|:--------------:|:--------:|
| Player Challenge | ✅ | Low (level/rep only) | ⚠️ Oversimplified | HIGH |
| Territory War | ✅ | ⚠️ Stats self-reported | ✅ Good | CRITICAL (stats) |
| Assassination | ✅ | ⚠️ Stats self-reported | ✅ Good | CRITICAL (stats) |
| Heist | ✅ | ❌ None | ✅ Good | — |
| Jailbreak | ✅ | Low | ✅ OK | MEDIUM |
| District Jobs | ❌ | 🔴 Fully exploitable | N/A (client-side) | CRITICAL |
| Event Participation | ❌ | 🔴 Fully exploitable | N/A (client-side) | CRITICAL |
| War Betting | ❌ | 🔴 Fully exploitable | N/A (client-side) | CRITICAL |
| Player Update | Partial | 🔴 health/energy/jail | N/A | CRITICAL |
| Leaderboard | ✅ | Indirect (via rep inflation) | ⚠️ Single metric | MEDIUM |
| Notifications | N/A | N/A | ⚠️ No offline/sound | MEDIUM |
