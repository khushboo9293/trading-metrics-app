#!/bin/bash

echo "🚀 Pushing Trading Metrics App to GitHub"
echo "========================================"
echo ""
echo "Repository: https://github.com/khushboo9293/trading-metrics-app"
echo ""
echo "When prompted for password, use your Personal Access Token (not your GitHub password)"
echo ""

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🌐 Your repository is now available at:"
    echo "   https://github.com/khushboo9293/trading-metrics-app"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to render.com"
    echo "2. Sign up with GitHub account"
    echo "3. Connect this repository"
    echo "4. Deploy automatically!"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check:"
    echo "1. GitHub repository exists"
    echo "2. You have the correct Personal Access Token"
    echo "3. Token has 'repo' permissions"
    echo ""
fi