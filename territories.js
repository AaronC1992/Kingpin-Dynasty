// territories.js — Unified Territory System (Phases 1–3)
// Single source of truth for all territory data.
// Used by both client (game.js, multiplayer.js) and server (server.js).
//
// Phase 1: Spawn selection, relocation, HUD district display.
// Phase 2: Territory ownership, 10% job-income tax, claim & conquest.
// Phase 3: Businesses tied to districts — benefit multipliers, max-slot
//          enforcement, business-income tax for territory owners.

// ────────────────────────────────────────────────────────────────────────
// DISTRICT DEFINITIONS — the 8 neighbourhoods of the city
// ────────────────────────────────────────────────────────────────────────

export const DISTRICTS = [
  {
    id: 'residential_low',
    name: 'Low-Income Residential',
    shortName: 'The Slums',
    icon: '🏚️',
    description: 'Run-down apartments and project housing. Cheap to live in, easy recruiting — but every dollar is hard-fought.',
    category: 'residential',
    // Gameplay modifiers for residents
    baseIncome: 150,
    maxBusinesses: 3,
    riskLevel: 'low',
    policePresence: 20,
    moveCost: 500,        // cost to relocate here
    benefits: {
      drugSales: 1.2,
      recruitment: 1.3,
      heatReduction: 0.1
    }
  },
  {
    id: 'residential_middle',
    name: 'Middle-Class Residential',
    shortName: 'Suburbia',
    icon: '🏡',
    description: 'Suburban streets with picket fences — and plenty of protection money potential beneath the surface.',
    category: 'residential',
    baseIncome: 300,
    maxBusinesses: 5,
    riskLevel: 'medium',
    policePresence: 35,
    moveCost: 1500,
    benefits: {
      protection: 1.4,
      legitimacy: 1.2,
      recruitment: 1.1
    }
  },
  {
    id: 'residential_upscale',
    name: 'Upscale Residential',
    shortName: 'The Hills',
    icon: '🏛️',
    description: 'Gated mansions and luxury condos. High-value targets behind heavy security.',
    category: 'residential',
    baseIncome: 600,
    maxBusinesses: 4,
    riskLevel: 'high',
    policePresence: 60,
    moveCost: 5000,
    benefits: {
      protection: 1.8,
      heistRewards: 1.5,
      corruption: 1.3
    }
  },
  {
    id: 'commercial_downtown',
    name: 'Downtown Commercial',
    shortName: 'Downtown',
    icon: '🏙️',
    description: 'The beating heart of the city — skyscrapers, banks, and corporate offices ripe for influence.',
    category: 'commercial',
    baseIncome: 800,
    maxBusinesses: 8,
    riskLevel: 'medium',
    policePresence: 45,
    moveCost: 4000,
    benefits: {
      business: 1.5,
      laundering: 1.4,
      networking: 1.6
    }
  },
  {
    id: 'commercial_shopping',
    name: 'Shopping District',
    shortName: 'The Strip',
    icon: '🏬',
    description: 'Retail malls and storefronts. Easy theft, good smuggling routes, plenty of foot traffic.',
    category: 'commercial',
    baseIncome: 500,
    maxBusinesses: 6,
    riskLevel: 'low',
    policePresence: 30,
    moveCost: 2000,
    benefits: {
      theft: 1.3,
      smuggling: 1.2,
      business: 1.3
    }
  },
  {
    id: 'industrial_warehouse',
    name: 'Warehouse District',
    shortName: 'The Yards',
    icon: '🏭',
    description: 'Sprawling warehouses and empty lots — perfect for smuggling ops and stashing product.',
    category: 'industrial',
    baseIncome: 400,
    maxBusinesses: 4,
    riskLevel: 'medium',
    policePresence: 25,
    moveCost: 2500,
    benefits: {
      smuggling: 1.8,
      weapons: 1.5,
      storage: 1.4
    }
  },
  {
    id: 'industrial_port',
    name: 'Port District',
    shortName: 'The Docks',
    icon: '⚓',
    description: 'Shipping containers, docks, and international connections. Huge money, huge risk.',
    category: 'industrial',
    baseIncome: 1000,
    maxBusinesses: 5,
    riskLevel: 'high',
    policePresence: 50,
    moveCost: 8000,
    benefits: {
      smuggling: 2.0,
      international: 1.8,
      weapons: 1.6,
      corruption: 1.4
    }
  },
  {
    id: 'entertainment_nightlife',
    name: 'Nightlife District',
    shortName: 'Neon Row',
    icon: '🌃',
    description: 'Bars, clubs, and neon lights. Vice thrives here — and so does opportunity.',
    category: 'entertainment',
    baseIncome: 700,
    maxBusinesses: 6,
    riskLevel: 'medium',
    policePresence: 40,
    moveCost: 3500,
    benefits: {
      vice: 1.6,
      recruitment: 1.4,
      information: 1.5,
      laundering: 1.3
    }
  }
];

// ────────────────────────────────────────────────────────────────────────
// TERRITORY CONSTANTS
// ────────────────────────────────────────────────────────────────────────

/** Flat tax rate territory owners collect from all residents' income */
export const TAX_RATE = 0.10;

/** Cooldown between territory moves (ms) — 1 hour */
export const MOVE_COOLDOWN_MS = 60 * 60 * 1000;

/** Minimum level required to claim ownership of a territory */
export const MIN_CLAIM_LEVEL = 10;

/** Cost to claim each district (indexed same order as DISTRICTS) */
export const CLAIM_COSTS = [10000, 20000, 50000, 40000, 25000, 30000, 80000, 35000];

/** Minimum gang members required to wage territory war */
export const MIN_WAR_GANG_SIZE = 5;

/** Energy cost for waging territory war */
export const WAR_ENERGY_COST = 40;

/** Tax rate territory owners collect on business income earned in their district */
export const BUSINESS_TAX_RATE = 0.10;

// ────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────

/**
 * Get the business income multiplier for a district.
 * Returns the `benefits.business` value, defaulting to 1.0.
 */
export function getBusinessMultiplier(districtId) {
  const d = DISTRICTS.find(dd => dd.id === districtId);
  return (d && d.benefits && d.benefits.business) || 1.0;
}

/**
 * Get the laundering capacity multiplier for a district.
 * Returns the `benefits.laundering` value, defaulting to 1.0.
 */
export function getLaunderingMultiplier(districtId) {
  const d = DISTRICTS.find(dd => dd.id === districtId);
  return (d && d.benefits && d.benefits.laundering) || 1.0;
}

/** Look up a district definition by id */
export function getDistrict(districtId) {
  return DISTRICTS.find(d => d.id === districtId) || null;
}

/** Get all district IDs */
export function getDistrictIds() {
  return DISTRICTS.map(d => d.id);
}

/**
 * Build the initial server-side territory state.
 * Called once when the server starts with no persisted world data.
 * Each district tracks its owner and the set of player IDs living there.
 */
export function buildInitialTerritoryState() {
  const state = {};
  for (const d of DISTRICTS) {
    state[d.id] = {
      owner: null,          // username of owning player (null = unclaimed)
      residents: [],        // array of usernames living here
      defenseRating: 100,   // base defense rating
      taxCollected: 0       // running total of tax collected by owner
    };
  }
  return state;
}
