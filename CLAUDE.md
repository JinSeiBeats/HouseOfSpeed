# HouseOfSpeed - Claude Code Project Guide

## Project Overview

**HouseOfSpeed** is a luxury car dealership website with three main systems:
1. **Public Website** - Showroom for browsing luxury vehicles
2. **Admin Portal** - Business management dashboard
3. **Customer Portal** - Client account system with authentication

**Tech Stack:**
- Backend: Node.js + Express.js
- Database: SQLite (better-sqlite3)
- Authentication: Express sessions + bcrypt
- Security: helmet.js, express-rate-limit, express-validator
- Frontend: Vanilla HTML/CSS/JavaScript

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/JinSeiBeats/HouseOfSpeed.git
cd HouseOfSpeed
npm install
```

### 2. Environment Setup

Create `.env` file:

```bash
cp .env.example .env
```

Required environment variables:
```env
NODE_ENV=development
SESSION_SECRET=<generate-random-64-char-string>
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000
ADMIN_INITIAL_PASSWORD=AdminPass2024
```

Generate session secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start Server

```bash
npm start
```

Server runs on: http://localhost:3000

---

## Project Structure

```
HouseOfSpeed/
├── server.js                    # Express backend (main entry point)
├── package.json                 # Dependencies and scripts
├── .env                         # Environment variables (NOT in git)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
│
├── data/
│   └── houseofspeed.db         # SQLite database
│
├── migrations/
│   └── 001_customer_auth.js    # Database migration for customer auth
│
├── public/                      # Static assets
│   ├── assets/
│   │   ├── images/             # Images, logos
│   │   └── fonts/              # Web fonts
│   └── uploads/                # User uploaded content
│
├── Admin Portal (Staff Only)
├── admin-login.html            # Admin login page
├── admin.html                  # Admin dashboard (97KB - full featured)
│
├── Customer Portal (Public Users)
├── login.html                  # Customer login
├── signup.html                 # Customer registration
├── account.html                # Customer account dashboard
├── auth-backend.js             # Customer auth client library (5.1KB)
│
├── Public Website
├── index.html                  # Homepage
├── cars.html                   # Vehicle catalog
├── shop.html                   # Merchandise shop
├── about.html                  # About us
├── services.html               # Services offered
├── storage.html                # Vehicle storage info
├── contact.html                # Contact form
├── news.html                   # News & updates
├── gallery.html                # Photo gallery
├── partners.html               # Partners page
│
├── Shared Assets
├── styles.css                  # Main stylesheet
├── scripts.js                  # Main JavaScript
├── shop.js                     # Shopping cart logic
│
└── Documentation
    ├── README.md                          # Project overview
    ├── CLAUDE.md                          # This file
    ├── PORTAL_EXPLANATION.md              # Explains 3 portal systems
    ├── LOGIN_CREDENTIALS.md               # All login credentials
    ├── CUSTOMER_AUTH_IMPLEMENTATION_COMPLETE.md  # Customer auth docs
    ├── IMPROVEMENTS_SUMMARY.md            # Security improvements
    ├── SECURITY_IMPROVEMENTS.md           # Security details
    ├── DEPLOYMENT_GUIDE.md                # How to deploy
    └── [other docs]
