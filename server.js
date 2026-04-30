// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Migrations
const customerAuthMigration = require('./migrations/001_customer_auth');

// ---------------------------------------------------------------------------
// Directory setup
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'cars');
const DOCS_DIR = path.join(__dirname, 'uploads', 'documents');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DOCS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
const db = new Database(path.join(DATA_DIR, 'houseofspeed.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin','sales','viewer')),
      full_name TEXT,
      email TEXT,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      variant_trim TEXT,
      year INTEGER NOT NULL,
      production_year INTEGER,
      price REAL NOT NULL,
      price_currency TEXT NOT NULL DEFAULT 'EUR',
      price_qualifier TEXT NOT NULL DEFAULT 'fixed' CHECK(price_qualifier IN ('fixed','negotiable','poa')),
      reserve_price REAL,
      acquisition_cost REAL,
      vat_status TEXT NOT NULL DEFAULT 'margin' CHECK(vat_status IN ('standard','margin','qualifying','none')),
      vat_rate REAL NOT NULL DEFAULT 21,
      mileage INTEGER DEFAULT 0,
      mileage_unit TEXT NOT NULL DEFAULT 'km' CHECK(mileage_unit IN ('km','miles')),
      fuel_type TEXT DEFAULT 'Petrol',
      transmission TEXT DEFAULT 'Automatic',
      drivetrain TEXT DEFAULT 'RWD' CHECK(drivetrain IN ('FWD','RWD','AWD')),
      engine_type TEXT,
      engine_displacement TEXT,
      engine_cylinders INTEGER,
      engine_configuration TEXT,
      engine_aspiration TEXT,
      horsepower INTEGER,
      torque TEXT,
      top_speed TEXT,
      acceleration_0_100 TEXT,
      body_type TEXT DEFAULT 'Coupe' CHECK(body_type IN ('Coupe','Sedan','Convertible','SUV','Wagon','Roadster','Shooting Brake','Hatchback','Limousine')),
      doors INTEGER,
      seats INTEGER,
      color_exterior TEXT,
      color_exterior_code TEXT,
      color_interior TEXT,
      interior_material TEXT,
      condition_rating TEXT,
      owners_count INTEGER,
      registration_number TEXT,
      vin TEXT,
      matching_numbers INTEGER DEFAULT 0,
      production_number TEXT,
      provenance TEXT,
      restoration_history TEXT,
      concours_history TEXT,
      racing_history TEXT,
      service_history TEXT DEFAULT 'none' CHECK(service_history IN ('full','partial','none')),
      mot_status TEXT,
      mot_expiry TEXT,
      location_city TEXT,
      location_country TEXT,
      description TEXT,
      features TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','reserved','deposit_taken','sold','consignment','incoming')),
      featured INTEGER NOT NULL DEFAULT 0,
      just_arrived INTEGER NOT NULL DEFAULT 0,
      price_reduced INTEGER NOT NULL DEFAULT 0,
      views_count INTEGER NOT NULL DEFAULT 0,
      inquiry_count INTEGER NOT NULL DEFAULT 0,
      listed_at TEXT,
      sold_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS car_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS car_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      document_type TEXT NOT NULL DEFAULT 'other' CHECK(document_type IN ('service_record','certificate','inspection','history_report','invoice','other')),
      description TEXT,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      phone_secondary TEXT,
      preferred_contact TEXT DEFAULT 'email' CHECK(preferred_contact IN ('email','phone','whatsapp')),
      company_name TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT,
      customer_type TEXT DEFAULT 'private' CHECK(customer_type IN ('private','trade','collector','investor')),
      lead_source TEXT DEFAULT 'website' CHECK(lead_source IN ('website','phone','email','whatsapp','walkin','referral','autotrader','mobile_de','social_media','event','other')),
      lead_score INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','viewing_scheduled','negotiation','deposit','sold','lost','archived')),
      assigned_to INTEGER,
      notes TEXT,
      tags TEXT,
      gdpr_consent INTEGER NOT NULL DEFAULT 0,
      gdpr_consent_date TEXT,
      newsletter_subscribed INTEGER NOT NULL DEFAULT 0,
      total_purchases INTEGER NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0,
      last_contact_at TEXT,
      next_follow_up TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER,
      customer_id INTEGER,
      inquiry_type TEXT NOT NULL DEFAULT 'general' CHECK(inquiry_type IN ('general','viewing','test_drive','offer','finance','trade_in','callback')),
      message TEXT,
      preferred_contact_time TEXT,
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','responded','closed')),
      assigned_to INTEGER,
      response TEXT,
      responded_at TEXT,
      source TEXT DEFAULT 'website' CHECK(source IN ('website','phone','email','whatsapp','marketplace')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      inquiry_id INTEGER,
      offer_amount REAL NOT NULL,
      offer_currency TEXT NOT NULL DEFAULT 'EUR',
      counter_amount REAL,
      trade_in_vehicle TEXT,
      trade_in_value REAL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','countered','accepted','rejected','expired','withdrawn')),
      valid_until TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (car_id) REFERENCES cars(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      offer_id INTEGER,
      deposit_amount REAL,
      deposit_paid INTEGER NOT NULL DEFAULT 0,
      deposit_payment_method TEXT,
      deposit_receipt_number TEXT,
      reservation_expires TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','cancelled','expired')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (car_id) REFERENCES cars(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (offer_id) REFERENCES offers(id)
    );

    CREATE TABLE IF NOT EXISTS sales_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      reservation_id INTEGER,
      offer_id INTEGER,
      sale_price REAL NOT NULL,
      sale_currency TEXT NOT NULL DEFAULT 'EUR',
      vat_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'bank_transfer' CHECK(payment_method IN ('bank_transfer','finance','cash','crypto')),
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','partial','paid','refunded')),
      trade_in_vehicle TEXT,
      trade_in_value REAL,
      financing_provider TEXT,
      financing_reference TEXT,
      invoice_number TEXT UNIQUE,
      delivery_method TEXT DEFAULT 'collection' CHECK(delivery_method IN ('collection','delivery','shipping')),
      delivery_status TEXT DEFAULT 'pending' CHECK(delivery_status IN ('pending','in_transit','delivered')),
      delivery_address TEXT,
      delivery_date TEXT,
      delivery_cost REAL,
      warranty_type TEXT DEFAULT 'none' CHECK(warranty_type IN ('none','3month','6month','12month','extended')),
      warranty_expires TEXT,
      notes TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by INTEGER,
      FOREIGN KEY (car_id) REFERENCES cars(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (reservation_id) REFERENCES reservations(id),
      FOREIGN KEY (offer_id) REFERENCES offers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      old_price REAL,
      new_price REAL,
      changed_by INTEGER,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('car','customer','inquiry','offer','sale','reservation','user','system','customer_account')),
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('created','updated','deleted','viewed','status_changed','note_added','email_sent','call_logged','login_success','login_failed','logout','account_locked')),
      details TEXT,
      performed_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (performed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      email TEXT,
      search_criteria TEXT,
      alert_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK(alert_frequency IN ('immediate','daily','weekly')),
      active INTEGER NOT NULL DEFAULT 1,
      last_notified TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_cars_slug ON cars(slug);
    CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
    CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
    CREATE INDEX IF NOT EXISTS idx_cars_featured ON cars(featured);
    CREATE INDEX IF NOT EXISTS idx_cars_price ON cars(price);
    CREATE INDEX IF NOT EXISTS idx_cars_year ON cars(year);
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
    CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
    CREATE INDEX IF NOT EXISTS idx_inquiries_car_id ON inquiries(car_id);
    CREATE INDEX IF NOT EXISTS idx_offers_car_id ON offers(car_id);
    CREATE INDEX IF NOT EXISTS idx_offers_customer_id ON offers(customer_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_car ON price_history(car_id);
    CREATE INDEX IF NOT EXISTS idx_sales_car ON sales_transactions(car_id);
  `);

  // Seed default admin if none exists
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    // Generate secure random password if not provided
    let adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!adminPassword) {
      adminPassword = crypto.randomBytes(16).toString('hex');
      console.warn('\n⚠️  IMPORTANT: No ADMIN_INITIAL_PASSWORD set in .env');
      console.warn('📝 Generated random admin password:', adminPassword);
      console.warn('🔒 Please save this password and change it after first login!\n');
    }
    const hash = bcrypt.hashSync(adminPassword, 13);
    db.prepare('INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)').run('admin', hash, 'admin', 'Administrator');
    console.log('✓ Default admin user created (username: admin)');
  }

  // Seed default settings
  const seedSettings = [
    ['dealership_name', 'House of Speed Collections'],
    ['currency', 'EUR'],
    ['vat_rate', '21'],
    ['country', 'NL'],
    ['address', ''],
    ['phone', ''],
    ['email', ''],
    ['website', ''],
  ];
  const upsertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of seedSettings) {
    upsertSetting.run(key, value);
  }
}

initDatabase();

// Run migrations
try {
  customerAuthMigration.runMigration(db);
} catch (error) {
  console.error('Failed to run customer auth migration:', error.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateSlug(brand, model, year) {
  const base = `${brand}-${model}-${year}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  // Ensure uniqueness
  let slug = base;
  let counter = 1;
  while (db.prepare('SELECT id FROM cars WHERE slug = ?').get(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `HOS-${year}-`;
  const last = db.prepare("SELECT invoice_number FROM sales_transactions WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1").get(`${prefix}%`);
  let seq = 1;
  if (last && last.invoice_number) {
    const parts = last.invoice_number.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function calculateLeadScore(customer) {
  let score = 0;
  if (customer.phone) score += 10;
  if (customer.email) score += 5;
  // Check inquiries
  const inquiryCount = db.prepare('SELECT COUNT(*) as c FROM inquiries WHERE customer_id = ?').get(customer.id)?.c || 0;
  if (inquiryCount > 0) score += 15;
  // Check offers
  const offerCount = db.prepare('SELECT COUNT(*) as c FROM offers WHERE customer_id = ?').get(customer.id)?.c || 0;
  if (offerCount > 0) score += 25;
  // Check viewing scheduled
  const viewingCount = db.prepare("SELECT COUNT(*) as c FROM inquiries WHERE customer_id = ? AND inquiry_type = 'viewing'").get(customer.id)?.c || 0;
  if (viewingCount > 0) score += 20;
  // Returning customer
  if (customer.total_purchases > 0) score += 15;
  return Math.min(score, 100);
}

function recalcLeadScore(customerId) {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
  if (!customer) return;
  const score = calculateLeadScore(customer);
  db.prepare('UPDATE customers SET lead_score = ? WHERE id = ?').run(score, customerId);
}

function logActivity(entityType, entityId, action, details, performedBy) {
  db.prepare('INSERT INTO activity_log (entity_type, entity_id, action, details, performed_by) VALUES (?, ?, ?, ?, ?)').run(
    entityType, entityId, action, typeof details === 'string' ? details : JSON.stringify(details), performedBy || null
  );
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  console.error('❌ ERROR: SESSION_SECRET environment variable is required!');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for now
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for now
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Customer authentication rate limiter
const customerAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Customer registration rate limiter
const customerRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 registration attempts
  message: 'Too many registration attempts, please try again later.',
});

// Unified login rate limiter
const unifiedLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust Railway's reverse proxy so secure cookies work correctly
app.set('trust proxy', 1);

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'hos_session_id', // Don't use default 'connect.sid'
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 30, // 30 minutes
  },
}));

