import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

class PostgresDatabase {
  constructor() {
    this.pool = null;
  }

  async init() {
    // Use DATABASE_URL from Render PostgreSQL
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await this.createTables();
  }

  async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS trades (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          underlying TEXT NOT NULL,
          option_type TEXT NOT NULL CHECK(option_type IN ('call', 'put', 'none')),
          breakout_type TEXT CHECK(breakout_type IN ('vertical', 'horizontal', 'none')),
          nifty_range TEXT CHECK(nifty_range IN ('inside_day', 'outside_bullish', 'outside_bearish')),
          strike_price REAL,
          entry_price REAL NOT NULL,
          stop_loss REAL,
          exit_price REAL NOT NULL,
          quantity INTEGER NOT NULL,
          lot_size INTEGER DEFAULT 25,
          trade_date DATE NOT NULL,
          entry_time TEXT,
          exit_time TEXT,
          followed_plan BOOLEAN NOT NULL,
          mistakes TEXT,
          emotional_state_entry TEXT,
          emotional_state_exit TEXT,
          notes TEXT,
          screenshot_url TEXT,
          pnl REAL,
          return_percentage REAL,
          risk_amount REAL,
          r_multiple REAL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS daily_metrics (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          total_trades INTEGER DEFAULT 0,
          winning_trades INTEGER DEFAULT 0,
          losing_trades INTEGER DEFAULT 0,
          total_pnl REAL DEFAULT 0,
          win_rate REAL DEFAULT 0,
          avg_r_multiple REAL DEFAULT 0,
          plan_adherence_rate REAL DEFAULT 0,
          mistake_frequency REAL DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, date)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS insights (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          severity TEXT CHECK(severity IN ('info', 'warning', 'success')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS mistake_tags (
          id SERIAL PRIMARY KEY,
          tag_name TEXT UNIQUE NOT NULL,
          category TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS emotional_state_tags (
          id SERIAL PRIMARY KEY,
          tag_name TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          usage_count INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, tag_name)
        )
      `);

      // Create indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, trade_date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id)');
      
      console.log('PostgreSQL tables created successfully');
    } finally {
      client.release();
    }
  }

  getDb() {
    // Return a wrapper that matches SQLite's API
    return {
      run: async (query, params = []) => {
        const client = await this.pool.connect();
        try {
          // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
          let pgQuery = query;
          let paramIndex = 1;
          while (pgQuery.includes('?')) {
            pgQuery = pgQuery.replace('?', `$${paramIndex}`);
            paramIndex++;
          }
          
          // Handle INSERT queries to return the ID
          if (pgQuery.toLowerCase().includes('insert')) {
            pgQuery = pgQuery.replace(/;?\s*$/, '') + ' RETURNING id';
            const result = await client.query(pgQuery, params);
            return {
              lastID: result.rows[0]?.id || null,
              changes: result.rowCount
            };
          } else {
            const result = await client.query(pgQuery, params);
            return {
              lastID: null,
              changes: result.rowCount
            };
          }
        } finally {
          client.release();
        }
      },
      
      get: async (query, params = []) => {
        const client = await this.pool.connect();
        try {
          // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
          let pgQuery = query;
          let paramIndex = 1;
          while (pgQuery.includes('?')) {
            pgQuery = pgQuery.replace('?', `$${paramIndex}`);
            paramIndex++;
          }
          
          const result = await client.query(pgQuery, params);
          return result.rows[0] || null;
        } finally {
          client.release();
        }
      },
      
      all: async (query, params = []) => {
        const client = await this.pool.connect();
        try {
          // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
          let pgQuery = query;
          let paramIndex = 1;
          while (pgQuery.includes('?')) {
            pgQuery = pgQuery.replace('?', `$${paramIndex}`);
            paramIndex++;
          }
          
          const result = await client.query(pgQuery, params);
          return result.rows;
        } finally {
          client.release();
        }
      },
      
      exec: async (query) => {
        const client = await this.pool.connect();
        try {
          await client.query(query);
        } finally {
          client.release();
        }
      }
    };
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export default PostgresDatabase;