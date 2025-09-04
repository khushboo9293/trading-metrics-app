import Database from './database.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixDuplicateTags() {
  const db = new Database();
  await db.init();
  const database = db.getDb();
  
  try {
    console.log('Starting to fix duplicate mistake tags...');
    
    // Get all trades with mistakes
    const trades = await database.all(
      `SELECT id, mistakes FROM trades WHERE mistakes IS NOT NULL AND mistakes != ''`
    );
    
    console.log(`Found ${trades.length} trades with mistakes`);
    
    let updatedCount = 0;
    
    // Common duplicates to fix
    const tagMappings = {
      'early exit': 'early-exit',
      'late exit': 'late-exit',
      'no setup entry': 'no-setup-entry',
      'poor entry level': 'poor-entry-level',
      'poor entry timing': 'poor-entry-timing',
      'no stop loss': 'no-stop-loss',
      'poor position size': 'poor-position-size',
      'poor stop placement': 'poor-stop-placement',
      'fear driven': 'fear-driven',
      'greed driven': 'greed-driven',
      'revenge mode': 'revenge-trading',
      'ignored plan': 'ignored-plan',
      'no plan': 'no-plan',
      'rushed decision': 'rushed-decision',
      'poor risk sizing': 'poor-risk-sizing',
      'no risk calculation': 'no-risk-calculation',
      'violated risk rules': 'violated-risk-rules'
    };
    
    for (const trade of trades) {
      let mistakes = trade.mistakes;
      let updated = false;
      
      // Replace each variant with the standardized version
      for (const [variant, standard] of Object.entries(tagMappings)) {
        if (mistakes.includes(variant)) {
          // Use regex to replace whole words only
          const regex = new RegExp(`\\b${variant}\\b`, 'gi');
          mistakes = mistakes.replace(regex, standard);
          updated = true;
        }
      }
      
      // Also clean up any duplicate commas or extra spaces
      mistakes = mistakes
        .split(',')
        .map(m => m.trim())
        .filter((m, index, self) => m && self.indexOf(m) === index) // Remove duplicates
        .join(', ');
      
      if (updated) {
        await database.run(
          'UPDATE trades SET mistakes = ? WHERE id = ?',
          [mistakes, trade.id]
        );
        updatedCount++;
        console.log(`Updated trade ${trade.id}: ${trade.mistakes} -> ${mistakes}`);
      }
    }
    
    console.log(`\n✅ Fixed ${updatedCount} trades with duplicate/variant mistake tags`);
    
    // Also update emotional state entries if they exist
    const emotionalTrades = await database.all(
      `SELECT id, emotional_state_entry, emotional_state_exit FROM trades 
       WHERE (emotional_state_entry IS NOT NULL AND emotional_state_entry != '') 
       OR (emotional_state_exit IS NOT NULL AND emotional_state_exit != '')`
    );
    
    console.log(`\nFound ${emotionalTrades.length} trades with emotional states`);
    
    let emotionalUpdatedCount = 0;
    
    for (const trade of emotionalTrades) {
      let updated = false;
      let entryEmotions = trade.emotional_state_entry || '';
      let exitEmotions = trade.emotional_state_exit || '';
      
      // Clean up entry emotions
      if (entryEmotions) {
        const cleanedEntry = entryEmotions
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter((e, index, self) => e && self.indexOf(e) === index)
          .join(', ');
        
        if (cleanedEntry !== entryEmotions) {
          entryEmotions = cleanedEntry;
          updated = true;
        }
      }
      
      // Clean up exit emotions
      if (exitEmotions) {
        const cleanedExit = exitEmotions
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter((e, index, self) => e && self.indexOf(e) === index)
          .join(', ');
        
        if (cleanedExit !== exitEmotions) {
          exitEmotions = cleanedExit;
          updated = true;
        }
      }
      
      if (updated) {
        await database.run(
          'UPDATE trades SET emotional_state_entry = ?, emotional_state_exit = ? WHERE id = ?',
          [entryEmotions || null, exitEmotions || null, trade.id]
        );
        emotionalUpdatedCount++;
        console.log(`Updated emotional states for trade ${trade.id}`);
      }
    }
    
    if (emotionalUpdatedCount > 0) {
      console.log(`✅ Cleaned up emotional states for ${emotionalUpdatedCount} trades`);
    }
    
    console.log('\n🎉 Database cleanup complete!');
    
  } catch (error) {
    console.error('Error fixing duplicate tags:', error);
  } finally {
    process.exit(0);
  }
}

// Set DATABASE_URL to use production database
if (process.argv[2] === '--production') {
  console.log('Running on PRODUCTION database...');
  // Make sure DATABASE_URL is set in your .env file
} else {
  console.log('Running on LOCAL database...');
  delete process.env.DATABASE_URL;
}

fixDuplicateTags();