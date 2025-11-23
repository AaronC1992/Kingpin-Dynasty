# 🎮 QUICK START GUIDE - Expanded Systems

## TL;DR - What You Need to Know

I just added **7 MASSIVE new features** to your game. Here's how to use them:

---

## 🚀 IMMEDIATE ACTIONS

### 1. Open the Game
Just refresh your browser. Everything loads automatically.

### 2. Look for These NEW Buttons in Command Center:
- **👥 Crew Details** - See your gang's roles, stats, and perks
- **🗺️ Territory Map** - Defend and conquer territories
- **⭐ Relationships** - Track respect with all factions  
- **🎯 Crime Board** - Monitor rival kingpins
- **🏛️ Legacy Perks** - Buy permanent upgrades (after retirement)
- **💎 Don's Vault** - View your collectibles

---

## 💡 KEY NEW MECHANICS

### Gang Members Now Have:
- **Roles:** Bruiser, Fixer, Hacker, Enforcer, Wheelman, Scout, Accountant
- **Stats:** Violence, Stealth, Intelligence, Loyalty
- **Perks:** Unique bonuses per role
- **Traits:** Random personality quirks

👉 **Recruit new members to see this in action!**

### Territories Are Now:
- **Defendable:** Assign gang members to protect them
- **Attackable:** AI rivals will try to take your turf
- **Upgradable:** Fortify for better defense

👉 **Go to Territory Map to claim and defend!**

### Events Are Now:
- **Interactive:** Choose from 2-4 options
- **Consequential:** Different outcomes based on choices
- **Risky:** Success/failure chances shown

👉 **Wait ~5 minutes and an event will trigger automatically!**

### Rivals Are Now:
- **Active:** 5 AI kingpins grow their empires
- **Aggressive:** They'll attack your territories
- **Trackable:** See their power, wealth, and gang size

👉 **Check Crime Board to see rival stats!**

### Legacy System Is Now:
- **Permanent:** Unlock perks that carry across runs
- **Earned:** Get Legacy Points when you retire
- **Powerful:** +XP gain, starting money, extra gang slots, etc.

👉 **Retire to earn points, then buy perks for next run!**

### Collectibles Are Now:
- **Discoverable:** Find rare items through events/missions
- **Categorized:** Vehicles, Weapons, Art, Luxury
- **Tracked:** See your collection progress

👉 **Check Don's Vault to see what you've found!**

### Relationships Are Now:
- **Scored:** -100 to +100 respect with each faction
- **Dynamic:** Actions change your standing
- **Impactful:** High respect = discounts & missions, low = attacks

👉 **View Relationships screen to see who likes/hates you!**

---

## 🎯 FIRST 5 MINUTES CHECKLIST

### ✅ Step 1: Recruit a Gang Member
1. Go to Command Center
2. Click "The Family" (existing button)
3. Recruit someone new
4. Then click "👥 Crew Details" to see their role, stats, and perk!

### ✅ Step 2: Claim a Territory
1. Click "🗺️ Territory Map"
2. Claim "Suburban Rackets" ($2,000 - cheapest)
3. Click "👥 Manage Defenders"
4. Assign your new gang member to defend it

### ✅ Step 3: Wait for an Event
1. Play normally for ~5 minutes
2. An interactive event will pop up
3. Read the choices carefully
4. Pick one and see what happens!

### ✅ Step 4: Check the Crime Board
1. Click "🎯 Crime Board"
2. See all 5 rival kingpins
3. Note their power levels
4. They'll attack you eventually!

### ✅ Step 5: Explore Legacy Perks
1. Click "🏛️ Legacy Perks"
2. See what perks are available
3. (You won't have points yet - earn them on retirement)

---

## 🔧 SETTINGS (Optional)

Want to turn something off? Edit `expanded-systems.js`:

```javascript
export const EXPANDED_SYSTEMS_CONFIG = {
    gangRolesEnabled: true,           // Turn off role system
    territoryWarsEnabled: true,       // Turn off territory attacks
    interactiveEventsEnabled: true,   // Turn off choice events
    rivalKingpinsEnabled: true,       // Turn off AI rivals
    legacyPerksEnabled: true,         // Turn off perk shop
    collectiblesEnabled: true,        // Turn off vault
    respectSystemEnabled: true,       // Turn off respect system
};
```

Just change `true` to `false` for any system you want disabled.

---

## 🎮 PRO TIPS

1. **Different roles are better at different jobs**
   - Hackers excel at intelligence jobs
   - Bruisers excel at violence
   - Fixers reduce heat
   - Scouts give early attack warnings

2. **Defend your most valuable territories**
   - Casino District = $6,000/day (but needs strong defense)
   - Suburbs = $2,000/day (easiest to defend)

3. **Make smart event choices**
   - Check requirements before choosing
   - Success % is shown for risky choices
   - Some choices are always safe but give less reward

4. **Watch rival aggressiveness**
   - Kozlov (80%) attacks most often
   - Chen (40%) is more peaceful
   - Marcus Kane (90%) is ultra-aggressive

5. **Save up for good legacy perks**
   - Strategic Mind (+10% job success) is powerful
   - Old Money ($10K start) helps early game
   - Laundering Genius speeds up money cleaning

6. **Loyalty matters!**
   - Low loyalty gang members might betray you
   - Wins increase loyalty
   - Losses decrease loyalty

---

## 🐛 TROUBLESHOOTING

### "Nothing appears to be different"
- Hard refresh: `Ctrl + F5` (or `Cmd + Shift + R` on Mac)
- Clear browser cache
- Check browser console (F12) for errors

### "Menu buttons don't work"
- Make sure you hard refreshed
- Check that all 3 new files are loaded:
  - `expanded-systems.js`
  - `expanded-ui.js`
  - `expanded-styles.css`

### "Save game doesn't work"
- New data structures are automatically included in saves
- Old saves load fine and get new systems initialized

### "Want to test without waiting"
Open console (F12) and run:
```javascript
// Trigger event immediately
ExpandedUI.checkAndTriggerInteractiveEvent();

// Give yourself Legacy Points
player.legacy.availableLegacyPoints = 500;

// Add a collectible
ExpandedSystems.addCollectible(player, 'rare_cars', 'classic_cadillac');
```

---

## 📱 MOBILE FRIENDLY?

**Yes!** All new screens are responsive and work on mobile devices.

---

## 🎉 THAT'S IT!

You're ready to experience a massively expanded "From Dusk to Don"!

**Have fun building your criminal empire with:**
- Specialized gang members
- Defendable territories  
- Choice-driven events
- Active rival bosses
- Permanent progression
- Rare collectibles
- Dynamic relationships

**Enjoy! 🎩💰**
