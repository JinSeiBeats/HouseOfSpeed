# Railway PostgreSQL Database Setup — HouseOfSpeed

## Overzicht

Dit document beschrijft hoe je de bestaande SQLite-database omzet naar een PostgreSQL-database op Railway. De huidige database bevat **14 tabellen** en wordt beheerd via `better-sqlite3`.

---

## Stap 1: Railway PostgreSQL aanmaken

1. Ga naar [railway.app](https://railway.app) en open je project
2. Klik op **+ New** → **Database** → **PostgreSQL**
3. Railway genereert automatisch een `DATABASE_URL` in de omgevingsvariabelen
4. Kopieer de `DATABASE_URL` (format: `postgresql://user:pass@host:port/dbname`)

---

## Stap 2: Environment variabelen instellen

Vervang `.env` met het volgende (verwijder `DATABASE_PATH`):

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=<genereer-64-char-random-string>
ALLOWED_ORIGINS=https://jouw-app.railway.app
ADMIN_INITIAL_PASSWORD=<sterk-wachtwoord>
DATABASE_URL=postgresql://...  # automatisch door Railway
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Stap 3: PostgreSQL Schema

Voer dit SQL-script uit op je Railway PostgreSQL database (via Railway's Query-tab of `psql`):

```sql
-- ============================================================
-- HouseOfSpeed - PostgreSQL Schema
-- ============================================================

-- Users (admin accounts)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin','sales','viewer')),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cars (vehicle inventory)
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant_trim TEXT,
  year INTEGER NOT NULL,
  production_year INTEGER,
  price NUMERIC NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'EUR',
  price_qualifier TEXT NOT NULL DEFAULT 'fixed' CHECK(price_qualifier IN ('fixed','negotiable','poa')),
  reserve_price NUMERIC,
  acquisition_cost NUMERIC,
  vat_status TEXT NOT NULL DEFAULT 'margin' CHECK(vat_status IN ('standard','margin','qualifying','none')),
  vat_rate NUMERIC NOT NULL DEFAULT 21,
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
  matching_numbers BOOLEAN DEFAULT FALSE,
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
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  just_arrived BOOLEAN NOT NULL DEFAULT FALSE,
  price_reduced BOOLEAN NOT NULL DEFAULT FALSE,
  views_count INTEGER NOT NULL DEFAULT 0,
  inquiry_count INTEGER NOT NULL DEFAULT 0,
  listed_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

-- Car images
CREATE TABLE IF NOT EXISTS car_images (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Car documents
CREATE TABLE IF NOT EXISTS car_documents (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT,
  document_type TEXT NOT NULL DEFAULT 'other' CHECK(document_type IN ('service_record','certificate','inspection','history_report','invoice','other')),
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers (CRM contacts/leads)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
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
  assigned_to INTEGER REFERENCES users(id),
  notes TEXT,
  tags TEXT,
  gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
  gdpr_consent_date TIMESTAMPTZ,
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
  total_purchases INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  customer_account_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer accounts (authentication)
CREATE TABLE IF NOT EXISTS customer_accounts (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMPTZ,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN ('active','suspended','deleted')),
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK after both tables exist
ALTER TABLE customers ADD CONSTRAINT fk_customers_account
  FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id);

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  car_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  inquiry_type TEXT NOT NULL DEFAULT 'general' CHECK(inquiry_type IN ('general','viewing','test_drive','offer','finance','trade_in','callback')),
  message TEXT,
  preferred_contact_time TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','responded','closed')),
  assigned_to INTEGER REFERENCES users(id),
  response TEXT,
  responded_at TIMESTAMPTZ,
  source TEXT DEFAULT 'website' CHECK(source IN ('website','phone','email','whatsapp','marketplace')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  inquiry_id INTEGER REFERENCES inquiries(id),
  offer_amount NUMERIC NOT NULL,
  offer_currency TEXT NOT NULL DEFAULT 'EUR',
  counter_amount NUMERIC,
  trade_in_vehicle TEXT,
  trade_in_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','countered','accepted','rejected','expired','withdrawn')),
  valid_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  offer_id INTEGER REFERENCES offers(id),
  deposit_amount NUMERIC,
  deposit_paid BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_payment_method TEXT,
  deposit_receipt_number TEXT,
  reservation_expires TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','cancelled','expired')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales transactions
CREATE TABLE IF NOT EXISTS sales_transactions (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  reservation_id INTEGER REFERENCES reservations(id),
  offer_id INTEGER REFERENCES offers(id),
  sale_price NUMERIC NOT NULL,
  sale_currency TEXT NOT NULL DEFAULT 'EUR',
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'bank_transfer' CHECK(payment_method IN ('bank_transfer','finance','cash','crypto')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','partial','paid','refunded')),
  trade_in_vehicle TEXT,
  trade_in_value NUMERIC,
  financing_provider TEXT,
  financing_reference TEXT,
  invoice_number TEXT UNIQUE,
  delivery_method TEXT DEFAULT 'collection' CHECK(delivery_method IN ('collection','delivery','shipping')),
  delivery_status TEXT DEFAULT 'pending' CHECK(delivery_status IN ('pending','in_transit','delivered')),
  delivery_address TEXT,
  delivery_date TIMESTAMPTZ,
  delivery_cost NUMERIC,
  warranty_type TEXT DEFAULT 'none' CHECK(warranty_type IN ('none','3month','6month','12month','extended')),
  warranty_expires TIMESTAMPTZ,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

-- Price history
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  old_price NUMERIC,
  new_price NUMERIC,
  changed_by INTEGER REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('car','customer','inquiry','offer','sale','reservation','user','system','customer_account')),
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created','updated','deleted','viewed','status_changed','note_added','email_sent','call_logged','login_success','login_failed','logout','account_locked')),
  details TEXT,
  performed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  email TEXT,
  search_criteria TEXT,
  alert_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK(alert_frequency IN ('immediate','daily','weekly')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_notified TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sell inquiries (auto verkopen via website)
CREATE TABLE IF NOT EXISTS sell_inquiries (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  color TEXT,
  condition_rating TEXT,
  asking_price NUMERIC,
  description TEXT,
  photo_filenames TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','appraised','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_customer_accounts_email ON customer_accounts(email);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_status ON customer_accounts(account_status);
CREATE INDEX IF NOT EXISTS idx_customers_account_id ON customers(customer_account_id);
```

---

## Stap 4: Packages aanpassen

```bash
npm uninstall better-sqlite3
npm install pg
```

Optioneel voor persistente sessie-opslag in PostgreSQL:
```bash
npm install connect-pg-simple
```

---

## Stap 5: Code-aanpassingen in server.js (samenvatting)

Dit zijn de **kritieke** aanpassingen die server.js nodig heeft voor PostgreSQL:

| Onderwerp | SQLite | PostgreSQL |
|-----------|--------|------------|
| Driver | `better-sqlite3` | `pg` (Pool) |
| Query | `.prepare(sql).get/all/run(params)` | `await pool.query(sql, params)` |
| Placeholders | `?` | `$1, $2, $3, ...` |
| Last insert ID | `.lastInsertRowid` | `RETURNING id` + `rows[0].id` |
| Tekst zoeken | `LIKE '%x%'` | `ILIKE '%x%'` |
| Booleanen | `0` / `1` | `TRUE` / `FALSE` |
| Datum/tijd | `datetime('now')` | `NOW()` |
| INSERT OR IGNORE | `INSERT OR IGNORE INTO` | `INSERT INTO ... ON CONFLICT DO NOTHING` |
| Synchronous | Ja (blocking) | Nee (async/await) |
| Migrations | `PRAGMA table_info()` | `information_schema.columns` |

---

## Stap 6: Verbinding configureren

Vervang in `server.js` de better-sqlite3 initialisatie:

```javascript
// OUD (SQLite)
const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_PATH || './data/houseofspeed.db');

// NIEUW (PostgreSQL)
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
```

---

## Checklist

- [ ] Railway PostgreSQL service aangemaakt
- [ ] `DATABASE_URL` gekopieerd naar `.env`
- [ ] SQL-schema uitgevoerd op Railway
- [ ] `better-sqlite3` vervangen door `pg`
- [ ] Alle `?` placeholders vervangen door `$1, $2, ...`
- [ ] Alle `.prepare().get/all/run()` calls omgezet naar `await pool.query()`
- [ ] `lastInsertRowid` vervangen door `RETURNING id`
- [ ] Booleanse waarden (0/1) vervangen door TRUE/FALSE
- [ ] Migrations herschreven voor PostgreSQL
- [ ] Getest op Railway

---

*Gegenereerd op 2026-05-12 — gebaseerd op server.js en migrations/001_customer_auth.js*
