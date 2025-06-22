/**
 * GameSaveManager Component - Save and load game state
 * Provides persistent game storage using localStorage
 */

function GameSaveManager() {
    const [gameState, gameStateManager] = useGameState();
    const [saveState, setSaveState] = useState({
        autoSaveEnabled: true,
        lastSaveTime: null,
        saveSlots: []
    });

    // Auto-save every 30 seconds during gameplay
    useEffect(() => {
        if (!saveState.autoSaveEnabled || !gameState.players || gameState.players.length === 0) {
            return;
        }

        const autoSaveInterval = setInterval(() => {
            autoSaveGame();
        }, 30000); // 30 seconds

        return () => clearInterval(autoSaveInterval);
    }, [saveState.autoSaveEnabled, gameState.players]);

    // Save game after significant events
    useEventListener('playerMoved', () => {
        if (saveState.autoSaveEnabled) {
            autoSaveGame();
        }
    });

    useEventListener('turnEnded', () => {
        if (saveState.autoSaveEnabled) {
            autoSaveGame();
        }
    });

    // Load save slots on component mount
    useEffect(() => {
        loadSaveSlots();
    }, []);

    // Auto-save the current game
    const autoSaveGame = () => {
        if (!gameState.players || gameState.players.length === 0) return;

        const saveData = createSaveData();
        const saveKey = 'pm_game_autosave';
        
        try {
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            setSaveState(prev => ({
                ...prev,
                lastSaveTime: Date.now()
            }));
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    };

    // Manual save to specific slot
    const saveGame = (slotName = 'Manual Save') => {
        const saveData = createSaveData();
        const saveKey = `pm_game_save_${Date.now()}`;
        const saveMeta = {
            id: saveKey,
            name: slotName,
            timestamp: Date.now(),
            turnCount: gameState.turnCount || 0,
            playerCount: gameState.players ? gameState.players.length : 0,
            currentPlayer: gameState.players && gameState.players[gameState.currentPlayer] ? 
                          gameState.players[gameState.currentPlayer].name : 'Unknown'
        };

        try {
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            
            // Update save slots list
            const updatedSlots = [...saveState.saveSlots, saveMeta];
            setSaveState(prev => ({
                ...prev,
                saveSlots: updatedSlots.sort((a, b) => b.timestamp - a.timestamp)
            }));

            // Also update localStorage index
            localStorage.setItem('pm_game_saves_index', JSON.stringify(updatedSlots));

            gameStateManager.emit('gameSaved', { slotName, timestamp: Date.now() });
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            gameStateManager.emit('saveError', { error: error.message });
            return false;
        }
    };

    // Load game from save data
    const loadGame = (saveId) => {
        try {
            const saveData = localStorage.getItem(saveId);
            if (!saveData) {
                throw new Error('Save file not found');
            }

            const parsedData = JSON.parse(saveData);
            
            // Validate save data structure
            if (!parsedData.gameState || !parsedData.metadata) {
                throw new Error('Invalid save file format');
            }

            // Restore game state
            gameStateManager.setState(parsedData.gameState);
            
            gameStateManager.emit('gameLoaded', { 
                saveId, 
                metadata: parsedData.metadata 
            });
            return true;
        } catch (error) {
            console.error('Load failed:', error);
            gameStateManager.emit('loadError', { error: error.message });
            return false;
        }
    };

    // Load auto-save if available
    const loadAutoSave = () => {
        return loadGame('pm_game_autosave');
    };

    // Create save data object
    const createSaveData = () => {
        return {
            version: '1.0',
            metadata: {
                saveTime: Date.now(),
                gameVersion: '2026',
                turnCount: gameState.turnCount || 0,
                playerCount: gameState.players ? gameState.players.length : 0
            },
            gameState: {
                players: gameState.players || [],
                currentPlayer: gameState.currentPlayer || 0,
                turnCount: gameState.turnCount || 0,
                gameStatus: gameState.gameStatus || 'playing',
                winner: gameState.winner || null,
                finalScores: gameState.finalScores || null
            }
        };
    };

    // Load available save slots
    const loadSaveSlots = () => {
        try {
            const savedIndex = localStorage.getItem('pm_game_saves_index');
            if (savedIndex) {
                const slots = JSON.parse(savedIndex);
                setSaveState(prev => ({
                    ...prev,
                    saveSlots: slots.sort((a, b) => b.timestamp - a.timestamp)
                }));
            }
        } catch (error) {
            console.error('Failed to load save slots:', error);
        }
    };

    // Delete a save slot
    const deleteSave = (saveId) => {
        try {
            localStorage.removeItem(saveId);
            
            const updatedSlots = saveState.saveSlots.filter(slot => slot.id !== saveId);
            setSaveState(prev => ({
                ...prev,
                saveSlots: updatedSlots
            }));
            
            localStorage.setItem('pm_game_saves_index', JSON.stringify(updatedSlots));
            return true;
        } catch (error) {
            console.error('Delete save failed:', error);
            return false;
        }
    };

    // Export save data as file
    const exportSave = (saveId) => {
        try {
            const saveData = localStorage.getItem(saveId);
            if (!saveData) return false;

            const blob = new Blob([saveData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pm_game_save_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        }
    };

    // Import save data from file
    const importSave = (fileData) => {
        try {
            const parsedData = JSON.parse(fileData);
            if (!parsedData.gameState || !parsedData.metadata) {
                throw new Error('Invalid save file format');
            }

            const saveKey = `pm_game_save_imported_${Date.now()}`;
            const saveMeta = {
                id: saveKey,
                name: 'Imported Save',
                timestamp: Date.now(),
                turnCount: parsedData.gameState.turnCount || 0,
                playerCount: parsedData.gameState.players ? parsedData.gameState.players.length : 0
            };

            localStorage.setItem(saveKey, fileData);
            
            const updatedSlots = [...saveState.saveSlots, saveMeta];
            setSaveState(prev => ({
                ...prev,
                saveSlots: updatedSlots.sort((a, b) => b.timestamp - a.timestamp)
            }));
            
            localStorage.setItem('pm_game_saves_index', JSON.stringify(updatedSlots));
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    };

    // Check if auto-save exists
    const hasAutoSave = () => {
        return localStorage.getItem('pm_game_autosave') !== null;
    };

    // Expose save manager functions
    useEffect(() => {
        gameStateManager.saveManager = {
            saveGame,
            loadGame,
            loadAutoSave,
            deleteSave,
            exportSave,
            importSave,
            hasAutoSave,
            getSaveSlots: () => saveState.saveSlots,
            toggleAutoSave: () => setSaveState(prev => ({ 
                ...prev, 
                autoSaveEnabled: !prev.autoSaveEnabled 
            }))
        };
    }, [saveState.saveSlots, saveState.autoSaveEnabled]);

    // This is a logic-only component
    return null;
}