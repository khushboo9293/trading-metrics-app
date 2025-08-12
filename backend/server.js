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

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = new Database();
await db.init();

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