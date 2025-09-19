import pg from 'pg';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

const defaultTags = [
  // Entry Mistakes
  { tag_name: 'fomo-entry', category: 'entry', description: 'Fear of missing out entry' },
  { tag_name: 'impulse-entry', category: 'entry', description: 'Impulsive entry without setup' },
  { tag_name: 'chasing-breakout', category: 'entry', description: 'Chasing after breakout' },
  { tag_name: 'early-entry', category: 'entry', description: 'Entered too early' },
  { tag_name: 'late-entry', category: 'entry', description: 'Entered too late' },
  { tag_name: 'no-setup', category: 'entry', description: 'No clear setup' },
  
  // Exit Mistakes
  { tag_name: 'early-exit', category: 'exit', description: 'Exited too early' },
  { tag_name: 'late-exit', category: 'exit', description: 'Exited too late' },
  { tag_name: 'no-stop-loss', category: 'exit', description: 'No stop loss' },
  { tag_name: 'moved-stop-loss', category: 'exit', description: 'Moved stop loss' },
  { tag_name: 'panic-exit', category: 'exit', description: 'Panic exit' },
  
  // Position Management
  { tag_name: 'poor-position-size', category: 'position', description: 'Wrong position size' },
  { tag_name: 'over-leveraged', category: 'position', description: 'Too much leverage' },
  { tag_name: 'averaging-down', category: 'position', description: 'Averaged down' },
  
  // Psychology
  { tag_name: 'fear-driven', category: 'psychology', description: 'Fear-based decision' },
  { tag_name: 'greed-driven', category: 'psychology', description: 'Greed-based decision' },
  { tag_name: 'revenge-trade', category: 'psychology', description: 'Revenge trading' },
  { tag_name: 'overconfident', category: 'psychology', description: 'Overconfidence' },
  { tag_name: 'tilted', category: 'psychology', description: 'Emotional/tilted' },
  { tag_name: 'impatient', category: 'psychology', description: 'Impatient' },
  
  // Planning
  { tag_name: 'ignored-plan', category: 'plan', description: 'Ignored trading plan' },
  { tag_name: 'no-plan', category: 'plan', description: 'No trading plan' },
  { tag_name: 'changed-plan', category: 'plan', description: 'Changed plan mid-trade' },
  
  // Risk Management
  { tag_name: 'poor-risk-reward', category: 'risk', description: 'Poor risk/reward' },
  { tag_name: 'high-risk', category: 'risk', description: 'Risk too high' },
  { tag_name: 'no-risk-calculation', category: 'risk', description: 'No risk calculation' }
];

async function migratePostgreSQL() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Create mistake_tags table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS mistake_tags (
        id SERIAL PRIMARY KEY,
        tag_name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ mistake_tags table ready');
    
    // Insert default tags
    let inserted = 0;
    let skipped = 0;
    
    for (const tag of defaultTags) {
      try {
        await client.query(
          'INSERT INTO mistake_tags (tag_name, category, description) VALUES ($1, $2, $3) ON CONFLICT (tag_name) DO NOTHING',
          [tag.tag_name, tag.category, tag.description]
        );
        const result = await client.query('SELECT 1 FROM mistake_tags WHERE tag_name = $1', [tag.tag_name]);
        if (result.rows.length > 0) {
          console.log(`  ✅ Tag: ${tag.tag_name}`);
          inserted++;
        }
      } catch (err) {
        console.error(`  ❌ Error with tag ${tag.tag_name}:`, err.message);
        skipped++;
      }
    }
    
    // Verify all tags
    const allTags = await client.query('SELECT tag_name, category FROM mistake_tags ORDER BY category, tag_name');
    console.log(`\n📊 Migration Summary:`);
    console.log(`  Total tags in database: ${allTags.rows.length}`);
    console.log(`  Newly inserted: ${inserted}`);
    console.log(`  Already existed: ${skipped}`);
    
    // Show tags by category
    const categories = {};
    allTags.rows.forEach(row => {
      if (!categories[row.category]) {
        categories[row.category] = [];
      }
      categories[row.category].push(row.tag_name);
    });
    
    console.log('\n📋 Tags by category:');
    Object.keys(categories).sort().forEach(cat => {
      console.log(`  ${cat}: ${categories[cat].length} tags`);
      categories[cat].forEach(tag => console.log(`    - ${tag}`));
    });
    
  } catch (error) {
    console.error('❌ PostgreSQL migration error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function migrateSQLite() {
  const db = await open({
    filename: './trading_metrics.db',
    driver: sqlite3.Database
  });
  
  try {
    console.log('✅ Connected to SQLite database');
    
    // Create mistake_tags table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS mistake_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT UNIQUE NOT NULL,
        category TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ mistake_tags table ready');
    
    // Insert default tags
    let inserted = 0;
    let skipped = 0;
    
    for (const tag of defaultTags) {
      try {
        await db.run(
          'INSERT OR IGNORE INTO mistake_tags (tag_name, category, description) VALUES (?, ?, ?)',
          [tag.tag_name, tag.category, tag.description]
        );
        const result = await db.get('SELECT 1 FROM mistake_tags WHERE tag_name = ?', [tag.tag_name]);
        if (result) {
          console.log(`  ✅ Tag: ${tag.tag_name}`);
          inserted++;
        }
      } catch (err) {
        console.error(`  ❌ Error with tag ${tag.tag_name}:`, err.message);
        skipped++;
      }
    }
    
    // Verify all tags
    const allTags = await db.all('SELECT tag_name, category FROM mistake_tags ORDER BY category, tag_name');
    console.log(`\n📊 Migration Summary:`);
    console.log(`  Total tags in database: ${allTags.length}`);
    console.log(`  Newly inserted: ${inserted}`);
    console.log(`  Already existed: ${skipped}`);
    
    // Show tags by category
    const categories = {};
    allTags.forEach(row => {
      if (!categories[row.category]) {
        categories[row.category] = [];
      }
      categories[row.category].push(row.tag_name);
    });
    
    console.log('\n📋 Tags by category:');
    Object.keys(categories).sort().forEach(cat => {
      console.log(`  ${cat}: ${categories[cat].length} tags`);
      categories[cat].forEach(tag => console.log(`    - ${tag}`));
    });
    
  } catch (error) {
    console.error('❌ SQLite migration error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

async function main() {
  console.log('🚀 Starting mistake tags migration...\n');
  
  try {
    if (process.env.DATABASE_URL) {
      console.log('🐘 Using PostgreSQL database');
      await migratePostgreSQL();
    } else {
      console.log('📦 Using SQLite database');
      await migrateSQLite();
    }
    
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();