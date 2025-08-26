import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from './database.js';
import authRoutes from './routes/auth.js';
import tradesRoutes from './routes/trades.js';
import metricsRoutes from './routes/metrics.js';
import insightsRoutes from './routes/insights.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Function to populate default mistake tags
async function populateDefaultTags(database) {
  const defaultTags = [
    // Entry Mistakes
    { tag_name: 'fomo-entry', category: 'entry', description: 'Fear of missing out entry' },
    { tag_name: 'impulse-entry', category: 'entry', description: 'Impulsive entry without proper setup' },
    { tag_name: 'chasing-breakout', category: 'entry', description: 'Chasing price after breakout' },
    { tag_name: 'no-setup-entry', category: 'entry', description: 'Entry without proper setup' },
    { tag_name: 'poor-entry-timing', category: 'entry', description: 'Entry timing too early/late' },
    
    // Exit Mistakes
    { tag_name: 'early-exit', category: 'exit', description: 'Exited too early before target' },
    { tag_name: 'late-exit', category: 'exit', description: 'Exited too late after reversal' },
    { tag_name: 'moved-stop-loss', category: 'exit', description: 'Moved stop loss against position' },
    { tag_name: 'no-stop-loss', category: 'exit', description: 'Traded without stop loss' },
    
    // Position Management
    { tag_name: 'poor-position-size', category: 'position', description: 'Position size too large/small' },
    { tag_name: 'poor-stop-placement', category: 'position', description: 'Stop too tight/wide for volatility' },
    
    // Psychology
    { tag_name: 'fear-driven', category: 'psychology', description: 'Decision driven by fear' },
    { tag_name: 'greed-driven', category: 'psychology', description: 'Decision driven by greed' },
    { tag_name: 'revenge-trading', category: 'psychology', description: 'Trading to recover losses' },
    { tag_name: 'overconfident', category: 'psychology', description: 'Overconfident in trade setup' },
    
    // Plan Deviation
    { tag_name: 'ignored-plan', category: 'plan', description: 'Ignored predetermined trading plan' },
    { tag_name: 'no-plan', category: 'plan', description: 'Traded without a plan' },
    { tag_name: 'rushed-decision', category: 'plan', description: 'Made rushed trading decision' },
    
    // Risk Management
    { tag_name: 'poor-risk-sizing', category: 'risk', description: 'Risk too high/low for account' },
    { tag_name: 'violated-risk-rules', category: 'risk', description: 'Violated risk management rules' }
  ];
  
  // Insert tags (ignore duplicates)
  for (const tag of defaultTags) {
    await database.run(
      'INSERT OR IGNORE INTO mistake_tags (tag_name, category, description) VALUES (?, ?, ?)',
      [tag.tag_name, tag.category, tag.description]
    );
  }
  
  console.log('Default mistake tags populated successfully');
}

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new Database();
await db.init();

// Populate default mistake tags on startup
try {
  await populateDefaultTags(db.getDb());
} catch (error) {
  console.error('Error populating default tags:', error);
}

app.use('/api/auth', authRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/insights', insightsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://10.20.65.40:${PORT}`);
});