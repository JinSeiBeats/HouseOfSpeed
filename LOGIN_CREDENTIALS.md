# 🔐 HouseOfSpeed - Login Credentials Guide

## Quick Reference

### 👔 **ADMIN PORTAL** (Business Management)
- **URL**: http://localhost:3000/admin-login.html
- **Username**: `admin`
- **Password**: `AdminPass2024`
- **Purpose**: Manage business operations

### 👤 **CLIENT PORTAL** (Customer Access)
- **URL**: http://localhost:3000/client-login.html
- **Email**: `customer@houseofspeed.dk`
- **Password**: `Customer123!`
- **Purpose**: Customer account and orders

---

## 1. Admin Portal - Full Access

### Access Information
```
URL:      http://localhost:3000/admin-login.html
Username: admin
Password: AdminPass2024
Role:     Administrator
```

### What You Can Do:
✅ **Vehicle Management**
- Add new luxury vehicles to inventory
- Edit vehicle specifications (70+ fields)
- Upload multiple images per vehicle
- Manage pricing and VAT
- Track vehicle status (available, sold, reserved)

✅ **Customer Relationship Management**
- View all customer inquiries
- Track lead scores
- Manage customer contacts
- View purchase history

✅ **Sales Pipeline**
- Track offers and negotiations
- Manage reservations
- Complete sales transactions
- Generate invoices

✅ **Analytics & Reporting**
- Sales dashboard
- Revenue tracking
- Inventory overview
- Customer analytics

✅ **System Administration**
- User management
- Settings configuration
- Activity log viewing

### Security Features:
- ✅ Secure session management (30-minute timeout)
- ✅ Activity logging with IP tracking
- ✅ Rate limiting (5 login attempts per 15 minutes)
- ✅ CSRF protection
- ✅ Encrypted passwords (bcrypt with 13 rounds)

---

## 2. Client Portal - Customer Access

### Access Information
```
URL:      http://localhost:3000/client-login.html
Email:    customer@houseofspeed.dk
Password: Customer123!
Role:     Customer
```

### What You Can Do:
✅ **Account Management**
- View/edit personal information
- Manage saved addresses
- Update contact preferences

✅ **Vehicle Shopping**
- Browse luxury vehicle inventory
- Save vehicles to wishlist
- Request test drives
- Submit inquiries

✅ **Order Management**
- View order history
- Track order status
- Download invoices

✅ **Shopping Cart**
- Add accessories/merchandise
- Manage cart items
- Proceed to checkout

### Note:
The client portal is currently a **demo system** for testing purposes. In production, you would integrate with Supabase or your preferred authentication provider.

---

## 3. Public Website (No Login Required)

### Access:
```
URL: http://localhost:3000/
```

### Available Pages:
- **Homepage**: `/index.html` - Luxury vehicle showcase
- **Vehicle Catalog**: `/cars.html` - Browse inventory
- **About**: `/about.html` - Company information
- **Services**: `/services.html` - Our services
- **Shop**: `/shop.html` - Merchandise store
- **Gallery**: `/gallery.html` - Photo gallery
- **Contact**: `/contact.html` - Contact form
- **Storage**: `/storage.html` - Vehicle storage info
- **News**: `/news.html` - Latest updates

### Public Features (No Login):
- ✅ Browse vehicle inventory
- ✅ Use finance calculator
- ✅ Submit inquiries
- ✅ Shop merchandise (cart stored locally)
- ✅ View gallery
- ✅ Contact us

---

## 4. Testing Dashboard

### Access:
```
File: demo-website.html
URL:  file:///Users/josh/Developer/HouseOfSpeed/demo-website.html
```

### What You Can Test:
- **Authentication** - Login/logout functionality
- **Rate Limiting** - Security protection testing
- **API Endpoints** - All public APIs
- **Input Validation** - XSS protection
- **Spam Protection** - Inquiry rate limiting
- **Security Headers** - Helmet.js verification

---

## 5. Creating New Users

### Create New Admin User

```sql
-- Connect to database
sqlite3 data/houseofspeed.db

-- Create admin user
INSERT INTO users (username, password_hash, role, full_name, email)
VALUES (
  'newadmin',
  '$2a$13$HASH_HERE',  -- Use bcrypt to generate hash
  'admin',
  'New Administrator',
  'admin@houseofspeed.dk'
);
```

### Roles Available:
- **admin** - Full access to everything
- **sales** - Can manage vehicles and customers
- **viewer** - Read-only access

---

## 6. Password Management

### Change Admin Password

#### Option 1: Via Environment Variable (Recommended)
```bash
# Edit .env file
ADMIN_INITIAL_PASSWORD=YourNewSecurePassword123!

# Delete database to recreate with new password
rm data/houseofspeed.db

# Restart server
npm start
```