// Serve uploaded images and documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Redirect old admin login page to unified login
app.get('/admin-login.html', (req, res) => {
  res.redirect(301, '/login.html');
});

// Serve frontend static files
app.use(express.static(__dirname, { index: 'index.html' }));

// ---------------------------------------------------------------------------
// Multer configs
// ---------------------------------------------------------------------------
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const imageFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/i;
  if (allowed.test(path.extname(file.originalname)) && allowed.test(file.mimetype.split('/')[1])) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
  }
};

const upload = multer({ storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCS_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const docFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|pdf|doc|docx/i;
  if (allowed.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error('Only image and document files (jpg, png, webp, gif, pdf, doc, docx) are allowed'));
  }
};

const uploadDocs = multer({ storage: docStorage, fileFilter: docFilter, limits: { fileSize: 25 * 1024 * 1024 } });

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Authentication required' });
}

// Customer authentication middleware
function requireCustomerAuth(req, res, next) {
  if (req.session && req.session.customerUserId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

// ---------------------------------------------------------------------------
// Input Validation Middleware
// ---------------------------------------------------------------------------
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

// Sanitize HTML input to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Helper functions for customer authentication
function isAccountLocked(account) {
  if (!account.lockout_until) return false;
  const lockoutTime = new Date(account.lockout_until);
  if (lockoutTime > new Date()) {
    return true;
  }
  // Lockout expired, clear it
  db.prepare('UPDATE customer_accounts SET lockout_until = NULL, failed_login_attempts = 0 WHERE id = ?')
    .run(account.id);
  return false;
}

function handleFailedCustomerLogin(accountId) {
  const stmt = db.prepare('SELECT failed_login_attempts FROM customer_accounts WHERE id = ?');
  const account = stmt.get(accountId);
  const newAttempts = (account.failed_login_attempts || 0) + 1;

  if (newAttempts >= 5) {
    const lockoutUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    db.prepare('UPDATE customer_accounts SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?')
      .run(newAttempts, lockoutUntil, accountId);
    return { locked: true };
  }

  db.prepare('UPDATE customer_accounts SET failed_login_attempts = ? WHERE id = ?')
    .run(newAttempts, accountId);
  return { locked: false };
}

// ---------------------------------------------------------------------------
// AUTH routes
// ---------------------------------------------------------------------------
app.post('/api/auth/login',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3, max: 50 }).escape(),
    body('password').isLength({ min: 8, max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) {
        // Use same error message to prevent username enumeration
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Use async bcrypt compare for better security
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        // Log failed attempt
        logActivity('user', user.id, 'login_failed', { ip: req.ip }, null);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Regenerate session ID to prevent fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;

        // Log successful login
        logActivity('user', user.id, 'login_success', { ip: req.ip }, user.id);

        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            full_name: user.full_name
          }
        });
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

app.post('/api/auth/logout', (req, res) => {
  const userId = req.session?.userId;
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('hos_session_id');
    if (userId) {
      logActivity('user', userId, 'logout', { ip: req.ip }, userId);
    }
    res.json({ message: 'Logged out' });
  });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ authenticated: true, user: { id: req.session.userId, username: req.session.username, role: req.session.role } });
  }
  res.status(401).json({ authenticated: false });
});