```

---

## Three Portal Systems Explained

### 🏢 1. Admin Portal (Staff Only)

**Purpose:** Business management for staff/owners

**Access:**
- URL: http://localhost:3000/admin-login.html
- Credentials: `admin` / `AdminPass2024`

**Features:**
- Vehicle inventory management
- Customer CRM
- Sales pipeline tracking
- Inquiries management
- Analytics dashboard
- System settings

**Tech:**
- Backend auth: `/api/auth/login` (Express sessions)
- Session timeout: 30 minutes
- Rate limit: 5 attempts per 15 minutes

---

### 👤 2. Customer Portal (Public Users)

**Purpose:** Customer accounts for buyers

**Access:**
- Registration: http://localhost:3000/signup.html
- Login: http://localhost:3000/login.html
- Account: http://localhost:3000/account.html

**Features:**
- User registration and login
- Account dashboard
- Order history (future)
- Wishlist (future)
- Profile management

**Tech:**
- Backend auth: `/api/customer/*` endpoints
- Client library: `auth-backend.js`
- Session timeout: 7 days
- Rate limit: 5 login, 3 register per 15 minutes

**API Endpoints:**
```
POST /api/customer/register  - Create account
POST /api/customer/login     - Sign in
POST /api/customer/logout    - Sign out
GET  /api/customer/check     - Check auth status
```

---

### 🌐 3. Public Website (Everyone)

**Purpose:** Public showroom for browsing

**Access:**
- Homepage: http://localhost:3000/
- No login required

**Features:**
- Browse luxury vehicles
- View vehicle details
- Submit inquiries
- Contact forms
- Shop merchandise
- Gallery

---

## Database Schema

### Core Tables

**users** - Admin staff accounts
```sql
id, username, password_hash, role (admin/sales/viewer),
full_name, email, phone, created_at
```

**customer_accounts** - Customer authentication
```sql
id, email, password_hash, first_name, last_name, phone,
email_verified, account_status, last_login_at,
failed_login_attempts, lockout_until, created_at, updated_at
```

**cars** - Vehicle inventory
```sql
id, title, slug, brand, model, year, price, mileage,
fuel_type, transmission, horsepower, body_type, status,
[70+ fields total]
```

**customers** - CRM data (leads, contacts)
```sql
id, email, first_name, last_name, phone, source,
lead_score, status, customer_account_id (FK)
```

**inquiries** - Customer inquiries
```sql
id, customer_id, car_id, message, status,
lead_score, created_at
```

**activity_log** - Audit trail
```sql
id, entity_type, entity_id, action, user_id,
ip_address, user_agent, details, created_at
```

### Database Migrations

Migrations run automatically on server start:
- `migrations/001_customer_auth.js` - Customer authentication tables

To manually run migrations:
```javascript
const { migrateCustomerAuth } = require('./migrations/001_customer_auth');
migrateCustomerAuth(db);
```

---

## Authentication Systems

### Admin Authentication

**Location:** `server.js` lines 602-678

**Flow:**
1. POST `/api/auth/login` with username/password
2. bcrypt verifies password (13 rounds)
3. Session created: `req.session.userId`
4. Cookie set: `hos_session_id` (httpOnly, secure, sameSite)
5. Redirect to `admin.html`

**Middleware:**
```javascript
requireAuth(req, res, next)  // Protects admin routes
```

---

### Customer Authentication

**Location:** `server.js` lines 749-923

**Flow:**
1. POST `/api/customer/register` or `/api/customer/login`
2. bcrypt verifies password (13 rounds)
3. Session created: `req.session.customerUserId`
4. Cookie set: `hos_session_id` (7-day timeout)
5. Redirect to `account.html`

**Middleware:**
```javascript
requireCustomerAuth(req, res, next)  // Protects customer routes
```

**Security Features:**
- Password requirements: 8+ chars, uppercase, lowercase, number
- Account lockout: 5 failed attempts = 30 minute lock
- Rate limiting: 5 login attempts per 15 minutes
- Session regeneration on login (prevents fixation)
- Activity logging for all auth events

---

## Key Files to Understand

### Backend

**server.js** (~1000 lines)
- Lines 1-30: Imports and configuration
- Lines 35-300: Database initialization
- Lines 430-520: Security middleware (helmet, CORS, rate limiting)
- Lines 495-510: Session configuration
- Lines 558-601: Helper functions
- Lines 602-678: Admin authentication endpoints
- Lines 749-923: Customer authentication endpoints
- Lines 925+: Vehicle, inquiry, offer APIs

**migrations/001_customer_auth.js**
- Creates `customer_accounts` table
- Links to `customers` table
- Updates `activity_log` constraints

---

### Frontend

**auth-backend.js** (5.1KB)
- Client-side auth library for customer authentication
- Functions: `signUp()`, `signIn()`, `signOut()`, `checkAuth()`
- Uses fetch API with credentials: 'include'

**login.html** / **signup.html**
- Use `auth-backend.js` for authentication
- Form validation and error handling
- Session checks on page load

**account.html**
- Customer account dashboard
- Session check: redirects to login if not authenticated
- Logout functionality

**admin.html** (97KB)
- Complete admin dashboard
- Vehicle management
- CRM and sales tools
- Analytics

---

### Styling

**styles.css** (~100KB)
- Main stylesheet for entire site
- CSS variables for theming
- Responsive design

**Theme colors:**
```css
--hos-black: #111111
--hos-gold: #c9a05b
--hos-text-primary: #ffffff
--hos-text-secondary: #cccccc
```

---

## Development Workflow

### Running Locally

```bash
# Start development server
npm start

# Server runs on http://localhost:3000
# Auto-restarts NOT enabled (use nodemon if needed)
```

### Testing Authentication

**Test admin login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"admin","password":"AdminPass2024"}'
```

**Test customer registration:**
```bash
curl -X POST http://localhost:3000/api/customer/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","first_name":"Test","last_name":"User"}'
```

**Test customer login:**
```bash
curl -X POST http://localhost:3000/api/customer/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

---

### Database Access

```bash
# Open SQLite CLI
sqlite3 data/houseofspeed.db

# View tables
.tables

# View customer accounts
SELECT id, email, first_name, created_at FROM customer_accounts;

# View activity log
SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20;

# Delete test accounts
DELETE FROM customer_accounts WHERE email LIKE '%test%';
```

---

## Git Workflow

### Current Branch Structure

```
main - Production-ready code
```

### Pushing to Main

```bash
# 1. Check status
git status

# 2. Add all changes
git add .

# 3. Commit with descriptive message
git commit -m "Add customer authentication system

- Implemented customer registration and login
- Added auth-backend.js client library
- Updated login.html, signup.html, account.html
- Created database migration for customer_accounts table
- Added security features: rate limiting, account lockout, bcrypt
- Complete documentation in CUSTOMER_AUTH_IMPLEMENTATION_COMPLETE.md"

# 4. Push to main
git push origin main
```

### Creating a Feature Branch (Recommended)

```bash
# 1. Create and switch to feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "Description of changes"

# 3. Push feature branch
git push origin feature/your-feature-name

# 4. Create Pull Request on GitHub
# Review and merge to main via GitHub UI
```

### Pull Latest Changes

```bash
# Update your local main branch
git checkout main
git pull origin main
```

---

## Working with Colleagues

### For Your Colleague to Start

**1. Clone the repository:**
```bash
git clone https://github.com/JinSeiBeats/HouseOfSpeed.git
cd HouseOfSpeed
```

**2. Install dependencies:**
```bash
npm install
```

**3. Set up environment:**
```bash
cp .env.example .env
# Edit .env and add SESSION_SECRET
```

**4. Start server:**
```bash
npm start
```

**5. Read documentation:**
- Start with: `PORTAL_EXPLANATION.md`
- Then: `LOGIN_CREDENTIALS.md`
- Then: `CUSTOMER_AUTH_IMPLEMENTATION_COMPLETE.md`

---

### Coordination Tips

**Before making changes:**
1. Pull latest: `git pull origin main`
2. Create feature branch: `git checkout -b feature/your-task`
3. Make changes
4. Test locally
5. Commit and push feature branch
6. Create Pull Request for review

**Communication:**
- Use GitHub Issues for bugs and feature requests
- Use Pull Requests for code reviews
- Document significant changes in commit messages

---

## Security Considerations

### Passwords

**Admin:**
- Default: `AdminPass2024`
- Change in production: Set `ADMIN_INITIAL_PASSWORD` in `.env`

**Customers:**
- Requirements: 8+ chars, uppercase, lowercase, number
- Hashed with bcrypt (13 rounds)
- Never stored in plaintext

### Sessions

**Session Secret:**
- Must be set in `.env`
- Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Different secret for production

**Cookie Settings:**
- `httpOnly: true` - Prevents XSS access
- `secure: true` - HTTPS only (production)
- `sameSite: 'strict'` - CSRF protection
- Admin timeout: 30 minutes
- Customer timeout: 7 days

### Rate Limiting

- API: 100 requests per 15 minutes
- Admin login: 5 attempts per 15 minutes
- Customer login: 5 attempts per 15 minutes
- Customer registration: 3 attempts per 15 minutes

### Activity Logging

All authentication events logged:
```sql
SELECT * FROM activity_log
WHERE entity_type IN ('user', 'customer_account')
ORDER BY created_at DESC;
```

---

## Environment Variables

Required in `.env`:

```env
# Server
NODE_ENV=development                    # development | production
PORT=3000                               # Server port

# Security
SESSION_SECRET=<64-char-random-string>  # REQUIRED: Generate with crypto
ALLOWED_ORIGINS=http://localhost:3000   # Comma-separated CORS origins

# Authentication
ADMIN_INITIAL_PASSWORD=AdminPass2024    # Default admin password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000            # 15 minutes (default)
RATE_LIMIT_MAX_REQUESTS=100            # Max requests per window (default)

# Database
DATABASE_PATH=./data/houseofspeed.db   # SQLite database location
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Change `SESSION_SECRET` (generate new random string)
- [ ] Change `ADMIN_INITIAL_PASSWORD`
- [ ] Set `NODE_ENV=production`
- [ ] Update `ALLOWED_ORIGINS` to production domain
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set up database backups
- [ ] Configure email service (for password reset - Phase 2)
- [ ] Review security headers (helmet.js config)
- [ ] Test all authentication flows
- [ ] Check activity logs

### Deployment Options

See `DEPLOYMENT_GUIDE.md` for detailed instructions on:
- VPS deployment (DigitalOcean, Linode)
- Railway.app deployment
- Docker deployment
- Vercel deployment (frontend only)

---

## Common Tasks

### Add New Admin User

```sql
-- Generate password hash in Node.js:
-- bcrypt.hashSync('password', 13)

INSERT INTO users (username, password_hash, role, full_name, email)
VALUES (
  'newadmin',
  '$2a$13$...',  -- bcrypt hash
  'admin',
  'New Admin',
  'admin@example.com'
);
```

### Reset Customer Password (Manual)

```sql
-- Generate new hash for password "NewPass123":
-- bcrypt.hashSync('NewPass123', 13)

UPDATE customer_accounts
SET password_hash = '$2a$13$...',
    failed_login_attempts = 0,
    lockout_until = NULL
WHERE email = 'customer@example.com';
```

### Unlock Customer Account

```sql
UPDATE customer_accounts
SET failed_login_attempts = 0,
    lockout_until = NULL
WHERE email = 'customer@example.com';
```

### View Recent Activity

```sql
SELECT
  al.created_at,
  al.entity_type,
  al.action,
  CASE
    WHEN al.entity_type = 'user' THEN u.username
    WHEN al.entity_type = 'customer_account' THEN ca.email
  END as user_identifier
FROM activity_log al
LEFT JOIN users u ON al.entity_type = 'user' AND al.entity_id = u.id
LEFT JOIN customer_accounts ca ON al.entity_type = 'customer_account' AND al.entity_id = ca.id
ORDER BY al.created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Server won't start

**Issue:** Port 3000 already in use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Issue:** Missing dependencies
```bash
npm install
```

**Issue:** Missing .env file
```bash
cp .env.example .env
# Edit .env and add SESSION_SECRET
```

---

### Authentication errors

**Issue:** "Invalid credentials"
- Check username/password
- Check if account exists in database
- Check if account is locked (lockout_until)

**Issue:** "Too many login attempts"
- Wait 15 minutes
- Or unlock account manually (see SQL above)

**Issue:** Session not persisting
- Check if cookies are enabled
- Check if SESSION_SECRET is set
- Check browser console for cookie errors

---

### Database errors

**Issue:** "Database locked"
```bash
# Check for stale locks
fuser data/houseofspeed.db
# Kill process if needed
```

**Issue:** Migration fails
```bash
# Check migration log in console
# Migrations are idempotent, safe to re-run
# Restart server to retry migration
```

---

## Testing

### Manual Testing Checklist

**Admin Portal:**
- [ ] Login with admin credentials
- [ ] View dashboard
- [ ] Add test vehicle
- [ ] View inquiries
- [ ] Logout

**Customer Portal:**
- [ ] Register new account
- [ ] Login with credentials
- [ ] View account page
- [ ] Logout
- [ ] Try duplicate registration (should fail)
- [ ] Try 5 wrong passwords (should lock)

**Public Website:**
- [ ] Browse homepage
- [ ] View vehicle catalog
- [ ] Submit inquiry
- [ ] Browse shop
- [ ] View gallery

### API Testing

Use the demo dashboard:
```bash
open demo-website.html
```

Or use curl (see "Testing Authentication" section above)

---

## Performance

### Current Setup

- Database: SQLite (WAL mode enabled)
- Session store: In-memory (express-session default)
- Static files: Served by Express
- No caching layer

### Optimization Tips

**For Production:**
1. Use Redis for session store
2. Add CDN for static assets
3. Enable gzip compression (already configured)
4. Consider PostgreSQL for larger scale
5. Add database indexes for frequently queried fields

---

## Documentation Index

All documentation files in the project:

| File | Purpose |
|------|---------|
| **README.md** | Project overview and quick start |
| **CLAUDE.md** | This file - complete development guide |
| **PORTAL_EXPLANATION.md** | Explains the 3 portal systems |
| **LOGIN_CREDENTIALS.md** | All login credentials and access info |
| **CUSTOMER_AUTH_IMPLEMENTATION_COMPLETE.md** | Customer auth system documentation |
| **IMPROVEMENTS_SUMMARY.md** | Summary of all improvements made |
| **SECURITY_IMPROVEMENTS.md** | Detailed security implementation |
| **SECURITY_AUDIT_REPORT.md** | Initial security audit findings |
| **PERFORMANCE_OPTIMIZATION.md** | Performance improvements guide |
| **DEPLOYMENT_GUIDE.md** | How to deploy to production |
| **WEBSITE_TRANSFORMATION_REPORT.md** | Before/after comparison |
| **ADMIN_SYSTEM_CLARIFICATION.md** | Clarifies admin vs customer systems |
| **NO_DOUBLE_ADMIN_PANELS.md** | Explains there's only one admin system |
| **CLIENT_LOGIN_OPTIONS.md** | Customer login implementation options |

---

## Contact & Support

**Repository:** https://github.com/JinSeiBeats/HouseOfSpeed

**Issues:** Report bugs and feature requests via GitHub Issues

**Questions:** Check documentation first, then create an issue

---

## Recent Changes

### April 17, 2026 - Customer Authentication System

**What was added:**
- Customer registration and login system
- Backend API endpoints (`/api/customer/*`)
- Client library (`auth-backend.js`)
- Database migration (`migrations/001_customer_auth.js`)
- Security features (rate limiting, account lockout)
- Activity logging for customer auth events
- Updated frontend (login.html, signup.html, account.html)

**Files modified:**
- `server.js` - Added customer auth endpoints
- `login.html` - Updated to use backend auth
- `signup.html` - Updated to use backend auth
- `account.html` - Updated session management

**Files created:**
- `auth-backend.js` - Customer auth client library
- `migrations/001_customer_auth.js` - Database migration
- `CUSTOMER_AUTH_IMPLEMENTATION_COMPLETE.md` - Documentation

---

## License

[Add your license information here]

---

## Contributors

- Josh (Project Owner)
- [Add colleague names here]

---

**Last Updated:** April 17, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
