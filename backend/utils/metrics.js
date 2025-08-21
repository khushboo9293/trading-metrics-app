export function calculateMetrics({ entry_price, exit_price, stop_loss, quantity }) {
  // Quantity is now in units (individual options), not lots
  const pnl = (exit_price - entry_price) * quantity;
  const returnPercentage = ((exit_price - entry_price) / entry_price) * 100;
  
  // Handle optional stop loss - if no stop loss, set riskAmount and rMultiple to null/0
  let riskAmount = 0;
  let rMultiple = 0;
  
  if (stop_loss !== null && stop_loss !== undefined && stop_loss !== '') {
    riskAmount = Math.abs(entry_price - stop_loss) * quantity;
    rMultiple = riskAmount > 0 ? pnl / riskAmount : 0;
  } else {
    // No stop loss set - cannot calculate risk-based metrics
    riskAmount = null;
    rMultiple = null;
  }
  
  return {
    pnl: Math.round(pnl * 100) / 100,
    returnPercentage: Math.round(returnPercentage * 100) / 100,
    riskAmount: riskAmount !== null ? Math.round(riskAmount * 100) / 100 : null,
    rMultiple: rMultiple !== null ? Math.round(rMultiple * 100) / 100 : null
  };
}

export function analyzeEmotionalBias(trades) {
  // Emotional bias analysis removed - return empty object
  return {};
}

export function analyzeBreakoutTypes(trades) {
  const breakoutGroups = {
    vertical: { trades: [], totalPnl: 0, totalRMultiple: 0, count: 0 },
    horizontal: { trades: [], totalPnl: 0, totalRMultiple: 0, count: 0 }
  };
  
  trades.forEach(trade => {
    if (trade.breakout_type && breakoutGroups[trade.breakout_type]) {
      const group = breakoutGroups[trade.breakout_type];
      group.trades.push(trade);
      group.totalPnl += trade.pnl || 0;
      group.totalRMultiple += trade.r_multiple || 0;
      group.count++;
    }
  });
  
  const analysis = {};
  Object.keys(breakoutGroups).forEach(type => {
    const group = breakoutGroups[type];
    if (group.count > 0) {
      analysis[type] = {
        avgPnl: Math.round((group.totalPnl / group.count) * 100) / 100,
        avgRMultiple: Math.round((group.totalRMultiple / group.count) * 100) / 100,
        count: group.count,
        winRate: Math.round((group.trades.filter(t => t.pnl > 0).length / group.count) * 100 * 100) / 100,
        totalPnl: Math.round(group.totalPnl * 100) / 100
      };
    }
  });
  
  return analysis;
}

export function analyzeNiftyRange(trades) {
  const rangeGroups = {
    inside_day: { trades: [], totalPnl: 0, totalRMultiple: 0, count: 0 },
    outside_bullish: { trades: [], totalPnl: 0, totalRMultiple: 0, count: 0 },
    outside_bearish: { trades: [], totalPnl: 0, totalRMultiple: 0, count: 0 }
  };
  
  trades.forEach(trade => {
    if (trade.nifty_range && rangeGroups[trade.nifty_range]) {
      const group = rangeGroups[trade.nifty_range];
      group.trades.push(trade);
      group.totalPnl += trade.pnl || 0;
      group.totalRMultiple += trade.r_multiple || 0;
      group.count++;
    }
  });
  
  const analysis = {};
  Object.keys(rangeGroups).forEach(type => {
    const group = rangeGroups[type];
    if (group.count > 0) {
      analysis[type] = {
        avgPnl: Math.round((group.totalPnl / group.count) * 100) / 100,
        avgRMultiple: Math.round((group.totalRMultiple / group.count) * 100) / 100,
        count: group.count,
        winRate: Math.round((group.trades.filter(t => t.pnl > 0).length / group.count) * 100 * 100) / 100,
        totalPnl: Math.round(group.totalPnl * 100) / 100
      };
    }
  });
  
  return analysis;
}

export function findMistakePatterns(trades) {
  const mistakes = {};
  
  trades.forEach(trade => {
    if (trade.mistakes) {
      const mistakeList = trade.mistakes.toLowerCase().split(',').map(m => m.trim());
      mistakeList.forEach(mistake => {
        if (!mistakes[mistake]) {
          mistakes[mistake] = {
            count: 0,
            totalPnl: 0,
            trades: []
          };
        }
        mistakes[mistake].count++;
        mistakes[mistake].totalPnl += trade.pnl;
        mistakes[mistake].trades.push(trade.id);
      });
    }
  });
  
  return Object.entries(mistakes)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([mistake, data]) => ({
      mistake,
      frequency: data.count,
      avgPnl: data.totalPnl / data.count
    }));
}

export function calculateStreaks(trades) {
  let currentWinStreak = 0;
  let currentPlanStreak = 0;
  let maxWinStreak = 0;
  let maxPlanStreak = 0;
  let tempWinStreak = 0;
  let tempPlanStreak = 0;
  
  const sortedTrades = [...trades].sort((a, b) => 
    new Date(b.trade_date) - new Date(a.trade_date)
  );
  
  // Calculate current streaks (from most recent trade going backward until first loss/non-plan)
  for (let i = 0; i < sortedTrades.length; i++) {
    const trade = sortedTrades[i];
    
    // Current win streak calculation
    if (trade.pnl > 0) {
      currentWinStreak++;
    } else {
      break; // Stop at first loss for current streak
    }
  }
  
  // Calculate current plan streak
  for (let i = 0; i < sortedTrades.length; i++) {
    const trade = sortedTrades[i];
    
    if (trade.followed_plan) {
      currentPlanStreak++;
    } else {
      break; // Stop at first non-plan trade for current streak
    }
  }
  
  // Calculate max streaks by going through all trades
  sortedTrades.forEach(trade => {
    if (trade.pnl > 0) {
      tempWinStreak++;
      maxWinStreak = Math.max(maxWinStreak, tempWinStreak);
    } else {
      tempWinStreak = 0;
    }
    
    if (trade.followed_plan) {
      tempPlanStreak++;
      maxPlanStreak = Math.max(maxPlanStreak, tempPlanStreak);
    } else {
      tempPlanStreak = 0;
    }
  });
  
  return {
    currentWinStreak,
    currentPlanStreak,
    maxWinStreak,
    maxPlanStreak
  };
}