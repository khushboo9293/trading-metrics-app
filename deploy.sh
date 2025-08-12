#!/bin/bash

echo "🚀 Trading Metrics App - Full Stack Deployment"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Please run this script from the trading-metrics-app directory"
    exit 1
fi

echo "📦 Preparing deployment..."

# Create root package.json for monorepo deployment
cat > package.json << EOL
{
  "name": "trading-metrics-app",
  "version": "1.0.0",
  "description": "Professional trading metrics tracker with behavioral analytics",
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install",
    "build:frontend": "cd frontend && npm run build",
    "start:backend": "cd backend && npm start",
    "start": "cd backend && npm start",
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm run dev\"",
    "deploy:render": "echo 'Push to GitHub and connect to Render'",
    "deploy:railway": "railway up",
    "deploy:vercel": "cd frontend && vercel --prod"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "keywords": [
    "trading",
    "metrics", 
    "analytics",
    "react",
    "node.js",
    "responsive"
  ],
  "author": "Generated with Claude Code",
  "license": "MIT"
}
EOL

# Update backend package.json with engines
cd backend
npm pkg set engines.node=">=18.0.0"
npm pkg set engines.npm=">=9.0.0"
cd ..

# Update frontend API URL for production
cd frontend
cat > .env.production << EOL
VITE_API_URL=\${BACKEND_URL}/api
VITE_DEMO_MODE=false
EOL
cd ..

echo "✅ Deployment files ready!"
echo ""
echo "🌐 Deployment Options:"
echo ""
echo "1. 🚂 Railway (Recommended - Full Stack)"
echo "   - Install: npm i -g @railway/cli"
echo "   - Login:   railway login"
echo "   - Deploy:  railway up"
echo ""
echo "2. 🎨 Render (Free Tier - Full Stack)"
echo "   - Push code to GitHub"
echo "   - Connect to render.com"
echo "   - Auto-deploy with render.yaml"
echo ""
echo "3. ⚡ Vercel + Railway (Hybrid)"
echo "   - Frontend: vercel --prod"
echo "   - Backend:  railway up"
echo ""
echo "📁 Files created:"
echo "   ✅ package.json (root)"
echo "   ✅ render.yaml (Render config)"
echo "   ✅ railway.json (Railway config)" 
echo "   ✅ vercel.json (Vercel config)"
echo "   ✅ backend/Procfile (Process config)"
echo ""
echo "🔗 Your app will be available at:"
echo "   Frontend: https://your-app.vercel.app"
echo "   Backend:  https://your-api.railway.app"
echo "   Full:     https://your-fullstack.render.com"