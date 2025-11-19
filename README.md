# From Dusk to Don - Multiplayer Edition

A criminal empire building game with both local and online multiplayer functionality!

## 🎮 **[PLAY NOW - Live Demo](https://aaronc1992.github.io/FromDuskToDon/)**

Click the link above to play the game instantly in your browser - no installation required!

---

## 🎮 Game Features

### Single Player
- Build your criminal empire from street thug to kingpin
- Manage gang members, territories, and businesses
- Complete jobs, heists, and missions
- Skill progression and character development
- Full crime family storylines

### Local Multiplayer (Hot-seat)
- 2-4 players on the same device
- Competitive and cooperative game modes
- Territory war battles
- Turn-based gameplay
- Trade resources between players

### Online Multiplayer
- Real-time multiplayer with up to 4 players
- Room-based system with invite codes
- Chat functionality
- Cooperative heists and gang wars
- Cross-platform compatible

## 🚀 Quick Start

### Playing Single Player (No Setup Required)
1. Simply open `index.html` in your web browser
2. Create your character and start your criminal career

### Playing Local Multiplayer (No Setup Required)
1. Open the game in your browser
2. Click "🌐 Multiplayer" from the main menu
3. Choose "Local Multiplayer"
4. Select number of players and game mode
5. Pass the device between players for turns

### Playing Online Multiplayer (Server Setup Required)

#### Prerequisites
- Node.js (version 14 or higher)
- Internet connection

#### Setup Instructions

1. **Install Node.js dependencies:**
   ```bash
   cd "c:\Users\jenna\OneDrive\Desktop\Portfolio projects\FromDuskToDon"
   npm install
   ```

2. **Start the multiplayer server:**
   ```bash
   npm start
   ```
   
   You should see:
   ```
   🌐 WebSocket server started on port 8080
   🌍 HTTP server started on port 3000
   Open http://localhost:3000 to play the game
   ```

3. **Connect players:**
   - Open `http://localhost:3000` in your web browser
   - Click "🌐 Multiplayer" from the main menu
   - One player creates a room and shares the room code
   - Other players join using the room code
   - Host starts the game when ready

#### For Development
```bash
npm install -g nodemon
npm run dev
```

## 🎯 Game Modes

### Competitive Mode
- Players compete to reach the target money/reputation first
- Territory battles for control
- Individual victory conditions

### Cooperative Mode
- Players work together toward a shared goal
- Shared resources and objectives
- Team-based victory

### Territory War Mode
- Focus on territorial expansion
- Control districts for income
- Military-style conquest gameplay

## 🌐 Multiplayer Features

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

## 🔧 Technical Details

### Client-Side (Browser)
- Pure HTML5, CSS3, and JavaScript
- No external dependencies
- Local storage for game saves
- Responsive design for different screen sizes

### Server-Side (Node.js)
- WebSocket server for real-time communication
- HTTP server for serving game files
- Room management system
- Player state synchronization

### Network Protocol
- JSON-based message protocol
- Automatic reconnection handling
- Anti-cheat validation
- Graceful disconnect handling

## 📱 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎮 Controls

### Single Player & Local Multiplayer
- Mouse/Touch: Navigate menus and select options
- Keyboard: Type in input fields and chat

### Online Multiplayer
- All single player controls
- Enter: Send chat messages
- ESC: Close dialogs/menus

## 🏆 Victory Conditions

### Competitive Modes
- **Money Race**: First to reach target amount ($50K-$250K)
- **Reputation**: First to reach 100 reputation points
- **Territory Control**: Control specified number of territories
- **Time Challenge**: Highest score after set time limit

### Cooperative Mode
- **Team Wealth**: Combine resources to reach team goal
- **Empire Building**: Build specified number of businesses together
- **Survival**: Survive waves of police crackdowns

## 🛠️ Troubleshooting

### Local Multiplayer Issues
- **Game not responding**: Refresh the page and restart
- **Player turns stuck**: Click "End Turn" button
- **Save issues**: Check browser local storage permissions

### Online Multiplayer Issues
- **Can't connect**: Ensure server is running on port 8080
- **Room not found**: Check room code spelling and server status
- **Lag/Disconnects**: Check internet connection stability
- **Server crashes**: Restart with `npm start`

### Common Solutions
1. Clear browser cache and refresh
2. Disable browser extensions
3. Check Windows Firewall settings for Node.js
4. Ensure ports 3000 and 8080 are available
5. Try a different browser

## 🔐 Security Notes

- This is a local development server
- Not suitable for production deployment without security hardening
- No authentication system implemented
- Room codes provide basic access control

## 📚 Game Tips

### Multiplayer Strategy
- **Early Game**: Focus on quick jobs and energy management
- **Mid Game**: Balance between growth and defense
- **Late Game**: Territory expansion and player interaction

### Cooperative Play
- Coordinate job timing for maximum efficiency
- Share resources strategically
- Plan heists together for better success rates

### Competitive Play
- Monitor other players' progress
- Use trade wisely to gain advantages
- Territory control is key to late-game victory

## 🎨 Customization

The game supports various customizations:
- Victory conditions can be modified in `multiplayer.js`
- New game modes can be added to the server
- UI themes can be changed in `styles.css`
- Room settings are configurable per game

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Ensure all files are in the correct directory
3. Verify Node.js installation with `node --version`
4. Check browser console for error messages

## 🎉 Have Fun!

From Dusk to Don multiplayer brings the criminal underworld to life with friends. Whether you're competing for the crown or working together to build an empire, the streets await your command!

Build your legacy, expand your territory, and prove who's the ultimate Don! 🏛️👑
