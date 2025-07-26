#!/usr/bin/env node

/**
 * Claude Auto-Trigger System
 * 
 * Mirrors the Gemini auto-trigger system to automatically prompt Claude
 * when new messages arrive, eliminating the need for manual "check messages" prompts.
 * 
 * FEATURES:
 * - Monitors claude-notifications/ directory continuously
 * - Detects new notification files using robust file watching
 * - Outputs "check messages" to stdout for piping to Claude CLI
 * - Handles duplicate notifications and errors gracefully
 * - Runs persistently in background
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const MESSAGE_FILES = [
    path.join(__dirname, 'NEW_MESSAGE_FOR_CLAUDE.txt'),
    path.join(__dirname, '.server', 'claude-inbox')
];
const PROCESSED_FILE = path.join(__dirname, 'data', 'claude_trigger_processed.json');
const LOG_FILE = path.join(__dirname, 'logs', 'claude-auto-trigger.log');

// Track processed notifications to avoid duplicates
let processedNotifications = new Set();

function log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    
    // Ensure logs directory exists
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    try {
        fs.appendFileSync(LOG_FILE, logEntry + '\\n');
    } catch (error) {
        console.error('Error writing to log:', error.message);
    }
}

function loadProcessedNotifications() {
    try {
        if (fs.existsSync(PROCESSED_FILE)) {
            const data = JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
            processedNotifications = new Set(data);
            log(`Loaded ${processedNotifications.size} previously processed notifications`);
        }
    } catch (error) {
        log(`Error loading processed notifications: ${error.message}`);
    }
}

function saveProcessedNotifications() {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(PROCESSED_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(PROCESSED_FILE, JSON.stringify([...processedNotifications], null, 2));
    } catch (error) {
        log(`Error saving processed notifications: ${error.message}`);
    }
}

/**
 * CORE FUNCTION: Trigger Claude via CLI Input Injection
 * 
 * This outputs "check messages" to stdout, which should be piped to Claude's stdin
 */
function triggerClaude(notificationData) {
    log(`TRIGGERING CLAUDE: New message from ${notificationData.from}`);
    
    // DIRECT STDIN INJECTION (Claude's "Last Mile" Solution)
    // This outputs "check messages" to stdout, which should be piped to Claude's stdin
    console.log("check messages");
    
    // Also create attention files as backup
    try {
        const urgentPrompt = `🚨 CLAUDE - URGENT MESSAGE ALERT 🚨

You have a new message from ${notificationData.from}!

**Auto-Trigger System Activated**
This file was created automatically because you received a message.

**Action Required:**
Type "check messages" or manually check your inbox.

**Message Preview:**
${notificationData.contentPreview || 'Check your inbox for details'}

**Notification File:** ${notificationData.notificationFile}
**Timestamp:** ${notificationData.timestamp}

---
Delete this file after reading.`;

        // Create multiple attention-grabbing files
        const alertFiles = [
            path.join(__dirname, '..', 'CLAUDE_URGENT_MESSAGE.md'),
            path.join(__dirname, '..', 'NEW_MESSAGE_FOR_CLAUDE.txt'),
            path.join(__dirname, '..', 'CLAUDE_CHECK_NOW.md')
        ];

        alertFiles.forEach(filePath => {
            fs.writeFileSync(filePath, urgentPrompt);
            log(`Created attention file: ${filePath}`);
        });

    } catch (error) {
        log(`File creation method failed: ${error.message}`);
    }
    
    // Write to stdout/stderr for visibility
    console.log('\\n🚨 CLAUDE AUTO-TRIGGER ACTIVATED 🚨');
    console.log(`📥 New message from ${notificationData.from}`);
    console.log(`📄 Preview: ${notificationData.contentPreview || 'Check inbox'}`);
    console.log(`⏰ Time: ${notificationData.timestamp}`);
    console.log('🔔 ACTION: Claude should check messages now!\\n');
    
    log(`All trigger methods executed for notification from ${notificationData.from}`);
}

/**
 * Process a new notification file
 */
function processNotification(filePath) {
    const filename = path.basename(filePath);
    
    // Check if already processed
    if (processedNotifications.has(filename)) {
        return; // Already handled
    }
    
    try {
        // Read notification data
        const notificationData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        log(`NEW NOTIFICATION: ${filename}`);
        log(`From: ${notificationData.from} | Preview: ${notificationData.message_preview || notificationData.contentPreview || 'No preview'}`);
        
        // Add enhanced data for trigger
        const enhancedData = {
            ...notificationData,
            notificationFile: filename,
            contentPreview: notificationData.message_preview || notificationData.contentPreview || 'New message available'
        };
        
        // TRIGGER CLAUDE
        triggerClaude(enhancedData);
        
        // Mark as processed
        processedNotifications.add(filename);
        saveProcessedNotifications();
        
        log(`PROCESSED: ${filename} - Claude trigger activated`);
        
    } catch (error) {
        log(`ERROR processing ${filename}: ${error.message}`);
    }
}

/**
 * Start the automated trigger system
 */
function startClaudeAutoTrigger() {
    log('🚀 Claude Auto-Trigger System starting...');
    
    // Ensure notifications directory exists
    if (!fs.existsSync(NOTIFICATIONS_DIR)) {
        fs.mkdirSync(NOTIFICATIONS_DIR, { recursive: true });
        log(`Created notifications directory: ${NOTIFICATIONS_DIR}`);
    }
    
    // Load previous state
    loadProcessedNotifications();
    
    // Scan existing notifications first
    try {
        const existingFiles = fs.readdirSync(NOTIFICATIONS_DIR)
            .filter(file => file.startsWith('notification_') && file.endsWith('.json'))
            .map(file => path.join(NOTIFICATIONS_DIR, file));
        
        log(`Found ${existingFiles.length} existing notification files`);
        existingFiles.forEach(processNotification);
        
    } catch (error) {
        log(`Error scanning existing files: ${error.message}`);
    }
    
    // Start robust file watching using chokidar
    const watcher = chokidar.watch(NOTIFICATIONS_DIR, {
        ignored: /^\\./, // ignore dotfiles
        persistent: true,
        ignoreInitial: true // We already processed existing files
    });
    
    watcher.on('add', (filePath) => {
        const filename = path.basename(filePath);
        if (filename.startsWith('notification_') && filename.endsWith('.json')) {
            log(`FILE WATCHER: New notification detected - ${filename}`);
            // Small delay to ensure file is fully written
            setTimeout(() => processNotification(filePath), 100);
        }
    });
    
    watcher.on('error', (error) => {
        log(`FILE WATCHER ERROR: ${error.message}`);
    });
    
    log('✅ Claude Auto-Trigger System active');
    log(`📁 Monitoring: ${NOTIFICATIONS_DIR}`);
    log('🔔 Ready to trigger Claude automatically on new messages');
    
    // Keep process alive
    process.on('SIGINT', () => {
        log('🛑 Claude Auto-Trigger shutting down...');
        saveProcessedNotifications();
        watcher.close();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        log('🛑 Claude Auto-Trigger terminated');
        saveProcessedNotifications();
        watcher.close();
        process.exit(0);
    });
}

// Start the system
startClaudeAutoTrigger();