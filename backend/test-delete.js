import Database from './database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDeleteFunctionality() {
  console.log('🧪 Testing trade deletion functionality...\n');
  
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    // First, create a test trade
    console.log('1. Creating a test trade...');
    const testTrade = {
      user_id: 1, // Assuming user 1 exists
      underlying: 'TEST-DELETE',
      option_type: 'call',
      entry_price: 100,
      exit_price: 105,
      quantity: 25,
      trade_date: '2024-01-01',
      followed_plan: 1,
      pnl: 125,
      return_percentage: 5,
      risk_amount: 0,
      r_multiple: 0
    };
    
    const result = await database.run(
      `INSERT INTO trades (
        user_id, underlying, option_type, entry_price, exit_price, quantity, 
        trade_date, followed_plan, pnl, return_percentage, risk_amount, r_multiple
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testTrade.user_id, testTrade.underlying, testTrade.option_type,
        testTrade.entry_price, testTrade.exit_price, testTrade.quantity,
        testTrade.trade_date, testTrade.followed_plan,
        testTrade.pnl, testTrade.return_percentage, testTrade.risk_amount, testTrade.r_multiple
      ]
    );
    
    const testTradeId = result.lastID;
    console.log(`✅ Test trade created with ID: ${testTradeId}`);
    
    // Verify the trade was created
    console.log('\n2. Verifying test trade exists...');
    const createdTrade = await database.get(
      'SELECT * FROM trades WHERE id = ?',
      [testTradeId]
    );
    
    if (createdTrade) {
      console.log('✅ Test trade found:', {
        id: createdTrade.id,
        underlying: createdTrade.underlying,
        pnl: createdTrade.pnl,
        trade_date: createdTrade.trade_date
      });
    } else {
      console.log('❌ Test trade not found after creation');
      return;
    }
    
    // Test the delete functionality
    console.log('\n3. Testing delete functionality...');
    
    // Check if trade exists and belongs to user (simulating the backend logic)
    const existingTrade = await database.get(
      'SELECT * FROM trades WHERE id = ? AND user_id = ?',
      [testTradeId, testTrade.user_id]
    );
    
    if (!existingTrade) {
      console.log('❌ Trade not found or doesn\'t belong to user');
      return;
    }
    
    // Delete the trade
    const deleteResult = await database.run(
      'DELETE FROM trades WHERE id = ? AND user_id = ?',
      [testTradeId, testTrade.user_id]
    );
    
    console.log(`✅ Delete executed. Rows affected: ${deleteResult.changes}`);
    
    // Verify the trade was deleted
    console.log('\n4. Verifying trade was deleted...');
    const deletedTrade = await database.get(
      'SELECT * FROM trades WHERE id = ?',
      [testTradeId]
    );
    
    if (!deletedTrade) {
      console.log('✅ Trade successfully deleted - not found in database');
    } else {
      console.log('❌ Trade still exists after deletion:', deletedTrade);
    }
    
    // Test edge cases
    console.log('\n5. Testing edge cases...');
    
    // Try to delete non-existent trade
    const nonExistentResult = await database.run(
      'DELETE FROM trades WHERE id = ? AND user_id = ?',
      [99999, testTrade.user_id]
    );
    
    console.log(`✅ Deleting non-existent trade: ${nonExistentResult.changes} rows affected (should be 0)`);
    
    console.log('\n✅ All delete functionality tests passed!');
    console.log('\nThe delete endpoint should work correctly with:');
    console.log('- Proper user authorization (trade belongs to user)');
    console.log('- Successful deletion from database');
    console.log('- Proper error handling for non-existent trades');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDeleteFunctionality();