/**
 * CSVDatabase - Unified CSV Query System
 * Single source of truth for all game data
 * 
 * Architecture principles:
 * - CSV files contain ALL game content
 * - Unified API for all data types
 * - No fallbacks, no hardcoded data
 * - Error early if data not found
 */

class CSVDatabase {
    constructor() {
        this.data = {
            cards: [],
            spaces: [],
            dice: []
        };
        this.debug = false;
        this.loaded = false;
    }

    /**
     * Load all CSV data files
     */
    async loadAll() {
        try {
            await Promise.all([
                this.loadCards(),
                this.loadSpaces(),
                this.loadDice()
            ]);
            this.loaded = true;
            this.log('All CSV data loaded successfully');
        } catch (error) {
            console.error('Failed to load CSV data:', error);
            throw error;
        }
    }

    /**
     * Load cards.csv
     */
    async loadCards() {
        const response = await fetch('data/cards.csv');
        const csvText = await response.text();
        this.data.cards = this.parseCSV(csvText);
        this.log(`Loaded ${this.data.cards.length} cards`);
    }

    /**
     * Load Spaces.csv
     */
    async loadSpaces() {
        const response = await fetch('data/Spaces.csv');
        const csvText = await response.text();
        this.data.spaces = this.parseCSV(csvText);
        this.log(`Loaded ${this.data.spaces.length} spaces`);
    }

    /**
     * Load DiceRoll Info.csv
     */
    async loadDice() {
        const response = await fetch('data/DiceRoll Info.csv');
        const csvText = await response.text();
        this.data.dice = this.parseCSV(csvText);
        this.log(`Loaded ${this.data.dice.length} dice configurations`);
    }

    /**
     * Parse CSV text into JavaScript objects
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index]?.trim() || '';
                });
                
                rows.push(row);
            }
        }

        return rows;
    }

    /**
     * Parse a single CSV line handling commas in quoted strings
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    /**
     * CARDS API - Query card data
     */
    get cards() {
        return {
            // Get all cards matching filters
            query: (filters = {}) => {
                this.ensureLoaded();
                let results = this.data.cards;

                Object.entries(filters).forEach(([key, value]) => {
                    results = results.filter(card => {
                        if (Array.isArray(value)) {
                            return value.includes(card[key]);
                        }
                        return card[key] === value;
                    });
                });

                this.log(`Cards query ${JSON.stringify(filters)} returned ${results.length} results`);
                return results;
            },

            // Get single card by ID
            find: (cardId) => {
                this.ensureLoaded();
                const card = this.data.cards.find(c => c.card_id === cardId);
                this.log(`Cards find ${cardId} returned ${card ? 'found' : 'not found'}`);
                return card;
            },

            // Get cards by type
            byType: (cardType) => {
                return this.cards.query({ card_type: cardType });
            },

            // Get cards by phase restriction
            byPhase: (phase) => {
                return this.cards.query({ phase_restriction: phase });
            }
        };
    }

    /**
     * SPACES API - Query space data
     */
    get spaces() {
        return {
            // Find space by name and visit type
            find: (spaceName, visitType = 'First') => {
                this.ensureLoaded();
                const space = this.data.spaces.find(s => 
                    s.space_name === spaceName && s.visit_type === visitType
                );
                this.log(`Spaces find ${spaceName}/${visitType} returned ${space ? 'found' : 'not found'}`);
                return space;
            },

            // Get all spaces matching filters
            query: (filters = {}) => {
                this.ensureLoaded();
                let results = this.data.spaces;

                Object.entries(filters).forEach(([key, value]) => {
                    results = results.filter(space => {
                        if (Array.isArray(value)) {
                            return value.includes(space[key]);
                        }
                        return space[key] === value;
                    });
                });

                this.log(`Spaces query ${JSON.stringify(filters)} returned ${results.length} results`);
                return results;
            },

            // Get spaces by phase
            byPhase: (phase) => {
                return this.spaces.query({ phase });
            }
        };
    }

    /**
     * DICE API - Query dice roll data
     */
    get dice() {
        return {
            // Find dice configuration for space and visit type
            find: (spaceName, visitType = 'First') => {
                this.ensureLoaded();
                const config = this.data.dice.find(d => 
                    d.space_name === spaceName && d.visit_type === visitType
                );
                this.log(`Dice find ${spaceName}/${visitType} returned ${config ? 'found' : 'not found'}`);
                return config;
            },

            // Get dice outcomes for a roll
            getRollOutcome: (spaceName, visitType, rollValue) => {
                const config = this.dice.find(spaceName, visitType);
                if (!config) return null;

                const outcome = config[rollValue.toString()];
                this.log(`Dice roll ${spaceName}/${visitType}/${rollValue} = ${outcome}`);
                return outcome;
            },

            // Query dice configurations
            query: (filters = {}) => {
                this.ensureLoaded();
                let results = this.data.dice;

                Object.entries(filters).forEach(([key, value]) => {
                    results = results.filter(dice => dice[key] === value);
                });

                this.log(`Dice query ${JSON.stringify(filters)} returned ${results.length} results`);
                return results;
            }
        };
    }

    /**
     * Utility methods
     */
    log(message) {
        if (this.debug) {
            console.log(`[CSVDatabase] ${message}`);
        }
    }

    ensureLoaded() {
        if (!this.loaded) {
            throw new Error('CSVDatabase not loaded. Call loadAll() first.');
        }
    }

    /**
     * Get raw data (for debugging)
     */
    getRawData() {
        return { ...this.data };
    }
}

// Create singleton instance
const CSVDatabaseInstance = new CSVDatabase();

// Export for browser usage
if (typeof window !== 'undefined') {
    window.CSVDatabase = CSVDatabaseInstance;
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSVDatabaseInstance;
}