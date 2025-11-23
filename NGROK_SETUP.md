# 🌐 Ngrok Setup Guide - Make Your Game Available Online

## What is Ngrok?
Ngrok creates a secure tunnel from your local computer to the internet, allowing friends to connect to your multiplayer server from anywhere in the world.

## Step-by-Step Installation

### 1. Download Ngrok
1. Go to [https://ngrok.com](https://ngrok.com)
2. Click "Sign up" and create a free account
3. Go to "Setup & Installation" → "Download"
4. Download the Windows version
5. Extract the `ngrok.exe` file to a folder (like `C:\ngrok\`)

### 2. Get Your Auth Token
1. In your ngrok dashboard, go to "Your Authtoken"
2. Copy the token (looks like: `2ABC...`)
3. Open Command Prompt or PowerShell as Administrator
4. Navigate to your ngrok folder: `cd C:\ngrok`
5. Run: `ngrok config add-authtoken YOUR_TOKEN_HERE`

### 3. Start Your Game Server
1. Make sure your multiplayer server is running (run `start-server.bat`)
2. You should see "🎮 Ready for players to connect!" in the server window

### 4. Start Ngrok
1. Open a new Command Prompt or PowerShell window
2. Navigate to your ngrok folder: `cd C:\ngrok`
3. Run: `ngrok http 3000`
4. You'll see something like:
   ```
   Session Status    online
   Account           your-email@example.com
   Forwarding        https://abc123.ngrok.io -> http://localhost:3000
   ```
5. **Copy the https URL** (like `https://abc123.ngrok.io`)

### 5. Update Your Game
1. Open `multiplayer.js` in a text editor (Notepad, VS Code, etc.)
2. Find the line: `serverUrl: 'ws://localhost:3000',`
3. Change it to: `serverUrl: 'wss://abc123.ngrok.io',` (use YOUR ngrok URL)
4. **Important:** Remove `https://` and replace with `wss://`
5. Save the file

### 6. Test with Friends
**Option A: Share the Web Link**
- Send friends your ngrok URL: `https://abc123.ngrok.io`
- They can play directly in their browser

**Option B: Share Game Files**
- Send friends your entire game folder
- They need to update their `multiplayer.js` with the same serverUrl
- They open `index.html` in their browser

## ⚠️ Important Notes

### Free Ngrok Limitations
- URL changes every time you restart ngrok
- Limited to 1 tunnel at a time
- Sessions timeout after 8 hours

### When You Restart
1. **Keep server running** - Don't close the server window
2. **Restart ngrok** - Close and restart `ngrok http 8080`
3. **Update serverUrl** - Change the URL in `multiplayer.js`
4. **Tell friends** - Share the new URL

### Security Notes
- Never share your ngrok authtoken
- Free URLs are publicly accessible
- For production, consider paid hosting

## 🔧 Troubleshooting

### "Connection Failed" Errors
- Make sure server is running first
- Check you're using `wss://` not `https://`
- Don't add `/` at the end of the URL

### Ngrok Won't Start
- Run Command Prompt as Administrator
- Make sure you added your authtoken
- Check your internet connection

### Players Can't Connect
- Make sure everyone has the same serverUrl
- Check that ngrok shows "online" status
- Try restarting both server and ngrok

## 📱 Quick Commands

```bash
# Start ngrok (run this every time)
cd C:\ngrok
ngrok http 3000

# Add authtoken (one-time setup)
ngrok config add-authtoken YOUR_TOKEN
```

---

**Now you're ready for worldwide criminal empire building! 🌍🏴‍☠️**
