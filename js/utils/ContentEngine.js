/**
 * ContentEngine - Clean CSV Content System
 * Handles all UI display content using clean CSV architecture
 * 
 * Uses: SPACE_CONTENT.csv, GAME_CONFIG.csv
 */

class ContentEngine {
    constructor() {
        this.database = null;
        this.debug = false;
        this.contentCache = new Map();
    }

    /**
     * Initialize with clean CSV database
     */
    initialize(csvDatabase) {
        this.database = csvDatabase;
        this.log('ContentEngine initialized with clean CSV database');
    }

    /**
     * Get complete content for a space
     */
    getSpaceContent(spaceName, visitType = 'First') {
        if (!this.database || !this.database.loaded) {
            throw new Error('ContentEngine: Database not loaded');
        }

        const cacheKey = `${spaceName}_${visitType}`;
        if (this.contentCache.has(cacheKey)) {
            return this.contentCache.get(cacheKey);
        }

        const content = this.database.spaceContent.find(spaceName, visitType);
        if (!content) {
            this.log(`No content found for ${spaceName}/${visitType}`);
            return null;
        }

        // Cache the result
        this.contentCache.set(cacheKey, content);
        this.log(`Retrieved content for ${spaceName}/${visitType}`);
        return content;
    }

    /**
     * Get space title
     */
    getSpaceTitle(spaceName, visitType = 'First') {
        const content = this.getSpaceContent(spaceName, visitType);
        return content?.title || `${spaceName} (${visitType})`;
    }

    /**
     * Get space story/description
     */
    getSpaceStory(spaceName, visitType = 'First') {
        const content = this.getSpaceContent(spaceName, visitType);
        return content?.story || '';
    }

    /**
     * Get action description
     */
    getActionDescription(spaceName, visitType = 'First') {
        const content = this.getSpaceContent(spaceName, visitType);
        return content?.action_description || '';
    }

    /**
     * Get outcome description
     */
    getOutcomeDescription(spaceName, visitType = 'First') {
        const content = this.getSpaceContent(spaceName, visitType);
        return content?.outcome_description || '';
    }

    /**
     * Check if space allows negotiation
     */
    canNegotiate(spaceName, visitType = 'First') {
        const content = this.getSpaceContent(spaceName, visitType);
        return content?.can_negotiate === 'Yes';
    }

    /**
     * Get space configuration metadata
     */
    getSpaceConfig(spaceName) {
        if (!this.database || !this.database.loaded) {
            throw new Error('ContentEngine: Database not loaded');
        }

        const config = this.database.gameConfig.find(spaceName);
        if (!config) {
            this.log(`No config found for ${spaceName}`);
            return null;
        }

        return config;
    }

    /**
     * Get space phase
     */
    getSpacePhase(spaceName) {
        const config = this.getSpaceConfig(spaceName);
        return config?.phase || 'UNKNOWN';
    }

    /**
     * Get space path type
     */
    getPathType(spaceName) {
        const config = this.getSpaceConfig(spaceName);
        return config?.path_type || 'Main';
    }

    /**
     * Check if space is starting space
     */
    isStartingSpace(spaceName) {
        const config = this.getSpaceConfig(spaceName);
        return config?.is_starting_space === 'Yes';
    }

    /**
     * Check if space is ending space
     */
    isEndingSpace(spaceName) {
        const config = this.getSpaceConfig(spaceName);
        return config?.is_ending_space === 'Yes';
    }

    /**
     * Get all spaces by phase
     */
    getSpacesByPhase(phase) {
        if (!this.database || !this.database.loaded) {
            throw new Error('ContentEngine: Database not loaded');
        }

        return this.database.gameConfig.byPhase(phase);
    }

    /**
     * Get all phases in the game
     */
    getAllPhases() {
        if (!this.database || !this.database.loaded) {
            throw new Error('ContentEngine: Database not loaded');
        }

        const configs = this.database.gameConfig.query({});
        const phases = [...new Set(configs.map(config => config.phase))];
        return phases.filter(phase => phase && phase !== '');
    }

    /**
     * Render space content to DOM elements
     */
    renderSpaceContent(spaceName, visitType = 'First', elementIds = {}) {
        const content = this.getSpaceContent(spaceName, visitType);
        if (!content) {
            this.log(`Cannot render content for ${spaceName}/${visitType} - content not found`);
            return false;
        }

        const {
            titleElement = 'space-title',
            storyElement = 'space-story', 
            actionElement = 'space-action',
            outcomeElement = 'space-outcome',
            negotiateButton = 'negotiate-btn'
        } = elementIds;

        // Update title
        const titleEl = document.getElementById(titleElement);
        if (titleEl) {
            titleEl.textContent = content.title;
        }

        // Update story
        const storyEl = document.getElementById(storyElement);
        if (storyEl) {
            storyEl.textContent = content.story;
        }

        // Update action description
        const actionEl = document.getElementById(actionElement);
        if (actionEl) {
            actionEl.textContent = content.action_description;
        }

        // Update outcome description
        const outcomeEl = document.getElementById(outcomeElement);
        if (outcomeEl) {
            outcomeEl.textContent = content.outcome_description;
        }

        // Handle negotiate button
        const negotiateBtn = document.getElementById(negotiateButton);
        if (negotiateBtn) {
            negotiateBtn.style.display = content.can_negotiate === 'Yes' ? 'block' : 'none';
        }

        this.log(`Rendered content for ${spaceName}/${visitType}`);
        return true;
    }

