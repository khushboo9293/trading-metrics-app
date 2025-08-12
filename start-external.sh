#!/bin/bash

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "🚀 Starting Trading Metrics App with External Access..."
echo "📍 Your local IP: $LOCAL_IP"

# Kill any existing processes
pkill -f "vite"
pkill -f "node.*server.js"

# Start backend with external access
echo "🔧 Starting backend on $LOCAL_IP:3001..."
cd /Users/khushboo/trading-metrics-app/backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend with external access (production build)
echo "📱 Starting frontend on $LOCAL_IP:5173..."
cd /Users/khushboo/trading-metrics-app/frontend

# Build the app first
npm run build

# Serve the production build
npx serve -s dist -l 5173 -H $LOCAL_IP &
FRONTEND_PID=$!

# Wait for servers to start
sleep 5

echo ""
echo "✅ Trading Metrics App is now accessible from any device!"
echo ""
echo "📱 From this computer:"
echo "   http://localhost:5173/"
echo ""
echo "🌐 From other devices on your network:"
echo "   http://$LOCAL_IP:5173/"
echo ""
echo "📱 On mobile devices, scan this QR code or type the URL:"
echo "   http://$LOCAL_IP:5173/"
echo ""
echo "🔧 Backend API:"
echo "   http://$LOCAL_IP:3001/"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap cleanup function on script exit
trap cleanup EXIT

# Wait for user interrupt
wait