# Security Improvements Implemented

## ✅ Critical Vulnerabilities Fixed

### 1. Removed Exposed Credentials
- **OLD**: Supabase URL and ANON_KEY hardcoded in `auth.js`
- **NEW**: Moved to environment variables in `.env` file
- **Files Created**:
  - `.env.example` - Template for configuration
  - `auth-config.js` - Server-side configuration module
  - `auth-secure.js` - Secure client without exposed keys

### 2. Secure Admin Password Generation
- **OLD**: Hardcoded password `HouseOfSpeed2024!` in source code
- **NEW**: Randomly generated on first startup or from `ADMIN_INITIAL_PASSWORD` env var
- **Location**: `server.js:314-327`
- **Action Required**: Check console output on first run for generated password

### 3. Fixed CORS Configuration
- **OLD**: Accepted requests from any origin (`origin: true`)
- **NEW**: Whitelist-based CORS with `ALLOWED_ORIGINS` env var
- **Location**: `server.js:452-469`
- **Default**: `http://localhost:3000` (development)

### 4. Enhanced Session Security
- **Improvements**:
  - Required `SESSION_SECRET` environment variable (no fallback)
  - `secure: true` in production (HTTPS only)
  - `sameSite: 'strict'` to prevent CSRF
  - Reduced timeout to 30 minutes (was 8 hours)
  - Custom session name (not default `connect.sid`)
  - Session regeneration on login (prevents fixation attacks)
- **Location**: `server.js:493-505`

### 5. Added Security Middleware
- **helmet.js**: Security headers (CSP, HSTS, etc.)
- **express-rate-limit**: API rate limiting
- **express-validator**: Input validation
- **Location**: `server.js:423-487`

### 6. Secured Inquiry Endpoint
- **Added**:
  - Rate limiting (3 inquiries/hour per IP)
  - Input validation for all fields
  - XSS prevention via sanitization
  - Email/phone validation
- **Location**: `server.js:918-988`

### 7. Enhanced Authentication
- **Improvements**:
  - Rate limiting on login (5 attempts/15 min)
  - Input validation and sanitization
  - Async bcrypt for better security
  - Session regeneration
  - Activity logging for failed attempts
- **Location**: `server.js:590-654`

---

## 📦 New Dependencies Added

```json
{
  "helmet": "^7.1.0",              // Security headers
  "express-rate-limit": "^7.1.5",  // Rate limiting
  "csurf": "^1.11.0",              // CSRF protection
  "express-validator": "^7.0.1",   // Input validation
  "dotenv": "^16.4.5",             // Environment variables
  "dompurify": "^3.0.9",           // HTML sanitization (dev)
  "jsdom": "^24.0.0"               // DOM for server-side (dev)
}
```

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Generate Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste into `.env`:

```bash
SESSION_SECRET=your-generated-secret-here
```

### 4. Configure CORS (Production)

Edit `.env`:

```bash
ALLOWED_ORIGINS=https://houseofspeed.dk,https://www.houseofspeed.dk
```

### 5. Configure Supabase (If Using)

Edit `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```

### 6. Set Admin Password (Optional)

Edit `.env`:

```bash
ADMIN_INITIAL_PASSWORD=YourSecurePassword123!
```

If not set, a random password will be generated on first run.

### 7. Start Server

```bash
npm start
```

Check console output for admin credentials if generated.

---

## 🔒 Security Headers Implemented

The following headers are automatically set by helmet.js:

```
Content-Security-Policy: Protects against XSS
Strict-Transport-Security: Forces HTTPS
X-Content-Type-Options: Prevents MIME sniffing
X-Frame-Options: Prevents clickjacking
X-XSS-Protection: Browser XSS protection
```

---

## 🚦 Rate Limiting Configuration

### API Endpoints
- **Limit**: 100 requests per 15 minutes per IP
- **Applies to**: All `/api/*` routes

### Authentication
- **Limit**: 5 attempts per 15 minutes per IP
- **Applies to**: `/api/auth/login`
- **Resets on**: Successful login

### Inquiry Submissions
- **Limit**: 3 inquiries per hour per IP
- **Applies to**: `/api/cars/:id/inquire`

---

## 🛡️ Input Validation

All user inputs are validated and sanitized:

### Login
- Username: 3-50 characters, alphanumeric
- Password: 8-100 characters

### Inquiry Form
- Names: 2-50 characters
- Email: Valid email format
- Phone: Valid phone format
- Message: Max 1000 characters, HTML escaped
- Type: Enum validation
- Source: Enum validation

---

## 📝 Activity Logging

Security-relevant events are logged to the database:

- Login attempts (success/failure)
- Logout events
- Customer creation
- Inquiry submissions
- Includes IP addresses for audit trail

Query audit log:

