import express from 'express';
import Database from '../database.js';
import dbSingleton from '../database-singleton.js';
import { summaryCache, trendCache } from '../cache.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeEmotionalBias, findMistakePatterns, calculateStreaks, analyzeBreakoutTypes, analyzeNiftyRange } from '../utils/metrics.js';

const router = express.Router();

router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
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
    // Check cache first
    const { period = 'current-month' } = req.query;
    const cacheKey = `user:${req.userId}:summary:${period}`;
    const cached = summaryCache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Use singleton database connection
    const database = await dbSingleton.getInstance();
    
    let startDate, endDate;
    
    if (period === 'today') {
      // Get today's date in YYYY-MM-DD format to avoid timezone issues
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      // Use the same date for both start and end for "today"
      startDate = new Date(todayStr + 'T00:00:00');
      endDate = new Date(todayStr + 'T23:59:59');
    } else if (period === 'current-month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'last-month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'two-months-ago') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
    } else {
      // Handle numeric days (like "15")
      const days = parseInt(period);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      endDate = new Date();
    }
    
    let trades;
    if (period === 'today') {
      // For today, get current date string directly to avoid timezone issues
      const todayStr = new Date().toISOString().split('T')[0];
      trades = await database.all(
        'SELECT * FROM trades WHERE user_id = ? AND trade_date = ? ORDER BY trade_date DESC',
        [req.userId, todayStr]
      );
    } else {
      trades = await database.all(
        'SELECT * FROM trades WHERE user_id = ? AND trade_date >= ? AND trade_date <= ? ORDER BY trade_date DESC',
        [req.userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );
    }
    
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
    
    // Calculate total investment and return percentage
    const totalInvestment = trades.reduce((sum, t) => {
      // Investment = entry price × quantity
      return sum + (t.entry_price * t.quantity);
    }, 0);
    
    const returnPercentage = totalInvestment > 0 ? ((totalPnl / totalInvestment) * 100) : 0;
    
    const emotionalBias = analyzeEmotionalBias(trades);
    const mistakePatterns = findMistakePatterns(trades);
    const streaks = calculateStreaks(trades);
    const breakoutAnalysis = analyzeBreakoutTypes(trades);
    const niftyRangeAnalysis = analyzeNiftyRange(trades);
    
    const maxDrawdown = calculateMaxDrawdown(trades);
    
    // Calculate daily trade limit violations
    const dailyTradeLimit = 4;
    let tradeLimitAnalysis = {};
    
    if (period === 'today') {
      // For today view, just show if limit is exceeded
      tradeLimitAnalysis = {
        todayTradeCount: totalTrades,
        limitExceeded: totalTrades > dailyTradeLimit,
        excessTrades: Math.max(0, totalTrades - dailyTradeLimit)
      };
    } else {
      // For other periods, count days with limit violations
      const tradesByDay = {};
      trades.forEach(trade => {
        const dateKey = trade.trade_date;
        if (!tradesByDay[dateKey]) {
          tradesByDay[dateKey] = 0;
        }
        tradesByDay[dateKey]++;
      });
      
      const daysOverLimit = Object.entries(tradesByDay).filter(([date, count]) => count > dailyTradeLimit);
      const totalDaysTraded = Object.keys(tradesByDay).length;
      
      tradeLimitAnalysis = {
        daysOverLimit: daysOverLimit.length,
        totalDaysTraded,
        violationDates: daysOverLimit.map(([date, count]) => ({
          date,
          tradeCount: count,
          excess: count - dailyTradeLimit
        })).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5), // Show last 5 violations
        violationRate: totalDaysTraded > 0 ? Math.round((daysOverLimit.length / totalDaysTraded) * 100) : 0
      };
    }
    
    const responseData = {
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
      totalInvestment: Math.round(totalInvestment * 100) / 100,
      returnPercentage: Math.round(returnPercentage * 100) / 100,
      maxDrawdown,
      emotionalBias,
      mistakePatterns,
      streaks,
      breakoutAnalysis,
      niftyRangeAnalysis,
      callPutRatio: {
        calls: trades.filter(t => t.option_type === 'call').length,
        puts: trades.filter(t => t.option_type === 'put').length
      },
      tradeLimitAnalysis
    };
    
    // Cache the response
    summaryCache.set(cacheKey, responseData);
    
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch summary metrics' });
  }
});

