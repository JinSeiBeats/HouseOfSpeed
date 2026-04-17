/**
 * Migration 001: Customer Authentication System
 *
 * Creates the customer_accounts table and links it to the existing customers table.
 * This migration is idempotent and can be safely run multiple times.
 */

const Database = require('better-sqlite3');

/**
 * Run the customer authentication migration
 * @param {Database} db - The better-sqlite3 database instance
 */
function runMigration(db) {
  console.log('Running migration 001: Customer Authentication...');

  try {
    // Start a transaction for atomic execution
    db.exec('BEGIN TRANSACTION');

    // Create customer_accounts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        email_verification_token TEXT,
        email_verification_expires TEXT,
        password_reset_token TEXT,
        password_reset_expires TEXT,
        account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN ('active','suspended','deleted')),
        last_login_at TEXT,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        lockout_until TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Create indexes for customer_accounts
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_customer_accounts_email ON customer_accounts(email);
      CREATE INDEX IF NOT EXISTS idx_customer_accounts_status ON customer_accounts(account_status);
    `);

    // Check if customer_account_id column already exists in customers table
    const tableInfo = db.prepare("PRAGMA table_info(customers)").all();
    const hasAccountIdColumn = tableInfo.some(col => col.name === 'customer_account_id');

    if (!hasAccountIdColumn) {
      // Add foreign key column to customers table
      db.exec(`
        ALTER TABLE customers ADD COLUMN customer_account_id INTEGER REFERENCES customer_accounts(id)
      `);

      // Create index for the foreign key
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_customers_account_id ON customers(customer_account_id)
      `);

      console.log('✓ Added customer_account_id column to customers table');
    } else {
      console.log('✓ customer_account_id column already exists in customers table');
    }

    // Update activity_log table to support customer_account entity type and account_locked action
    // Check if the table needs updating by checking the schema
    const activityLogSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='activity_log'").get();

    if (activityLogSchema && !activityLogSchema.sql.includes('customer_account')) {
      // SQLite doesn't support ALTER for CHECK constraints, so we need to recreate the table
      console.log('Updating activity_log constraints...');

      db.exec(`
        -- Rename the old table
        ALTER TABLE activity_log RENAME TO activity_log_old;

        -- Create new table with updated constraints
        CREATE TABLE activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL CHECK(entity_type IN ('car','customer','inquiry','offer','sale','reservation','user','system','customer_account')),
          entity_id INTEGER NOT NULL,
          action TEXT NOT NULL CHECK(action IN ('created','updated','deleted','viewed','status_changed','note_added','email_sent','call_logged','login_success','login_failed','logout','account_locked')),
          details TEXT,
          performed_by INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (performed_by) REFERENCES users(id)
        );

        -- Copy data from old table to new table
        INSERT INTO activity_log (id, entity_type, entity_id, action, details, performed_by, created_at)
        SELECT id, entity_type, entity_id, action, details, performed_by, created_at
        FROM activity_log_old;

        -- Drop old table
        DROP TABLE activity_log_old;
      `);

      console.log('✓ Updated activity_log table constraints');
    } else {
      console.log('✓ activity_log table constraints already up to date');
    }

    // Commit the transaction
    db.exec('COMMIT');

    console.log('✓ Migration 001: Customer Authentication completed successfully');
    return true;

  } catch (error) {
    // Rollback on error
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError.message);
    }

    console.error('✗ Migration 001 failed:', error.message);
    throw error;
  }
}

module.exports = { runMigration };
