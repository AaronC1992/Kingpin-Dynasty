# From Dusk To Don - Kingpin Dynasty

**Version 0.2.0** | A criminal empire building game with both local and online multiplayer functionality!

## 🎮 **[PLAY NOW - Live Demo](https://aaronc1992.github.io/Kingpin-Dynasty/)**

Click the link above to play the game instantly in your browser - no installation required!

---

## 🎮 Game Features

### Single Player
- Build your criminal empire from street thug to kingpin
- Manage gang members, territories, and businesses
- Complete jobs, heists, and missions
- Skill progression and character development
- Full crime family storylines

### Online Multiplayer
- Real-time multiplayer
- Chat functionality
- Cooperative heists and gang wars
- Cross-platform compatible

## Multiplayer Features

### Real-time Actions
- Job completion notifications
- Territory changes
- Gang recruitment updates
- Money transactions

### Communication
- In-game chat system
- Trade negotiations
- Heist invitations
- Alliance proposals

### Competitive Elements
- Leaderboards
- Achievement tracking
- Statistical comparisons
- Victory conditions

## 🚀 Getting Started

### Playing Online
Simply visit the [live demo](https://aaronc1992.github.io/Kingpin-Dynasty/) - no installation needed!

### Running Locally
1. Clone this repository
2. Open `index.html` in your browser for single player
3. For multiplayer, see **Running the Server** below

### Running the Server
```bash
# Install dependencies
npm install

# Start the server
npm start

# For development with auto-reload
npm run dev
```

The server will start on `http://localhost:3000`

For online multiplayer with friends, see `MULTIPLAYER_README.md` and `NGROK_SETUP.md`

## 🔧 Configuration & Balancing

### Game Balance
All balancing values are centralized in `config/balance.js`:
- Job payouts and risks
- XP and progression curves  
- Energy costs and regeneration
- Jail mechanics
- Faction mission rewards

**To adjust difficulty:** Edit values in `config/balance.js` - detailed comments explain each parameter.

### World Persistence
The multiplayer server uses `world-state.json` to persist:
- Territory control
- City events
- Leaderboard rankings

This file is automatically created and updated by the server.

## 📁 Project Structure

```
├── index.html              # Main game interface
├── game.js                 # Core game logic
├── expanded-systems.js     # Extended gameplay systems
├── expanded-ui.js          # UI for expanded features
├── server.js               # Multiplayer server
├── config/
│   ├── meta.js            # Game name, version, metadata
│   └── balance.js         # All balancing values
├── eventBus.js            # Event system for UI updates
├── logging.js             # Logging and debugging
├── ui-events.js           # UI event listeners
├── worldPersistence.js    # Server world state save/load
└── world-state.json       # Persistent world data (auto-generated)
```

## 📚 Documentation

- **README.md** - Main project overview and setup (you're reading it)
- **QUICK_START.md** - Gameplay guide for expanded systems
- **MULTIPLAYER_README.md** - Local and online multiplayer setup
- **NGROK_SETUP.md** - Detailed ngrok configuration for online play
- **CHANGELOG.md** - Version history and updates
- **docs_archive/** - Archived implementation notes and refactoring logs

## 🛠️ Development

### Code Quality
```bash
# Lint server-side code
npm run lint

# Check for syntax errors
npm run check
```

### Debugging
```javascript
// Enable client-side logging
GameLogging.setEnabled(true);

// Show debug panel
GameLogging.showDebugPanel();
```

## Technical Details

### Client-Side (Browser)
- Pure HTML5, CSS3, and JavaScript
- Event-driven architecture
- Local storage for game saves
- Responsive design for different screen sizes
- Centralized configuration for easy balancing

### Server-Side (Node.js)
- WebSocket server for real-time communication
- HTTP server for serving game files
- JSON-based world persistence
- Rate limiting and input validation
- Profanity filtering

### Network Protocol
- JSON-based message protocol
- Automatic reconnection handling
- Graceful disconnect handling
- Server-authoritative validation (in progress)

## 📝 Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and changes.

## Have Fun!

Kingpin Dynasty multiplayer brings the criminal underworld to life with friends. Whether you're competing for the crown or working together to build an empire, the streets await your command!

Build your legacy, expand your territory, and prove who's the ultimate Don!

---

**From Dusk To Don v0.2.0** | Made with ❤️ for the criminal in all of us
