/**
 * AdvancedCardManager Component - Sophisticated card system with combos and chains
 * Adapted for code2026's architecture from code2025's advanced features
 */

function AdvancedCardManager() {
    const { useState, useEffect } = React;
    const [gameState, gameStateManager] = useGameState();
    const [cardState, setCardState] = useState({
        comboOpportunities: [],
        chainEffects: [],
        activeSequences: [],
        recentCombos: []
    });

    // Handle card drawing event
    useEventListener('cardDrawn', ({ player, card, cardType }) => {
        if (card && player) {
            processCardEffects(card, player, false);
            checkComboOpportunities(card, player);
            updateCardAnimations(cardType, card);
        }
    });

    // Handle card playing event
    useEventListener('cardPlayed', ({ player, card }) => {
        if (card && player) {
            processCardEffects(card, player, true);
            executeCardCombo(card, player);
            processChainEffects(card, player);
        }
    });

    // Process individual card effects
    const processCardEffects = (card, player, isPlayed) => {
        if (!card || !player) return;

        const effects = {
            money: 0,
            time: 0,
            specialEffect: null
        };

        // Extract monetary effects
        if (card.money_cost && isPlayed) {
            effects.money -= parseInt(card.money_cost) || 0;
        }
        if (card.money_gain) {
            effects.money += parseInt(card.money_gain) || 0;
        }
        if (card.loan_amount && isPlayed) {
            effects.money += parseInt(card.loan_amount) || 0;
        }
        if (card.investment_amount && isPlayed) {
            effects.money += parseInt(card.investment_amount) || 0;
        }

        // Extract time effects
        if (card.time_cost && isPlayed) {
            effects.time -= parseInt(card.time_cost) || 0;
        }
        if (card.time_gain) {
            effects.time += parseInt(card.time_gain) || 0;
        }

        // Apply effects to player
        if (effects.money !== 0) {
            const newMoney = Math.max(0, player.money + effects.money);
            gameStateManager.emit('updatePlayer', {
                playerId: player.id,
                updates: { money: newMoney }
            });

            // Show feedback
            if (window.InteractiveFeedback) {
                const message = effects.money > 0 ? 
                    `+$${effects.money.toLocaleString()} gained` : 
                    `-$${Math.abs(effects.money).toLocaleString()} spent`;
                window.InteractiveFeedback.success(message);
            }
        }

        if (effects.time !== 0 && window.InteractiveFeedback) {
            const message = effects.time > 0 ? 
                `+${effects.time} time gained` : 
                `${Math.abs(effects.time)} time spent`;
            window.InteractiveFeedback.info(message);
        }

        console.log('AdvancedCardManager: Processed card effects', { card: card.card_id, effects });
    };

    // Check for combo opportunities when cards are drawn/played
    const checkComboOpportunities = (triggerCard, player) => {
        if (!triggerCard || !player) return;

        // Initialize combo state if needed
        if (!player.comboState) {
            player.comboState = {
                recentCards: [],
                activeSequences: [],
                completedCombos: []
            };
        }

        // Add to recent cards
        addToRecentCards(triggerCard, player);

        // Check for combo patterns
        const opportunities = findComboOpportunities(triggerCard, player);
        if (opportunities.length > 0) {
            setCardState(prev => ({
                ...prev,
                comboOpportunities: opportunities
            }));

            if (window.InteractiveFeedback) {
                window.InteractiveFeedback.info(
                    `Combo opportunity detected! ${opportunities.length} possible combination${opportunities.length > 1 ? 's' : ''}`
                );
            }
        }
    };

    // Add card to recent cards for combo tracking
    const addToRecentCards = (card, player) => {
        const maxRecentCards = 8;
        
        player.comboState.recentCards.unshift({
            card: card,
            timestamp: Date.now(),
            turn: gameState.currentTurn || 0
        });

        if (player.comboState.recentCards.length > maxRecentCards) {
            player.comboState.recentCards = player.comboState.recentCards.slice(0, maxRecentCards);
        }
    };

    // Find combo opportunities based on current hand and recent cards
    const findComboOpportunities = (triggerCard, player) => {
        const opportunities = [];
        const recentCards = player.comboState.recentCards.slice(0, 5);
        const cardTypes = recentCards.map(r => r.card.card_type);

        // Finance Combo: Bank (B) + Investor (I)
        if ((triggerCard.card_type === 'B' && cardTypes.includes('I')) ||
            (triggerCard.card_type === 'I' && cardTypes.includes('B'))) {
            opportunities.push({
                type: 'finance',
                name: 'Finance Synergy',
                description: 'Bank + Investor cards provide enhanced funding',
                bonus: { money: 75000, multiplier: 1.5 },
                cards: ['B', 'I']
            });
        }

        // Work-Life Balance: Work (W) + Life (L)
        if ((triggerCard.card_type === 'W' && cardTypes.includes('L')) ||
            (triggerCard.card_type === 'L' && cardTypes.includes('W'))) {
            opportunities.push({
                type: 'work-life',
                name: 'Work-Life Balance',
                description: 'Work + Life cards provide balanced approach bonus',
                bonus: { money: 25000, time: 2 },
                cards: ['W', 'L']
            });
        }

        // Same-Type Mastery: 3+ cards of same type
        const typeCounts = {};
        cardTypes.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        if (typeCounts[triggerCard.card_type] && typeCounts[triggerCard.card_type] >= 2) {
            opportunities.push({
                type: 'mastery',
                name: `${getCardTypeName(triggerCard.card_type)} Mastery`,
                description: `Multiple ${getCardTypeName(triggerCard.card_type)} cards provide specialization bonus`,
                bonus: { money: 40000, multiplier: 1.3 },
                cards: [triggerCard.card_type]
            });
        }

        // Project Spectrum: All 5 card types
        const uniqueTypes = new Set([triggerCard.card_type, ...cardTypes]);
        if (uniqueTypes.size >= 4) {
            opportunities.push({
                type: 'spectrum',
                name: 'Project Mastery',
                description: 'Diverse card types provide ultimate project bonus',
                bonus: { money: 150000, time: 5, multiplier: 2.0 },
                cards: ['W', 'B', 'I', 'L', 'E']
            });
        }

        return opportunities;
    };

    // Execute combo when player chooses to activate it
    const executeCardCombo = (triggerCard, player) => {
        const opportunities = findComboOpportunities(triggerCard, player);
        
        // Auto-execute first available combo (can be made interactive later)
        if (opportunities.length > 0) {
            const combo = opportunities[0];
            applyComboEffects(combo, player);
            recordComboExecution(combo, player);
        }
    };

    // Apply combo effects to player
    const applyComboEffects = (combo, player) => {
        const { bonus } = combo;
        let totalMoney = 0;
        let totalTime = 0;

        if (bonus.money) {
            totalMoney += bonus.money;
        }
        if (bonus.time) {
            totalTime += bonus.time;
        }

        // Apply multiplier if present
        if (bonus.multiplier > 1) {
            totalMoney = Math.floor(totalMoney * bonus.multiplier);
            totalTime = Math.floor(totalTime * bonus.multiplier);
        }

        // Update player resources
        if (totalMoney > 0) {
            const newMoney = player.money + totalMoney;
            gameStateManager.emit('updatePlayer', {
                playerId: player.id,
                updates: { money: newMoney }
            });
        }

        // Show combo feedback
        if (window.InteractiveFeedback) {
            window.InteractiveFeedback.success(
                `🎯 ${combo.name} Combo! +$${totalMoney.toLocaleString()}${totalTime > 0 ? ` +${totalTime} time` : ''}`,
                6000
            );
        }

        console.log('AdvancedCardManager: Applied combo effects', { combo, totalMoney, totalTime });
    };

    // Record combo execution for history
    const recordComboExecution = (combo, player) => {
        const comboRecord = {
            type: combo.type,
            name: combo.name,
            bonus: combo.bonus,
            turn: gameState.currentTurn || 0,
            timestamp: Date.now()
        };

        player.comboState.completedCombos.push(comboRecord);
        
        setCardState(prev => ({
            ...prev,
            recentCombos: [comboRecord, ...prev.recentCombos.slice(0, 4)]
        }));

        // Emit combo event
        gameStateManager.emit('comboExecuted', {
            player,
            combo: comboRecord
        });
    };

    // Process chain effects (sequential card benefits)
    const processChainEffects = (card, player) => {
        if (!card.chain_effect && !card.immediate_effect) return;

        const chainBonus = calculateChainBonus(card, player);
        if (chainBonus) {
            applyChainEffects(chainBonus, player, card);
        }
    };

    // Calculate chain bonus based on card sequence
    const calculateChainBonus = (card, player) => {
        const recentCards = player.comboState?.recentCards?.slice(0, 3) || [];
        
        // Phase progression chain: consecutive phase cards
        const phaseCards = recentCards.filter(r => {
            const cardName = r.card.card_name || '';
            return cardName.includes('PHASE') || cardName.includes('DESIGN') || 
                   cardName.includes('BUILD') || cardName.includes('TEST');
        });

        if (phaseCards.length >= 2) {
            return {
                type: 'phase_progression',
                money: 30000,
                time: 1,
                message: 'Phase progression chain bonus!'
            };
        }

        return null;
    };

    // Apply chain effects
    const applyChainEffects = (chainBonus, player, triggerCard) => {
        if (chainBonus.money > 0) {
            const newMoney = player.money + chainBonus.money;
            gameStateManager.emit('updatePlayer', {
                playerId: player.id,
                updates: { money: newMoney }
            });
        }

        if (window.InteractiveFeedback) {
            window.InteractiveFeedback.info(
                `⛓️ ${chainBonus.message} +$${chainBonus.money.toLocaleString()}`,
                4000
            );
        }

        setCardState(prev => ({
            ...prev,
            chainEffects: [{
                card: triggerCard.card_id,
                bonus: chainBonus,
                timestamp: Date.now()
            }, ...prev.chainEffects.slice(0, 2)]
        }));
    };

    // Get human-readable card type name
    const getCardTypeName = (cardType) => {
        const names = {
            'W': 'Work',
            'B': 'Business',
            'I': 'Investment',
            'L': 'Life',
            'E': 'Emergency'
        };
        return names[cardType] || 'Unknown';
    };

    // Expose combo and chain methods globally
    useEffect(() => {
        window.AdvancedCardManager = {
            getComboOpportunities: () => cardState.comboOpportunities,
            getRecentCombos: () => cardState.recentCombos,
            getChainEffects: () => cardState.chainEffects,
            findComboOpportunities,
            executeCardCombo,
            processChainEffects
        };
    }, [cardState]);

    // Render combo opportunities UI (optional visual feedback)
    const renderComboOpportunities = () => {
        if (cardState.comboOpportunities.length === 0) return null;

        return React.createElement('div', {
            className: 'combo-opportunities',
            style: {
                position: 'fixed',
                top: '100px',
                right: '20px',
                zIndex: 1000,
                maxWidth: '300px'
            }
        },
            cardState.comboOpportunities.map((combo, index) =>
                React.createElement('div', {
                    key: index,
                    className: 'combo-card',
                    style: {
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        animation: 'pulse 2s infinite'
                    }
                }, [
                    React.createElement('div', {
                        key: 'name',
                        className: 'combo-name',
                        style: { fontWeight: 'bold', marginBottom: '4px' }
                    }, `🎯 ${combo.name}`),
                    
                    React.createElement('div', {
                        key: 'desc',
                        className: 'combo-description',
                        style: { fontSize: '12px', opacity: 0.9 }
                    }, combo.description)
                ])
            )
        );
    };

    return React.createElement('div', { className: 'advanced-card-manager' }, [
        renderComboOpportunities(),
        
        // CSS for animations
        React.createElement('style', {
            key: 'combo-styles'
        }, `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
        `)
    ]);
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedCardManager;
} else {
    window.AdvancedCardManagerComponent = AdvancedCardManager;
}