// ---------------------------------------------------------------------------
// UNIFIED LOGIN route
// ---------------------------------------------------------------------------
app.post('/api/auth/unified-login',
  unifiedLoginLimiter,
  [
    body('identifier').trim().isLength({ min: 3, max: 254 }),
    body('password').isLength({ min: 1, max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const isEmail = identifier.includes('@');

      if (isEmail) {
        // Customer login path
        const user = db.prepare('SELECT * FROM customer_accounts WHERE LOWER(email) = LOWER(?)').get(identifier);

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (isAccountLocked(user)) {
          return res.status(423).json({ error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
          const lockoutResult = handleFailedCustomerLogin(user.id);
          logActivity('customer_account', user.id, 'login_failed', { ip: req.ip }, null);
          if (lockoutResult.locked) {
            return res.status(423).json({ error: 'Account locked due to too many failed login attempts. Please try again in 30 minutes.' });
          }
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        db.prepare('UPDATE customer_accounts SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);

        req.session.regenerate((err) => {
          if (err) return res.status(500).json({ error: 'Internal server error' });
          req.session.customerUserId = user.id;
          req.session.customerEmail = user.email;
          req.session.isCustomer = true;
          logActivity('customer_account', user.id, 'login_success', { ip: req.ip }, null);
          res.json({ message: 'Login successful', role: 'customer', redirectTo: 'account.html' });
        });

      } else {
        // Admin login path
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(identifier);

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
          logActivity('user', user.id, 'login_failed', { ip: req.ip }, null);
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.regenerate((err) => {
          if (err) return res.status(500).json({ error: 'Internal server error' });
          req.session.userId = user.id;
          req.session.username = user.username;
          req.session.role = user.role;
          logActivity('user', user.id, 'login_success', { ip: req.ip }, user.id);
          res.json({ message: 'Login successful', role: 'admin', redirectTo: 'admin.html' });
        });
      }
    } catch (err) {
      console.error('Unified login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ---------------------------------------------------------------------------
// CUSTOMER AUTH routes
// ---------------------------------------------------------------------------

// POST /api/customer/register - Register new customer account
app.post('/api/customer/register',
  customerRegisterLimiter,
  [
    body('email').trim().toLowerCase().isEmail().normalizeEmail(),
    body('password').isLength({ min: 8, max: 100 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('first_name').optional().trim().isLength({ min: 2, max: 50 }).escape(),
    body('last_name').optional().trim().isLength({ min: 2, max: 50 }).escape(),
    body('phone').optional().trim().isLength({ max: 20 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password, first_name, last_name, phone } = req.body;

      // Check if email already exists (case-insensitive)
      const existingUser = db.prepare('SELECT id FROM customer_accounts WHERE LOWER(email) = LOWER(?)').get(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password with bcrypt (13 rounds)
      const password_hash = await bcrypt.hash(password, 13);

      // Insert new customer account
      const result = db.prepare(
        'INSERT INTO customer_accounts (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)'
      ).run(email, password_hash, first_name || null, last_name || null, phone || null);

      const customerId = result.lastInsertRowid;

      // Auto-login: Set session
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Registration successful but login failed' });
        }

        req.session.customerUserId = customerId;
        req.session.customerEmail = email;
        req.session.isCustomer = true;

        // Log account creation
        logActivity('customer_account', customerId, 'created', { email, ip: req.ip }, null);

        // Fetch and return user data
        const user = db.prepare('SELECT id, email, first_name, last_name, phone, created_at FROM customer_accounts WHERE id = ?').get(customerId);

        res.status(201).json({
          message: 'Registration successful',
          user: user
        });
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/customer/login - Customer login
app.post('/api/customer/login',
  customerAuthLimiter,
  [
    body('email').trim().toLowerCase().isEmail(),
    body('password').isLength({ min: 1 })
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Fetch user by email (case-insensitive)
      const user = db.prepare('SELECT * FROM customer_accounts WHERE LOWER(email) = LOWER(?)').get(email);

      if (!user) {
        // Use same error message to prevent email enumeration
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check lockout status
      if (isAccountLocked(user)) {
        return res.status(423).json({
          error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
        });
      }

      // Compare password with bcrypt
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        // Handle failed login
        const lockoutResult = handleFailedCustomerLogin(user.id);
        logActivity('customer_account', user.id, 'login_failed', { ip: req.ip }, null);

        if (lockoutResult.locked) {
          logActivity('customer_account', user.id, 'account_locked', { ip: req.ip, reason: 'Too many failed login attempts' }, null);
          return res.status(423).json({
            error: 'Account locked due to too many failed login attempts. Please try again in 30 minutes.'
          });
        }

        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Successful login - Reset failed attempts and lockout
      db.prepare('UPDATE customer_accounts SET failed_login_attempts = 0, lockout_until = NULL, last_login_at = datetime(\'now\') WHERE id = ?')
        .run(user.id);

      // Regenerate session ID to prevent fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        req.session.customerUserId = user.id;
        req.session.customerEmail = user.email;
        req.session.isCustomer = true;

        // Log successful login
        logActivity('customer_account', user.id, 'login_success', { ip: req.ip }, null);

        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone
          }
        });
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/customer/logout - Customer logout
app.post('/api/customer/logout', (req, res) => {
  const customerUserId = req.session?.customerUserId;

  if (customerUserId) {
    logActivity('customer_account', customerUserId, 'logout', { ip: req.ip }, null);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('hos_session_id');
    res.json({ message: 'Logged out successfully' });
  });
});

// GET /api/customer/check - Check customer authentication status
app.get('/api/customer/check', (req, res) => {
  if (req.session && req.session.customerUserId) {
    // Fetch current user data from database
    const user = db.prepare('SELECT id, email, first_name, last_name, phone FROM customer_accounts WHERE id = ?')
      .get(req.session.customerUserId);

    if (user) {
      return res.json({ authenticated: true, user: user });
    }
  }
  res.json({ authenticated: false });
});

// ===========================================================================
// PUBLIC CAR ROUTES
// ===========================================================================

// GET /api/cars - List cars with extensive filters
app.get('/api/cars', (req, res) => {
  try {
    const {
      status, featured, just_arrived, price_reduced, brand, model,
      yearMin, yearMax, priceMin, priceMax, bodyType, fuelType,
      transmission, drivetrain, condition, search, sort,
      limit, offset,
    } = req.query;

    let sql = 'SELECT * FROM cars WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM cars WHERE 1=1';
    const params = [];
    const countParams = [];

    function addFilter(clause, value) {
      sql += clause;
      countSql += clause;
      params.push(value);
      countParams.push(value);
    }

    if (status) addFilter(' AND status = ?', status);
    if (featured !== undefined) addFilter(' AND featured = ?', Number(featured));
    if (just_arrived !== undefined) addFilter(' AND just_arrived = ?', Number(just_arrived));
    if (price_reduced !== undefined) addFilter(' AND price_reduced = ?', Number(price_reduced));
    if (brand) addFilter(' AND brand = ?', brand);
    if (model) addFilter(' AND model = ?', model);
    if (yearMin) addFilter(' AND year >= ?', Number(yearMin));
    if (yearMax) addFilter(' AND year <= ?', Number(yearMax));
    if (priceMin) addFilter(' AND price >= ?', Number(priceMin));
    if (priceMax) addFilter(' AND price <= ?', Number(priceMax));
    if (bodyType) addFilter(' AND body_type = ?', bodyType);
    if (fuelType) addFilter(' AND fuel_type = ?', fuelType);
    if (transmission) addFilter(' AND transmission = ?', transmission);
    if (drivetrain) addFilter(' AND drivetrain = ?', drivetrain);
    if (condition) addFilter(' AND condition_rating = ?', condition);

    if (search) {
      const searchClause = ' AND (title LIKE ? OR brand LIKE ? OR model LIKE ? OR description LIKE ?)';
      const searchVal = `%${search}%`;
      sql += searchClause;
      countSql += searchClause;
      params.push(searchVal, searchVal, searchVal, searchVal);
      countParams.push(searchVal, searchVal, searchVal, searchVal);
    }

    // Sorting
    switch (sort) {
      case 'price_asc': sql += ' ORDER BY price ASC'; break;
      case 'price_desc': sql += ' ORDER BY price DESC'; break;
      case 'year_asc': sql += ' ORDER BY year ASC'; break;
      case 'year_desc': sql += ' ORDER BY year DESC'; break;
      case 'newest': sql += ' ORDER BY created_at DESC'; break;
      case 'mileage_asc': sql += ' ORDER BY mileage ASC'; break;
      case 'mileage_desc': sql += ' ORDER BY mileage DESC'; break;
      case 'popular': sql += ' ORDER BY views_count DESC'; break;
      default: sql += ' ORDER BY created_at DESC';
    }

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(Number(offset));
      }
    }

    const cars = db.prepare(sql).all(...params);
    const { total } = db.prepare(countSql).get(...countParams);

    // Attach primary image to each car
    const imgStmt = db.prepare('SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC LIMIT 1');
    for (const car of cars) {
      const img = imgStmt.get(car.id);
      car.primary_image = img ? `/uploads/cars/${img.filename}` : null;
    }

    res.json({ cars, total });
  } catch (err) {
    console.error('GET /api/cars error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/brands - List all unique brands with count
app.get('/api/cars/brands', (req, res) => {
  try {
    const brands = db.prepare("SELECT brand, COUNT(*) as count FROM cars WHERE status != 'sold' GROUP BY brand ORDER BY brand ASC").all();
    res.json(brands);
  } catch (err) {
    console.error('GET /api/cars/brands error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/stats - Public stats
app.get('/api/cars/stats', (req, res) => {
  try {
    const total = db.prepare("SELECT COUNT(*) as count FROM cars WHERE status = 'available'").get().count;
    const brands = db.prepare("SELECT COUNT(DISTINCT brand) as count FROM cars WHERE status = 'available'").get().count;
    const priceRange = db.prepare("SELECT MIN(price) as min_price, MAX(price) as max_price FROM cars WHERE status = 'available'").get();
    res.json({
      total_available: total,
      brands_available: brands,
      price_min: priceRange.min_price || 0,
      price_max: priceRange.max_price || 0,
    });
  } catch (err) {
    console.error('GET /api/cars/stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/finance/calculate - Finance calculator
app.get('/api/finance/calculate', (req, res) => {
  try {
    const { price, deposit, term, rate } = req.query;
    const p = Number(price) - Number(deposit || 0);
    const months = Number(term || 48);
    const annualRate = Number(rate || 5.9);
    const monthlyRate = annualRate / 100 / 12;

    if (p <= 0 || months <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    let monthlyPayment;
    if (monthlyRate === 0) {
      monthlyPayment = p / months;
    } else {
      monthlyPayment = p * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalCost = monthlyPayment * months;
    const totalInterest = totalCost - p;

    res.json({
      loan_amount: Math.round(p * 100) / 100,
      monthly_payment: Math.round(monthlyPayment * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      term_months: months,
      annual_rate: annualRate,
    });
  } catch (err) {
    console.error('GET /api/finance/calculate error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/:idOrSlug - Get by id or slug, auto-increment views_count
app.get('/api/cars/:idOrSlug', (req, res) => {
  try {
    const param = req.params.idOrSlug;
    let car;
    if (/^\d+$/.test(param)) {
      car = db.prepare('SELECT * FROM cars WHERE id = ?').get(Number(param));
    } else {
      car = db.prepare('SELECT * FROM cars WHERE slug = ?').get(param);
    }
    if (!car) return res.status(404).json({ error: 'Car not found' });

    // Increment views
    db.prepare('UPDATE cars SET views_count = views_count + 1 WHERE id = ?').run(car.id);
    car.views_count += 1;

    // Attach images
    const images = db.prepare('SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC').all(car.id);
    car.images = images.map(img => ({
      id: img.id,
      filename: img.filename,
      url: `/uploads/cars/${img.filename}`,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    }));

    // Attach documents
    const docs = db.prepare('SELECT * FROM car_documents WHERE car_id = ? ORDER BY uploaded_at DESC').all(car.id);
    car.documents = docs.map(d => ({
      id: d.id,
      filename: d.filename,
      original_name: d.original_name,
      document_type: d.document_type,
      description: d.description,
      url: `/uploads/documents/${d.filename}`,
      uploaded_at: d.uploaded_at,
    }));

    // Parse features JSON
    if (car.features) {
      try { car.features = JSON.parse(car.features); } catch (e) { /* keep as string */ }
    }

    res.json(car);
  } catch (err) {
    console.error('GET /api/cars/:idOrSlug error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/:id/similar - Find 4 similar cars
app.get('/api/cars/:id/similar', (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const priceMin = car.price * 0.5;
    const priceMax = car.price * 1.5;

    // Same brand first, then same body type, similar price range
    const similar = db.prepare(`
      SELECT *,
        CASE WHEN brand = ? THEN 2 ELSE 0 END + CASE WHEN body_type = ? THEN 1 ELSE 0 END as relevance
      FROM cars
      WHERE id != ? AND status = 'available' AND price BETWEEN ? AND ?
      ORDER BY relevance DESC, ABS(price - ?) ASC
      LIMIT 4
    `).all(car.brand, car.body_type, car.id, priceMin, priceMax, car.price);

    const imgStmt = db.prepare('SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC LIMIT 1');
    for (const c of similar) {
      const img = imgStmt.get(c.id);
      c.primary_image = img ? `/uploads/cars/${img.filename}` : null;
      delete c.relevance;
    }

    res.json(similar);
  } catch (err) {
    console.error('GET /api/cars/:id/similar error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rate limiter for inquiry submissions
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 inquiries per hour per IP
  message: 'Too many inquiries from this IP, please try again later.',
  skipSuccessfulRequests: false,
});

// POST /api/cars/:id/inquire - Public inquiry submission (PROTECTED)
app.post('/api/cars/:id/inquire',
  inquiryLimiter,
  [
    body('first_name').trim().isLength({ min: 2, max: 50 }).escape().withMessage('First name must be 2-50 characters'),
    body('last_name').trim().isLength({ min: 2, max: 50 }).escape().withMessage('Last name must be 2-50 characters'),
    body('email').optional({ checkFalsy: true }).trim().isEmail().normalizeEmail().withMessage('Invalid email'),
    body('phone').optional({ checkFalsy: true }).trim().matches(/^[\d\s\+\-\(\)]+$/).withMessage('Invalid phone number'),
    body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message too long (max 1000 characters)'),
    body('inquiry_type').optional().isIn(['general', 'viewing', 'test_drive', 'purchase', 'financing']).withMessage('Invalid inquiry type'),
    body('preferred_contact_time').optional().trim().isLength({ max: 100 }),
    body('source').optional().trim().isIn(['website', 'phone', 'email', 'referral', 'social']).withMessage('Invalid source'),
  ],
  validateRequest,
  (req, res) => {
    try {
      const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
      if (!car) return res.status(404).json({ error: 'Car not found' });

      const { first_name, last_name, email, phone, message, inquiry_type, preferred_contact_time, source } = req.body;

      // Require at least email OR phone
      if (!email && !phone) {
        return res.status(400).json({ error: 'Either email or phone is required' });
      }

      // Sanitize message to prevent XSS
      const sanitizedMessage = message ? sanitizeInput(message) : null;

      // Find or create customer
      let customer;
      if (email) {
        customer = db.prepare('SELECT * FROM customers WHERE email = ?').get(email);
      }
      if (!customer && phone) {
        customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
      }

      if (!customer) {
        const result = db.prepare(
          'INSERT INTO customers (first_name, last_name, email, phone, lead_source) VALUES (?, ?, ?, ?, ?)'
        ).run(first_name, last_name, email || null, phone || null, source || 'website');
        customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
        logActivity('customer', customer.id, 'created', { source: 'public_inquiry', ip: req.ip }, null);
      }

      // Create inquiry
      const inqResult = db.prepare(
        'INSERT INTO inquiries (car_id, customer_id, inquiry_type, message, preferred_contact_time, source) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(car.id, customer.id, inquiry_type || 'general', sanitizedMessage, preferred_contact_time || null, source || 'website');

      // Increment inquiry count on car
      db.prepare('UPDATE cars SET inquiry_count = inquiry_count + 1 WHERE id = ?').run(car.id);

      // Recalculate lead score
      recalcLeadScore(customer.id);

      logActivity('inquiry', inqResult.lastInsertRowid, 'created', { car_id: car.id, customer_id: customer.id, ip: req.ip }, null);

      res.status(201).json({ message: 'Inquiry submitted successfully', inquiry_id: inqResult.lastInsertRowid });
    } catch (err) {
      console.error('POST /api/cars/:id/inquire error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ===========================================================================
// ADMIN CAR ROUTES
// ===========================================================================

// GET /api/admin/cars - List all cars (admin, no public filters)
app.get('/api/admin/cars', requireAuth, (req, res) => {
  try {
    const { status, brand, search, sort, limit, offset } = req.query;

    let sql = 'SELECT * FROM cars WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM cars WHERE 1=1';
    const params = [];
    const countParams = [];

    function addFilter(clause, value) {
      sql += clause;
      countSql += clause;
      params.push(value);
      countParams.push(value);
    }

    if (status) addFilter(' AND status = ?', status);
    if (brand) addFilter(' AND brand = ?', brand);
    if (search) {
      const searchClause = ' AND (title LIKE ? OR brand LIKE ? OR model LIKE ? OR description LIKE ?)';
      const searchVal = `%${search}%`;
      sql += searchClause;
      countSql += searchClause;
      params.push(searchVal, searchVal, searchVal, searchVal);
      countParams.push(searchVal, searchVal, searchVal, searchVal);
    }

    switch (sort) {
      case 'price_asc': sql += ' ORDER BY price ASC'; break;
      case 'price_desc': sql += ' ORDER BY price DESC'; break;
      case 'year_desc': sql += ' ORDER BY year DESC'; break;
      case 'newest': sql += ' ORDER BY created_at DESC'; break;
      default: sql += ' ORDER BY created_at DESC';
    }

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(Number(offset));
      }
    }

    const cars = db.prepare(sql).all(...params);
    const { total } = db.prepare(countSql).get(...countParams);

    // Attach primary image to each car
    const imgStmt = db.prepare('SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC LIMIT 1');
    for (const car of cars) {
      const img = imgStmt.get(car.id);
      car.primary_image = img ? `/uploads/cars/${img.filename}` : null;
    }

    res.json({ cars, total });
  } catch (err) {
    console.error('GET /api/admin/cars error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/cars/:id - Get single car (admin, does NOT increment views)
app.get('/api/admin/cars/:id', requireAuth, (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    // Attach images
    const images = db.prepare('SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC').all(car.id);
    car.images = images.map(img => ({
      id: img.id,
      filename: img.filename,
      url: `/uploads/cars/${img.filename}`,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    }));

    // Attach documents
    const docs = db.prepare('SELECT * FROM car_documents WHERE car_id = ? ORDER BY uploaded_at DESC').all(car.id);
    car.documents = docs.map(d => ({
      id: d.id,
      filename: d.filename,
      original_name: d.original_name,
      document_type: d.document_type,
      description: d.description,
      url: `/uploads/documents/${d.filename}`,
      uploaded_at: d.uploaded_at,
    }));

    // Parse features JSON
    if (car.features) {
      try { car.features = JSON.parse(car.features); } catch (e) { /* keep as string */ }
    }

    res.json(car);
  } catch (err) {
    console.error('GET /api/admin/cars/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/cars - Create car
app.post('/api/admin/cars', requireAuth, upload.array('images', 20), (req, res) => {
  try {
    const b = req.body;

    if (!b.title || !b.brand || !b.model || !b.year || !b.price) {
      return res.status(400).json({ error: 'title, brand, model, year, and price are required' });
    }

    const slug = generateSlug(b.brand, b.model, b.year);

    const result = db.prepare(`
      INSERT INTO cars (
        title, slug, brand, model, variant_trim, year, production_year,
        price, price_currency, price_qualifier, reserve_price, acquisition_cost,
        vat_status, vat_rate,
        mileage, mileage_unit, fuel_type, transmission, drivetrain,
        engine_type, engine_displacement, engine_cylinders, engine_configuration, engine_aspiration,
        horsepower, torque, top_speed, acceleration_0_100,
        body_type, doors, seats,
        color_exterior, color_exterior_code, color_interior, interior_material,
        condition_rating, owners_count, registration_number, vin,
        matching_numbers, production_number,
        provenance, restoration_history, concours_history, racing_history,
        service_history, mot_status, mot_expiry,
        location_city, location_country,
        description, features,
        status, featured, just_arrived, price_reduced,
        listed_at, created_by
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        datetime('now'), ?
      )
    `).run(
      b.title, slug, b.brand, b.model, b.variant_trim || null, Number(b.year), b.production_year ? Number(b.production_year) : null,
      Number(b.price), b.price_currency || 'EUR', b.price_qualifier || 'fixed', b.reserve_price ? Number(b.reserve_price) : null, b.acquisition_cost ? Number(b.acquisition_cost) : null,
      b.vat_status || 'margin', b.vat_rate ? Number(b.vat_rate) : 21,
      b.mileage ? Number(b.mileage) : 0, b.mileage_unit || 'km', b.fuel_type || 'Petrol', b.transmission || 'Automatic', b.drivetrain || 'RWD',
      b.engine_type || null, b.engine_displacement || null, b.engine_cylinders ? Number(b.engine_cylinders) : null, b.engine_configuration || null, b.engine_aspiration || null,
      b.horsepower ? Number(b.horsepower) : null, b.torque || null, b.top_speed || null, b.acceleration_0_100 || null,
      b.body_type || 'Coupe', b.doors ? Number(b.doors) : null, b.seats ? Number(b.seats) : null,
      b.color_exterior || null, b.color_exterior_code || null, b.color_interior || null, b.interior_material || null,
      b.condition_rating || null, b.owners_count ? Number(b.owners_count) : null, b.registration_number || null, b.vin || null,
      b.matching_numbers ? Number(b.matching_numbers) : 0, b.production_number || null,
      b.provenance || null, b.restoration_history || null, b.concours_history || null, b.racing_history || null,
      b.service_history || 'none', b.mot_status || null, b.mot_expiry || null,
      b.location_city || null, b.location_country || null,
      b.description || null, Array.isArray(b.features) ? JSON.stringify(b.features) : (b.features || null),
      b.status || 'available', b.featured ? Number(b.featured) : 0, b.just_arrived ? Number(b.just_arrived) : 0, b.price_reduced ? Number(b.price_reduced) : 0,
      req.session.userId
    );

    const carId = result.lastInsertRowid;

    // Save uploaded images
    if (req.files && req.files.length > 0) {
      const insertImg = db.prepare('INSERT INTO car_images (car_id, filename, is_primary, sort_order) VALUES (?, ?, ?, ?)');
      const insertMany = db.transaction((files) => {
        files.forEach((file, idx) => {
          insertImg.run(carId, file.filename, idx === 0 ? 1 : 0, idx);
        });
      });
      insertMany(req.files);
    }

    logActivity('car', carId, 'created', { title: b.title, brand: b.brand, model: b.model }, req.session.userId);

    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(carId);
    const images = db.prepare('SELECT * FROM car_images WHERE car_id = ?').all(carId);
    car.images = images.map(img => ({ id: img.id, filename: img.filename, url: `/uploads/cars/${img.filename}`, is_primary: img.is_primary, sort_order: img.sort_order }));

    res.status(201).json(car);
  } catch (err) {
    console.error('POST /api/admin/cars error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/cars/:id - Update car
app.put('/api/admin/cars/:id', requireAuth, (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const b = req.body;

    // Track price changes
    if (b.price !== undefined && Number(b.price) !== car.price) {
      db.prepare('INSERT INTO price_history (car_id, old_price, new_price, changed_by, reason) VALUES (?, ?, ?, ?, ?)').run(
        car.id, car.price, Number(b.price), req.session.userId, b.price_change_reason || null
      );
      // Mark as price reduced if new price is lower
      if (Number(b.price) < car.price) {
        b.price_reduced = 1;
      }
    }

    // Regenerate slug if brand/model/year changed
    let newSlug = car.slug;
    const newBrand = b.brand || car.brand;
    const newModel = b.model || car.model;
    const newYear = b.year ? Number(b.year) : car.year;
    if (b.brand || b.model || b.year) {
      // Check if slug needs update
      const testSlug = `${newBrand}-${newModel}-${newYear}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!car.slug || !car.slug.startsWith(testSlug)) {
        // Temporarily remove current car's slug to avoid self-collision
        db.prepare('UPDATE cars SET slug = NULL WHERE id = ?').run(car.id);
        newSlug = generateSlug(newBrand, newModel, newYear);
      }
    }

    // Build dynamic update
    const fields = [
      'title', 'brand', 'model', 'variant_trim', 'year', 'production_year',
      'price', 'price_currency', 'price_qualifier', 'reserve_price', 'acquisition_cost',
      'vat_status', 'vat_rate',
      'mileage', 'mileage_unit', 'fuel_type', 'transmission', 'drivetrain',
      'engine_type', 'engine_displacement', 'engine_cylinders', 'engine_configuration', 'engine_aspiration',
      'horsepower', 'torque', 'top_speed', 'acceleration_0_100',
      'body_type', 'doors', 'seats',
      'color_exterior', 'color_exterior_code', 'color_interior', 'interior_material',
      'condition_rating', 'owners_count', 'registration_number', 'vin',
      'matching_numbers', 'production_number',
      'provenance', 'restoration_history', 'concours_history', 'racing_history',
      'service_history', 'mot_status', 'mot_expiry',
      'location_city', 'location_country',
      'description', 'features',
      'status', 'featured', 'just_arrived', 'price_reduced',
    ];

    const setClauses = ['slug = ?', "updated_at = datetime('now')"];
    const values = [newSlug];

    for (const field of fields) {
      if (b[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        const numericFields = ['year', 'production_year', 'price', 'reserve_price', 'acquisition_cost', 'vat_rate', 'mileage', 'engine_cylinders', 'horsepower', 'torque', 'top_speed', 'acceleration_0_100', 'doors', 'seats', 'owners_count', 'matching_numbers', 'featured', 'just_arrived', 'price_reduced'];
        if (field === 'features' && Array.isArray(b[field])) {
          values.push(JSON.stringify(b[field]));
        } else if (numericFields.includes(field)) {
          values.push(b[field] === '' || b[field] === null ? null : Number(b[field]));
        } else {
          values.push(b[field] === '' ? null : b[field]);
        }
      }
    }

    values.push(req.params.id);
    db.prepare(`UPDATE cars SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

    logActivity('car', car.id, 'updated', { changed_fields: Object.keys(b).filter(k => k !== 'price_change_reason') }, req.session.userId);

    const updated = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    const images = db.prepare('SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC').all(updated.id);
    updated.images = images.map(img => ({ id: img.id, filename: img.filename, url: `/uploads/cars/${img.filename}`, is_primary: img.is_primary, sort_order: img.sort_order }));

    res.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/cars/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/cars/:id
app.delete('/api/admin/cars/:id', requireAuth, (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    // Delete image files from disk
    const images = db.prepare('SELECT filename FROM car_images WHERE car_id = ?').all(car.id);
    for (const img of images) {
      const filepath = path.join(UPLOADS_DIR, img.filename);
      fs.unlink(filepath, (err) => {
        if (err && err.code !== 'ENOENT') console.error('Failed to delete image file:', filepath, err);
      });
    }

    // Delete document files from disk
    const docs = db.prepare('SELECT filename FROM car_documents WHERE car_id = ?').all(car.id);
    for (const doc of docs) {
      const filepath = path.join(DOCS_DIR, doc.filename);
      fs.unlink(filepath, (err) => {
        if (err && err.code !== 'ENOENT') console.error('Failed to delete doc file:', filepath, err);
      });
    }

    logActivity('car', car.id, 'deleted', { title: car.title }, req.session.userId);

    // Delete dependent records that reference this car (FK constraints)
    db.prepare('DELETE FROM sales_transactions WHERE car_id = ?').run(car.id);
    db.prepare('DELETE FROM reservations WHERE car_id = ?').run(car.id);
    db.prepare('DELETE FROM offers WHERE car_id = ?').run(car.id);
    db.prepare('DELETE FROM price_history WHERE car_id = ?').run(car.id);
    // CASCADE handles car_images and car_documents rows
    db.prepare('DELETE FROM cars WHERE id = ?').run(req.params.id);

    res.json({ message: 'Car deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/cars/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/cars/:id/images - Upload images
app.post('/api/admin/cars/:id/images', requireAuth, upload.array('images', 20), (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM car_images WHERE car_id = ?').get(car.id);
    let nextOrder = (maxOrder.max_order ?? -1) + 1;
    const hasPrimary = db.prepare('SELECT id FROM car_images WHERE car_id = ? AND is_primary = 1').get(car.id);

    const insertImg = db.prepare('INSERT INTO car_images (car_id, filename, is_primary, sort_order) VALUES (?, ?, ?, ?)');
    const insertMany = db.transaction((files) => {
      files.forEach((file, idx) => {
        const isPrimary = (!hasPrimary && idx === 0) ? 1 : 0;
        insertImg.run(car.id, file.filename, isPrimary, nextOrder + idx);
      });
    });
    insertMany(req.files);

    const images = db.prepare('SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC').all(car.id);
    res.status(201).json(images.map(img => ({ id: img.id, filename: img.filename, url: `/uploads/cars/${img.filename}`, is_primary: img.is_primary, sort_order: img.sort_order })));
  } catch (err) {
    console.error('POST /api/admin/cars/:id/images error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/cars/:id/images/:imageId - Update image (set primary)
app.put('/api/admin/cars/:id/images/:imageId', requireAuth, (req, res) => {
  try {
    const image = db.prepare('SELECT * FROM car_images WHERE id = ? AND car_id = ?').get(req.params.imageId, req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    if (req.body.is_primary) {
      // Unset all other images as primary for this car
      db.prepare('UPDATE car_images SET is_primary = 0 WHERE car_id = ?').run(req.params.id);
      // Set this one as primary
      db.prepare('UPDATE car_images SET is_primary = 1 WHERE id = ?').run(image.id);
    }

    const images = db.prepare('SELECT * FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC').all(req.params.id);
    res.json(images.map(img => ({ id: img.id, filename: img.filename, url: `/uploads/cars/${img.filename}`, is_primary: img.is_primary, sort_order: img.sort_order })));
  } catch (err) {
    console.error('PUT /api/admin/cars/:id/images/:imageId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/cars/:id/images/:imageId
app.delete('/api/admin/cars/:id/images/:imageId', requireAuth, (req, res) => {
  try {
    const image = db.prepare('SELECT * FROM car_images WHERE id = ? AND car_id = ?').get(req.params.imageId, req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    const filepath = path.join(UPLOADS_DIR, image.filename);
    try { fs.unlinkSync(filepath); } catch (e) {
      if (e.code !== 'ENOENT') console.error('Failed to delete image file:', filepath, e);
    }

    db.prepare('DELETE FROM car_images WHERE id = ?').run(image.id);

    if (image.is_primary) {
      const next = db.prepare('SELECT id FROM car_images WHERE car_id = ? ORDER BY sort_order ASC LIMIT 1').get(req.params.id);
      if (next) {
        db.prepare('UPDATE car_images SET is_primary = 1 WHERE id = ?').run(next.id);
      }
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('DELETE image error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/cars/:id/documents - Upload documents
app.post('/api/admin/cars/:id/documents', requireAuth, uploadDocs.array('documents', 10), (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No documents uploaded' });
    }

    const insertDoc = db.prepare('INSERT INTO car_documents (car_id, filename, original_name, document_type, description) VALUES (?, ?, ?, ?, ?)');
    const docType = req.body.document_type || 'other';
    const description = req.body.description || null;

    const insertMany = db.transaction((files) => {
      files.forEach((file) => {
        insertDoc.run(car.id, file.filename, file.originalname, docType, description);
      });
    });
    insertMany(req.files);

    const docs = db.prepare('SELECT * FROM car_documents WHERE car_id = ? ORDER BY uploaded_at DESC').all(car.id);
    res.status(201).json(docs.map(d => ({
      id: d.id,
      filename: d.filename,
      original_name: d.original_name,
      document_type: d.document_type,
      description: d.description,
      url: `/uploads/documents/${d.filename}`,
      uploaded_at: d.uploaded_at,
    })));
  } catch (err) {
    console.error('POST /api/admin/cars/:id/documents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/cars/:id/documents/:docId
app.delete('/api/admin/cars/:id/documents/:docId', requireAuth, (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM car_documents WHERE id = ? AND car_id = ?').get(req.params.docId, req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const filepath = path.join(DOCS_DIR, doc.filename);
    try { fs.unlinkSync(filepath); } catch (e) {
      if (e.code !== 'ENOENT') console.error('Failed to delete doc file:', filepath, e);
    }

    db.prepare('DELETE FROM car_documents WHERE id = ?').run(doc.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('DELETE document error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/cars/:id/status - Change car status
app.put('/api/admin/cars/:id/status', requireAuth, (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const validStatuses = ['available', 'reserved', 'deposit_taken', 'sold', 'consignment', 'incoming'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updates = { status };
    if (status === 'sold' && !car.sold_at) {
      updates.sold_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    db.prepare(`UPDATE cars SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(updates), car.id);

    logActivity('car', car.id, 'status_changed', { old_status: car.status, new_status: status }, req.session.userId);

    const updated = db.prepare('SELECT * FROM cars WHERE id = ?').get(car.id);
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/cars/:id/status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/cars/:id/history - Price history and activity log
app.get('/api/admin/cars/:id/history', requireAuth, (req, res) => {
  try {
    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const priceHistory = db.prepare(`
      SELECT ph.*, u.username as changed_by_username
      FROM price_history ph
      LEFT JOIN users u ON u.id = ph.changed_by
      WHERE ph.car_id = ?
      ORDER BY ph.created_at DESC
    `).all(car.id);

    const activityLog = db.prepare(`
      SELECT al.*, u.username as performed_by_username
      FROM activity_log al
      LEFT JOIN users u ON u.id = al.performed_by
      WHERE al.entity_type = 'car' AND al.entity_id = ?
      ORDER BY al.created_at DESC
    `).all(car.id);

    res.json({ price_history: priceHistory, activity_log: activityLog });
  } catch (err) {
    console.error('GET /api/admin/cars/:id/history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================================================
// CUSTOMER / CRM ROUTES
// ===========================================================================

// GET /api/admin/customers
app.get('/api/admin/customers', requireAuth, (req, res) => {
  try {
    const { status, customer_type, lead_source, assigned_to, search, sort, limit, offset } = req.query;

    let sql = 'SELECT * FROM customers WHERE 1=1';
    let countSql = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const params = [];
    const countParams = [];

    function addFilter(clause, value) {
      sql += clause;
      countSql += clause;
      params.push(value);
      countParams.push(value);
    }

    if (status) addFilter(' AND status = ?', status);
    if (customer_type) addFilter(' AND customer_type = ?', customer_type);
    if (lead_source) addFilter(' AND lead_source = ?', lead_source);
    if (assigned_to) addFilter(' AND assigned_to = ?', Number(assigned_to));

    if (search) {
      const clause = ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?)';
      const val = `%${search}%`;
      sql += clause;
      countSql += clause;
      params.push(val, val, val, val, val);
      countParams.push(val, val, val, val, val);
    }

    switch (sort) {
      case 'name_asc': sql += ' ORDER BY last_name ASC, first_name ASC'; break;
      case 'name_desc': sql += ' ORDER BY last_name DESC, first_name DESC'; break;
      case 'lead_score': sql += ' ORDER BY lead_score DESC'; break;
      case 'newest': sql += ' ORDER BY created_at DESC'; break;
      case 'last_contact': sql += ' ORDER BY last_contact_at DESC'; break;
      default: sql += ' ORDER BY created_at DESC';
    }

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(Number(offset));
      }
    }

    const customers = db.prepare(sql).all(...params);
    const { total } = db.prepare(countSql).get(...countParams);

    // Attach aggregated counts for each customer
    const inqCountStmt = db.prepare('SELECT COUNT(*) as count FROM inquiries WHERE customer_id = ?');
    const purchaseCountStmt = db.prepare('SELECT COUNT(*) as count FROM sales_transactions WHERE customer_id = ?');
    const offerCountStmt = db.prepare('SELECT COUNT(*) as count FROM offers WHERE customer_id = ?');
    for (const cust of customers) {
      cust.inquiries_count = inqCountStmt.get(cust.id).count;
      cust.purchases_count = purchaseCountStmt.get(cust.id).count;
      cust.offers_count = offerCountStmt.get(cust.id).count;
    }

    res.json({ customers, total });
  } catch (err) {
    console.error('GET /api/admin/customers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/customers/:id - Full customer profile
app.get('/api/admin/customers/:id', requireAuth, (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Parse tags
    if (customer.tags) {
      try { customer.tags = JSON.parse(customer.tags); } catch (e) { /* keep as string */ }
    }

    // Get inquiries
    customer.inquiries = db.prepare(`
      SELECT i.*, c.title as car_title, c.brand as car_brand, c.model as car_model
      FROM inquiries i
      LEFT JOIN cars c ON c.id = i.car_id
      WHERE i.customer_id = ?
      ORDER BY i.created_at DESC
    `).all(customer.id);

    // Get offers
    customer.offers = db.prepare(`
      SELECT o.*, c.title as car_title, c.brand as car_brand, c.model as car_model
      FROM offers o
      LEFT JOIN cars c ON c.id = o.car_id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `).all(customer.id);

    // Get purchases
    customer.purchases = db.prepare(`
      SELECT st.*, c.title as car_title, c.brand as car_brand, c.model as car_model
      FROM sales_transactions st
      LEFT JOIN cars c ON c.id = st.car_id
      WHERE st.customer_id = ?
      ORDER BY st.created_at DESC
    `).all(customer.id);

    // Get reservations
    customer.reservations = db.prepare(`
      SELECT r.*, c.title as car_title, c.brand as car_brand, c.model as car_model
      FROM reservations r
      LEFT JOIN cars c ON c.id = r.car_id
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC
    `).all(customer.id);

    // Assigned user
    if (customer.assigned_to) {
      const assignedUser = db.prepare('SELECT id, username, full_name FROM users WHERE id = ?').get(customer.assigned_to);
      customer.assigned_user = assignedUser || null;
    }

    res.json(customer);
  } catch (err) {
    console.error('GET /api/admin/customers/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/customers
app.post('/api/admin/customers', requireAuth, (req, res) => {
  try {
    const b = req.body;
    if (!b.first_name || !b.last_name) {
      return res.status(400).json({ error: 'first_name and last_name are required' });
    }

    const result = db.prepare(`
      INSERT INTO customers (
        first_name, last_name, email, phone, phone_secondary, preferred_contact,
        company_name, address, city, postal_code, country,
        customer_type, lead_source, status, assigned_to,
        notes, tags, gdpr_consent, gdpr_consent_date, newsletter_subscribed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      b.first_name, b.last_name, b.email || null, b.phone || null, b.phone_secondary || null, b.preferred_contact || 'email',
      b.company_name || null, b.address || null, b.city || null, b.postal_code || null, b.country || null,
      b.customer_type || 'private', b.lead_source || 'website', b.status || 'new', b.assigned_to ? Number(b.assigned_to) : null,
      b.notes || null, b.tags ? (typeof b.tags === 'string' ? b.tags : JSON.stringify(b.tags)) : null,
      b.gdpr_consent ? 1 : 0, b.gdpr_consent ? new Date().toISOString() : null, b.newsletter_subscribed ? 1 : 0
    );

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    recalcLeadScore(customer.id);

    logActivity('customer', customer.id, 'created', { name: `${b.first_name} ${b.last_name}` }, req.session.userId);

    res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id));
  } catch (err) {
    console.error('POST /api/admin/customers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/customers/:id
app.put('/api/admin/customers/:id', requireAuth, (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const b = req.body;
    const fields = [
      'first_name', 'last_name', 'email', 'phone', 'phone_secondary', 'preferred_contact',
      'company_name', 'address', 'city', 'postal_code', 'country',
      'customer_type', 'lead_source', 'status', 'assigned_to',
      'notes', 'tags', 'gdpr_consent', 'gdpr_consent_date', 'newsletter_subscribed',
      'last_contact_at', 'next_follow_up',
    ];

    const setClauses = ["updated_at = datetime('now')"];
    const values = [];

    for (const field of fields) {
      if (b[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        if (field === 'tags' && typeof b[field] !== 'string') {
          values.push(JSON.stringify(b[field]));
        } else if (['assigned_to', 'gdpr_consent', 'newsletter_subscribed'].includes(field)) {
          values.push(b[field] === null || b[field] === '' ? null : Number(b[field]));
        } else {
          values.push(b[field] === '' ? null : b[field]);
        }
      }
    }

    if (b.gdpr_consent && !customer.gdpr_consent) {
      setClauses.push('gdpr_consent_date = ?');
      values.push(new Date().toISOString());
    }

    values.push(req.params.id);
    db.prepare(`UPDATE customers SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

    recalcLeadScore(Number(req.params.id));
    logActivity('customer', customer.id, 'updated', { changed_fields: Object.keys(b) }, req.session.userId);

    res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id));
  } catch (err) {
    console.error('PUT /api/admin/customers/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/customers/:id
app.delete('/api/admin/customers/:id', requireAuth, (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    logActivity('customer', customer.id, 'deleted', { name: `${customer.first_name} ${customer.last_name}` }, req.session.userId);

    // Delete dependent records that reference this customer (FK constraints)
    db.prepare('DELETE FROM sales_transactions WHERE customer_id = ?').run(req.params.id);
    db.prepare('DELETE FROM reservations WHERE customer_id = ?').run(req.params.id);
    db.prepare('DELETE FROM offers WHERE customer_id = ?').run(req.params.id);
    db.prepare('DELETE FROM inquiries WHERE customer_id = ?').run(req.params.id);
    db.prepare('DELETE FROM saved_searches WHERE customer_id = ?').run(req.params.id);
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/customers/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/customers/:id/status
app.put('/api/admin/customers/:id/status', requireAuth, (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    db.prepare("UPDATE customers SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, customer.id);

    logActivity('customer', customer.id, 'status_changed', { old_status: customer.status, new_status: status }, req.session.userId);

    res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(customer.id));
  } catch (err) {
    console.error('PUT /api/admin/customers/:id/status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/customers/:id/note
app.post('/api/admin/customers/:id/note', requireAuth, (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const { note } = req.body;
    if (!note) return res.status(400).json({ error: 'Note is required' });

    logActivity('customer', customer.id, 'note_added', { note }, req.session.userId);

    // Also update last_contact_at
    db.prepare("UPDATE customers SET last_contact_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(customer.id);

    res.status(201).json({ message: 'Note added successfully' });
  } catch (err) {
    console.error('POST /api/admin/customers/:id/note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/customers/:id/timeline
app.get('/api/admin/customers/:id/timeline', requireAuth, (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const activities = db.prepare(`
      SELECT al.*, u.username as performed_by_username
      FROM activity_log al
      LEFT JOIN users u ON u.id = al.performed_by
      WHERE al.entity_type = 'customer' AND al.entity_id = ?
      ORDER BY al.created_at DESC
    `).all(customer.id);

    // Also include inquiry activities related to this customer
    const inquiryActivities = db.prepare(`
      SELECT al.*, u.username as performed_by_username
      FROM activity_log al
      LEFT JOIN users u ON u.id = al.performed_by
      WHERE al.entity_type = 'inquiry' AND al.entity_id IN (SELECT id FROM inquiries WHERE customer_id = ?)
      ORDER BY al.created_at DESC
    `).all(customer.id);

    const offerActivities = db.prepare(`
      SELECT al.*, u.username as performed_by_username
      FROM activity_log al
      LEFT JOIN users u ON u.id = al.performed_by
      WHERE al.entity_type = 'offer' AND al.entity_id IN (SELECT id FROM offers WHERE customer_id = ?)
      ORDER BY al.created_at DESC
    `).all(customer.id);

    const saleActivities = db.prepare(`
      SELECT al.*, u.username as performed_by_username
      FROM activity_log al
      LEFT JOIN users u ON u.id = al.performed_by
      WHERE al.entity_type = 'sale' AND al.entity_id IN (SELECT id FROM sales_transactions WHERE customer_id = ?)
      ORDER BY al.created_at DESC
    `).all(customer.id);

    const allActivities = [...activities, ...inquiryActivities, ...offerActivities, ...saleActivities]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allActivities);
  } catch (err) {
    console.error('GET /api/admin/customers/:id/timeline error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================================================
// INQUIRY ROUTES
// ===========================================================================

// GET /api/admin/inquiries
app.get('/api/admin/inquiries', requireAuth, (req, res) => {
  try {
    const { status, inquiry_type, car_id, assigned_to, limit, offset } = req.query;

    let sql = `
      SELECT i.*,
        c.title as car_title, c.brand as car_brand, c.model as car_model,
        cu.first_name as customer_first_name, cu.last_name as customer_last_name, cu.email as customer_email, cu.phone as customer_phone
      FROM inquiries i
      LEFT JOIN cars c ON c.id = i.car_id
      LEFT JOIN customers cu ON cu.id = i.customer_id
      WHERE 1=1
    `;
    let countSql = 'SELECT COUNT(*) as total FROM inquiries WHERE 1=1';
    const params = [];
    const countParams = [];

    function addFilter(clause, value) {
      sql += clause;
      countSql += clause;
      params.push(value);
      countParams.push(value);
    }

    if (status) addFilter(' AND i.status = ?', status);
    if (inquiry_type) addFilter(' AND i.inquiry_type = ?', inquiry_type);
    if (car_id) addFilter(' AND i.car_id = ?', Number(car_id));
    if (assigned_to) addFilter(' AND i.assigned_to = ?', Number(assigned_to));

    sql += ' ORDER BY i.created_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(Number(offset));
      }
    }

    const inquiries = db.prepare(sql).all(...params);
    const { total } = db.prepare(countSql).get(...countParams);

    res.json({ inquiries, total });
  } catch (err) {
    console.error('GET /api/admin/inquiries error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/inquiries/:id
app.get('/api/admin/inquiries/:id', requireAuth, (req, res) => {
  try {
    const inquiry = db.prepare(`
      SELECT i.*,
        c.title as car_title, c.brand as car_brand, c.model as car_model, c.price as car_price, c.status as car_status,
        cu.first_name as customer_first_name, cu.last_name as customer_last_name, cu.email as customer_email, cu.phone as customer_phone, cu.status as customer_status
      FROM inquiries i
      LEFT JOIN cars c ON c.id = i.car_id
      LEFT JOIN customers cu ON cu.id = i.customer_id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    res.json(inquiry);
  } catch (err) {
    console.error('GET /api/admin/inquiries/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/inquiries/:id
app.put('/api/admin/inquiries/:id', requireAuth, (req, res) => {
  try {
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    const b = req.body;
    const setClauses = [];
    const values = [];

    if (b.status !== undefined) { setClauses.push('status = ?'); values.push(b.status); }
    if (b.assigned_to !== undefined) { setClauses.push('assigned_to = ?'); values.push(b.assigned_to ? Number(b.assigned_to) : null); }
    if (b.response !== undefined) {
      setClauses.push('response = ?');
      values.push(b.response);
      setClauses.push("responded_at = datetime('now')");
      if (!b.status) {
        setClauses.push("status = 'responded'");
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    db.prepare(`UPDATE inquiries SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

    logActivity('inquiry', inquiry.id, 'updated', { changed_fields: Object.keys(b) }, req.session.userId);

    // Update customer last_contact_at if responding
    if (b.response && inquiry.customer_id) {
      db.prepare("UPDATE customers SET last_contact_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(inquiry.customer_id);
    }

    res.json(db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id));
  } catch (err) {
    console.error('PUT /api/admin/inquiries/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/inquiries/:id
app.delete('/api/admin/inquiries/:id', requireAuth, (req, res) => {
  try {
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });

    // Nullify foreign-key references in offers before deleting
    db.prepare('UPDATE offers SET inquiry_id = NULL WHERE inquiry_id = ?').run(req.params.id);
    db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/inquiries/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================================================
// OFFER ROUTES
// ===========================================================================

// GET /api/admin/offers
app.get('/api/admin/offers', requireAuth, (req, res) => {
  try {
    const { status, car_id, customer_id, limit, offset } = req.query;

    let sql = `
      SELECT o.*,
        c.title as car_title, c.brand as car_brand, c.model as car_model, c.price as car_price,
        cu.first_name as customer_first_name, cu.last_name as customer_last_name, cu.email as customer_email
      FROM offers o
      LEFT JOIN cars c ON c.id = o.car_id
      LEFT JOIN customers cu ON cu.id = o.customer_id
      WHERE 1=1
    `;
    let countSql = 'SELECT COUNT(*) as total FROM offers WHERE 1=1';
    const params = [];
    const countParams = [];

    function addFilter(clause, value) {
      sql += clause;
      countSql += clause;
      params.push(value);
      countParams.push(value);
    }

    if (status) addFilter(' AND o.status = ?', status);
    if (car_id) addFilter(' AND o.car_id = ?', Number(car_id));
    if (customer_id) addFilter(' AND o.customer_id = ?', Number(customer_id));

    sql += ' ORDER BY o.created_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(Number(offset));
      }
    }

    const offers = db.prepare(sql).all(...params);
    const { total } = db.prepare(countSql).get(...countParams);

    res.json({ offers, total });
  } catch (err) {
    console.error('GET /api/admin/offers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/offers
app.post('/api/admin/offers', requireAuth, (req, res) => {
  try {
    const b = req.body;
    if (!b.car_id || !b.customer_id || !b.offer_amount) {
      return res.status(400).json({ error: 'car_id, customer_id, and offer_amount are required' });
    }

    const result = db.prepare(`
      INSERT INTO offers (car_id, customer_id, inquiry_id, offer_amount, offer_currency, trade_in_vehicle, trade_in_value, valid_until, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(b.car_id), Number(b.customer_id), b.inquiry_id ? Number(b.inquiry_id) : null,
      Number(b.offer_amount), b.offer_currency || 'EUR',
      b.trade_in_vehicle || null, b.trade_in_value ? Number(b.trade_in_value) : null,
      b.valid_until || null, b.notes || null
    );

    recalcLeadScore(Number(b.customer_id));
    logActivity('offer', result.lastInsertRowid, 'created', { car_id: b.car_id, customer_id: b.customer_id, amount: b.offer_amount }, req.session.userId);

    res.status(201).json(db.prepare('SELECT * FROM offers WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    console.error('POST /api/admin/offers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/offers/:id
app.put('/api/admin/offers/:id', requireAuth, (req, res) => {
  try {
    const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const b = req.body;
    const setClauses = ["updated_at = datetime('now')"];
    const values = [];

    const fields = ['status', 'counter_amount', 'trade_in_vehicle', 'trade_in_value', 'valid_until', 'notes'];
    for (const field of fields) {
      if (b[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        if (['counter_amount', 'trade_in_value'].includes(field)) {
          values.push(b[field] === null || b[field] === '' ? null : Number(b[field]));
        } else {
          values.push(b[field] === '' ? null : b[field]);
        }
      }
    }

    values.push(req.params.id);
    db.prepare(`UPDATE offers SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

    logActivity('offer', offer.id, 'updated', { changed_fields: Object.keys(b) }, req.session.userId);

    res.json(db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id));
  } catch (err) {
    console.error('PUT /api/admin/offers/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/offers/:id/accept - Accept offer
app.put('/api/admin/offers/:id/accept', requireAuth, (req, res) => {
  try {
    const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    const b = req.body;

    // Update offer status
    db.prepare("UPDATE offers SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").run(offer.id);

    // Change car status to reserved
    db.prepare("UPDATE cars SET status = 'reserved', updated_at = datetime('now') WHERE id = ?").run(offer.car_id);

    // Create reservation
    const resResult = db.prepare(`
      INSERT INTO reservations (car_id, customer_id, offer_id, deposit_amount, reservation_expires, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      offer.car_id, offer.customer_id, offer.id,
      b.deposit_amount ? Number(b.deposit_amount) : null,
      b.reservation_expires || null,
      b.notes || null
    );

    logActivity('offer', offer.id, 'status_changed', { old_status: offer.status, new_status: 'accepted' }, req.session.userId);
    logActivity('car', offer.car_id, 'status_changed', { old_status: 'available', new_status: 'reserved', offer_id: offer.id }, req.session.userId);
    logActivity('reservation', resResult.lastInsertRowid, 'created', { car_id: offer.car_id, customer_id: offer.customer_id }, req.session.userId);

    // Update customer status
    db.prepare("UPDATE customers SET status = 'deposit', updated_at = datetime('now') WHERE id = ?").run(offer.customer_id);

    res.json({
      offer: db.prepare('SELECT * FROM offers WHERE id = ?').get(offer.id),
      reservation: db.prepare('SELECT * FROM reservations WHERE id = ?').get(resResult.lastInsertRowid),
    });
  } catch (err) {
    console.error('PUT /api/admin/offers/:id/accept error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================================================
// SALES ROUTES
// ===========================================================================

// GET /api/admin/sales
app.get('/api/admin/sales', requireAuth, (req, res) => {
  try {
    const { payment_status, delivery_status, limit, offset } = req.query;

    let sql = `
      SELECT st.*,
        c.title as car_title, c.brand as car_brand, c.model as car_model,
        cu.first_name as customer_first_name, cu.last_name as customer_last_name, cu.email as customer_email
      FROM sales_transactions st
      LEFT JOIN cars c ON c.id = st.car_id
      LEFT JOIN customers cu ON cu.id = st.customer_id
      WHERE 1=1
    `;
    let countSql = 'SELECT COUNT(*) as total FROM sales_transactions WHERE 1=1';
    const params = [];
    const countParams = [];

    function addFilter(clause, value) {
      sql += clause;
      countSql += clause;
      params.push(value);
      countParams.push(value);
    }

    if (payment_status) addFilter(' AND st.payment_status = ?', payment_status);
    if (delivery_status) addFilter(' AND st.delivery_status = ?', delivery_status);

    sql += ' ORDER BY st.created_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(Number(offset));
      }
    }

    const sales = db.prepare(sql).all(...params);
    const { total } = db.prepare(countSql).get(...countParams);

    res.json({ sales, total });
  } catch (err) {
    console.error('GET /api/admin/sales error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/sales/:id - Get single sale
app.get('/api/admin/sales/:id', requireAuth, (req, res) => {
  try {
    const sale = db.prepare(`
      SELECT st.*,
        c.title as car_title, c.brand as car_brand, c.model as car_model,
        cu.first_name as customer_first_name, cu.last_name as customer_last_name, cu.email as customer_email, cu.phone as customer_phone
      FROM sales_transactions st
      LEFT JOIN cars c ON c.id = st.car_id
      LEFT JOIN customers cu ON cu.id = st.customer_id
      WHERE st.id = ?
    `).get(req.params.id);

    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    // Build nested customer object for frontend compatibility
    sale.customer = {
      first_name: sale.customer_first_name,
      last_name: sale.customer_last_name,
      email: sale.customer_email,
      phone: sale.customer_phone,
    };
    sale.customer_name = ((sale.customer_first_name || '') + ' ' + (sale.customer_last_name || '')).trim();

    res.json(sale);
  } catch (err) {
    console.error('GET /api/admin/sales/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/sales
app.post('/api/admin/sales', requireAuth, (req, res) => {
  try {
    const b = req.body;
    if (!b.car_id || !b.customer_id || !b.sale_price) {
      return res.status(400).json({ error: 'car_id, customer_id, and sale_price are required' });
    }

    const invoiceNumber = generateInvoiceNumber();
    const salePrice = Number(b.sale_price);
    const vatRate = b.vat_rate ? Number(b.vat_rate) : 21;
    const vatAmount = b.vat_amount !== undefined ? Number(b.vat_amount) : 0;
    const totalAmount = b.total_amount ? Number(b.total_amount) : salePrice + vatAmount;

    const result = db.prepare(`
      INSERT INTO sales_transactions (
        car_id, customer_id, reservation_id, offer_id,
        sale_price, sale_currency, vat_amount, total_amount,
        payment_method, payment_status,
        trade_in_vehicle, trade_in_value,
        financing_provider, financing_reference,
        invoice_number,
        delivery_method, delivery_status, delivery_address, delivery_date, delivery_cost,
        warranty_type, warranty_expires,
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(b.car_id), Number(b.customer_id),
      b.reservation_id ? Number(b.reservation_id) : null, b.offer_id ? Number(b.offer_id) : null,
      salePrice, b.sale_currency || 'EUR', vatAmount, totalAmount,
      b.payment_method || 'bank_transfer', b.payment_status || 'pending',
      b.trade_in_vehicle || null, b.trade_in_value ? Number(b.trade_in_value) : null,
      b.financing_provider || null, b.financing_reference || null,
      invoiceNumber,
      b.delivery_method || 'collection', b.delivery_status || 'pending',
      b.delivery_address || null, b.delivery_date || null, b.delivery_cost ? Number(b.delivery_cost) : null,
      b.warranty_type || 'none', b.warranty_expires || null,
      b.notes || null, req.session.userId
    );

    // Mark car as sold
    db.prepare("UPDATE cars SET status = 'sold', sold_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(Number(b.car_id));

    // Update customer stats
    db.prepare(`
      UPDATE customers SET
        total_purchases = total_purchases + 1,
        total_spent = total_spent + ?,
        status = 'sold',
        updated_at = datetime('now')
      WHERE id = ?
    `).run(totalAmount, Number(b.customer_id));

    // Complete reservation if linked
    if (b.reservation_id) {
      db.prepare("UPDATE reservations SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(Number(b.reservation_id));
    }

    logActivity('sale', result.lastInsertRowid, 'created', { car_id: b.car_id, customer_id: b.customer_id, total: totalAmount, invoice: invoiceNumber }, req.session.userId);
    logActivity('car', Number(b.car_id), 'status_changed', { old_status: 'reserved', new_status: 'sold', sale_id: result.lastInsertRowid }, req.session.userId);

    res.status(201).json(db.prepare('SELECT * FROM sales_transactions WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) {
    console.error('POST /api/admin/sales error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/sales/:id
app.put('/api/admin/sales/:id', requireAuth, (req, res) => {
  try {
    const sale = db.prepare('SELECT * FROM sales_transactions WHERE id = ?').get(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    const b = req.body;
    const fields = [
      'payment_status', 'delivery_status', 'delivery_address', 'delivery_date', 'delivery_cost',
      'warranty_type', 'warranty_expires', 'notes', 'completed_at',
      'financing_provider', 'financing_reference', 'trade_in_vehicle', 'trade_in_value',
    ];

    const setClauses = [];
    const values = [];

    for (const field of fields) {
      if (b[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        if (['delivery_cost', 'trade_in_value'].includes(field)) {
          values.push(b[field] === null || b[field] === '' ? null : Number(b[field]));
        } else {
          values.push(b[field] === '' ? null : b[field]);
        }
      }
    }

    // Auto-set completed_at when payment is paid and delivery is delivered
    if (b.payment_status === 'paid' && b.delivery_status === 'delivered' && !sale.completed_at) {
      setClauses.push("completed_at = datetime('now')");
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    db.prepare(`UPDATE sales_transactions SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

    logActivity('sale', sale.id, 'updated', { changed_fields: Object.keys(b) }, req.session.userId);

    res.json(db.prepare('SELECT * FROM sales_transactions WHERE id = ?').get(req.params.id));
  } catch (err) {
    console.error('PUT /api/admin/sales/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/sales/:id/invoice - Generate invoice data
app.get('/api/admin/sales/:id/invoice', requireAuth, (req, res) => {
  try {
    const sale = db.prepare('SELECT * FROM sales_transactions WHERE id = ?').get(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(sale.car_id);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(sale.customer_id);
    const settings = {};
    db.prepare('SELECT key, value FROM settings').all().forEach(s => { settings[s.key] = s.value; });

    res.json({
      invoice_number: sale.invoice_number,
      invoice_date: sale.created_at,
      dealership: {
        name: settings.dealership_name || 'House of Speed Collections',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        country: settings.country || 'NL',
        vat_rate: settings.vat_rate || '21',
      },
      customer: {
        name: `${customer.first_name} ${customer.last_name}`,
        company: customer.company_name,
        address: customer.address,
        city: customer.city,
        postal_code: customer.postal_code,
        country: customer.country,
        email: customer.email,
        phone: customer.phone,
      },
      vehicle: {
        title: car.title,
        brand: car.brand,
        model: car.model,
        year: car.year,
        vin: car.vin,
        registration_number: car.registration_number,
        mileage: car.mileage,
        mileage_unit: car.mileage_unit,
        color: car.color_exterior,
      },
      sale: {
        sale_price: sale.sale_price,
        vat_amount: sale.vat_amount,
        total_amount: sale.total_amount,
        currency: sale.sale_currency,
        payment_method: sale.payment_method,
        payment_status: sale.payment_status,
        trade_in_vehicle: sale.trade_in_vehicle,
        trade_in_value: sale.trade_in_value,
        delivery_method: sale.delivery_method,
        delivery_cost: sale.delivery_cost,
        warranty_type: sale.warranty_type,
        warranty_expires: sale.warranty_expires,
      },
    });
  } catch (err) {
    console.error('GET /api/admin/sales/:id/invoice error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================================================
// ANALYTICS / DASHBOARD ROUTES
// ===========================================================================

// GET /api/admin/dashboard
app.get('/api/admin/dashboard', requireAuth, (req, res) => {
  try {
    // Cars by status
    const carsByStatus = {};
    db.prepare('SELECT status, COUNT(*) as count FROM cars GROUP BY status').all().forEach(r => { carsByStatus[r.status] = r.count; });
    const totalCars = db.prepare('SELECT COUNT(*) as count FROM cars').get().count;

    // Customers
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const newCustomers = db.prepare("SELECT COUNT(*) as count FROM customers WHERE created_at >= datetime('now', '-30 days')").get().count;

    // Inquiries by status
    const inquiriesByStatus = {};
    db.prepare('SELECT status, COUNT(*) as count FROM inquiries GROUP BY status').all().forEach(r => { inquiriesByStatus[r.status] = r.count; });
    const totalInquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;

    // This month sales
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthSales = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM sales_transactions WHERE created_at >= ?").get(monthStart.toISOString());

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT al.*, u.username as performed_by_username
      FROM activity_log al
      LEFT JOIN users u ON u.id = al.performed_by
      ORDER BY al.created_at DESC
      LIMIT 20
    `).all();

    // Pending offers
    const pendingOffers = db.prepare("SELECT COUNT(*) as count FROM offers WHERE status = 'pending'").get().count;

    // Follow-ups due
    const followUpsDue = db.prepare("SELECT COUNT(*) as count FROM customers WHERE next_follow_up <= datetime('now') AND next_follow_up IS NOT NULL").get().count;

    res.json({
      cars: { total: totalCars, by_status: carsByStatus },
      customers: { total: totalCustomers, new_this_month: newCustomers },
      inquiries: { total: totalInquiries, by_status: inquiriesByStatus },
      sales_this_month: { count: monthSales.count, revenue: monthSales.revenue },
      pending_offers: pendingOffers,
      follow_ups_due: followUpsDue,
      recent_activity: recentActivity,
    });
  } catch (err) {
    console.error('GET /api/admin/dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/analytics/inventory
app.get('/api/admin/analytics/inventory', requireAuth, (req, res) => {
  try {
    // Average days on market
    const avgDays = db.prepare(`
      SELECT AVG(julianday('now') - julianday(listed_at)) as avg_days
      FROM cars WHERE status = 'available' AND listed_at IS NOT NULL
    `).get();

    // Aging breakdown
    const aging = {
      under_30: db.prepare("SELECT COUNT(*) as count FROM cars WHERE status = 'available' AND listed_at IS NOT NULL AND julianday('now') - julianday(listed_at) < 30").get().count,
      days_30_60: db.prepare("SELECT COUNT(*) as count FROM cars WHERE status = 'available' AND listed_at IS NOT NULL AND julianday('now') - julianday(listed_at) BETWEEN 30 AND 60").get().count,
      days_60_90: db.prepare("SELECT COUNT(*) as count FROM cars WHERE status = 'available' AND listed_at IS NOT NULL AND julianday('now') - julianday(listed_at) BETWEEN 60 AND 90").get().count,
      over_90: db.prepare("SELECT COUNT(*) as count FROM cars WHERE status = 'available' AND listed_at IS NOT NULL AND julianday('now') - julianday(listed_at) > 90").get().count,
    };

    // Stock value
    const stockValue = db.prepare("SELECT COALESCE(SUM(price), 0) as total, COUNT(*) as count FROM cars WHERE status IN ('available', 'reserved', 'deposit_taken', 'consignment', 'incoming')").get();

    // Brand distribution
    const brandDistribution = db.prepare("SELECT brand, COUNT(*) as count, COALESCE(SUM(price), 0) as total_value FROM cars WHERE status != 'sold' GROUP BY brand ORDER BY count DESC").all();

    // Body type distribution
    const bodyTypeDistribution = db.prepare("SELECT body_type, COUNT(*) as count FROM cars WHERE status != 'sold' GROUP BY body_type ORDER BY count DESC").all();

    res.json({
      avg_days_on_market: Math.round(avgDays.avg_days || 0),
      aging_breakdown: aging,
      stock_value: stockValue.total,
      stock_count: stockValue.count,
      brand_distribution: brandDistribution,
      body_type_distribution: bodyTypeDistribution,
    });
  } catch (err) {
    console.error('GET /api/admin/analytics/inventory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/analytics/sales
app.get('/api/admin/analytics/sales', requireAuth, (req, res) => {
  try {
    // Monthly sales (last 12 months)
    const monthlySales = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(AVG(sale_price), 0) as avg_price
      FROM sales_transactions
      WHERE created_at >= datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all();

    // Total stats
    const totalStats = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue, COALESCE(AVG(sale_price), 0) as avg_price FROM sales_transactions').get();

    // This year stats
    const yearStats = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue, COALESCE(AVG(sale_price), 0) as avg_price
      FROM sales_transactions
      WHERE strftime('%Y', created_at) = strftime('%Y', 'now')
    `).get();

    // Conversion rate (sold cars / total inquiries)
    const totalInquiries = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
    const totalSales = db.prepare('SELECT COUNT(*) as count FROM sales_transactions').get().count;
    const conversionRate = totalInquiries > 0 ? ((totalSales / totalInquiries) * 100).toFixed(1) : 0;

    // Average margin (if acquisition_cost available)
    const marginData = db.prepare(`
      SELECT AVG(st.sale_price - c.acquisition_cost) as avg_margin,
             AVG((st.sale_price - c.acquisition_cost) / c.acquisition_cost * 100) as avg_margin_pct
      FROM sales_transactions st
      JOIN cars c ON c.id = st.car_id
      WHERE c.acquisition_cost IS NOT NULL AND c.acquisition_cost > 0
    `).get();

    res.json({
      monthly_sales: monthlySales,
      total: totalStats,
      this_year: yearStats,
      conversion_rate: Number(conversionRate),
      avg_margin: marginData.avg_margin ? Math.round(marginData.avg_margin) : null,
      avg_margin_pct: marginData.avg_margin_pct ? Math.round(marginData.avg_margin_pct * 10) / 10 : null,
    });
  } catch (err) {
    console.error('GET /api/admin/analytics/sales error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/analytics/leads
app.get('/api/admin/analytics/leads', requireAuth, (req, res) => {
  try {
    // Leads by source
    const bySource = db.prepare('SELECT lead_source, COUNT(*) as count FROM customers GROUP BY lead_source ORDER BY count DESC').all();

    // Conversion funnel
    const funnel = {
      new: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'new'").get().count,
      contacted: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'contacted'").get().count,
      qualified: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'qualified'").get().count,
      viewing_scheduled: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'viewing_scheduled'").get().count,
      negotiation: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'negotiation'").get().count,
      deposit: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'deposit'").get().count,
      sold: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'sold'").get().count,
      lost: db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'lost'").get().count,
    };

    // Average response time (inquiries with responses)
    const avgResponse = db.prepare(`
      SELECT AVG(
        (julianday(responded_at) - julianday(created_at)) * 24
      ) as avg_hours
      FROM inquiries
      WHERE responded_at IS NOT NULL
    `).get();

    // New leads this month
    const newLeads = db.prepare("SELECT COUNT(*) as count FROM customers WHERE created_at >= datetime('now', '-30 days')").get().count;

    // Inquiry types breakdown
    const inquiryTypes = db.prepare('SELECT inquiry_type, COUNT(*) as count FROM inquiries GROUP BY inquiry_type ORDER BY count DESC').all();

    res.json({
      by_source: bySource,
      funnel,
      avg_response_hours: avgResponse.avg_hours ? Math.round(avgResponse.avg_hours * 10) / 10 : null,
      new_leads_this_month: newLeads,
      inquiry_types: inquiryTypes,
    });
  } catch (err) {
    console.error('GET /api/admin/analytics/leads error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/analytics/popular
app.get('/api/admin/analytics/popular', requireAuth, (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const mostViewed = db.prepare('SELECT id, title, brand, model, year, price, views_count, inquiry_count FROM cars ORDER BY views_count DESC LIMIT ?').all(limit);
    const mostInquired = db.prepare('SELECT id, title, brand, model, year, price, views_count, inquiry_count FROM cars ORDER BY inquiry_count DESC LIMIT ?').all(limit);

    // Add primary images
    const imgStmt = db.prepare('SELECT filename FROM car_images WHERE car_id = ? ORDER BY is_primary DESC, sort_order ASC LIMIT 1');
    for (const car of [...mostViewed, ...mostInquired]) {
      const img = imgStmt.get(car.id);
      car.primary_image = img ? `/uploads/cars/${img.filename}` : null;
    }

    res.json({ most_viewed: mostViewed, most_inquired: mostInquired });
  } catch (err) {
    console.error('GET /api/admin/analytics/popular error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================================================
// SETTINGS ROUTES
// ===========================================================================

// GET /api/admin/settings
app.get('/api/admin/settings', requireAuth, (req, res) => {
  try {
    const settings = {};
    db.prepare('SELECT key, value, updated_at FROM settings').all().forEach(s => {
      settings[s.key] = { value: s.value, updated_at: s.updated_at };
    });
    res.json(settings);
  } catch (err) {
    console.error('GET /api/admin/settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/settings
app.put('/api/admin/settings', requireRole('admin'), (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const upsert = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at");
    const updateMany = db.transaction((entries) => {
      for (const [key, value] of entries) {
        upsert.run(key, String(value));
      }
    });
    updateMany(Object.entries(updates));

    // Return all settings
    const settings = {};
    db.prepare('SELECT key, value, updated_at FROM settings').all().forEach(s => {
      settings[s.key] = { value: s.value, updated_at: s.updated_at };
    });
    res.json(settings);
  } catch (err) {
    console.error('PUT /api/admin/settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================================================
// SAVED SEARCHES ROUTES (bonus)
// ===========================================================================

// POST /api/saved-searches - Public route for saving searches
app.post('/api/saved-searches', (req, res) => {
  try {
    const { email, search_criteria, alert_frequency, customer_id } = req.body;
    if (!email && !customer_id) {
      return res.status(400).json({ error: 'Email or customer_id is required' });
    }

    const result = db.prepare(
      'INSERT INTO saved_searches (customer_id, email, search_criteria, alert_frequency) VALUES (?, ?, ?, ?)'
    ).run(
      customer_id ? Number(customer_id) : null,
      email || null,
      typeof search_criteria === 'string' ? search_criteria : JSON.stringify(search_criteria),
      alert_frequency || 'weekly'
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Search saved successfully' });
  } catch (err) {
    console.error('POST /api/saved-searches error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================================================
// RESERVATIONS ROUTES (admin)
// ===========================================================================

// GET /api/admin/reservations
app.get('/api/admin/reservations', requireAuth, (req, res) => {
  try {
    const { status, limit, offset } = req.query;

    let sql = `
      SELECT r.*,
        c.title as car_title, c.brand as car_brand, c.model as car_model,
        cu.first_name as customer_first_name, cu.last_name as customer_last_name
      FROM reservations r
      LEFT JOIN cars c ON c.id = r.car_id
      LEFT JOIN customers cu ON cu.id = r.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (status) { sql += ' AND r.status = ?'; params.push(status); }

    sql += ' ORDER BY r.created_at DESC';

    if (limit) {
      sql += ' LIMIT ?';
      params.push(Number(limit));
      if (offset) {
        sql += ' OFFSET ?';
        params.push(Number(offset));
      }
    }

    const reservations = db.prepare(sql).all(...params);
    res.json({ reservations });
  } catch (err) {
    console.error('GET /api/admin/reservations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/reservations/:id
app.put('/api/admin/reservations/:id', requireAuth, (req, res) => {
  try {
    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    const b = req.body;
    const setClauses = ["updated_at = datetime('now')"];
    const values = [];

    const fields = ['deposit_amount', 'deposit_paid', 'deposit_payment_method', 'deposit_receipt_number', 'reservation_expires', 'status', 'notes'];
    for (const field of fields) {
      if (b[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        if (['deposit_amount'].includes(field)) {
          values.push(b[field] === null || b[field] === '' ? null : Number(b[field]));
        } else if (field === 'deposit_paid') {
          values.push(b[field] ? 1 : 0);
        } else {
          values.push(b[field] === '' ? null : b[field]);
        }
      }
    }

    values.push(req.params.id);
    db.prepare(`UPDATE reservations SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

    // If reservation is cancelled, set car back to available
    if (b.status === 'cancelled') {
      db.prepare("UPDATE cars SET status = 'available', updated_at = datetime('now') WHERE id = ?").run(reservation.car_id);
      logActivity('car', reservation.car_id, 'status_changed', { old_status: 'reserved', new_status: 'available', reason: 'reservation_cancelled' }, req.session.userId);
    }

    logActivity('reservation', reservation.id, 'updated', { changed_fields: Object.keys(b) }, req.session.userId);

    res.json(db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id));
  } catch (err) {
    console.error('PUT /api/admin/reservations/:id error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Multer error handler
// ---------------------------------------------------------------------------
app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10 MB for images, 25 MB for documents.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
  next();
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`House of Speed server running on http://localhost:${PORT}`);
});
