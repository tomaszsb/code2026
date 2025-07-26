#!/bin/bash

# Smart Gemini - Simplified Auto-Response System
# This script starts the auto-responder for Gemini messages

NODE_PATH="node"
AUTO_RESPONDER_SCRIPT="/mnt/d/unravel/current_game/code2026/simple-auto-responder.js"

echo "🚀 Starting Smart Gemini Auto-Responder..."
echo "📁 Auto-responder script: $AUTO_RESPONDER_SCRIPT"
echo ""

# The auto-responder handles both Claude and Gemini messages
# We just need to ensure it's running (it may already be started by smart_claude.sh)

if pgrep -f "simple-auto-responder.js" > /dev/null; then
    echo "✅ Auto-responder already running (shared with Claude)"
    echo "💎 Gemini message handling is active"
    echo "📨 Will respond to NEW_MESSAGE_FOR_GEMINI.txt files automatically"
else
    echo "🤖 Starting Gemini auto-response system..."
    echo "📨 Will respond to NEW_MESSAGE_FOR_GEMINI.txt files automatically"
    echo "🎯 Dashboard communication will work immediately"
    echo ""
    
    # Ensure the auto-responder script is executable
    chmod +x "$AUTO_RESPONDER_SCRIPT"
    
    # Run the auto-responder in the background
    "$NODE_PATH" "$AUTO_RESPONDER_SCRIPT" &
    AUTO_RESPONDER_PID=$!
    
    echo "✅ Gemini auto-responder started (PID: $AUTO_RESPONDER_PID)"
    echo "🔄 Ready to handle dashboard messages automatically"
    echo ""
    echo "⏹️  Press Ctrl+C to stop the auto-responder"
    
    # Wait for the background process
    wait $AUTO_RESPONDER_PID
fi

# Keep the script running to maintain the "Smart Gemini" process
echo "💎 Smart Gemini system active..."
sleep infinity
