import express from 'express';
import Database from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeEmotionalBias, findMistakePatterns, calculateStreaks, analyzeBreakoutTypes, analyzeNiftyRange } from '../utils/metrics.js';

const router = express.Router();

router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    const { date } = req.query;
    const query = date 
      ? 'SELECT * FROM daily_metrics WHERE user_id = ? AND date = ?'
      : 'SELECT * FROM daily_metrics WHERE user_id = ? ORDER BY date DESC LIMIT 30';
    const params = date ? [req.userId, date] : [req.userId];
    
    const metrics = await database.all(query, params);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily metrics' });
  }
});

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const trades = await database.all(
      'SELECT * FROM trades WHERE user_id = ? AND trade_date >= ? ORDER BY trade_date DESC',
      [req.userId, startDate.toISOString().split('T')[0]]
    );
    
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    // Calculate average R-Multiple only for trades with stop loss
    const tradesWithStopLoss = trades.filter(t => t.r_multiple !== null && t.r_multiple !== undefined);
    const avgRMultiple = tradesWithStopLoss.length > 0 ? 
      tradesWithStopLoss.reduce((sum, t) => sum + t.r_multiple, 0) / tradesWithStopLoss.length : 0;
    
    // Calculate Stop Loss Usage Rate (percentage of trades with stop loss)
    const stopLossUsageRate = totalTrades > 0 ? (tradesWithStopLoss.length / totalTrades) * 100 : 0;
    
    // Calculate Plan Follow Rate
    const tradesWithPlanFollowed = trades.filter(t => t.followed_plan === 1 || t.followed_plan === true);
    const planFollowRate = totalTrades > 0 ? (tradesWithPlanFollowed.length / totalTrades) * 100 : 0;
    
    // Calculate separate R-Multiples for winning and losing trades
    const winningTradesWithSL = tradesWithStopLoss.filter(t => t.pnl > 0);
    const losingTradesWithSL = tradesWithStopLoss.filter(t => t.pnl <= 0);
    
    const avgRMultipleWinning = winningTradesWithSL.length > 0 ?
      winningTradesWithSL.reduce((sum, t) => sum + t.r_multiple, 0) / winningTradesWithSL.length : 0;
    const avgRMultipleLosing = losingTradesWithSL.length > 0 ?
      losingTradesWithSL.reduce((sum, t) => sum + t.r_multiple, 0) / losingTradesWithSL.length : 0;
    
    // Calculate total profit and total loss separately
    const totalProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    
    const emotionalBias = analyzeEmotionalBias(trades);
    const mistakePatterns = findMistakePatterns(trades);
    const streaks = calculateStreaks(trades);
    const breakoutAnalysis = analyzeBreakoutTypes(trades);
    const niftyRangeAnalysis = analyzeNiftyRange(trades);
    
    const maxDrawdown = calculateMaxDrawdown(trades);
    
    res.json({
      totalTrades,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      totalPnl: Math.round(totalPnl * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      avgRMultiple: Math.round(avgRMultiple * 100) / 100,
      avgRMultipleWinning: Math.round(avgRMultipleWinning * 100) / 100,
      avgRMultipleLosing: Math.round(avgRMultipleLosing * 100) / 100,
      stopLossUsageRate: Math.round(stopLossUsageRate * 100) / 100,
      tradesWithStopLoss: tradesWithStopLoss.length,
      planFollowRate: Math.round(planFollowRate * 100) / 100,
      tradesWithPlanFollowed: tradesWithPlanFollowed.length,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalLoss: Math.round(totalLoss * 100) / 100,
      maxDrawdown,
      emotionalBias,
      mistakePatterns,
      streaks,
      breakoutAnalysis,
      niftyRangeAnalysis,
      callPutRatio: {
        calls: trades.filter(t => t.option_type === 'call').length,
        puts: trades.filter(t => t.option_type === 'put').length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch summary metrics' });
  }
});

router.get('/performance-trend', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const dailyMetrics = await database.all(
      'SELECT * FROM daily_metrics WHERE user_id = ? AND date >= ? ORDER BY date ASC',
      [req.userId, startDate.toISOString().split('T')[0]]
    );
    
    let cumulativePnl = 0;
    const equityCurve = dailyMetrics.map(day => {
      cumulativePnl += day.total_pnl;
      return {
        date: day.date,
        pnl: day.total_pnl,
        cumulativePnl,
        winRate: day.win_rate,
        avgRMultiple: day.avg_r_multiple
      };
    });
    
    res.json(equityCurve);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance trend' });
  }
});

function calculateMaxDrawdown(trades) {
  if (trades.length === 0) return 0;
  
  let peak = 0;
  let maxDrawdown = 0;
  let cumPnl = 0;
  
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.trade_date) - new Date(b.trade_date)
  );
  
  sortedTrades.forEach(trade => {
    cumPnl += trade.pnl;
    if (cumPnl > peak) {
      peak = cumPnl;
    }
    const drawdown = peak - cumPnl;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  return Math.round(maxDrawdown * 100) / 100;
}

export default router;