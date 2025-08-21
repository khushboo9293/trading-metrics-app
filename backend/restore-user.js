import bcrypt from 'bcryptjs';
import Database from './database.js';

async function restoreUser() {
  const db = new Database();
  await db.init();
  const database = db.getDb();
  
  try {
    // Check if user already exists
    const existingUser = await database.get('SELECT * FROM users WHERE id = 1');
    
    if (existingUser) {
      console.log('✅ User already exists with email:', existingUser.email);
      return;
    }
    
    // Create user with ID 1 to match existing trades
    const email = 'khushboo9293@gmail.com'; // You can change this
    const password = 'trading123'; // You can change this
    const name = 'Khushboo';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await database.run(
      'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
      [1, email, hashedPassword, name]
    );
    
    console.log('✅ User account restored successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('📊 You have access to all 14 existing trades');
    
    // Show trade summary
    const tradeSummary = await database.get(`
      SELECT 
        COUNT(*) as total_trades,
        SUM(pnl) as total_pnl,
        COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades
      FROM trades 
      WHERE user_id = 1
    `);
    
    console.log('\n📈 Your Trading Summary:');
    console.log('   Total Trades:', tradeSummary.total_trades);
    console.log('   Total P&L: ₹', tradeSummary.total_pnl);
    console.log('   Winning Trades:', tradeSummary.winning_trades);
    console.log('   Win Rate:', Math.round(tradeSummary.winning_trades / tradeSummary.total_trades * 100) + '%');
    
  } catch (error) {
    console.error('Error restoring user:', error);
  } finally {
    await database.close();
  }
}

restoreUser();