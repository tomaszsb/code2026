#!/bin/bash

echo "🚀 Starting AI Control Center..."
echo "📊 This will start the bridge server and open the dashboard"

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "hybrid-ai-bridge" 2>/dev/null || true
pkill -f "ai-bridge-server" 2>/dev/null || true
pkill -f "smart_claude" 2>/dev/null || true  
pkill -f "smart_gemini" 2>/dev/null || true

# Kill anything using port 3003
lsof -ti:3003 2>/dev/null | xargs kill -9 2>/dev/null || true

# Wait a moment for cleanup
sleep 3

# Start the Hybrid AI Bridge Server in background
echo "🌉 Starting Hybrid AI Bridge Server..."
cd .server
node hybrid-ai-bridge.js &
BRIDGE_PID=$!
cd ..

# Wait for server to start
echo "⏳ Waiting for server to initialize..."
sleep 3

# Check if server is running
if kill -0 $BRIDGE_PID 2>/dev/null; then
    echo "✅ Hybrid AI Bridge Server started successfully (PID: $BRIDGE_PID)"
    
    # Open dashboard in default browser
    echo "🌐 Opening AI Control Dashboard..."
    
    # Try different browser opening methods based on OS
    if command -v xdg-open > /dev/null; then
        xdg-open http://localhost:3003
    elif command -v open > /dev/null; then
        open http://localhost:3003
    elif command -v start > /dev/null; then
        start http://localhost:3003
    else
        echo "📋 Please open http://localhost:3003 in your browser"
    fi
    
    echo ""
    echo "🎯 AI Control Center is ready!"
    echo "📊 Dashboard: http://localhost:3003"
    echo "🎮 Game: http://localhost:8000 (start with dashboard buttons)"
    echo ""
    echo "💡 Use the dashboard to:"
    echo "   • Start Claude and Gemini AIs"
    echo "   • Send messages between AIs"
    echo "   • Monitor AI conversations"
    echo "   • Control the game servers"
    echo ""
    echo "⏹️  Press Ctrl+C to stop all services"
    
    # Keep script running and handle cleanup on exit
    trap 'echo "🛑 Shutting down AI Control Center..."; kill $BRIDGE_PID 2>/dev/null; pkill -f "smart_claude\|smart_gemini" 2>/dev/null; exit 0' INT
    
    # Wait for the bridge server process
    wait $BRIDGE_PID
    
else
    echo "❌ Failed to start AI Bridge Server"
    exit 1
fi