```sql
SELECT * FROM activity_log
WHERE action IN ('login_success', 'login_failed', 'logout')
ORDER BY timestamp DESC LIMIT 100;
```

---

## 🔄 Migration from Old Auth

### Client-Side Changes Required

**Option 1: Use New Secure Auth (Recommended)**

Replace `auth.js` with `auth-secure.js` in your HTML:

```html
<!-- OLD -->
<script src="auth.js"></script>

<!-- NEW -->
<script src="auth-secure.js"></script>
```

**Option 2: Keep Old Auth (Quick Fix)**

If you want to keep using `auth.js` temporarily:

1. Move Supabase credentials to `.env`
2. Create backend proxy endpoints in `server.js`
3. Update `auth.js` to call proxy endpoints

**Recommendation**: Switch to `auth-secure.js` for maximum security.

---

## ⚠️ Breaking Changes

### 1. Session Cookie Name
- **OLD**: `connect.sid`
- **NEW**: `hos_session_id`
- **Impact**: Existing sessions will be invalidated

### 2. SESSION_SECRET Required
- **OLD**: Had fallback default
- **NEW**: Must be set or server won't start
- **Fix**: Set in `.env` file

### 3. CORS Restrictions
- **OLD**: Accepted all origins
- **NEW**: Whitelist only
- **Fix**: Add your domain to `ALLOWED_ORIGINS`

### 4. Admin Password
- **OLD**: Hardcoded `HouseOfSpeed2024!`
- **NEW**: Random or env var
- **Fix**: Check console on first run

---

## 🧪 Testing Security

### 1. Test Rate Limiting

```bash
# Should block after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done
```

### 2. Test CORS

```bash
# Should be rejected (wrong origin)
curl -X GET http://localhost:3000/api/cars \
  -H "Origin: https://evil.com"
```

### 3. Test Input Validation

```bash
# Should fail validation
curl -X POST http://localhost:3000/api/cars/1/inquire \
  -H "Content-Type: application/json" \
  -d '{"first_name":"A"}'  # Too short
```

### 4. Test XSS Protection

```bash
# Should be escaped
curl -X POST http://localhost:3000/api/cars/1/inquire \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","email":"test@test.com","message":"<script>alert(1)</script>"}'
```

---

## 📊 Security Checklist

Before deploying to production:

- [ ] `.env` file created with all required variables
- [ ] `SESSION_SECRET` set to strong random value
- [ ] `ALLOWED_ORIGINS` set to production domains
- [ ] `NODE_ENV=production` set
- [ ] SSL/HTTPS enabled
- [ ] Admin password changed from initial value
- [ ] Supabase keys rotated (if exposed previously)
- [ ] Database file permissions restricted
- [ ] Firewall configured to allow only HTTPS (443)
- [ ] Server behind reverse proxy (nginx/cloudflare)
- [ ] Rate limiting tested
- [ ] CORS tested with actual frontend domain
- [ ] Monitoring and alerting set up
- [ ] Backup system configured

---

## 🚀 Deployment Recommendations

### 1. Use HTTPS Only

Never run in production without HTTPS. Use:
- Let's Encrypt (free SSL certificates)
- Cloudflare (free SSL + CDN)
- Your hosting provider's SSL

### 2. Environment Variables

Never commit `.env` to git. Use:
- Railway/Heroku config vars
- Docker secrets
- AWS Secrets Manager
- Azure Key Vault

### 3. Database Security

- Set file permissions: `chmod 600 data/houseofspeed.db`
- Enable backups
- Consider PostgreSQL for production

### 4. Monitoring

Set up monitoring for:
- Failed login attempts
- Rate limit hits
- Server errors
- Response times

Recommended tools:
- Sentry (error tracking)
- New Relic (APM)
- Datadog (infrastructure)

---

## 🆘 Incident Response

If you suspect a security breach:

1. **Immediately**:
   - Rotate `SESSION_SECRET`
   - Rotate Supabase keys
   - Change admin passwords
   - Check audit logs for suspicious activity

2. **Investigate**:
   ```sql
   -- Check recent logins
   SELECT * FROM activity_log WHERE action LIKE '%login%' ORDER BY timestamp DESC LIMIT 100;

   -- Check failed attempts
   SELECT * FROM activity_log WHERE action = 'login_failed' ORDER BY timestamp DESC;

   -- Check inquiry spam
   SELECT COUNT(*), details->>'ip' as ip FROM activity_log WHERE entity_type = 'inquiry' GROUP BY ip ORDER BY count DESC;
   ```

3. **Recover**:
   - Restore from backup if needed
   - Update all dependencies
   - Run security audit
   - Enable additional logging

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

**Last Updated**: April 16, 2026
**Status**: Production-Ready (pending testing)
**Next Steps**: Performance optimization & code quality improvements
