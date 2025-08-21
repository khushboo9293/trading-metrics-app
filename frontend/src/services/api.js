import axios from 'axios';
import { demoUser, demoTrades, demoMetrics } from './demoData.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Demo API responses
const demoResponses = {
  '/auth/login': { user: demoUser, token: 'demo-token-123' },
  '/auth/register': { user: demoUser, token: 'demo-token-123' },
  '/auth/me': demoUser,
  '/trades': demoTrades,
  '/metrics/summary': demoMetrics,
  '/metrics/performance-trend': [
    { date: '2025-08-06', pnl: 7055.00, cumulativePnl: 7055.00, winRate: 100, avgRMultiple: 6.89 },
    { date: '2025-08-07', pnl: -1635.00, cumulativePnl: 5420.00, winRate: 50, avgRMultiple: 2.95 },
    { date: '2025-08-08', pnl: 3512.50, cumulativePnl: 8932.50, winRate: 66.67, avgRMultiple: 3.52 },
    { date: '2025-08-09', pnl: -1811.25, cumulativePnl: 7121.25, winRate: 50, avgRMultiple: 2.58 },
    { date: '2025-08-10', pnl: 3762.50, cumulativePnl: 10883.75, winRate: 60, avgRMultiple: 2.52 }
  ]
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Demo mode interceptor
if (DEMO_MODE) {
  api.interceptors.request.use(
    (config) => {
      const path = config.url.replace(config.baseURL, '');
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const response = {
            data: demoResponses[path] || { message: 'Demo mode - endpoint not configured' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          };
          resolve(response);
        }, Math.random() * 500 + 200); // Simulate network delay
      });
    },
    (error) => Promise.reject(error)
  );
} else {
  // Production interceptors
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

export default api;