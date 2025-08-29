import Database from './database.js';
import XLSX from 'xlsx';
import fs from 'fs';

async function exportTrades() {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    // Get all trades for user_id 1
    const trades = await database.all(
      'SELECT * FROM trades WHERE user_id = 1 ORDER BY trade_date DESC, created_at DESC'
    );
    
    console.log(`Found ${trades.length} trades to export`);
    
    // Transform trades data for Excel
    const exportData = trades.map(trade => ({
      'Date': trade.trade_date,
      'Underlying': trade.underlying,
      'Option Type': trade.option_type,
      'Breakout Type': trade.breakout_type || '',
      'Nifty Range': trade.nifty_range || '',
      'Strike Price': trade.strike_price || '',
      'Entry Price': trade.entry_price,
      'Stop Loss': trade.stop_loss || '',
      'Exit Price': trade.exit_price,
      'Quantity': trade.quantity,
      'Lot Size': trade.lot_size || 25,
      'PnL': trade.pnl,
      'Return %': trade.return_percentage,
      'Risk Amount': trade.risk_amount || '',
      'R-Multiple': trade.r_multiple || '',
      'Followed Plan': trade.followed_plan ? 'Yes' : 'No',
      'Mistakes': trade.mistakes || '',
      'Notes': trade.notes || ''
    }));
    
    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trades');
    
    // Write to file
    const filename = `local_trades_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    console.log(`✅ Exported ${trades.length} trades to ${filename}`);
    
  } catch (error) {
    console.error('Export error:', error);
  }
}

exportTrades();