router.get('/performance-trend', authenticateToken, async (req, res) => {
  try {
    // Check cache first
    const { period = 'current-month' } = req.query;
    const cacheKey = `user:${req.userId}:trend:${period}`;
    const cached = trendCache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Use singleton database connection
    const database = await dbSingleton.getInstance();
    
    let startDate, endDate;
    
    if (period === 'today') {
      // Get today's date in YYYY-MM-DD format to avoid timezone issues
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      // Use the same date for both start and end for "today"
      startDate = new Date(todayStr + 'T00:00:00');
      endDate = new Date(todayStr + 'T23:59:59');
    } else if (period === 'current-month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'last-month') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (period === 'two-months-ago') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
    } else {
      const days = parseInt(period);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      endDate = new Date();
    }
    
    let dailyMetrics;
    if (period === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      dailyMetrics = await database.all(
        'SELECT * FROM daily_metrics WHERE user_id = ? AND date = ? ORDER BY date ASC',
        [req.userId, todayStr]
      );
    } else {
      dailyMetrics = await database.all(
        'SELECT * FROM daily_metrics WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
        [req.userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );
    }
    
    // Get daily trades to calculate winners and losers R-Multiple
    let dailyTrades;
    if (period === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      dailyTrades = await database.all(
        `SELECT DATE(trade_date) as date, 
                AVG(CASE WHEN pnl > 0 THEN r_multiple END) as winners_r_multiple,
                AVG(CASE WHEN pnl <= 0 THEN r_multiple END) as losers_r_multiple
         FROM trades 
         WHERE user_id = ? AND trade_date = ?
         GROUP BY DATE(trade_date)
         ORDER BY date ASC`,
        [req.userId, todayStr]
      );
    } else {
      dailyTrades = await database.all(
        `SELECT DATE(trade_date) as date, 
                AVG(CASE WHEN pnl > 0 THEN r_multiple END) as winners_r_multiple,
                AVG(CASE WHEN pnl <= 0 THEN r_multiple END) as losers_r_multiple
         FROM trades 
         WHERE user_id = ? AND trade_date >= ? AND trade_date <= ?
         GROUP BY DATE(trade_date)
         ORDER BY date ASC`,
        [req.userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      );
    }
    
    // Create a map for easy lookup
    const tradesMap = {};
    dailyTrades.forEach(day => {
      tradesMap[day.date] = {
        winnersRMultiple: day.winners_r_multiple || 0,
        losersRMultiple: day.losers_r_multiple || 0
      };
    });
    
    let cumulativePnl = 0;
    const equityCurve = dailyMetrics.map(day => {
      cumulativePnl += day.total_pnl;
      const tradeData = tradesMap[day.date] || { winnersRMultiple: 0, losersRMultiple: 0 };
      return {
        date: day.date,
        pnl: day.total_pnl,
        cumulativePnl,
        winRate: day.win_rate,
        avgRMultiple: day.avg_r_multiple,
        winnersRMultiple: tradeData.winnersRMultiple,
        losersRMultiple: tradeData.losersRMultiple
      };
    });
    
    // Cache the response
    trendCache.set(cacheKey, equityCurve);
    
    res.json(equityCurve);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance trend' });
  }
});

router.get('/weekly-r-multiple', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
    // Get last 12 weeks of data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (12 * 7));
    
    const trades = await database.all(
      `SELECT * FROM trades 
       WHERE user_id = ? AND trade_date >= ? 
       ORDER BY trade_date ASC`,
      [req.userId, startDate.toISOString().split('T')[0]]
    );
    
    // Group trades by week
    const weeklyData = {};
    trades.forEach(trade => {
      const tradeDate = new Date(trade.trade_date);
      const startOfWeek = new Date(tradeDate);
      startOfWeek.setDate(tradeDate.getDate() - tradeDate.getDay()); // Start of week (Sunday)
      const weekKey = startOfWeek.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          allTrades: [],
          winningTrades: [],
          losingTrades: []
        };
      }
      
      weeklyData[weekKey].allTrades.push(trade);
      if (trade.pnl > 0) {
        weeklyData[weekKey].winningTrades.push(trade);
      } else {
        weeklyData[weekKey].losingTrades.push(trade);
      }
    });
    
    // Calculate weekly averages
    const weeklyRMultiples = Object.values(weeklyData).map(week => {
      const avgAll = week.allTrades.length > 0 
        ? week.allTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / week.allTrades.length 
        : 0;
      
      const avgWinners = week.winningTrades.length > 0 
        ? week.winningTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / week.winningTrades.length 
        : 0;
      
      const avgLosers = week.losingTrades.length > 0 
        ? week.losingTrades.reduce((sum, t) => sum + (t.r_multiple || 0), 0) / week.losingTrades.length 
        : 0;
      
      return {
        week: week.week,
        weekLabel: new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgRMultiple: avgAll,
        avgWinnersRMultiple: avgWinners,
        avgLosersRMultiple: avgLosers,
        totalTrades: week.allTrades.length,
        winningTrades: week.winningTrades.length,
        losingTrades: week.losingTrades.length
      };
    }).filter(week => week.totalTrades > 0); // Only include weeks with trades
    
    res.json(weeklyRMultiples);
  } catch (error) {
    console.error('Error fetching weekly R-Multiple data:', error);
    res.status(500).json({ error: 'Failed to fetch weekly R-Multiple data' });
  }
});