    /**
     * Get formatted space information for display
     */
    getFormattedSpaceInfo(spaceName, visitType = 'First') {
        const content = this.getSpaceContent(spaceName, visitType);
        const config = this.getSpaceConfig(spaceName);

        if (!content) {
            return {
                title: spaceName,
                phase: 'UNKNOWN',
                pathType: 'Unknown',
                story: 'No content available',
                action: '',
                outcome: '',
                canNegotiate: false,
                isStart: false,
                isEnd: false
            };
        }

        return {
            title: content.title,
            phase: config?.phase || 'UNKNOWN',
            pathType: config?.path_type || 'Main',
            story: content.story,
            action: content.action_description,
            outcome: content.outcome_description,
            canNegotiate: content.can_negotiate === 'Yes',
            isStart: config?.is_starting_space === 'Yes',
            isEnd: config?.is_ending_space === 'Yes'
        };
    }

    /**
     * Search content by keyword
     */
    searchContent(keyword, searchFields = ['title', 'story', 'action_description']) {
        if (!this.database || !this.database.loaded) {
            throw new Error('ContentEngine: Database not loaded');
        }

        const results = [];
        const allContent = this.database.spaceContent.query({});
        const searchTerm = keyword.toLowerCase();

        allContent.forEach(content => {
            const matches = searchFields.some(field => {
                const fieldValue = content[field] || '';
                return fieldValue.toLowerCase().includes(searchTerm);
            });

            if (matches) {
                results.push({
                    spaceName: content.space_name,
                    visitType: content.visit_type,
                    title: content.title,
                    matchedContent: content
                });
            }
        });

        this.log(`Search for "${keyword}" returned ${results.length} results`);
        return results;
    }

    /**
     * Get content statistics
     */
    getContentStats() {
        if (!this.database || !this.database.loaded) {
            throw new Error('ContentEngine: Database not loaded');
        }

        const allContent = this.database.spaceContent.query({});
        const allConfigs = this.database.gameConfig.query({});

        const stats = {
            totalSpaces: allContent.length,
            totalConfigs: allConfigs.length,
            phases: this.getAllPhases(),
            visitTypes: [...new Set(allContent.map(c => c.visit_type))],
            spacesWithNegotiation: allContent.filter(c => c.can_negotiate === 'Yes').length,
            startingSpaces: allConfigs.filter(c => c.is_starting_space === 'Yes').length,
            endingSpaces: allConfigs.filter(c => c.is_ending_space === 'Yes').length
        };

        return stats;
    }

    /**
     * Validate content data integrity
     */
    validateContentData() {
        if (!this.database || !this.database.loaded) {
            throw new Error('Database not loaded');
        }

        const issues = [];
        const content = this.database.data.spaceContent;
        const configs = this.database.data.gameConfig;

        // Check that all content has corresponding config
        content.forEach(contentRow => {
            const config = configs.find(c => c.space_name === contentRow.space_name);
            if (!config) {
                issues.push(`Content without config: ${contentRow.space_name}`);
            }
        });

        // Check that all configs have corresponding content
        configs.forEach(configRow => {
            const hasFirstContent = content.find(c => 
                c.space_name === configRow.space_name && c.visit_type === 'First'
            );
            if (!hasFirstContent) {
                issues.push(`Config without First visit content: ${configRow.space_name}`);
            }
        });

        // Check for required fields
        content.forEach(contentRow => {
            if (!contentRow.title || contentRow.title.trim() === '') {
                issues.push(`Missing title for ${contentRow.space_name}/${contentRow.visit_type}`);
            }
            if (!contentRow.story || contentRow.story.trim() === '') {
                issues.push(`Missing story for ${contentRow.space_name}/${contentRow.visit_type}`);
            }
        });

        if (issues.length > 0) {
            console.warn('Content data validation issues:', issues);
            return { valid: false, issues };
        }

        this.log('Content data validation passed');
        return { valid: true, issues: [] };
    }

    /**
     * Clear content cache
     */
    clearCache() {
        this.contentCache.clear();
        this.log('Content cache cleared');
    }

    /**
     * Utility methods
     */
    log(message) {
        if (this.debug) {
            console.log(`[ContentEngine] ${message}`);
        }
    }

    enableDebug() {
        this.debug = true;
        this.log('Debug logging enabled');
    }

    disableDebug() {
        this.debug = false;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.contentCache.size,
            cachedItems: Array.from(this.contentCache.keys())
        };
    }
}

// Create singleton instance
const ContentEngineInstance = new ContentEngine();

// Export for browser usage
if (typeof window !== 'undefined') {
    window.ContentEngine = ContentEngineInstance;
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentEngineInstance;
}