// HandManager.js - Hand management and card organization system
class HandManager extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cards: [],
            selectedCards: [],
            sortBy: 'type', // type, name, cost, recent
            filterBy: 'all', // all, W, B, I, L, E
            groupBy: 'none', // none, type, cost
            viewMode: 'hand', // hand, grid, list
            showCardDetails: false,
            selectedCard: null,
            handLimit: 7, // Default hand limit
            organizationHistory: [],
            autoSort: true
        };
    }

    componentDidMount() {
        // Load cards from props or game state
        if (this.props.cards) {
            this.setState({ cards: this.props.cards });
        }
        
        // Listen for card state changes
        if (this.props.gameStateManager) {
            this.props.gameStateManager.on('cardsChanged', this.handleCardsChanged);
        }
    }

    componentWillUnmount() {
        if (this.props.gameStateManager) {
            this.props.gameStateManager.off('cardsChanged', this.handleCardsChanged);
        }
    }

    handleCardsChanged = (newCards) => {
        this.setState({ cards: newCards });
        if (this.state.autoSort) {
            this.sortCards(this.state.sortBy);
        }
    };

    sortCards = (sortBy) => {
        const { cards } = this.state;
        let sortedCards = [...cards];

        switch (sortBy) {
            case 'type':
                sortedCards.sort((a, b) => {
                    const typeOrder = { 'W': 0, 'B': 1, 'I': 2, 'L': 3, 'E': 4 };
                    return typeOrder[a.card_type] - typeOrder[b.card_type] || 
                           a.card_name.localeCompare(b.card_name);
                });
                break;
            case 'name':
                sortedCards.sort((a, b) => a.card_name.localeCompare(b.card_name));
                break;
            case 'cost':
                sortedCards.sort((a, b) => {
                    const getCost = (card) => {
                        return parseInt(card.money_cost || card.loan_amount || 0);
                    };
                    return getCost(a) - getCost(b);
                });
                break;
            case 'recent':
                // Assume cards have a timestamp or use array order
                sortedCards.reverse();
                break;
        }

        this.setState({ 
            cards: sortedCards, 
            sortBy,
            organizationHistory: [...this.state.organizationHistory, { action: 'sort', value: sortBy }]
        });
    };

    filterCards = (filterBy) => {
        this.setState({ filterBy });
    };

    groupCards = (groupBy) => {
        this.setState({ groupBy });
    };

    getFilteredCards = () => {
        const { cards, filterBy } = this.state;
        if (filterBy === 'all') {
            return cards;
        }
        return cards.filter(card => card.card_type === filterBy);
    };

    getGroupedCards = () => {
        const filteredCards = this.getFilteredCards();
        const { groupBy } = this.state;

        if (groupBy === 'none') {
            return { 'All': filteredCards };
        }

        const groups = {};
        filteredCards.forEach(card => {
            let groupKey;
            switch (groupBy) {
                case 'type':
                    const typeNames = {
                        'W': 'Work Cards',
                        'B': 'Business Cards',
                        'I': 'Inspection Cards',
                        'L': 'Legal Cards',
                        'E': 'Emergency Cards'
                    };
                    groupKey = typeNames[card.card_type] || card.card_type;
                    break;
                case 'cost':
                    const cost = parseInt(card.money_cost || card.loan_amount || 0);
                    if (cost === 0) groupKey = 'Free';
                    else if (cost < 100000) groupKey = 'Low Cost';
                    else if (cost < 500000) groupKey = 'Medium Cost';
                    else groupKey = 'High Cost';
                    break;
                default:
                    groupKey = 'All';
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(card);
        });

        return groups;
    };

    handleCardSelect = (card, multiSelect = false) => {
        const { selectedCards } = this.state;
        
        if (multiSelect) {
            const isSelected = selectedCards.some(c => c.card_id === card.card_id);
            const newSelection = isSelected
                ? selectedCards.filter(c => c.card_id !== card.card_id)
                : [...selectedCards, card];
            
            this.setState({ selectedCards: newSelection });
        } else {
            this.setState({ 
                selectedCard: card,
                showCardDetails: true,
                selectedCards: [card]
            });
        }

        if (this.props.onCardSelect) {
            this.props.onCardSelect(card, multiSelect);
        }
    };

    handleBulkAction = (action) => {
        const { selectedCards } = this.state;
        if (selectedCards.length === 0) return;

        switch (action) {
            case 'discard':
                if (this.props.onDiscardCards) {
                    this.props.onDiscardCards(selectedCards);
                }
                break;
            case 'organize':
                this.organizeSelectedCards();
                break;
            case 'details':
                this.setState({ showCardDetails: true });
                break;
        }

        this.setState({ selectedCards: [] });
    };

    organizeSelectedCards = () => {
        // Move selected cards to optimal positions based on play strategy
        const { selectedCards, cards } = this.state;
        const otherCards = cards.filter(card => 
            !selectedCards.some(selected => selected.card_id === card.card_id)
        );

        // Sort selected cards by priority for play
        const organizedSelected = [...selectedCards].sort((a, b) => {
            const getPriority = (card) => {
                if (card.card_type === 'E') return 0; // Emergency cards first
                if (card.card_type === 'B') return 1; // Business cards next
                if (card.card_type === 'W') return 2; // Work cards
                if (card.card_type === 'I') return 3; // Inspection cards
                if (card.card_type === 'L') return 4; // Legal cards last
                return 5;
            };
            return getPriority(a) - getPriority(b);
        });

        const newCardOrder = [...organizedSelected, ...otherCards];
        this.setState({ cards: newCardOrder });
    };

    checkHandLimit = () => {
        const { cards, handLimit } = this.state;
        return {
            isOverLimit: cards.length > handLimit,
            cardsOverLimit: Math.max(0, cards.length - handLimit),
            canDraw: cards.length < handLimit
        };
    };

    renderControlPanel = () => {
        const { sortBy, filterBy, groupBy, viewMode, selectedCards, handLimit, cards } = this.state;
        const handStatus = this.checkHandLimit();

        return React.createElement('div', {
            className: 'hand-control-panel card card--compact'
        }, [
            React.createElement('div', {
                key: 'header',
                className: 'control-header'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'heading-4'
                }, 'Hand Management'),
                React.createElement('div', {
                    key: 'status',
                    className: 'hand-status'
                }, [
                    React.createElement('span', {
                        key: 'count',
                        className: `badge ${handStatus.isOverLimit ? 'badge--error' : 'badge--primary'}`
                    }, `${cards.length}/${handLimit}`),
                    selectedCards.length > 0 && React.createElement('span', {
                        key: 'selected',
                        className: 'badge badge--success'
                    }, `${selectedCards.length} selected`)
                ])
            ]),

            React.createElement('div', {
                key: 'controls',
                className: 'control-grid'
            }, [
                // Sort controls
                React.createElement('div', {
                    key: 'sort',
                    className: 'control-group'
                }, [
                    React.createElement('label', { key: 'label', className: 'heading-5' }, 'Sort by'),
                    React.createElement('select', {
                        key: 'select',
                        value: sortBy,
                        onChange: (e) => this.sortCards(e.target.value),
                        className: 'btn btn--secondary btn--sm'
                    }, [
                        React.createElement('option', { key: 'type', value: 'type' }, 'Card Type'),
                        React.createElement('option', { key: 'name', value: 'name' }, 'Name'),
                        React.createElement('option', { key: 'cost', value: 'cost' }, 'Cost'),
                        React.createElement('option', { key: 'recent', value: 'recent' }, 'Recent')
                    ])
                ]),

                // Filter controls
                React.createElement('div', {
                    key: 'filter',
                    className: 'control-group'
                }, [
                    React.createElement('label', { key: 'label', className: 'heading-5' }, 'Filter'),
                    React.createElement('select', {
                        key: 'select',
                        value: filterBy,
                        onChange: (e) => this.filterCards(e.target.value),
                        className: 'btn btn--secondary btn--sm'
                    }, [
                        React.createElement('option', { key: 'all', value: 'all' }, 'All'),
                        React.createElement('option', { key: 'W', value: 'W' }, 'Work'),
                        React.createElement('option', { key: 'B', value: 'B' }, 'Business'),
                        React.createElement('option', { key: 'I', value: 'I' }, 'Inspection'),
                        React.createElement('option', { key: 'L', value: 'L' }, 'Legal'),
                        React.createElement('option', { key: 'E', value: 'E' }, 'Emergency')
                    ])
                ]),

                // View mode controls
                React.createElement('div', {
                    key: 'view',
                    className: 'control-group'
                }, [
                    React.createElement('label', { key: 'label', className: 'heading-5' }, 'View'),
                    React.createElement('div', {
                        key: 'buttons',
                        className: 'view-buttons'
                    }, [
                        React.createElement('button', {
                            key: 'hand',
                            className: `btn btn--sm ${viewMode === 'hand' ? 'btn--primary' : 'btn--secondary'}`,
                            onClick: () => this.setState({ viewMode: 'hand' })
                        }, '🃏 Hand'),
                        React.createElement('button', {
                            key: 'grid',
                            className: `btn btn--sm ${viewMode === 'grid' ? 'btn--primary' : 'btn--secondary'}`,
                            onClick: () => this.setState({ viewMode: 'grid' })
                        }, '⊞ Grid'),
                        React.createElement('button', {
                            key: 'list',
                            className: `btn btn--sm ${viewMode === 'list' ? 'btn--primary' : 'btn--secondary'}`,
                            onClick: () => this.setState({ viewMode: 'list' })
                        }, '☰ List')
                    ])
                ])
            ]),

            // Bulk actions
            selectedCards.length > 0 && React.createElement('div', {
                key: 'bulk-actions',
                className: 'bulk-actions'
            }, [
                React.createElement('div', {
                    key: 'label',
                    className: 'heading-5'
                }, 'Bulk Actions'),
                React.createElement('div', {
                    key: 'buttons',
                    className: 'bulk-buttons'
                }, [
                    React.createElement('button', {
                        key: 'organize',
                        className: 'btn btn--sm btn--success',
                        onClick: () => this.handleBulkAction('organize')
                    }, '🎯 Organize'),
                    React.createElement('button', {
                        key: 'discard',
                        className: 'btn btn--sm btn--warning',
                        onClick: () => this.handleBulkAction('discard')
                    }, '🗑️ Discard'),
                    React.createElement('button', {
                        key: 'clear',
                        className: 'btn btn--sm btn--ghost',
                        onClick: () => this.setState({ selectedCards: [] })
                    }, 'Clear')
                ])
            ])
        ]);
    };

    renderCardGroups = () => {
        const groupedCards = this.getGroupedCards();
        const { viewMode } = this.state;

        return Object.entries(groupedCards).map(([groupName, cards]) =>
            React.createElement('div', {
                key: groupName,
                className: 'card-group'
            }, [
                groupName !== 'All' && React.createElement('h4', {
                    key: 'title',
                    className: 'group-title heading-4'
                }, groupName),
                
                React.createElement(CardDisplay, {
                    key: 'cards',
                    cards: cards,
                    layout: viewMode,
                    onCardSelect: this.handleCardSelect
                })
            ])
        );
    };

    render() {
        const { showCardDetails, selectedCard } = this.state;
        const handStatus = this.checkHandLimit();

        return React.createElement('div', {
            className: 'hand-manager'
        }, [
            // Control panel
            this.renderControlPanel(),

            // Hand limit warning
            handStatus.isOverLimit && React.createElement('div', {
                key: 'warning',
                className: 'hand-warning card'
            }, [
                React.createElement('div', {
                    key: 'icon',
                    className: 'warning-icon'
                }, '⚠️'),
                React.createElement('div', {
                    key: 'message',
                    className: 'warning-message'
                }, [
                    React.createElement('div', {
                        key: 'title',
                        className: 'heading-4'
                    }, 'Hand Limit Exceeded'),
                    React.createElement('div', {
                        key: 'text',
                        className: 'text-body'
                    }, `You must discard ${handStatus.cardsOverLimit} card${handStatus.cardsOverLimit > 1 ? 's' : ''} before continuing.`)
                ])
            ]),

            // Card groups
            React.createElement('div', {
                key: 'cards',
                className: 'card-groups-container'
            }, this.renderCardGroups()),

            // Card details modal
            showCardDetails && selectedCard && React.createElement('div', {
                key: 'modal',
                className: 'card-detail-modal',
                onClick: () => this.setState({ showCardDetails: false })
            }, React.createElement('div', {
                className: 'modal-content',
                onClick: (e) => e.stopPropagation()
            }, [
                React.createElement(CardDisplay, {
                    key: 'detail',
                    cards: [selectedCard],
                    layout: 'grid',
                    maxCards: 1
                }),
                React.createElement('button', {
                    key: 'close',
                    className: 'btn btn--secondary',
                    onClick: () => this.setState({ showCardDetails: false })
                }, 'Close')
            ]))
        ]);
    }
}

// Register component globally
window.HandManager = HandManager;