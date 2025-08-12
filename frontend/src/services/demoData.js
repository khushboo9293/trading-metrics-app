// Demo data for hosted version
export const demoUser = {
  id: 1,
  name: 'Demo Trader',
  email: 'demo@tradingmetrics.app'
};

export const demoTrades = [
  {
    id: 1,
    underlying: 'Nifty',
    option_type: 'call',
    breakout_type: 'vertical',
    nifty_range: 'outside_bullish',
    entry_price: 150.50,
    exit_price: 225.75,
    stop_loss: 120.00,
    quantity: 50,
    trade_date: '2025-08-10',
    followed_plan: true,
    emotional_state: 'calm',
    mistakes: '',
    notes: 'Clean breakout trade',
    pnl: 3762.50,
    r_multiple: 2.47
  },
  {
    id: 2,
    underlying: 'Bank Nifty',
    option_type: 'put',
    breakout_type: 'horizontal',
    nifty_range: 'inside_day',
    entry_price: 89.25,
    exit_price: 65.10,
    stop_loss: 95.00,
    quantity: 75,
    trade_date: '2025-08-09',
    followed_plan: false,
    emotional_state: 'fearful',
    mistakes: 'early exit',
    notes: 'Should have held longer',
    pnl: -1811.25,
    r_multiple: -0.42
  },
  {
    id: 3,
    underlying: 'Nifty',
    option_type: 'call',
    breakout_type: 'vertical',
    nifty_range: 'outside_bullish',
    entry_price: 200.00,
    exit_price: 340.50,
    stop_loss: 170.00,
    quantity: 25,
    trade_date: '2025-08-08',
    followed_plan: true,
    emotional_state: 'calm',
    mistakes: '',
    notes: 'Perfect setup execution',
    pnl: 3512.50,
    r_multiple: 4.68
  },
  {
    id: 4,
    underlying: 'Bank Nifty',
    option_type: 'call',
    breakout_type: 'horizontal',
    nifty_range: 'outside_bearish',
    entry_price: 125.75,
    exit_price: 98.50,
    stop_loss: 110.00,
    quantity: 60,
    trade_date: '2025-08-07',
    followed_plan: true,
    emotional_state: 'neutral',
    mistakes: '',
    notes: 'Stop loss hit correctly',
    pnl: -1635.00,
    r_multiple: -1.00
  },
  {
    id: 5,
    underlying: 'Nifty',
    option_type: 'put',
    breakout_type: 'vertical',
    nifty_range: 'inside_day',
    entry_price: 75.25,
    exit_price: 145.80,
    stop_loss: 65.00,
    quantity: 100,
    trade_date: '2025-08-06',
    followed_plan: true,
    emotional_state: 'calm',
    mistakes: '',
    notes: 'Great reversal trade',
    pnl: 7055.00,
    r_multiple: 6.89
  }
];

export const demoMetrics = {
  totalTrades: 5,
  winningTrades: 3,
  losingTrades: 2,
  totalPnl: 10883.75,
  winRate: 60.0,
  avgRMultiple: 2.52,
  avgRMultipleWinning: 4.68,
  avgRMultipleLosing: -0.71,
  stopLossUsageRate: 100.0,
  tradesWithStopLoss: 5,
  planFollowRate: 80.0,
  tradesWithPlanFollowed: 4,
  totalProfit: 14330.00,
  totalLoss: 3446.25,
  maxDrawdown: 1811.25,
  streaks: {
    currentWinStreak: 1,
    maxWinStreak: 2,
    currentPlanStreak: 1,
    maxPlanStreak: 3
  },
  callPutRatio: {
    calls: 3,
    puts: 2
  },
  emotionalBias: [
    { state: 'calm', count: 3, avgPnl: 4776.67 },
    { state: 'fearful', count: 1, avgPnl: -1811.25 },
    { state: 'neutral', count: 1, avgPnl: -1635.00 }
  ],
  mistakePatterns: [
    { mistake: 'early exit', frequency: 1, avgPnl: -1811.25 }
  ],
  breakoutAnalysis: [
    { type: 'vertical', count: 3, avgPnl: 4776.25, winRate: 66.67 },
    { type: 'horizontal', count: 2, avgPnl: -1723.13, winRate: 0.0 }
  ],
  niftyRangeAnalysis: [
    { range: 'outside_bullish', count: 2, avgPnl: 3637.50, winRate: 100.0 },
    { range: 'inside_day', count: 2, avgPnl: 2621.88, winRate: 50.0 },
    { range: 'outside_bearish', count: 1, avgPnl: -1635.00, winRate: 0.0 }
  ]
};