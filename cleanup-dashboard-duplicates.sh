#!/bin/bash

# Dashboard-Aware Duplicate Cleanup
# Only cleans up processes started by smart_*.sh scripts
# Preserves manual/Claude Code AI processes

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

cleanup_dashboard_duplicates() {
    local changes_made=false
    
    log "🎯 Checking for duplicate dashboard-started AI processes..."
    log "   ℹ️ Manual/Claude Code processes will be ignored"
    
    # Check if there are smart_claude.sh processes
    SMART_CLAUDE_PIDS=$(pgrep -f "smart_claude.sh" 2>/dev/null || true)
    if [ ! -z "$SMART_CLAUDE_PIDS" ]; then
        SMART_CLAUDE_COUNT=$(echo "$SMART_CLAUDE_PIDS" | wc -l)
        if [ "$SMART_CLAUDE_COUNT" -gt 1 ]; then
            log "🔧 Found $SMART_CLAUDE_COUNT smart_claude.sh processes - cleaning duplicates..."
            # Keep only the newest process
            NEWEST_SMART_CLAUDE=$(echo "$SMART_CLAUDE_PIDS" | sort -n | tail -1)
            OLDER_SMART_CLAUDES=$(echo "$SMART_CLAUDE_PIDS" | sort -n | head -n -1)
            if [ ! -z "$OLDER_SMART_CLAUDES" ]; then
                echo "$OLDER_SMART_CLAUDES" | xargs kill 2>/dev/null || true
                log "✅ Killed $(echo "$OLDER_SMART_CLAUDES" | wc -l) duplicate smart_claude.sh processes, kept PID: $NEWEST_SMART_CLAUDE"
                changes_made=true
            fi
        elif [ "$SMART_CLAUDE_COUNT" -eq 1 ]; then
            log "✅ Dashboard Claude: 1 smart_claude.sh process running (PID: $SMART_CLAUDE_PIDS) - no cleanup needed"
        fi
    else
        log "ℹ️ No dashboard Claude processes found"
    fi
    
    # Check if there are smart_gemini.sh processes
    SMART_GEMINI_PIDS=$(pgrep -f "smart_gemini.sh" 2>/dev/null || true)
    if [ ! -z "$SMART_GEMINI_PIDS" ]; then
        SMART_GEMINI_COUNT=$(echo "$SMART_GEMINI_PIDS" | wc -l)
        if [ "$SMART_GEMINI_COUNT" -gt 1 ]; then
            log "🔧 Found $SMART_GEMINI_COUNT smart_gemini.sh processes - cleaning duplicates..."
            # Keep only the newest process
            NEWEST_SMART_GEMINI=$(echo "$SMART_GEMINI_PIDS" | sort -n | tail -1)
            OLDER_SMART_GEMINIS=$(echo "$SMART_GEMINI_PIDS" | sort -n | head -n -1)
            if [ ! -z "$OLDER_SMART_GEMINIS" ]; then
                echo "$OLDER_SMART_GEMINIS" | xargs kill 2>/dev/null || true
                log "✅ Killed $(echo "$OLDER_SMART_GEMINIS" | wc -l) duplicate smart_gemini.sh processes, kept PID: $NEWEST_SMART_GEMINI"
                changes_made=true
            fi
        elif [ "$SMART_GEMINI_COUNT" -eq 1 ]; then
            log "✅ Dashboard Gemini: 1 smart_gemini.sh process running (PID: $SMART_GEMINI_PIDS) - no cleanup needed"
        fi
    else
        log "ℹ️ No dashboard Gemini processes found"
    fi
    
    # Report on manual processes (but don't touch them)
    MANUAL_CLAUDE_PIDS=$(pgrep -f "real-claude-responder.js" 2>/dev/null || true)
    MANUAL_GEMINI_PIDS=$(pgrep -f "real-gemini-responder.js" 2>/dev/null || true)
    
    if [ ! -z "$MANUAL_CLAUDE_PIDS" ]; then
        MANUAL_CLAUDE_COUNT=$(echo "$MANUAL_CLAUDE_PIDS" | wc -l)
        log "ℹ️ Found $MANUAL_CLAUDE_COUNT manual Claude processes - leaving untouched (PIDs: $(echo "$MANUAL_CLAUDE_PIDS" | tr '\n' ' '))"
    fi
    
    if [ ! -z "$MANUAL_GEMINI_PIDS" ]; then
        MANUAL_GEMINI_COUNT=$(echo "$MANUAL_GEMINI_PIDS" | wc -l)
        log "ℹ️ Found $MANUAL_GEMINI_COUNT manual Gemini processes - leaving untouched (PIDs: $(echo "$MANUAL_GEMINI_PIDS" | tr '\n' ' '))"
    fi
    
    if [ "$changes_made" = true ]; then
        log "🎯 Dashboard duplicate cleanup completed - manual processes preserved"
        sleep 2
    else
        log "✅ No dashboard duplicates found - system is clean"
    fi
    
    return 0
}

# Main execution
log "🚀 Starting dashboard-aware duplicate cleanup..."
cleanup_dashboard_duplicates
log "✅ Cleanup check completed"