// Weekly Plan Follow Rate endpoint
router.get('/weekly-plan-follow-rate', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
    // Get last 12 weeks of data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (12 * 7));
    
    const trades = await database.all(
      `SELECT trade_date, followed_plan FROM trades 
       WHERE user_id = ? AND trade_date >= ? 
       ORDER BY trade_date ASC`,
      [req.userId, startDate.toISOString().split('T')[0]]
    );
    
    // Group trades by week
    const weeklyData = {};
    trades.forEach(trade => {
      const tradeDate = new Date(trade.trade_date);
      const startOfWeek = new Date(tradeDate);
      startOfWeek.setDate(tradeDate.getDate() - tradeDate.getDay());
      const weekKey = startOfWeek.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          totalTrades: 0,
          planFollowedTrades: 0
        };
      }
      
      weeklyData[weekKey].totalTrades++;
      if (trade.followed_plan) {
        weeklyData[weekKey].planFollowedTrades++;
      }
    });
    
    // Calculate weekly plan follow rates
    const weeklyPlanRates = Object.values(weeklyData).map(week => ({
      week: week.week,
      weekLabel: new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      planFollowRate: week.totalTrades > 0 ? (week.planFollowedTrades / week.totalTrades) * 100 : 0,
      totalTrades: week.totalTrades,
      planFollowedTrades: week.planFollowedTrades
    })).filter(week => week.totalTrades > 0);
    
    res.json(weeklyPlanRates);
  } catch (error) {
    console.error('Error fetching weekly plan follow rate data:', error);
    res.status(500).json({ error: 'Failed to fetch weekly plan follow rate data' });
  }
});

// Weekly Win Rate endpoint
router.get('/weekly-win-rate', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
    // Get last 12 weeks of data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (12 * 7));
    
    const trades = await database.all(
      `SELECT trade_date, pnl FROM trades 
       WHERE user_id = ? AND trade_date >= ? 
       ORDER BY trade_date ASC`,
      [req.userId, startDate.toISOString().split('T')[0]]
    );
    
    // Group trades by week
    const weeklyData = {};
    trades.forEach(trade => {
      const tradeDate = new Date(trade.trade_date);
      const startOfWeek = new Date(tradeDate);
      startOfWeek.setDate(tradeDate.getDate() - tradeDate.getDay());
      const weekKey = startOfWeek.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          week: weekKey,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0
        };
      }
      
      weeklyData[weekKey].totalTrades++;
      if (trade.pnl > 0) {
        weeklyData[weekKey].winningTrades++;
      } else {
        weeklyData[weekKey].losingTrades++;
      }
    });
    
    // Calculate weekly win rates
    const weeklyWinRates = Object.values(weeklyData).map(week => ({
      week: week.week,
      weekLabel: new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      winRate: week.totalTrades > 0 ? (week.winningTrades / week.totalTrades) * 100 : 0,
      totalTrades: week.totalTrades,
      winningTrades: week.winningTrades,
      losingTrades: week.losingTrades
    })).filter(week => week.totalTrades > 0);
    
    res.json(weeklyWinRates);
  } catch (error) {
    console.error('Error fetching weekly win rate data:', error);
    res.status(500).json({ error: 'Failed to fetch weekly win rate data' });
  }
});

