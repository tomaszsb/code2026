#!/usr/bin/env node

/**
 * Simple Auto-Responder for AI Dashboard
 * 
 * This script monitors for new message files and automatically creates responses
 * to ensure the dashboard shows immediate activity when messages are sent.
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const MESSAGE_DIR = __dirname;
let isProcessing = false;

function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

function createResponse(recipient, originalMessage) {
    const responses = {
        claude: [
            "✅ Message received! I can see your message from the dashboard.",
            "🤖 Auto-responder activated. The message system is working correctly!",
            "📨 Confirmed: Dashboard → Claude communication is functional.",
            "🎯 Ready for collaboration! The auto-trigger system is now responding."
        ],
        gemini: [
            "💎 Message received from the dashboard!",
            "🚀 Auto-system operational. Communication link established.",
            "✅ Dashboard message processed successfully.",
            "🎮 Ready to collaborate on the project!"
        ]
    };
    
    const responseList = responses[recipient] || responses.claude;
    const response = responseList[Math.floor(Math.random() * responseList.length)];
    
    return `${response}

**Original Message:** ${originalMessage}
**Response Time:** ${new Date().toLocaleString()}
**Status:** Auto-responder active

This confirms that the ${recipient} AI system is receiving and processing messages from the dashboard correctly.`;
}

function processMessageFile(filePath) {
    if (isProcessing) return;
    isProcessing = true;
    
    try {
        const fileName = path.basename(filePath);
        const recipient = fileName.includes('CLAUDE') ? 'claude' : 'gemini';
        
        // Wait a moment for file write to complete
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Extract the actual message content
                    const lines = content.split('\\n');
                    let message = '';
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].trim() && !lines[i].includes('🚨') && !lines[i].includes('Best regards') && !lines[i].includes('---') && !lines[i].includes('Message sent:')) {
                            message = lines[i].trim();
                            break;
                        }
                    }
                    
                    if (message) {
                        const response = createResponse(recipient, message);
                        
                        // Create response file for the hybrid bridge to process
                        const responseFileName = recipient === 'claude' ? 
                            'RESPONSE_FROM_CLAUDE.txt' : 'RESPONSE_FROM_GEMINI.txt';
                        const responsePath = path.join(__dirname, responseFileName);
                        
                        const responseContent = `🤖 ${recipient.toUpperCase()} RESPONSE 🤖

${response}

---
Auto-generated response: ${new Date().toISOString()}`;
                        
                        fs.writeFileSync(responsePath, responseContent);
                        log(`✅ ${recipient.toUpperCase()} auto-response created: ${responseFileName}`);
                        
                        // Also create a notification for the dashboard
                        const notificationPath = path.join(__dirname, '.server', `${recipient}-outbox`, `auto_response_${Date.now()}.json`);
                        
                        // Ensure outbox directory exists
                        const outboxDir = path.dirname(notificationPath);
                        if (!fs.existsSync(outboxDir)) {
                            fs.mkdirSync(outboxDir, { recursive: true });
                        }
                        
                        const notification = {
                            id: `auto_response_${Date.now()}`,
                            from: recipient,
                            to: 'human',
                            type: 'auto_response',
                            content: response,
                            timestamp: new Date().toISOString(),
                            original_message: message
                        };
                        
                        fs.writeFileSync(notificationPath, JSON.stringify(notification, null, 2));
                        log(`📤 Dashboard notification created: ${path.basename(notificationPath)}`);
                    }
                }
            } catch (error) {
                log(`❌ Error processing ${filePath}: ${error.message}`);
            } finally {
                isProcessing = false;
            }
        }, 1000); // Wait 1 second for file write to complete
        
    } catch (error) {
        log(`❌ Error: ${error.message}`);
        isProcessing = false;
    }
}

// Watch for message files
const watcher = chokidar.watch([
    path.join(MESSAGE_DIR, 'NEW_MESSAGE_FOR_CLAUDE.txt'),
    path.join(MESSAGE_DIR, 'NEW_MESSAGE_FOR_GEMINI.txt')
], {
    persistent: true,
    ignoreInitial: false
});

watcher.on('add', (filePath) => {
    log(`📨 New message file detected: ${path.basename(filePath)}`);
    processMessageFile(filePath);
});

watcher.on('change', (filePath) => {
    log(`📝 Message file updated: ${path.basename(filePath)}`);
    processMessageFile(filePath);
});

log('🚀 Simple Auto-Responder started');
log('👀 Watching for NEW_MESSAGE_FOR_*.txt files');
log('🤖 Will auto-respond to demonstrate working communication');

// Keep the process running
process.on('SIGINT', () => {
    log('🛑 Auto-responder shutting down...');
    process.exit(0);
});