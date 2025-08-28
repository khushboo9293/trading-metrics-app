import express from 'express';
import Database from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateMetrics } from '../utils/metrics.js';
import XLSX from 'xlsx';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    const {
      underlying,
      option_type,
      breakout_type,
      nifty_range,
      entry_price,
      stop_loss,
      exit_price,
      quantity,
      trade_date,
      followed_plan,
      mistakes,
      notes,
      screenshot_url
    } = req.body;
    
    const metrics = calculateMetrics({
      entry_price,
      exit_price,
      stop_loss,
      quantity
    });
    
    const result = await database.run(
      `INSERT INTO trades (
        user_id, underlying, option_type, breakout_type, nifty_range, entry_price,
        stop_loss, exit_price, quantity, trade_date,
        followed_plan, mistakes, notes, screenshot_url,
        pnl, return_percentage, risk_amount, r_multiple
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId, underlying, option_type, breakout_type, nifty_range, entry_price,
        stop_loss, exit_price, quantity, trade_date,
        followed_plan, mistakes, notes, screenshot_url,
        metrics.pnl, metrics.returnPercentage, metrics.riskAmount, metrics.rMultiple
      ]
    );
    
    await updateDailyMetrics(database, req.userId, trade_date);
    
    res.json({ id: result.lastID, ...metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save trade' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    const trades = await database.all(
      'SELECT * FROM trades WHERE user_id = ? ORDER BY trade_date DESC, created_at DESC',
      [req.userId]
    );
    
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    const trade = await database.get(
      'SELECT * FROM trades WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    
    if (!trade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    const {
      underlying,
      option_type,
      breakout_type,
      nifty_range,
      entry_price,
      stop_loss,
      exit_price,
      quantity,
      trade_date,
      followed_plan,
      mistakes,
      notes,
      screenshot_url
    } = req.body;
    
    // Check if trade exists and belongs to user
    const existingTrade = await database.get(
      'SELECT * FROM trades WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    
    if (!existingTrade) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    const metrics = calculateMetrics({
      entry_price,
      exit_price,
      stop_loss,
      quantity
    });
    
    await database.run(
      `UPDATE trades SET 
        underlying = ?, option_type = ?, breakout_type = ?, nifty_range = ?, entry_price = ?,
        stop_loss = ?, exit_price = ?, quantity = ?, trade_date = ?,
        followed_plan = ?, mistakes = ?, notes = ?, screenshot_url = ?,
        pnl = ?, return_percentage = ?, risk_amount = ?, r_multiple = ?
      WHERE id = ? AND user_id = ?`,
      [
        underlying, option_type, breakout_type, nifty_range, entry_price,
        stop_loss, exit_price, quantity, trade_date,
        followed_plan, mistakes, notes, screenshot_url,
        metrics.pnl, metrics.returnPercentage, metrics.riskAmount, metrics.rMultiple,
        req.params.id, req.userId
      ]
    );
    
    // Update daily metrics for the trade date
    await updateDailyMetrics(database, req.userId, trade_date);
    
    // Also update daily metrics for the old trade date if it changed
    if (existingTrade.trade_date !== trade_date) {
      await updateDailyMetrics(database, req.userId, existingTrade.trade_date);
    }
    
    res.json({ id: req.params.id, ...metrics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update trade' });
  }
});

// Export trades to Excel
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    const trades = await database.all(
      'SELECT * FROM trades WHERE user_id = ? ORDER BY trade_date DESC, created_at DESC',
      [req.userId]
    );
    
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
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Set headers and send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=trades_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export trades' });
  }
});

// Import trades from Excel
router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    
    let imported = 0;
    let skipped = 0;
    
    for (const row of data) {
      // Check for duplicate based on date, underlying, entry, and exit prices
      const existing = await database.get(
        `SELECT id FROM trades WHERE user_id = ? AND trade_date = ? AND underlying = ? 
         AND entry_price = ? AND exit_price = ?`,
        [req.userId, row['Date'], row['Underlying'], row['Entry Price'], row['Exit Price']]
      );
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Calculate metrics
      const metrics = calculateMetrics({
        entry_price: row['Entry Price'],
        exit_price: row['Exit Price'],
        stop_loss: row['Stop Loss'] || null,
        quantity: row['Quantity']
      });
      
      // Insert trade
      await database.run(
        `INSERT INTO trades (
          user_id, underlying, option_type, breakout_type, nifty_range, 
          strike_price, entry_price, stop_loss, exit_price, quantity, lot_size,
          trade_date, followed_plan, mistakes, notes,
          pnl, return_percentage, risk_amount, r_multiple
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.userId,
          row['Underlying'],
          row['Option Type'] || 'call',
          row['Breakout Type'] || null,
          row['Nifty Range'] || null,
          row['Strike Price'] || null,
          row['Entry Price'],
          row['Stop Loss'] || null,
          row['Exit Price'],
          row['Quantity'],
          row['Lot Size'] || 25,
          row['Date'],
          row['Followed Plan'] === 'Yes' ? 1 : 0,
          row['Mistakes'] || null,
          row['Notes'] || null,
          metrics.pnl,
          metrics.returnPercentage,
          metrics.riskAmount,
          metrics.rMultiple
        ]
      );
      
      // Update daily metrics for imported trade
      await updateDailyMetrics(database, req.userId, row['Date']);
      imported++;
    }
    
    res.json({ 
      message: 'Import completed',
      imported,
      skipped,
      total: data.length 
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import trades. Please ensure the file is in the correct format.' });
  }
});

async function updateDailyMetrics(database, userId, tradeDate) {
  const trades = await database.all(
    'SELECT * FROM trades WHERE user_id = ? AND trade_date = ?',
    [userId, tradeDate]
  );
  
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const losingTrades = trades.filter(t => t.pnl <= 0).length;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgRMultiple = totalTrades > 0 ? trades.reduce((sum, t) => sum + t.r_multiple, 0) / totalTrades : 0;
  const planAdherence = totalTrades > 0 ? (trades.filter(t => t.followed_plan).length / totalTrades) * 100 : 0;
  const mistakeFrequency = totalTrades > 0 ? (trades.filter(t => t.mistakes).length / totalTrades) * 100 : 0;
  
  await database.run(
    `INSERT OR REPLACE INTO daily_metrics (
      user_id, date, total_trades, winning_trades, losing_trades,
      total_pnl, win_rate, avg_r_multiple, plan_adherence_rate, mistake_frequency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, tradeDate, totalTrades, winningTrades, losingTrades,
      totalPnl, winRate, avgRMultiple, planAdherence, mistakeFrequency
    ]
  );
}

export default router;