router.get('/plan-deviation-analysis', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
    // Get all deviation trades with full details
    const deviationTrades = await database.all(
      `SELECT mistakes, notes, emotional_state_entry, emotional_state_exit, pnl, r_multiple, 
              symbol, setup, entry_price, exit_price, stop_loss 
       FROM trades 
       WHERE user_id = ? AND followed_plan = 0`,
      [req.userId]
    );
    
    // Parse and categorize mistakes
    const mistakeFrequency = {};
    const deviationPatterns = {
      emotional_triggers: {},
      setup_issues: {},
      risk_management: {},
      exit_problems: {}
    };
    
    let totalPnlFromDeviations = 0;
    let avgRMultipleDeviations = 0;
    let rMultipleSum = 0;
    let rMultipleCount = 0;
    
    deviationTrades.forEach(trade => {
      totalPnlFromDeviations += trade.pnl || 0;
      if (trade.r_multiple !== null && trade.r_multiple !== undefined) {
        rMultipleSum += trade.r_multiple;
        rMultipleCount++;
      }
      
      // Analyze mistakes
      if (trade.mistakes) {
        const mistakes = trade.mistakes.split(',').map(m => m.trim().toLowerCase());
        mistakes.forEach(mistake => {
          if (mistake) {
            mistakeFrequency[mistake] = (mistakeFrequency[mistake] || 0) + 1;
            
            // Categorize mistakes into patterns
            if (mistake.includes('fear') || mistake.includes('greed') || mistake.includes('revenge') || mistake.includes('fomo')) {
              deviationPatterns.emotional_triggers[mistake] = (deviationPatterns.emotional_triggers[mistake] || 0) + 1;
            } else if (mistake.includes('setup') || mistake.includes('entry') || mistake.includes('timing')) {
              deviationPatterns.setup_issues[mistake] = (deviationPatterns.setup_issues[mistake] || 0) + 1;
            } else if (mistake.includes('stop') || mistake.includes('risk') || mistake.includes('size') || mistake.includes('position')) {
              deviationPatterns.risk_management[mistake] = (deviationPatterns.risk_management[mistake] || 0) + 1;
            } else if (mistake.includes('exit') || mistake.includes('target') || mistake.includes('hold')) {
              deviationPatterns.exit_problems[mistake] = (deviationPatterns.exit_problems[mistake] || 0) + 1;
            }
          }
        });
      }
      
      // Analyze emotional states for patterns
      if (trade.emotional_state_entry) {
        const emotions = trade.emotional_state_entry.split(',').map(e => e.trim().toLowerCase());
        emotions.forEach(emotion => {
          if (emotion.includes('anxious') || emotion.includes('nervous') || emotion.includes('uncertain') || 
              emotion.includes('greedy') || emotion.includes('angry') || emotion.includes('frustrated')) {
            deviationPatterns.emotional_triggers[`entry: ${emotion}`] = (deviationPatterns.emotional_triggers[`entry: ${emotion}`] || 0) + 1;
          }
        });
      }
      
      if (trade.emotional_state_exit) {
        const emotions = trade.emotional_state_exit.split(',').map(e => e.trim().toLowerCase());
        emotions.forEach(emotion => {
          if (emotion.includes('panic') || emotion.includes('fear') || emotion.includes('impatient') || 
              emotion.includes('greedy') || emotion.includes('regret') || emotion.includes('frustrated')) {
            deviationPatterns.emotional_triggers[`exit: ${emotion}`] = (deviationPatterns.emotional_triggers[`exit: ${emotion}`] || 0) + 1;
          }
        });
      }
    });
    
    if (rMultipleCount > 0) {
      avgRMultipleDeviations = rMultipleSum / rMultipleCount;
    }
    
    // Convert to sorted arrays
    const sortedMistakes = Object.entries(mistakeFrequency)
      .map(([mistake, count]) => ({
        mistake: mistake,
        count: count,
        percentage: ((count / deviationTrades.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Generate insights based on patterns
    const insights = [];
    
    // Emotional pattern analysis
    const emotionalIssues = Object.keys(deviationPatterns.emotional_triggers).length;
    const riskIssues = Object.keys(deviationPatterns.risk_management).length;
    const setupIssues = Object.keys(deviationPatterns.setup_issues).length;
    const exitIssues = Object.keys(deviationPatterns.exit_problems).length;
    
    if (emotionalIssues > 0) {
      const topEmotion = Object.entries(deviationPatterns.emotional_triggers)
        .sort((a, b) => b[1] - a[1])[0];
      insights.push({
        type: 'emotional',
        title: 'Emotional Trading Issues',
        description: `Most common: "${topEmotion[0]}" (${topEmotion[1]} times)`,
        recommendation: 'Consider implementing emotional check-ins before trading'
      });
    }
    
    if (riskIssues > 0) {
      const topRisk = Object.entries(deviationPatterns.risk_management)
        .sort((a, b) => b[1] - a[1])[0];
      insights.push({
        type: 'risk',
        title: 'Risk Management Lapses',
        description: `Most common: "${topRisk[0]}" (${topRisk[1]} times)`,
        recommendation: 'Review and strengthen your risk management rules'
      });
    }
    
    if (avgRMultipleDeviations < -1.5) {
      insights.push({
        type: 'performance',
        title: 'Plan Deviations Hurt Performance',
        description: `Deviation trades average ${avgRMultipleDeviations.toFixed(2)}R vs planned trades`,
        recommendation: 'Plan adherence is critical - your deviations are costly'
      });
    }
    
    res.json({
      totalDeviationTrades: deviationTrades.length,
      topDeviations: sortedMistakes,
      deviationPatterns,
      insights,
      avgRMultipleDeviations,
      totalPnlFromDeviations
    });
  } catch (error) {
    console.error('Error fetching plan deviation analysis:', error);
    res.status(500).json({ error: 'Failed to fetch plan deviation analysis' });
  }
});

// Populate default tags
// Initialize default tags on startup
router.get('/init-tags', async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    await initializeDefaultTags(database);
    res.json({ message: 'Tags initialized successfully' });
  } catch (error) {
    console.error('Error initializing tags:', error);
    res.status(500).json({ error: 'Failed to initialize tags' });
  }
});

async function initializeDefaultTags(database) {
  const defaultTags = [
    { tag_name: 'fomo-entry', category: 'entry', description: 'Fear of missing out entry' },
    { tag_name: 'impulse-entry', category: 'entry', description: 'Impulsive entry without setup' },
    { tag_name: 'early-exit', category: 'exit', description: 'Exited too early' },
    { tag_name: 'late-exit', category: 'exit', description: 'Exited too late' },
    { tag_name: 'no-stop-loss', category: 'exit', description: 'No stop loss set' },
    { tag_name: 'moved-stop-loss', category: 'exit', description: 'Moved stop loss' },
    { tag_name: 'poor-position-size', category: 'position', description: 'Position size too large/small' },
    { tag_name: 'averaging-down', category: 'position', description: 'Averaged down incorrectly' },
    { tag_name: 'fear-driven', category: 'psychology', description: 'Decision driven by fear' },
    { tag_name: 'greed-driven', category: 'psychology', description: 'Decision driven by greed' },
    { tag_name: 'revenge-trade', category: 'psychology', description: 'Trading to recover losses' },
    { tag_name: 'overconfident', category: 'psychology', description: 'Overconfidence in trade' },
    { tag_name: 'ignored-plan', category: 'plan', description: 'Ignored trading plan' },
    { tag_name: 'no-plan', category: 'plan', description: 'No plan for trade' },
    { tag_name: 'poor-risk-reward', category: 'risk', description: 'Poor risk/reward ratio' }
  ];
  
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
    } catch (err) {
      // Ignore errors
    }
  }
  console.log('Default mistake tags initialized');
}

