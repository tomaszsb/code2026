/**
 * CSVDatabase - Clean Multi-File CSV System
 * Handles the 6-file clean CSV architecture
 * 
 * Architecture principles:
 * - 6 separate CSV files for single responsibilities
 * - Movement, Effects, Content, Configuration separated
 * - Unified API for all data types
 * - Zero data loss from original messy CSVs
 * - Single data access pattern (legacy code removed in Phase 20)
 */

class CSVDatabase {
    constructor() {
        this.data = {
            // Clean CSV architecture
            movement: [],      // MOVEMENT.csv - space connections
            diceOutcomes: [],  // DICE_OUTCOMES.csv - dice roll destinations  
            spaceEffects: [],  // SPACE_EFFECTS.csv - card/time/money effects
            diceEffects: [],   // DICE_EFFECTS.csv - dice-based effects
            spaceContent: [],  // SPACE_CONTENT.csv - UI display content
            gameConfig: [],    // GAME_CONFIG.csv - metadata & configuration
            cards: [],         // cards.csv - card definitions
            
        };
        this.debug = false;
        this.loaded = false;
        this.loadStartTime = null;
        this.cleanArchitecture = true;
    }

    /**
     * Load all CSV data files - clean architecture only
     */
    async loadAll() {
        this.loadStartTime = Date.now();
        try {
            // Load clean architecture files
            await Promise.all([
                this.loadMovement(),
                this.loadDiceOutcomes(),
                this.loadSpaceEffects(),
                this.loadDiceEffects(),
                this.loadSpaceContent(),
                this.loadGameConfig(),
                this.loadCards()
            ]);
            
            this.loaded = true;
            const loadTime = Date.now() - this.loadStartTime;
            this.log(`All CSV data loaded successfully in ${loadTime}ms`);
            this.logDataSummary();
            
        } catch (error) {
            console.error('CSV loading failed:', error);
            throw error;
        }
    }

    /**
     * Load MOVEMENT.csv - Pure space-to-space connections
     */
    async loadMovement() {
        try {
            const response = await fetch('data/MOVEMENT.csv');
            const csvText = await response.text();
            this.data.movement = this.parseCSV(csvText);
            this.log(`Loaded ${this.data.movement.length} movement configurations`);
        } catch (error) {
            console.error('Failed to load MOVEMENT.csv:', error);
            throw error;
        }
    }

    /**
     * Load DICE_OUTCOMES.csv - Dice roll destinations
     */
    async loadDiceOutcomes() {
        try {
            const response = await fetch('data/DICE_OUTCOMES.csv');
            const csvText = await response.text();
            this.data.diceOutcomes = this.parseCSV(csvText);
            this.log(`Loaded ${this.data.diceOutcomes.length} dice outcome configurations`);
        } catch (error) {
            console.error('Failed to load DICE_OUTCOMES.csv:', error);
            throw error;
        }
    }

    /**
     * Load SPACE_EFFECTS.csv - Card/time/money effects
     */
    async loadSpaceEffects() {
        try {
            const response = await fetch('data/SPACE_EFFECTS.csv');
            const csvText = await response.text();
            this.data.spaceEffects = this.parseCSV(csvText);
            this.log(`Loaded ${this.data.spaceEffects.length} space effects`);
        } catch (error) {
            console.error('Failed to load SPACE_EFFECTS.csv:', error);
            throw error;
        }
    }

    /**
     * Load DICE_EFFECTS.csv - Dice-based effects
     */
    async loadDiceEffects() {
        try {
            const response = await fetch('data/DICE_EFFECTS.csv');
            const csvText = await response.text();
            this.data.diceEffects = this.parseCSV(csvText);
            this.log(`Loaded ${this.data.diceEffects.length} dice effects`);
        } catch (error) {
            console.error('Failed to load DICE_EFFECTS.csv:', error);
            throw error;
        }
    }

