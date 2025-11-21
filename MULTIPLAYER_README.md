# Kingpin Dynasty - Multiplayer Setup Guide

## 🎮 Quick Start (Local Testing)

### Prerequisites
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org)
- **Modern web browser** (Chrome, Firefox, Edge)

### Step 1: Start the Server
1. Double-click `start-server.bat` 
2. Wait for the server to start (you'll see "🎮 Ready for players to connect!")
3. **Keep this window open** while testing

### Step 2: Test Locally
1. Open your game by double-clicking `index.html`
2. Click "🌐 Online World" in the main menu
3. You should see "✅ Connected to Online World" 

## 🌐 Online Testing (Cross-PC with Ngrok)

### Step 1: Install Ngrok
1. Go to [ngrok.com](https://ngrok.com) and create a free account
2. Download ngrok and extract to a folder
3. Run: `ngrok config add-authtoken YOUR_TOKEN` (get token from ngrok dashboard)

### Step 2: Expose Your Server
1. Start your game server first (run `start-server.bat`)
2. In a new terminal/command prompt, run: `ngrok http 8080`
3. Copy the **https** URL (looks like: `https://abc123.ngrok.io`)

### Step 3: Update Your Game
1. Open `multiplayer.js` in a text editor
2. Find this line: `serverUrl: 'ws://localhost:8080',`
3. Change it to: `serverUrl: 'wss://YOUR_NGROK_URL',` (replace YOUR_NGROK_URL)
4. Remove the `https://` and add `wss://` instead

Example:
```javascript
serverUrl: 'wss://abc123.ngrok.io', // Your ngrok URL
```

### Step 4: Share with Friends
1. Send your friends the ngrok URL (like `https://abc123.ngrok.io`)
2. They can open that URL in their browser to play
3. Or they can download your game files and update the serverUrl

## 🔧 Troubleshooting

### "Connection Error" Message
- Make sure the server is running (`start-server.bat`)
- Check if port 8080 is blocked by antivirus/firewall
- Try restarting the server

### Ngrok Issues
- Make sure you're using the **wss://** version of the ngrok URL
- Don't include `/` at the end of the URL
- Free ngrok URLs change each time you restart ngrok

### Multiple Players Not Seeing Each Other
- All players must connect to the same server URL
- Make sure the server shows multiple connections in its window
- Check that everyone updated their `multiplayer.js` with the same serverUrl

## 🎯 Multiplayer Features

### What Works
- ✅ **Global Chat** - Talk with all players worldwide
- ✅ **City Districts** - Claim territory that others can see
- ✅ **Active Heists** - Organize and join heists with other players
- ✅ **Player Challenges** - Combat other players for reputation
- ✅ **Live Leaderboard** - See who's the top criminal
- ✅ **World Events** - Dynamic city events affect all players
- ✅ **Real-time Updates** - See other players' actions instantly

### Commands for Testing
- Open browser console (F12) and type:
  - `onlineWorldState` - See current connection status
  - `gameState.players` - See all connected players (server console)

## 🚀 Deployment Options (Advanced)

### Option 1: Heroku (Free Tier)
1. Create account at [heroku.com](https://heroku.com)
2. Install Heroku CLI
3. Run: `heroku create your-game-name`
4. Run: `git push heroku main`
5. Update serverUrl to your Heroku app URL

### Option 2: Railway
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy automatically
4. Use the provided URL

### Option 3: DigitalOcean/AWS
- For more advanced users
- Provides more control and reliability
- Requires server management knowledge

## 📊 Server Monitoring

The server window shows:
- 🎮 Player connections/disconnections
- 💬 Global chat messages
- 🏛️ Territory claims
- 💰 Heist activities
- ⚔️ Player combat results

## ⚠️ Important Notes

1. **Keep server running** - If you close the server window, all players disconnect
2. **Ngrok URLs change** - Free ngrok URLs expire when you restart ngrok
3. **Update all clients** - When changing serverUrl, all players need the update
4. **Firewall settings** - Make sure Windows Firewall allows Node.js connections

## 🆘 Need Help?

If you encounter issues:
1. Check the server console for error messages
2. Open browser dev tools (F12) and check the console
3. Try restarting both server and ngrok
4. Make sure all players are using the same server URL

---

**Happy criminal empire building! 🏴‍☠️**
