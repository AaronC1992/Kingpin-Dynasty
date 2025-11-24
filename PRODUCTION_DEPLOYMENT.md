# 🚀 Kingpin Dynasty - Production Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Verification
- [x] Removed hardcoded ngrok URLs
- [x] Updated to production domain (embracedcreation.com)
- [x] XSS protection enabled (escapeHTML function)
- [x] Rate limiting configured (5 messages/5 seconds)
- [x] Input sanitization active
- [x] Profanity filter operational
- [x] Path traversal protection enabled
- [x] Graceful shutdown handlers configured

### 🔐 Security Recommendations

#### High Priority
1. **SSL Certificate Required**
   - WebSocket requires `wss://` (secure WebSocket)
   - Get free SSL from Let's Encrypt or your hosting provider
   - Configure at server/proxy level

2. **Environment Variables** (Optional but Recommended)
   - Store sensitive config outside code
   - Example: `WEBSOCKET_PORT=3000`

3. **CORS Configuration**
   - Currently allows all origins (`*`)
   - Consider restricting to your domain only:
   ```javascript
   'Access-Control-Allow-Origin': 'https://www.embracedcreation.com'
   ```

4. **Rate Limiting Enhancement**
   - Current: 5 messages per 5 seconds per player
   - Consider IP-based limiting for additional protection

#### Medium Priority
1. **Authentication System**
   - Current: Anonymous connections allowed
   - Consider adding user accounts in future updates

2. **Message Size Limits**
   - Current: 200 character limit on chat
   - Consider adding limits on all message types

3. **Connection Limits**
   - Monitor concurrent connections
   - Current max: 100 players per server

### 🖥️ Server Setup

#### Required Software
```bash
# Node.js (v14+)
node --version  # Should be 14.0.0 or higher

# Install PM2 for process management (recommended)
npm install -g pm2
```

#### File Upload
Upload these files to your server:
- `server.js`
- `worldPersistence.js`
- `package.json`
- All game files (HTML, JS, CSS, assets)

#### Installation
```bash
# On your server
cd /path/to/game
npm install --production
```

#### Starting the Server

**Option 1: Simple Start**
```bash
npm start
```

**Option 2: PM2 (Recommended for Production)**
```bash
# Start with PM2
pm2 start server.js --name kingpin-dynasty

# View logs
pm2 logs kingpin-dynasty

# Restart
pm2 restart kingpin-dynasty

# Auto-start on server reboot
pm2 startup
pm2 save
```

### 🌐 Web Server Configuration

#### Nginx (Recommended)
```nginx
server {
    listen 80;
    server_name www.embracedcreation.com embracedcreation.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.embracedcreation.com embracedcreation.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/embracedcreation.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/embracedcreation.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Game static files
    root /var/www/kingpin-dynasty;
    index index.html;
    
    # WebSocket upgrade for multiplayer
    location / {
        # Try static files first
        try_files $uri $uri/ @backend;
    }
    
    location @backend {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for long-lived connections
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

#### Apache (Alternative)
```apache
<VirtualHost *:443>
    ServerName www.embracedcreation.com
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/embracedcreation.com/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/embracedcreation.com/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/embracedcreation.com/chain.pem
    
    DocumentRoot /var/www/kingpin-dynasty
    
    # WebSocket proxy
    ProxyPreserveHost On
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:3000/$1" [P,L]
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

### 🔍 Testing Checklist

#### Before Going Live
- [ ] Test WebSocket connection from browser console
- [ ] Verify SSL certificate is valid (no warnings)
- [ ] Test with multiple browser tabs (simulate multiple players)
- [ ] Check global chat functionality
- [ ] Test territory conquest features
- [ ] Verify jailbreak system
- [ ] Test PVP combat
- [ ] Monitor server logs for errors

#### Browser Console Tests
```javascript
// Open browser console (F12) and run:

// Check connection status
console.log(onlineWorldState.isConnected);  // Should be true
console.log(onlineWorldState.playerId);     // Should show your ID

// Test chat
sendChatMessage();  // Type a message and send

// Check player count
console.log(onlineWorldState.serverInfo.playerCount);
```

### 📊 Monitoring

#### Server Health
```bash
# Check if server is running
pm2 status

# View real-time logs
pm2 logs kingpin-dynasty --lines 100

# Monitor resource usage
pm2 monit
```

#### Log Files
- Server logs: Check console output or PM2 logs
- Error tracking: Monitor for JavaScript errors in browser console
- Connection issues: Check WebSocket upgrade errors in server logs

### 🐛 Troubleshooting

#### Connection Failed
1. Check if Node.js server is running: `pm2 status`
2. Verify port 3000 is not blocked by firewall
3. Confirm SSL certificate is valid
4. Check nginx/Apache configuration

#### WebSocket Upgrade Failed
1. Verify proxy headers are set correctly
2. Check for conflicting proxy rules
3. Test direct connection: `wss://www.embracedcreation.com:3000`

#### Players Can't See Each Other
1. Check server logs for connection count
2. Verify world state is broadcasting
3. Test with browser dev tools network tab

### 🔄 Updating the Game

```bash
# Stop the server
pm2 stop kingpin-dynasty

# Upload new files
# (via FTP, Git, etc.)

# Restart
pm2 restart kingpin-dynasty

# Clear browser cache on client side
# Users: Press Ctrl+F5 to hard refresh
```

### 📈 Scalability Considerations

#### Current Limits
- Max players: 100 per server instance
- Chat history: Last 50 messages
- Territory income: Calculated every 5 minutes
- World state saves: Throttled to once per 5 seconds

#### Scaling Options
1. **Horizontal Scaling**: Run multiple server instances
2. **Database Integration**: Replace JSON files with PostgreSQL/MongoDB
3. **Redis Cache**: For high-frequency state updates
4. **Load Balancer**: Distribute players across servers

### 🎯 Post-Launch

#### Day 1
- [ ] Monitor server resources (CPU, RAM)
- [ ] Watch for error spikes
- [ ] Track concurrent player count
- [ ] Collect user feedback

#### Week 1
- [ ] Review chat logs for issues
- [ ] Check database/file sizes
- [ ] Monitor bandwidth usage
- [ ] Optimize based on usage patterns

---

## 🆘 Emergency Contacts

**Server Issues:**
- Check server logs: `pm2 logs`
- Restart server: `pm2 restart kingpin-dynasty`

**Client Issues:**
- Users should hard refresh: Ctrl+F5
- Clear browser cache
- Check browser console for errors

---

**Production URL:** https://www.embracedcreation.com
**Server Port:** 3000 (proxied through nginx/Apache)
**Protocol:** wss:// (WebSocket Secure)

**Good luck, Don! 🎩**