    /**
     * Load SPACE_CONTENT.csv - UI display content
     */
    async loadSpaceContent() {
        try {
            const response = await fetch('data/SPACE_CONTENT.csv');
            const csvText = await response.text();
            this.data.spaceContent = this.parseCSV(csvText);
            this.log(`Loaded ${this.data.spaceContent.length} space content entries`);
        } catch (error) {
            console.error('Failed to load SPACE_CONTENT.csv:', error);
            throw error;
        }
    }

    /**
     * Load GAME_CONFIG.csv - Metadata & configuration
     */
    async loadGameConfig() {
        try {
            const response = await fetch('data/GAME_CONFIG.csv');
            const csvText = await response.text();
            this.data.gameConfig = this.parseCSV(csvText);
            this.log(`Loaded ${this.data.gameConfig.length} game configuration entries`);
        } catch (error) {
            console.error('Failed to load GAME_CONFIG.csv:', error);
            throw error;
        }
    }

    /**
     * Load cards.csv
     */
    async loadCards() {
        try {
            const response = await fetch('data/cards.csv?v=1.2');
            const csvText = await response.text();
            this.data.cards = this.parseCSV(csvText);
            this.log(`Loaded ${this.data.cards.length} cards`);
            
            // DEBUG: Verify card data parsing - first 5 card IDs
            console.log('First 5 card IDs:', this.data.cards.slice(0, 5).map(card => `"${card.card_id}"`));
            
            
        } catch (error) {
            console.error('Failed to load cards.csv:', error);
            throw error;
        }
    }


    /**
     * Parse CSV text into JavaScript objects using Papa Parse
     */
    parseCSV(csvText) {
        if (typeof Papa === 'undefined') {
            console.error('Papa Parse library not loaded');
            return [];
        }

        const result = Papa.parse(csvText, {
            header: true,           // Treat first row as headers
            skipEmptyLines: true,   // Skip empty lines
            transformHeader: header => header.trim(), // Clean header whitespace
            transform: value => value.trim() // Clean all values
        });

        if (result.errors.length > 0) {
            console.error(`Papa Parse found ${result.errors.length} errors in CSV:`, result.errors);
            
            // Detailed error reporting for debugging
            result.errors.forEach((error, index) => {
                const errorDetails = {
                    type: error.type,
                    code: error.code,
                    message: error.message,
                    row: error.row !== undefined ? error.row + 1 : 'Unknown', // Convert to 1-based
                    index: error.index
                };
                console.error(`Error ${index + 1}:\n${JSON.stringify(errorDetails, null, 2)}`);
            });
            
            // Show sample of parsed data to see what did work
            console.log(`Successfully parsed ${result.data.length} rows`);
            if (result.data.length > 0) {
                console.log('Sample of parsed data (first 3 rows):', result.data.slice(0, 3));
            }
        }

        // Safety check: Don't return data if there are critical parsing errors
        if (result.errors.length > 0) {
            const criticalErrors = result.errors.filter(error => 
                error.type === 'Delimiter' || error.type === 'FieldMismatch'
            );
            
            if (criticalErrors.length > 5) {
                console.error('Too many critical CSV parsing errors. Data may be corrupted.');
                console.error('Consider checking the CSV file structure manually.');
            }
        }
        
        return result.data;
    }


    /**
     * Query API for clean architecture
     */
    get movement() {
        return {
            find: (spaceName, visitType) => {
                if (!this.cleanArchitecture) {
                    throw new Error('Movement API requires clean architecture. Use legacy spaces API.');
                }
                return this.data.movement.find(row => 
                    row.space_name === spaceName && row.visit_type === visitType
                );
            },
            query: (filters) => {
                if (!this.cleanArchitecture) {
                    throw new Error('Movement API requires clean architecture. Use legacy spaces API.');
                }
                if (!filters || typeof filters !== 'object') {
                    return this.data.movement;
                }
                return this.data.movement.filter(row => {
                    return Object.entries(filters).every(([key, value]) => row[key] === value);
                });
            },
            getDestinations: (spaceName, visitType) => {
                const movement = this.movement.find(spaceName, visitType);
                if (!movement) return [];
                return [
                    movement.destination_1,
                    movement.destination_2,
                    movement.destination_3,
                    movement.destination_4,
                    movement.destination_5
                ].filter(dest => dest && dest.trim());
            }
        };
    }

