// Simple JSON-based world persistence for From Dusk to Don
// What persists:
// - cityDistricts control (e.g., who controls which district)
// - cityEvents (high-level world events visible to all)
// - leaderboard snapshot (top players by reputation)
// File location:
// - Stored at project root as world-state.json
// Extensibility:
// - Future long-lived world data (factions, economy modifiers, crime heat) should be added
//   to the object returned by loadWorldState() and passed to saveWorldState(). Keep it small.

const fs = require('fs');
const path = require('path');

const WORLD_STATE_PATH = path.join(process.cwd(), 'world-state.json');

const DEFAULT_STATE = {
  cityDistricts: {
    downtown: { controlledBy: null, crimeLevel: 50 },
    docks: { controlledBy: null, crimeLevel: 75 },
    suburbs: { controlledBy: null, crimeLevel: 25 },
    industrial: { controlledBy: null, crimeLevel: 60 },
    redlight: { controlledBy: null, crimeLevel: 90 }
  },
  cityEvents: [
    { type: 'police_raid', district: 'industrial', description: 'Heavy police presence, high risk/reward jobs available', timeLeft: '15 min', createdAt: Date.now() },
    { type: 'market_crash', district: 'downtown', description: 'Economic instability, weapon prices fluctuating', timeLeft: '1 hour', createdAt: Date.now() },
    { type: 'gang_meeting', district: 'docks', description: 'Underground meeting, recruitment opportunities', timeLeft: '30 min', createdAt: Date.now() }
  ],
  leaderboard: [] // array of { name, reputation, territory }
};

function loadWorldState() {
  try {
    if (!fs.existsSync(WORLD_STATE_PATH)) {
      return { ...DEFAULT_STATE };
    }
    const raw = fs.readFileSync(WORLD_STATE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // Merge with defaults to tolerate missing fields
    return {
      cityDistricts: parsed.cityDistricts || { ...DEFAULT_STATE.cityDistricts },
      cityEvents: Array.isArray(parsed.cityEvents) ? parsed.cityEvents : [...DEFAULT_STATE.cityEvents],
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : []
    };
  } catch (err) {
    console.error('⚠️ Failed to load world-state.json, using defaults:', err.message);
    return { ...DEFAULT_STATE };
  }
}

function saveWorldState(state) {
  try {
    const data = JSON.stringify(state, null, 2);
    fs.writeFile(WORLD_STATE_PATH, data, 'utf-8', (err) => {
      if (err) {
        console.error('⚠️ Error saving world-state.json:', err.message);
      }
    });
  } catch (err) {
    console.error('⚠️ Error serializing world state:', err.message);
  }
}

module.exports = {
  loadWorldState,
  saveWorldState,
  WORLD_STATE_PATH
};
