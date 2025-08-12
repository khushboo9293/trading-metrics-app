# Trading Metrics App - "Whoop for Trading"

A comprehensive intraday trading performance tracker designed for options traders. Track your trades, analyze performance, and receive actionable insights to improve your trading discipline.

## Features

### 🎯 Quick Trade Logging (≤30 seconds)
- Minimal input form for trade details
- Option type, strike price, entry/exit prices
- Plan adherence and emotional state tracking
- Mistake logging with patterns analysis

### 📊 Performance Metrics
- **Trade PnL**: Profit/loss calculation with lot sizes
- **Win Rate**: Percentage of winning trades
- **R-Multiple**: Risk-adjusted returns
- **Max Drawdown**: Peak-to-trough loss tracking
- **Plan Adherence**: Discipline measurement

### 📈 Visual Analytics
- Equity curve with cumulative P&L
- Call/Put distribution charts
- Performance trends over time
- Mistake frequency heatmaps

### 🧠 Smart Insights
- Rule-adherence reminders
- Mistake pattern alerts
- Performance improvement suggestions
- Emotional bias analysis
- Time-of-day optimization tips

## Tech Stack

### Backend
- **Node.js** with Express
- **SQLite** database (easily portable)
- **JWT** authentication
- **RESTful API** design

### Frontend
- **React** with Vite (fast development)
- **Tailwind CSS** for styling
- **Chart.js** for visualizations
- **React Router** for navigation

## Quick Start

### Prerequisites
- Node.js 16+
- npm

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
npm run dev
```
Server runs on http://localhost:3001

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```
App runs on http://localhost:5173

### Default Account
Create a new account through the registration page or use the app's built-in registration flow.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Trades
- `GET /api/trades` - Fetch all trades
- `POST /api/trades` - Add new trade
- `GET /api/trades/:id` - Get specific trade

### Metrics
- `GET /api/metrics/summary?period=7` - Performance summary
- `GET /api/metrics/daily` - Daily metrics
- `GET /api/metrics/performance-trend` - Equity curve data

### Insights
- `GET /api/insights` - Smart trading insights

## Data Model

### Trades Table
- Basic trade info (underlying, option type, prices)
- Risk metrics (stop loss, quantity, lot size)
- Behavioral data (plan adherence, mistakes, emotions)
- Calculated metrics (PnL, R-multiple, returns)

### Daily Metrics
- Aggregated daily performance
- Win rate, average R-multiple
- Plan adherence rates

### Insights
- AI-generated trading feedback
- Pattern recognition alerts
- Performance coaching tips

## Key Metrics Explained

### R-Multiple
Risk-adjusted return measure:
```
R-Multiple = Trade PnL / Risk Amount
Risk Amount = |Entry Price - Stop Loss| × Quantity × Lot Size
```

### Win Rate
```
Win Rate = (Winning Trades ÷ Total Trades) × 100
```

### Max Drawdown
Largest peak-to-trough decline in cumulative P&L

## Mobile-First Design
- Responsive layout works on all devices
- Quick-tap trade logging
- Touch-friendly charts and interfaces

## Future Enhancements
- Broker API integrations (auto-import)
- Voice-to-text logging
- Advanced AI insights
- Peer comparison features
- Gamified discipline streaks

## Security
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection

## Contributing
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License
MIT License - see LICENSE file for details

---

Built with ❤️ for disciplined traders who want to improve their edge in the markets.