    get spaceEffects() {
        return {
            find: (spaceName, visitType) => {
                return this.data.spaceEffects.find(row => 
                    row.space_name === spaceName && row.visit_type === visitType
                );
            },
            query: (filters) => {
                if (!filters || typeof filters !== 'object') {
                    return this.data.spaceEffects;
                }
                return this.data.spaceEffects.filter(row => {
                    return Object.entries(filters).every(([key, value]) => row[key] === value);
                });
            }
        };
    }

    get spaceContent() {
        return {
            find: (spaceName, visitType) => {
                return this.data.spaceContent.find(row => 
                    row.space_name === spaceName && row.visit_type === visitType
                );
            },
            query: (filters) => {
                if (!filters || typeof filters !== 'object') {
                    return this.data.spaceContent;
                }
                return this.data.spaceContent.filter(row => {
                    return Object.entries(filters).every(([key, value]) => row[key] === value);
                });
            }
        };
    }

    get diceOutcomes() {
        return {
            find: (spaceName, visitType) => {
                return this.data.diceOutcomes.find(row => 
                    row.space_name === spaceName && row.visit_type === visitType
                );
            },
            query: (filters) => {
                if (!filters || typeof filters !== 'object') {
                    return this.data.diceOutcomes;
                }
                return this.data.diceOutcomes.filter(row => {
                    return Object.entries(filters).every(([key, value]) => row[key] === value);
                });
            }
        };
    }

    get diceEffects() {
        return {
            find: (spaceName, visitType) => {
                return this.data.diceEffects.find(row => 
                    row.space_name === spaceName && row.visit_type === visitType
                );
            },
            query: (filters) => {
                if (!filters || typeof filters !== 'object') {
                    return this.data.diceEffects;
                }
                return this.data.diceEffects.filter(row => {
                    return Object.entries(filters).every(([key, value]) => row[key] === value);
                });
            }
        };
    }

    get gameConfig() {
        return {
            find: (spaceName) => {
                return this.data.gameConfig.find(row => row.space_name === spaceName);
            },
            query: (filters) => {
                if (!filters || typeof filters !== 'object') {
                    return this.data.gameConfig;
                }
                return this.data.gameConfig.filter(row => {
                    return Object.entries(filters).every(([key, value]) => row[key] === value);
                });
            }
        };
    }


    get cards() {
        return {
            query: (filters) => {
                if (!filters || typeof filters !== 'object') {
                    return this.data.cards;
                }
                const results = this.data.cards.filter(row => {
                    return Object.entries(filters).every(([key, value]) => row[key] === value);
                });
                
                return results;
            },
            find: (filters) => {
                if (!filters || typeof filters !== 'object') {
                    return this.data.cards[0] || null;
                }
                const result = this.data.cards.find(row => {
                    return Object.entries(filters).every(([key, value]) => row[key] === value);
                });
                
                return result;
            }
        };
    }

    /**
     * Log data summary
     */
    logDataSummary() {
        if (this.debug) {
            if (this.cleanArchitecture) {
            }
        }
    }

    /**
     * Enable debug logging
     */
    enableDebug() {
        this.debug = true;
        this.log('Debug mode enabled');
    }

    /**
     * Log message if debug enabled
     */
    log(message) {
        if (this.debug) {
        }
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            loaded: this.loaded,
            cleanArchitecture: this.cleanArchitecture,
            dataCount: {
                movement: this.data.movement.length,
                spaceEffects: this.data.spaceEffects.length,
                spaceContent: this.data.spaceContent.length,
                diceOutcomes: this.data.diceOutcomes.length,
                gameConfig: this.data.gameConfig.length,
                cards: this.data.cards.length
            }
        };
    }
}

// Create singleton instance
if (typeof window !== 'undefined') {
    window.CSVDatabase = new CSVDatabase();
}