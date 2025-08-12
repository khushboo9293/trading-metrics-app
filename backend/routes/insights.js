import express from 'express';
import Database from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeBreakoutTypes } from '../utils/metrics.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = new Database();
    await db.init();
    const database = db.getDb();
    
    await generateInsights(database, req.userId);
    
    const insights = await database.all(
      'SELECT * FROM insights WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.userId]
    );
    
    res.json(insights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

async function generateInsights(database, userId) {
  const recentTrades = await database.all(
    'SELECT * FROM trades WHERE user_id = ? ORDER BY trade_date DESC LIMIT 20',
    [userId]
  );
  
  if (recentTrades.length === 0) return;
  
  await database.run('DELETE FROM insights WHERE user_id = ?', [userId]);
  
  const lastWeekTrades = recentTrades.slice(0, 7);
  const previousWeekTrades = recentTrades.slice(7, 14);
  
  const lastWeekWinRate = calculateWinRate(lastWeekTrades);
  const previousWeekWinRate = calculateWinRate(previousWeekTrades);
  
  if (lastWeekWinRate > previousWeekWinRate && previousWeekWinRate > 0) {
    await database.run(
      'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
      [userId, 'performance', `Win rate improved ${Math.round(lastWeekWinRate - previousWeekWinRate)}% compared to last week!`, 'success']
    );
  }
  
  const planViolations = lastWeekTrades.filter(t => !t.followed_plan);
  if (planViolations.length >= 2) {
    await database.run(
      'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
      [userId, 'discipline', `You traded outside your plan ${planViolations.length} times recently.`, 'warning']
    );
  }
  
  const mistakeMap = {};
  lastWeekTrades.forEach(trade => {
    if (trade.mistakes) {
      const mistakes = trade.mistakes.toLowerCase().split(',').map(m => m.trim());
      mistakes.forEach(mistake => {
        mistakeMap[mistake] = (mistakeMap[mistake] || 0) + 1;
      });
    }
  });
  
  const topMistake = Object.entries(mistakeMap).sort((a, b) => b[1] - a[1])[0];
  if (topMistake && topMistake[1] >= 3) {
    await database.run(
      'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
      [userId, 'mistakes', `"${topMistake[0]}" appeared in ${topMistake[1]} of your recent trades. Focus on fixing this pattern.`, 'warning']
    );
  }
  
  const timeAnalysis = analyzeTimeOfDay(recentTrades);
  if (timeAnalysis.bestTime) {
    await database.run(
      'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
      [userId, 'timing', `Your best results come during ${timeAnalysis.bestTime}. Consider focusing your trading during this period.`, 'info']
    );
  }
  
  const emotionalTrades = lastWeekTrades.filter(t => t.emotional_state === 'fearful' || t.emotional_state === 'overconfident');
  if (emotionalTrades.length >= 3) {
    const avgEmotionalPnl = emotionalTrades.reduce((sum, t) => sum + t.pnl, 0) / emotionalTrades.length;
    const avgCalmPnl = lastWeekTrades.filter(t => t.emotional_state === 'calm').reduce((sum, t) => sum + t.pnl, 0) / 
                       lastWeekTrades.filter(t => t.emotional_state === 'calm').length || 0;
    
    if (avgCalmPnl > avgEmotionalPnl) {
      await database.run(
        'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
        [userId, 'psychology', 'Your calm trades perform better than emotional ones. Consider taking breaks when feeling fearful or overconfident.', 'info']
      );
    }
  }
  
  const consecutiveLosses = findConsecutiveLosses(lastWeekTrades);
  if (consecutiveLosses >= 3) {
    await database.run(
      'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
      [userId, 'risk', `You had ${consecutiveLosses} consecutive losses. Consider reducing position size after losing streaks.`, 'warning']
    );
  }
  
  // Analyze breakout type performance
  const breakoutAnalysis = analyzeBreakoutTypes(recentTrades);
  if (Object.keys(breakoutAnalysis).length >= 2) {
    const vertical = breakoutAnalysis.vertical;
    const horizontal = breakoutAnalysis.horizontal;
    
    if (vertical && horizontal) {
      if (vertical.avgPnl > horizontal.avgPnl && vertical.count >= 3) {
        const difference = ((vertical.avgPnl - horizontal.avgPnl) / Math.abs(horizontal.avgPnl)) * 100;
        if (difference > 20) {
          await database.run(
            'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
            [userId, 'breakout_analysis', `Your vertical breakout trades perform ${Math.round(difference)}% better than horizontal ones. Avg P&L: Vertical ₹${vertical.avgPnl} vs Horizontal ₹${horizontal.avgPnl}.`, 'success']
          );
        }
      } else if (horizontal.avgPnl > vertical.avgPnl && horizontal.count >= 3) {
        const difference = ((horizontal.avgPnl - vertical.avgPnl) / Math.abs(vertical.avgPnl)) * 100;
        if (difference > 20) {
          await database.run(
            'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
            [userId, 'breakout_analysis', `Your horizontal breakout trades perform ${Math.round(difference)}% better than vertical ones. Avg P&L: Horizontal ₹${horizontal.avgPnl} vs Vertical ₹${vertical.avgPnl}.`, 'success']
          );
        }
      }
      
      // R-Multiple analysis
      if (vertical.avgRMultiple > horizontal.avgRMultiple && Math.abs(vertical.avgRMultiple - horizontal.avgRMultiple) > 0.5) {
        await database.run(
          'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
          [userId, 'breakout_analysis', `Vertical breakouts show better risk-adjusted returns: ${vertical.avgRMultiple}R vs ${horizontal.avgRMultiple}R for horizontal breakouts.`, 'info']
        );
      } else if (horizontal.avgRMultiple > vertical.avgRMultiple && Math.abs(horizontal.avgRMultiple - vertical.avgRMultiple) > 0.5) {
        await database.run(
          'INSERT INTO insights (user_id, type, message, severity) VALUES (?, ?, ?, ?)',
          [userId, 'breakout_analysis', `Horizontal breakouts show better risk-adjusted returns: ${horizontal.avgRMultiple}R vs ${vertical.avgRMultiple}R for vertical breakouts.`, 'info']
        );
      }
    }
  }
}

function calculateWinRate(trades) {
  if (trades.length === 0) return 0;
  return (trades.filter(t => t.pnl > 0).length / trades.length) * 100;
}

function analyzeTimeOfDay(trades) {
  const timeSlots = {
    'first 90 mins': { trades: [], pnl: 0 },
    'mid-morning': { trades: [], pnl: 0 },
    'afternoon': { trades: [], pnl: 0 }
  };
  
  trades.forEach(trade => {
    const hour = new Date(trade.created_at).getHours();
    let slot;
    if (hour >= 9 && hour < 11) slot = 'first 90 mins';
    else if (hour >= 11 && hour < 13) slot = 'mid-morning';
    else slot = 'afternoon';
    
    if (timeSlots[slot]) {
      timeSlots[slot].trades.push(trade);
      timeSlots[slot].pnl += trade.pnl;
    }
  });
  
  let bestTime = null;
  let bestPnl = -Infinity;
  
  Object.entries(timeSlots).forEach(([time, data]) => {
    if (data.trades.length > 0 && data.pnl > bestPnl) {
      bestPnl = data.pnl;
      bestTime = time;
    }
  });
  
  return { bestTime, bestPnl };
}

function findConsecutiveLosses(trades) {
  let maxConsecutive = 0;
  let current = 0;
  
  trades.forEach(trade => {
    if (trade.pnl < 0) {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  });
  
  return maxConsecutive;
}

export default router;