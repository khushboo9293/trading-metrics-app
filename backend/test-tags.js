import Database from './database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testTagsSetup() {
  console.log('🔍 Testing mistake tags setup...\n');
  
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    // Test 1: Check if mistake_tags table exists
    console.log('1. Checking mistake_tags table...');
    try {
      const tableCheck = await database.all('SELECT name FROM sqlite_master WHERE type="table" AND name="mistake_tags"');
      if (tableCheck.length > 0) {
        console.log('✅ mistake_tags table exists');
      } else {
        console.log('❌ mistake_tags table not found');
        return;
      }
    } catch (err) {
      console.log('❌ Error checking table:', err.message);
      return;
    }
    
    // Test 2: Count tags in database
    console.log('\n2. Checking tag count...');
    const tagCount = await database.get('SELECT COUNT(*) as count FROM mistake_tags');
    console.log(`📊 Total tags in database: ${tagCount.count}`);
    
    // Test 3: Show sample tags
    console.log('\n3. Sample tags:');
    const sampleTags = await database.all('SELECT tag_name, category, description FROM mistake_tags ORDER BY category, tag_name LIMIT 10');
    sampleTags.forEach(tag => {
      console.log(`   ${tag.category}: ${tag.tag_name} - ${tag.description}`);
    });
    
    // Test 4: Group tags by category
    console.log('\n4. Tags by category:');
    const categories = await database.all(`
      SELECT category, COUNT(*) as count 
      FROM mistake_tags 
      GROUP BY category 
      ORDER BY category
    `);
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} tags`);
    });
    
    // Test 5: Check for any user-created tags from trades
    console.log('\n5. Checking for user-created tags from trades...');
    try {
      const userTags = await database.all(`
        SELECT DISTINCT mistakes FROM trades 
        WHERE mistakes IS NOT NULL AND mistakes != ''
        LIMIT 5
      `);
      
      if (userTags.length > 0) {
        console.log('📋 Sample mistake entries from trades:');
        userTags.forEach(row => {
          console.log(`   "${row.mistakes}"`);
        });
      } else {
        console.log('   No mistake tags found in trades table yet');
      }
    } catch (err) {
      console.log('   No trades table found yet (this is normal for new setup)');
    }
    
    // Test 6: Simulate the /api/metrics/tags endpoint logic
    console.log('\n6. Simulating tags API endpoint...');
    
    // Get predefined tags
    const predefinedTags = await database.all('SELECT * FROM mistake_tags ORDER BY tag_name ASC');
    
    // Get used tags (this will be empty if no trades exist yet)
    let usedTags = new Set();
    try {
      const usedTagsResult = await database.all(`
        SELECT DISTINCT mistakes FROM trades 
        WHERE mistakes IS NOT NULL AND mistakes != ''
      `);
      
      usedTagsResult.forEach(row => {
        if (row.mistakes) {
          row.mistakes.split(',').forEach(tag => {
            const trimmed = tag.trim();
            if (trimmed) {
              usedTags.add(trimmed);
            }
          });
        }
      });
    } catch (err) {
      // trades table might not exist yet
    }
    
    // Combine tags
    const tagMap = new Map();
    
    predefinedTags.forEach(tag => {
      tagMap.set(tag.tag_name, tag);
    });
    
    usedTags.forEach(tagName => {
      if (!tagMap.has(tagName)) {
        tagMap.set(tagName, {
          tag_name: tagName,
          category: 'custom',
          description: 'User-created tag'
        });
      }
    });
    
    const allTags = Array.from(tagMap.values()).sort((a, b) => 
      a.tag_name.localeCompare(b.tag_name)
    );
    
    console.log(`📊 API would return: ${allTags.length} total tags`);
    console.log(`   - ${predefinedTags.length} predefined tags`);
    console.log(`   - ${usedTags.size} user-created tags from trades`);
    
    // Test 7: Show tags that would be available for autocomplete
    console.log('\n7. Tags available for autocomplete (first 15):');
    allTags.slice(0, 15).forEach(tag => {
      const marker = tag.category === 'custom' ? '👤' : '🏷️';
      console.log(`   ${marker} ${tag.tag_name} (${tag.category})`);
    });
    
    console.log('\n✅ Tags setup test completed successfully!');
    console.log('\nThe mistake tags are now ready for use in the frontend forms.');
    console.log('Users will see these tags as suggestions when typing in the mistakes field.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTagsSetup();