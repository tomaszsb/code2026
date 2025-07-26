const { chromium } = require('playwright');

async function testGame() {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Enable console logging
        page.on('console', msg => {
            console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
        });

        // Capture JavaScript errors
        page.on('pageerror', error => {
            console.log('PAGE ERROR:', error.message);
        });

        console.log('Navigating to game URL...');
        await page.goto('http://localhost:8000/?debug=true&logLevel=debug');
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        console.log('Taking screenshot of initial state...');
        await page.screenshot({ path: 'initial-state.png', fullPage: true });
        
        // Look for the start button
        console.log('Looking for start button...');
        const startButtons = await page.locator('button').all();
        console.log(`Found ${startButtons.length} buttons on the page`);
        
        for (let i = 0; i < startButtons.length; i++) {
            const buttonText = await startButtons[i].textContent();
            console.log(`Button ${i + 1}: "${buttonText}"`);
        }
        
        // Try to find and click the start button
        let startButton = await page.locator('button:has-text("Start Fixed Game")').first();
        if (await startButton.count() === 0) {
            startButton = await page.locator('button:has-text("Start Game")').first();
        }
        if (await startButton.count() === 0) {
            startButton = await page.locator('button:has-text("Starting Game")').first();
        }
        
        if (await startButton.count() > 0) {
            const buttonText = await startButton.textContent();
            console.log(`Found start button: "${buttonText}"`);
            console.log('Clicking start button...');
            await startButton.click();
            
            // Wait a moment for state changes
            await page.waitForTimeout(2000);
            
            console.log('Taking screenshot after clicking...');
            await page.screenshot({ path: 'after-click.png', fullPage: true });
        } else {
            console.log('No start button found, taking screenshot of current state');
            await page.screenshot({ path: 'no-start-button.png', fullPage: true });
        }
        
        // Check what components are rendered in the DOM
        console.log('\n=== DOM ANALYSIS ===');
        
        // Check for main app structure
        const appRoot = await page.locator('#root').first();
        if (await appRoot.count() > 0) {
            console.log('Found React root element');
            const rootContent = await appRoot.innerHTML();
            console.log('Root element structure:', rootContent.substring(0, 500) + '...');
        }
        
        // Look for GameBoard component
        const gameBoard = await page.locator('[class*="game-board"], [class*="GameBoard"], .board').all();
        console.log(`Found ${gameBoard.length} potential GameBoard elements`);
        
        for (let i = 0; i < gameBoard.length; i++) {
            const className = await gameBoard[i].getAttribute('class');
            const innerHTML = await gameBoard[i].innerHTML();
            console.log(`GameBoard ${i + 1} - Class: ${className}, Content: ${innerHTML.substring(0, 200)}...`);
        }
        
        // Look for game panels
        const panels = await page.locator('[class*="panel"], [class*="Panel"]').all();
        console.log(`Found ${panels.length} panel elements`);
        
        // Check for any game-related elements
        const gameElements = await page.locator('[class*="game"], [class*="Game"], [class*="player"], [class*="Player"]').all();
        console.log(`Found ${gameElements.length} game-related elements`);
        
        // Get current page HTML structure
        console.log('\n=== CURRENT PAGE STRUCTURE ===');
        const bodyContent = await page.locator('body').innerHTML();
        console.log('Body structure:', bodyContent.substring(0, 1000) + '...');
        
        // Check React DevTools info if available
        const reactVersion = await page.evaluate(() => {
            return window.React ? window.React.version : 'React not found';
        });
        console.log('React version:', reactVersion);
        
        // Check game state
        const gameState = await page.evaluate(() => {
            return window.GameStateManager ? {
                hasManager: true,
                state: window.GameStateManager.getState ? window.GameStateManager.getState() : 'No getState method'
            } : { hasManager: false };
        });
        console.log('GameState info:', JSON.stringify(gameState, null, 2));
        
        // Keep browser open for manual inspection
        console.log('\nBrowser will stay open for manual inspection. Press Ctrl+C to close.');
        await page.waitForTimeout(60000); // Wait 1 minute
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await browser.close();
    }
}

testGame();