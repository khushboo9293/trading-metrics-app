import Database from './database.js';
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  console.log('🚀 Starting production database migration...');
  
  try {
    const db = new Database();
    await db.init();
    console.log('✅ Database migration completed successfully!');
    
    // Test the schema
    const database = db.getDb();
    
    if (process.env.DATABASE_URL) {
      // PostgreSQL
      const result = await database.all(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'trades' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Current trades table schema (PostgreSQL):');
      result.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check for required columns
      const columnNames = result.map(col => col.column_name);
      const requiredColumns = ['entry_time', 'exit_time', 'mistake_corrected'];
      
      console.log('\n🔍 Required columns check:');
      requiredColumns.forEach(col => {
        const exists = columnNames.includes(col);
        console.log(`  ${exists ? '✅' : '❌'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
      });
      
    } else {
      // SQLite
      const result = await database.all("PRAGMA table_info(trades)");
      console.log('\n📋 Current trades table schema (SQLite):');
      result.forEach(col => {
        console.log(`  - ${col.name}: ${col.type}`);
      });
    }
    
    console.log('\n🎉 Migration verification completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

runMigrations();