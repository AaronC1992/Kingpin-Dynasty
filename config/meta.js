/**
 * meta.js - Game Metadata Configuration
 * 
 * Central source of truth for game name, version, and other meta information.
 * This ensures consistency across all UI elements, logs, and documentation.
 * 
 * Version follows Semantic Versioning (semver): MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes to save format or gameplay
 * - MINOR: New features, content additions
 * - PATCH: Bug fixes, balance tweaks
 */

(function() {
  const GAME_NAME = "From Dusk To Don";
  const GAME_VERSION = "0.2.0";
  const GAME_SUBTITLE = "Build Your Criminal Empire";
  
  // Expose globally for classic script usage
  window.GameMeta = {
    GAME_NAME,
    GAME_VERSION,
    GAME_SUBTITLE,
    // Helper to get full title string
    getFullTitle: () => `${GAME_NAME} v${GAME_VERSION}`,
    // Helper for display purposes
    getDisplayTitle: () => `${GAME_NAME} - ${GAME_SUBTITLE}`
  };
})();
