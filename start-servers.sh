#!/bin/bash

echo "🚀 Starting Trading Metrics App..."

# Kill any existing processes
pkill -f "vite"
pkill -f "node.*server.js"

# Start backend in background
echo "Starting backend on port 3001..."
cd /Users/khushboo/trading-metrics-app/backend
npm start &
BACKEND_PID=$!

# Wait a moment
sleep 3

# Start frontend
echo "Starting frontend on port 8080..."
cd /Users/khushboo/trading-metrics-app/frontend
npm run dev &
FRONTEND_PID=$!

# Wait for servers to start
sleep 5

echo ""
echo "✅ Servers started!"
echo "📱 Frontend: http://localhost:8080/"
echo "🔧 Backend:  http://localhost:3001/"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
wait