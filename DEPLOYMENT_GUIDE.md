# HouseOfSpeed - Deployment Guide

## Pre-Deployment Checklist

### ✅ Security (ALL CRITICAL)
- [ ] Environment variables configured in `.env`
- [ ] `SESSION_SECRET` set to cryptographically random value
- [ ] Admin password changed from initial/default
- [ ] Supabase keys rotated if previously exposed
- [ ] `ALLOWED_ORIGINS` configured for production domains
- [ ] `NODE_ENV=production` set
- [ ] HTTPS/SSL certificate installed and verified
- [ ] Database file permissions restricted (`chmod 600`)
- [ ] `.env` file NOT committed to git
- [ ] Security headers verified (helmet.js)

### ✅ Performance
- [ ] Assets minified (`npm run build`)
- [ ] Images optimized (WebP format)
- [ ] Video compressed to < 3MB
- [ ] Lazy loading implemented
- [ ] Caching headers configured
- [ ] Lighthouse score > 80

### ✅ Testing
- [ ] All pages load without errors
- [ ] Login/logout works
- [ ] Rate limiting tested
- [ ] Forms validated correctly
- [ ] Database operations work
- [ ] File uploads work
- [ ] CORS tested from production domain

### ✅ Monitoring
- [ ] Error tracking configured (Sentry/etc)
- [ ] Logging enabled
- [ ] Backup system configured
- [ ] Uptime monitoring set up

---

## Deployment Options

### Option 1: VPS (DigitalOcean, Linode, Vultr)

**Recommended for:** Full control, best performance

#### 1. Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install nginx
apt install -y nginx

# Install certbot for SSL
apt install -y certbot python3-certbot-nginx
```

#### 2. Deploy Application

```bash
# Create app user
adduser houseofspeed
usermod -aG sudo houseofspeed

# Switch to app user
su - houseofspeed

# Clone repository
git clone https://github.com/YourUsername/HouseOfSpeed.git
cd HouseOfSpeed

# Install dependencies
npm install --production

# Create .env file
nano .env
# (Paste your production environment variables)

# Build assets
npm run build

# Set database permissions
chmod 600 data/houseofspeed.db
```

#### 3. Setup PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name houseofspeed

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
# (Run the command it outputs)

# Monitor
pm2 monit
```

#### 4. Configure Nginx

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/houseofspeed

# Paste this configuration:
```

```nginx
server {
    listen 80;
    server_name houseofspeed.dk www.houseofspeed.dk;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name houseofspeed.dk www.houseofspeed.dk;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/houseofspeed.dk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/houseofspeed.dk/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|webp)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/houseofspeed /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d houseofspeed.dk -d www.houseofspeed.dk
```

---

### Option 2: Railway.app

**Recommended for:** Easiest deployment, auto-scaling

#### 1. Prepare for Railway

Create `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Create `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ['nodejs-20_x']

[phases.install]
cmds = ['npm ci --production=false']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm start'
```

#### 2. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set SESSION_SECRET=<your-secret>
railway variables set ALLOWED_ORIGINS=<your-domain>

# Deploy
railway up
```

---

### Option 3: Vercel (Frontend Only)

**Recommended for:** Static frontend, separate backend

#### Split Architecture

1. **Frontend** (Vercel): HTML, CSS, JS
2. **Backend** (Railway/Heroku): Express API

Update frontend to call backend API:

```javascript
// Change from:
fetch('/api/cars')

// To:
fetch('https://api.houseofspeed.dk/api/cars')
```

Deploy frontend:
```bash
npm install -g vercel
vercel
```

---

### Option 4: Docker

**Recommended for:** Containerization, Kubernetes

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application files
COPY . .

# Build assets
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
```

Create `.dockerignore`:

```
node_modules/
.git/
.env
data/
uploads/
*.log
.DS_Store
```

Build and run:

```bash
# Build image
docker build -t houseofspeed .

# Run container
docker run -d \
  --name houseofspeed \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e SESSION_SECRET=your-secret \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  houseofspeed
```

---

## Environment Variables Reference

### Required

```bash
NODE_ENV=production
SESSION_SECRET=<64-char-hex-string>
ALLOWED_ORIGINS=https://houseofspeed.dk,https://www.houseofspeed.dk
```

### Optional

```bash
PORT=3000
DATABASE_PATH=./data/houseofspeed.db
ADMIN_INITIAL_PASSWORD=<secure-password>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Supabase (if using)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<service-key>
SUPABASE_ANON_KEY=<anon-key>
```

---

## Database Backup Strategy

### Automated Backups

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
DB_FILE="data/houseofspeed.db"

mkdir -p $BACKUP_DIR

# SQLite backup
sqlite3 $DB_FILE ".backup $BACKUP_DIR/houseofspeed_$TIMESTAMP.db"

# Compress
gzip $BACKUP_DIR/houseofspeed_$TIMESTAMP.db

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup created: $BACKUP_DIR/houseofspeed_$TIMESTAMP.db.gz"
```

Add to crontab:

```bash
# Backup database daily at 3 AM
0 3 * * * /path/to/HouseOfSpeed/scripts/backup-db.sh
```

---

## Monitoring Setup

### 1. PM2 Monitoring (Free)

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 2. Uptime Monitoring

Use one of:
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor URL: `https://houseofspeed.dk/api/health`

### 3. Error Tracking - Sentry

```bash
npm install @sentry/node

# Add to server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

---

## SSL Certificate Renewal

### Certbot (Let's Encrypt)

Automatic renewal is configured by default. Test it:

```bash
sudo certbot renew --dry-run
```

If manual renewal needed:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs houseofspeed

# Common issues:
# 1. Port already in use
sudo lsof -i :3000

# 2. Database locked
rm data/houseofspeed.db-shm data/houseofspeed.db-wal

# 3. Permissions
chmod 600 data/houseofspeed.db
```

### High CPU Usage

```bash
# Check process
pm2 monit

# Restart application
pm2 restart houseofspeed
```

### Database Issues

```bash
# Check integrity
sqlite3 data/houseofspeed.db "PRAGMA integrity_check;"

# Vacuum database
sqlite3 data/houseofspeed.db "VACUUM;"
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop application
pm2 stop houseofspeed

# 2. Revert to previous version
git reset --hard HEAD~1

# 3. Reinstall dependencies
npm install

# 4. Restore database backup
cp backups/houseofspeed_YYYYMMDD_HHMMSS.db.gz data/
gunzip data/houseofspeed_YYYYMMDD_HHMMSS.db.gz
mv data/houseofspeed_YYYYMMDD_HHMMSS.db data/houseofspeed.db

# 5. Restart
pm2 restart houseofspeed
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Test API
curl https://houseofspeed.dk/api/cars

# Test auth
curl -X POST https://houseofspeed.dk/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Check SSL
curl -I https://houseofspeed.dk
```

### 2. Performance Test

```bash
# Run Lighthouse
lighthouse https://houseofspeed.dk --view

# Load test (optional)
npm install -g autocannon
autocannon -c 10 -d 30 https://houseofspeed.dk
```

### 3. Security Scan

```bash
# Run security headers check
curl -I https://houseofspeed.dk | grep -E "(Strict-Transport|Content-Security|X-Frame)"

# Run npm audit
npm audit

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=houseofspeed.dk
```

---

## Maintenance Schedule

### Daily
- Check error logs
- Monitor uptime
- Review failed login attempts

### Weekly
- Review analytics
- Check disk space
- Update dependencies (test first)

### Monthly
- Review backups
- Test restore procedure
- Review security logs
- Update documentation

---

**Last Updated**: April 16, 2026
**Status**: Production-Ready