router.post('/populate-tags', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
    const defaultTags = [
      // Entry Mistakes
      { tag_name: 'fomo-entry', category: 'entry', description: 'Fear of missing out entry' },
      { tag_name: 'impulse-entry', category: 'entry', description: 'Impulsive entry without proper setup' },
      { tag_name: 'chasing-breakout', category: 'entry', description: 'Chasing price after breakout' },
      { tag_name: 'no-setup-entry', category: 'entry', description: 'Entry without proper setup' },
      { tag_name: 'poor-entry-level', category: 'entry', description: 'Entered near resistance/support level' },
      { tag_name: 'poor-entry-timing', category: 'entry', description: 'Entry timing too early/late' },
      { tag_name: 'contrarian-entry', category: 'entry', description: 'Entry against the trend' },
      
      // Exit Mistakes
      { tag_name: 'early-exit', category: 'exit', description: 'Exited too early before target' },
      { tag_name: 'late-exit', category: 'exit', description: 'Exited too late after reversal' },
      { tag_name: 'moved-stop-loss', category: 'exit', description: 'Moved stop loss against position' },
      { tag_name: 'no-stop-loss', category: 'exit', description: 'Traded without stop loss' },
      { tag_name: 'poor-target', category: 'exit', description: 'Target too small/large for setup' },
      { tag_name: 'emotional-exit', category: 'exit', description: 'Exited based on emotions/panic' },
      
      // Position Management
      { tag_name: 'poor-position-size', category: 'position', description: 'Position size too large/small' },
      { tag_name: 'averaging-mistake', category: 'position', description: 'Averaged down/up incorrectly' },
      { tag_name: 'poor-stop-placement', category: 'position', description: 'Stop too tight/wide for volatility' },
      
      // Psychology/Emotion
      { tag_name: 'fear-driven', category: 'psychology', description: 'Decision driven by fear' },
      { tag_name: 'greed-driven', category: 'psychology', description: 'Decision driven by greed' },
      { tag_name: 'overconfident', category: 'psychology', description: 'Overconfident in trade setup' },
      { tag_name: 'revenge-mode', category: 'psychology', description: 'Trading to recover losses' },
      { tag_name: 'tilted', category: 'psychology', description: 'Emotional and irrational trading' },
      { tag_name: 'impatient', category: 'psychology', description: 'Impatient with trade execution' },
      
      // Plan Deviation
      { tag_name: 'ignored-plan', category: 'plan', description: 'Ignored predetermined trading plan' },
      { tag_name: 'changed-plan-mid-trade', category: 'plan', description: 'Changed plan during trade' },
      { tag_name: 'no-plan', category: 'plan', description: 'Traded without a plan' },
      { tag_name: 'rushed-decision', category: 'plan', description: 'Made rushed trading decision' },
      
      // Risk Management
      { tag_name: 'poor-risk-sizing', category: 'risk', description: 'Risk too high/low for account' },
      { tag_name: 'no-risk-calculation', category: 'risk', description: 'No proper risk calculation done' },
      { tag_name: 'violated-risk-rules', category: 'risk', description: 'Violated risk management rules' }
    ];
    
    // Insert tags (ignore duplicates)
    for (const tag of defaultTags) {
      try {
        if (process.env.DATABASE_URL) {
          // PostgreSQL syntax
          await database.run(
            'INSERT INTO mistake_tags (tag_name, category, description) VALUES (?, ?, ?) ON CONFLICT (tag_name) DO NOTHING',
            [tag.tag_name, tag.category, tag.description]
          );
        } else {
          // SQLite syntax
          await database.run(
            'INSERT OR IGNORE INTO mistake_tags (tag_name, category, description) VALUES (?, ?, ?)',
            [tag.tag_name, tag.category, tag.description]
          );
        }
      } catch (err) {
        // Ignore duplicate errors
      }
    }
    
    res.json({ message: 'Tags populated successfully', count: defaultTags.length });
  } catch (error) {
    console.error('Error populating tags:', error);
    res.status(500).json({ error: 'Failed to populate tags' });
  }
});

