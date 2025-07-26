#!/bin/bash

# Smart Claude - Simplified Auto-Response System
# This script starts the simple auto-responder that handles Claude messages

NODE_PATH="node"
AUTO_RESPONDER_SCRIPT="/mnt/d/unravel/current_game/code2026/simple-auto-responder.js"

echo "🚀 Starting Smart Claude Auto-Responder..."
echo "📁 Auto-responder script: $AUTO_RESPONDER_SCRIPT"
echo ""

# Ensure the auto-responder script is executable
chmod +x "$AUTO_RESPONDER_SCRIPT"

echo "🤖 Starting Claude auto-response system..."
echo "📨 Will respond to NEW_MESSAGE_FOR_CLAUDE.txt files automatically"
echo "🎯 Dashboard communication will work immediately"
echo ""

# Run the auto-responder in the background
"$NODE_PATH" "$AUTO_RESPONDER_SCRIPT" &
AUTO_RESPONDER_PID=$!

echo "✅ Claude auto-responder started (PID: $AUTO_RESPONDER_PID)"
echo "🔄 Ready to handle dashboard messages automatically"
echo ""
echo "⏹️  Press Ctrl+C to stop the auto-responder"

# Wait for the background process
wait $AUTO_RESPONDER_PID