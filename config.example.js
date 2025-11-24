// ==================== SERVER CONFIGURATION ====================
// Environment-based configuration for Kingpin Dynasty multiplayer server
// 
// USAGE:
// 1. Copy this file to config.js
// 2. Update values for your production environment
// 3. Import in server.js: const config = require('./config');
//
// For production, you can also use environment variables:
// - PORT: Server port (default 3000)
// - NODE_ENV: 'development' or 'production'
// - MAX_PLAYERS: Maximum concurrent connections
// - RATE_LIMIT_WINDOW: Rate limiting time window in ms
// - MAX_MESSAGES_PER_WINDOW: Max messages per rate limit window

const config = {
  // Server settings
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  
  // Production domain (update this to match your domain)
  productionDomain: 'www.embracedcreation.com',
  
  // Game limits
  maxPlayers: parseInt(process.env.MAX_PLAYERS) || 100,
  maxChatHistory: 50,
  
  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 5000, // 5 seconds
  maxMessagesPerWindow: parseInt(process.env.MAX_MESSAGES_PER_WINDOW) || 5,
  
  // Heartbeat & connection
  heartbeatInterval: 30000, // 30 seconds
  reconnectInterval: 5000,  // 5 seconds
  
  // World state persistence
  saveThrottleMs: 5000, // Don't save more than once per 5 seconds
  worldStatePath: './world-state.json',
  
  // Security
  enableProfanityFilter: true,
  enableRateLimiting: true,
  enableInputSanitization: true,
  
  // CORS settings
  corsOrigin: process.env.CORS_ORIGIN || '*', // In production, set to 'https://www.embracedcreation.com'
  
  // Logging
  enableVerboseLogging: process.env.NODE_ENV === 'development',
  
  // Feature flags
  features: {
    globalChat: true,
    territoryConquest: true,
    pvpCombat: true,
    jailbreak: true,
    tradeMarket: true,
    heists: true
  }
};

// Production environment overrides
if (config.environment === 'production') {
  console.log('🚀 Running in PRODUCTION mode');
  config.enableVerboseLogging = false;
  config.corsOrigin = `https://${config.productionDomain}`;
} else {
  console.log('🔧 Running in DEVELOPMENT mode');
}

module.exports = config;