// Get all tags for autocomplete
router.get('/tags', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
    // Get predefined tags
    const predefinedTags = await database.all('SELECT * FROM mistake_tags ORDER BY tag_name ASC');
    
    // Also get unique tags actually used in trades
    const usedTagsResult = await database.all(
      `SELECT DISTINCT mistakes FROM trades 
       WHERE user_id = ? AND mistakes IS NOT NULL AND mistakes != ''`,
      [req.userId]
    );
    
    // Parse the used tags (they're stored as comma-separated strings)
    const usedTags = new Set();
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
    
    // Combine predefined tags with used tags
    const tagMap = new Map();
    
    // Add predefined tags
    predefinedTags.forEach(tag => {
      tagMap.set(tag.tag_name, tag);
    });
    
    // Add used tags that aren't already in predefined
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
    
    console.log(`Returning ${allTags.length} tags (${predefinedTags.length} predefined, ${usedTags.size} from trades)`);
    res.json(allTags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get emotional state tags for autocomplete
router.get('/emotion-tags', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
    const tags = await database.all(
      'SELECT * FROM emotional_state_tags WHERE user_id = ? ORDER BY usage_count DESC, tag_name ASC', 
      [req.userId]
    );
    res.json(tags);
  } catch (error) {
    console.error('Error fetching emotion tags:', error);
    res.status(500).json({ error: 'Failed to fetch emotion tags' });
  }
});

