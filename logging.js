/**
 * logging.js - Client-side Logging System
 * 
 * Provides structured logging for debugging and analytics hooks.
 * Toggle logging on/off via GameLogging.setEnabled() or by setting window.DEBUG_MODE
 * 
 * Usage:
 *   GameLogging.logEvent('JOB_COMPLETE', { job: 'bankHeist', payout: 50000 });
 *   GameLogging.logEvent('JAIL_ENTER', { reason: 'caught', duration: 120 });
 *   GameLogging.logEvent('TERRITORY_CAPTURE', { district: 'downtown' });
 */

// Configuration
let enabled = false; // Set to true to enable logging by default
const maxLogSize = 100; // Keep last N events in memory

// In-memory log storage
const eventLog = [];

/**
 * Log a game event with type and details
 * @param {string} type - Event type (e.g., 'JOB_COMPLETE', 'JAIL_ENTER')
 * @param {object} details - Event details/payload
 */
function logEvent(type, details = {}) {
  if (!enabled && !window.DEBUG_MODE) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, details };
  
  // Add to memory log
  eventLog.push(logEntry);
  if (eventLog.length > maxLogSize) {
    eventLog.shift(); // Remove oldest entry
  }
  
  // Console output (can be styled differently in production)
  console.log(`[${timestamp}] ${type}`, details);
  
  // Hook for future analytics integration
  if (window.onGameEvent) {
    try {
      window.onGameEvent(logEntry);
    } catch (e) {
      console.warn('Analytics hook error:', e);
    }
  }
}

/**
 * Log an error event
 * @param {string} context - Where the error occurred
 * @param {Error|string} error - The error object or message
 */
function logError(context, error) {
  const errorDetails = {
    context,
    message: error?.message || String(error),
    stack: error?.stack || null
  };
  
  logEvent('ERROR', errorDetails);
  console.error(`[ERROR] ${context}:`, error);
}

/**
 * Get all logged events (for debugging)
 */
function getEventLog() {
  return [...eventLog];
}

/**
 * Clear the event log
 */
function clearLog() {
  eventLog.length = 0;
  console.log('[Logging] Event log cleared');
}

/**
 * Enable or disable logging
 */
function setEnabled(value) {
  enabled = !!value;
  console.log(`[Logging] ${enabled ? 'Enabled' : 'Disabled'}`);
}

/**
 * Show debug panel with recent logs
 */
function showDebugPanel() {
  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 400px;
    max-height: 500px;
    overflow-y: auto;
    background: rgba(0,0,0,0.95);
    color: #0f0;
    font-family: monospace;
    font-size: 11px;
    padding: 10px;
    border: 2px solid #0f0;
    z-index: 99999;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #0f0; padding-bottom: 5px;';
  header.innerHTML = `
    <span>DEBUG LOG (${eventLog.length})</span>
    <button onclick="GameLogging.closeDebugPanel()" style="background: #f00; color: #fff; border: none; cursor: pointer; padding: 2px 8px;">X</button>
  `;
  panel.appendChild(header);
  
  const logList = document.createElement('div');
  eventLog.slice().reverse().forEach(entry => {
    const logItem = document.createElement('div');
    logItem.style.cssText = 'margin: 5px 0; padding: 5px; border-left: 2px solid #0f0;';
    logItem.innerHTML = `
      <div style="color: #0ff;">${entry.timestamp}</div>
      <div style="color: #ff0; font-weight: bold;">${entry.type}</div>
      <pre style="margin: 2px 0; color: #0f0;">${JSON.stringify(entry.details, null, 2)}</pre>
    `;
    logList.appendChild(logItem);
  });
  panel.appendChild(logList);
  
  document.body.appendChild(panel);
}

/**
 * Close the debug panel
 */
function closeDebugPanel() {
  const panel = document.getElementById('debug-panel');
  if (panel) panel.remove();
}

// Expose globally
export const GameLogging = {
  logEvent,
  logError,
  getEventLog,
  clearLog,
  setEnabled,
  showDebugPanel,
  closeDebugPanel,
  // Quick toggle for console
  get enabled() { return enabled; },
  set enabled(value) { setEnabled(value); }
};

// Log initialization
console.log('[Logging] System initialized. Use GameLogging.setEnabled(true) to enable.');

