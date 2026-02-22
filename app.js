// ==================== CPANEL PASSENGER ENTRY POINT ====================
// cPanel's Phusion Passenger looks for app.js by default.
// This file simply requires/starts the main server.
// Passenger will set the PORT environment variable automatically.

require('./server.js');