// Create or update emotional state tag
router.post('/emotion-tags', authenticateToken, async (req, res) => {
  try {
    const { tag_name } = req.body;
    
    if (!tag_name || tag_name.trim().length === 0) {
      return res.status(400).json({ error: 'Tag name is required' });
    }
    
    const database = await dbSingleton.getInstance();
    
    // Check if tag already exists for this user
    const existing = await database.get(
      'SELECT * FROM emotional_state_tags WHERE user_id = ? AND tag_name = ?',
      [req.userId, tag_name.trim().toLowerCase()]
    );
    
    if (existing) {
      // Increment usage count
      await database.run(
        'UPDATE emotional_state_tags SET usage_count = usage_count + 1 WHERE id = ?',
        [existing.id]
      );
      res.json({ ...existing, usage_count: existing.usage_count + 1 });
    } else {
      // Create new tag
      let result;
      if (process.env.DATABASE_URL) {
        // PostgreSQL - returns ID directly
        result = await database.run(
          'INSERT INTO emotional_state_tags (user_id, tag_name) VALUES (?, ?)',
          [req.userId, tag_name.trim().toLowerCase()]
        );
      } else {
        // SQLite
        result = await database.run(
          'INSERT INTO emotional_state_tags (user_id, tag_name) VALUES (?, ?)',
          [req.userId, tag_name.trim().toLowerCase()]
        );
      }
      
      const newTag = await database.get(
        'SELECT * FROM emotional_state_tags WHERE id = ?',
        [result.lastID]
      );
      
      res.json(newTag);
    }
  } catch (error) {
    console.error('Error creating emotion tag:', error);
    res.status(500).json({ error: 'Failed to create emotion tag' });
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

// Nifty vs Non-Nifty Analysis endpoint
router.get('/nifty-comparison', authenticateToken, async (req, res) => {
  try {
    const database = await dbSingleton.getInstance();
    
    // Get all trades for the user
    const allTrades = await database.all(
      `SELECT * FROM trades WHERE user_id = ? ORDER BY trade_date DESC`,
      [req.userId]
    );
    
    // Separate Nifty and Non-Nifty trades
    const niftyTrades = allTrades.filter(t => {
      const underlying = t.underlying ? t.underlying.toLowerCase() : '';
      return underlying.includes('nifty') || underlying === 'nf';
    });
    
    const nonNiftyTrades = allTrades.filter(t => {
      const underlying = t.underlying ? t.underlying.toLowerCase() : '';
      return !underlying.includes('nifty') && underlying !== 'nf';
    });
    
    // Calculate metrics for Nifty trades
    const niftyMetrics = calculateBucketMetrics(niftyTrades);
    
    // Calculate metrics for Non-Nifty trades
    const nonNiftyMetrics = calculateBucketMetrics(nonNiftyTrades);
    
    // Get common mistakes for each bucket
    const niftyMistakes = analyzeCommonMistakes(niftyTrades);
    const nonNiftyMistakes = analyzeCommonMistakes(nonNiftyTrades);
    
    res.json({
      nifty: {
        ...niftyMetrics,
        commonMistakes: niftyMistakes,
        trades: niftyTrades.length
      },
      nonNifty: {
        ...nonNiftyMetrics,
        commonMistakes: nonNiftyMistakes,
        trades: nonNiftyTrades.length
      },
      totalTrades: allTrades.length,
      breakdown: {
        niftyPercentage: allTrades.length > 0 ? (niftyTrades.length / allTrades.length) * 100 : 0,
        nonNiftyPercentage: allTrades.length > 0 ? (nonNiftyTrades.length / allTrades.length) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching Nifty comparison data:', error);
    res.status(500).json({ error: 'Failed to fetch Nifty comparison data' });
  }
});

function calculateBucketMetrics(trades) {
  if (trades.length === 0) {
    return {
      totalPnl: 0,
      avgPnl: 0,
      winRate: 0,
      avgRMultiple: 0,
      avgRMultipleWinning: 0,
      avgRMultipleLosing: 0,
      totalProfit: 0,
      totalLoss: 0,
      planFollowRate: 0,
      bestTrade: 0,
      worstTrade: 0,
      avgHoldTime: 0
    };
  }
  
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  const tradesWithStopLoss = trades.filter(t => t.r_multiple !== null && t.r_multiple !== undefined);
  const winningTradesWithSL = tradesWithStopLoss.filter(t => t.pnl > 0);
  const losingTradesWithSL = tradesWithStopLoss.filter(t => t.pnl <= 0);
  const tradesWithPlanFollowed = trades.filter(t => t.followed_plan === 1 || t.followed_plan === true);
  
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
  
  const avgRMultiple = tradesWithStopLoss.length > 0 
    ? tradesWithStopLoss.reduce((sum, t) => sum + t.r_multiple, 0) / tradesWithStopLoss.length 
    : 0;
  
  const avgRMultipleWinning = winningTradesWithSL.length > 0
    ? winningTradesWithSL.reduce((sum, t) => sum + t.r_multiple, 0) / winningTradesWithSL.length 
    : 0;
    
  const avgRMultipleLosing = losingTradesWithSL.length > 0
    ? losingTradesWithSL.reduce((sum, t) => sum + t.r_multiple, 0) / losingTradesWithSL.length 
    : 0;
  
  const bestTrade = Math.max(...trades.map(t => t.pnl || 0), 0);
  const worstTrade = Math.min(...trades.map(t => t.pnl || 0), 0);
  
  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    avgPnl: Math.round((totalPnl / trades.length) * 100) / 100,
    winRate: Math.round((winningTrades.length / trades.length) * 100 * 100) / 100,
    avgRMultiple: Math.round(avgRMultiple * 100) / 100,
    avgRMultipleWinning: Math.round(avgRMultipleWinning * 100) / 100,
    avgRMultipleLosing: Math.round(avgRMultipleLosing * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalLoss: Math.round(totalLoss * 100) / 100,
    planFollowRate: Math.round((tradesWithPlanFollowed.length / trades.length) * 100 * 100) / 100,
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100,
    profitFactor: totalLoss > 0 ? Math.round((totalProfit / totalLoss) * 100) / 100 : 0,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length
  };
}

function analyzeCommonMistakes(trades) {
  const mistakeFrequency = {};
  const emotionalPatterns = {
    entry: {},
    exit: {}
  };
  
  trades.forEach(trade => {
    // Count mistakes
    if (trade.mistakes) {
      const mistakes = trade.mistakes.split(',').map(m => m.trim().toLowerCase()).filter(m => m);
      mistakes.forEach(mistake => {
        mistakeFrequency[mistake] = (mistakeFrequency[mistake] || 0) + 1;
      });
    }
    
    // Analyze emotional states
    if (trade.emotional_state_entry) {
      const emotions = trade.emotional_state_entry.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
      emotions.forEach(emotion => {
        emotionalPatterns.entry[emotion] = (emotionalPatterns.entry[emotion] || 0) + 1;
      });
    }
    
    if (trade.emotional_state_exit) {
      const emotions = trade.emotional_state_exit.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
      emotions.forEach(emotion => {
        emotionalPatterns.exit[emotion] = (emotionalPatterns.exit[emotion] || 0) + 1;
      });
    }
  });
  
  // Sort and get top mistakes
  const topMistakes = Object.entries(mistakeFrequency)
    .map(([mistake, count]) => ({
      mistake,
      count,
      percentage: trades.length > 0 ? ((count / trades.length) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Get most common emotional states
  const topEntryEmotions = Object.entries(emotionalPatterns.entry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion, count]) => ({
      emotion,
      count,
      percentage: trades.length > 0 ? ((count / trades.length) * 100).toFixed(1) : 0
    }));
  
  const topExitEmotions = Object.entries(emotionalPatterns.exit)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion, count]) => ({
      emotion,
      count,
      percentage: trades.length > 0 ? ((count / trades.length) * 100).toFixed(1) : 0
    }));
  
  return {
    topMistakes,
    topEntryEmotions,
    topExitEmotions,
    totalMistakeTypes: Object.keys(mistakeFrequency).length
  };
}

export default router;