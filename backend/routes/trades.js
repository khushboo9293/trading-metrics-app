import express from 'express';
import Database from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateMetrics } from '../utils/metrics.js';

const router = express.Router();

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