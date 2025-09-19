import Database from './database.js';
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

async function initializeTags() {
  console.log('🚀 Initializing mistake tags...');
  
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    for (const tag of defaultTags) {
      try {
        if (process.env.DATABASE_URL) {
          // PostgreSQL
          await database.run(
            'INSERT INTO mistake_tags (tag_name, category, description) VALUES (?, ?, ?) ON CONFLICT (tag_name) DO NOTHING',
            [tag.tag_name, tag.category, tag.description]
          );
        } else {
          // SQLite
          await database.run(
            'INSERT OR IGNORE INTO mistake_tags (tag_name, category, description) VALUES (?, ?, ?)',
            [tag.tag_name, tag.category, tag.description]
          );
        }
        console.log(`✅ Added tag: ${tag.tag_name}`);
      } catch (err) {
        console.log(`⚠️ Tag already exists: ${tag.tag_name}`);
      }
    }
    
    // Verify tags were added
    const allTags = await database.all('SELECT * FROM mistake_tags ORDER BY tag_name');
    console.log(`\n📊 Total tags in database: ${allTags.length}`);
    console.log('Tags by category:');
    
    const categories = {};
    allTags.forEach(tag => {
      if (!categories[tag.category]) {
        categories[tag.category] = [];
      }
      categories[tag.category].push(tag.tag_name);
    });
    
    Object.keys(categories).forEach(cat => {
      console.log(`  ${cat}: ${categories[cat].length} tags`);
    });
    
    console.log('\n✅ Tag initialization complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error initializing tags:', error);
    process.exit(1);
  }
}

initializeTags();