#### Option 2: Via Database
```bash
# Generate new password hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NewPassword123!', 13));"

# Update database
sqlite3 data/houseofspeed.db
UPDATE users SET password_hash = 'HASH_FROM_ABOVE' WHERE username = 'admin';
```

### Password Requirements:
- ✅ Minimum 8 characters
- ✅ Contains uppercase and lowercase
- ✅ Contains numbers
- ✅ Contains special characters (recommended)

---

## 7. Session Management

### Admin Sessions:
- **Duration**: 30 minutes of inactivity
- **Security**: HTTPS-only in production
- **Storage**: Server-side with secure cookies
- **Name**: `hos_session_id`

### Client Sessions (Demo):
- **Duration**: Persistent (localStorage)
- **Storage**: Client-side (demo only)
- **Note**: In production, use secure backend sessions

---

## 8. Troubleshooting

### "Invalid Credentials"
**Problem**: Wrong username/password
**Solution**:
1. Check for typos
2. Verify correct portal (admin vs client)
3. Check database for user existence:
   ```bash
   sqlite3 data/houseofspeed.db "SELECT username, role FROM users;"
   ```

### "Too Many Login Attempts"
**Problem**: Rate limit triggered
**Solution**:
1. Wait 15 minutes
2. Or restart server to clear rate limits
3. Or clear rate limit manually (for testing)

### "Session Expired"
**Problem**: Session timeout after 30 minutes
**Solution**:
1. Simply log in again
2. Activity is logged for security audit

### Can't Access Admin Panel
**Checklist**:
- [ ] Server is running (check `npm start`)
- [ ] Accessing correct URL (`/admin-login.html`)
- [ ] Using admin credentials (not client)
- [ ] Database exists (`data/houseofspeed.db`)
- [ ] No browser cache issues (try incognito)

---

## 9. Security Best Practices

### For Admin Access:
1. ✅ Change default password immediately
2. ✅ Use strong, unique password
3. ✅ Don't share credentials
4. ✅ Log out after each session
5. ✅ Use HTTPS in production
6. ✅ Monitor activity logs regularly

### For Production:
1. ✅ Set `NODE_ENV=production` in `.env`
2. ✅ Generate new `SESSION_SECRET`
3. ✅ Configure `ALLOWED_ORIGINS`
4. ✅ Enable HTTPS (SSL certificate)
5. ✅ Set up automated backups
6. ✅ Configure monitoring alerts

---

## 10. Quick Start Commands

### Start Server:
```bash
cd /Users/josh/Developer/HouseOfSpeed
npm start
```

### Open Admin Portal:
```bash
open http://localhost:3000/admin-login.html
# Login: admin / AdminPass2024
```

### Open Client Portal:
```bash
open http://localhost:3000/client-login.html
# Login: customer@houseofspeed.dk / Customer123!
```

### Open Testing Dashboard:
```bash
open demo-website.html
```

### Check Server Status:
```bash
curl http://localhost:3000/api/cars/stats
```

---

## 11. Summary

### Current Login Options:

| Portal | URL | Username/Email | Password | Purpose |
|--------|-----|----------------|----------|---------|
| **Admin** | `/admin-login.html` | `admin` | `AdminPass2024` | Business management |
| **Client** | `/client-login.html` | `customer@houseofspeed.dk` | `Customer123!` | Customer portal |
| **Public** | `/` | None | None | Browse & shop |
| **Demo** | `demo-website.html` | Various | Various | Testing |

---

## 12. Next Steps

### For Testing:
1. ✅ Log in to admin portal
2. ✅ Add some test vehicles
3. ✅ Test client portal
4. ✅ Submit test inquiry
5. ✅ Use demo dashboard

### For Production:
1. 📝 Change all default passwords
2. 🔐 Configure production authentication
3. 🌐 Set up production database
4. 🚀 Deploy to hosting platform
5. 📊 Configure monitoring

---

## Need Help?

### Documentation:
- **Complete Guide**: `IMPROVEMENTS_SUMMARY.md`
- **Security Details**: `SECURITY_IMPROVEMENTS.md`
- **Deployment**: `DEPLOYMENT_GUIDE.md`
- **This File**: `LOGIN_CREDENTIALS.md`

### Support:
- Check server logs: `tail -f /tmp/houseofspeed.log`
- Test dashboard: `demo-website.html`
- Database check: `sqlite3 data/houseofspeed.db`

---

**Last Updated**: April 16, 2026
**Status**: ✅ Credentials Active
**Server**: http://localhost:3000

**Remember**: These are demo credentials for testing. Change them before production deployment!
