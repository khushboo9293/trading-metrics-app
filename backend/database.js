import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await open({
      filename: join(__dirname, 'trading_metrics.db'),
      driver: sqlite3.Database
    });

    await this.createTables();
  }

  async createTables() {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        followed_plan BOOLEAN NOT NULL,
        mistakes TEXT,
        notes TEXT,
        screenshot_url TEXT,
        pnl REAL,
        return_percentage REAL,
        risk_amount REAL,
        r_multiple REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS daily_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      );

      CREATE TABLE IF NOT EXISTS insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT CHECK(severity IN ('info', 'warning', 'success')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      CREATE TABLE IF NOT EXISTS mistake_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT UNIQUE NOT NULL,
        category TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, trade_date);
      CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_insights_user ON insights(user_id);
    `);
  }

  getDb() {
    return this.db;
  }
}

export default Database;