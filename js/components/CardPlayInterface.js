// CardPlayInterface.js - Drag-and-drop card playing interface
class CardPlayInterface extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            draggedCard: null,
            dragOffset: { x: 0, y: 0 },
            dropZones: [],
            validDropZone: null,
            dragPosition: { x: 0, y: 0 },
            isDragging: false
        };
        
        this.cardRefs = new Map();
        this.dropZoneRefs = new Map();
        this.dragRef = React.createRef();
    }

    componentDidMount() {
        this.setupDropZones();
        // Add global mouse event listeners for dragging
        document.addEventListener('mousemove', this.handleGlobalMouseMove);
        document.addEventListener('mouseup', this.handleGlobalMouseUp);
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);
    }

    setupDropZones() {
        // Define valid drop zones for different card types
        const dropZones = [
            {
                id: 'play-area',
                name: 'Play Area',
                accepts: ['W', 'I', 'L', 'E'], // All except Bank cards
                description: 'Play cards to affect the game'
            },
            {
                id: 'loan-area',
                name: 'Loan Applications',
                accepts: ['B'], // Only Bank cards
                description: 'Apply for loans and financing'
            },
            {
                id: 'discard-area',
                name: 'Discard',
                accepts: ['W', 'B', 'I', 'L', 'E'], // All cards
                description: 'Discard unwanted cards'
            }
        ];
        
        this.setState({ dropZones });
    }

    handleCardMouseDown = (card, event) => {
        if (this.props.disabled || !this.isCardPlayable(card)) {
            return;
        }

        const cardElement = this.cardRefs.get(card.card_id);
        if (!cardElement) return;

        const rect = cardElement.getBoundingClientRect();
        const dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };

        this.setState({
            draggedCard: card,
            dragOffset,
            isDragging: true,
            dragPosition: { x: event.clientX, y: event.clientY }
        });

        // Prevent default drag behavior
        event.preventDefault();
        event.stopPropagation();
    };

    handleGlobalMouseMove = (event) => {
        if (!this.state.isDragging || !this.state.draggedCard) {
            return;
        }

        const dragPosition = {
            x: event.clientX,
            y: event.clientY
        };

        // Check for valid drop zones
        const validDropZone = this.getValidDropZoneAt(dragPosition);

        this.setState({
            dragPosition,
            validDropZone
        });
    };

    handleGlobalMouseUp = (event) => {
        if (!this.state.isDragging || !this.state.draggedCard) {
            return;
        }

        const dropPosition = { x: event.clientX, y: event.clientY };
        const dropZone = this.getValidDropZoneAt(dropPosition);

        if (dropZone) {
            this.handleCardDrop(this.state.draggedCard, dropZone);
        }

        this.setState({
            draggedCard: null,
            dragOffset: { x: 0, y: 0 },
            validDropZone: null,
            isDragging: false,
            dragPosition: { x: 0, y: 0 }
        });
    };

    getValidDropZoneAt(position) {
        for (const [zoneId, element] of this.dropZoneRefs.entries()) {
            if (!element) continue;
            
            const rect = element.getBoundingClientRect();
            if (position.x >= rect.left && position.x <= rect.right &&
                position.y >= rect.top && position.y <= rect.bottom) {
                
                const zone = this.state.dropZones.find(z => z.id === zoneId);
                if (zone && this.canDropCardInZone(this.state.draggedCard, zone)) {
                    return zone;
                }
            }
        }
        return null;
    }

    canDropCardInZone(card, zone) {
        return zone.accepts.includes(card.card_type);
    }

    isCardPlayable(card) {
        // Check if card can be played (has required resources, etc.)
        if (this.props.onCheckPlayable) {
            return this.props.onCheckPlayable(card);
        }
        return true; // Default to playable
    }

    handleCardDrop(card, dropZone) {
        if (this.props.onCardPlay) {
            this.props.onCardPlay(card, dropZone);
        }
    }

    renderCard(card, index) {
        const isBeingDragged = this.state.draggedCard && 
                               this.state.draggedCard.card_id === card.card_id;
        const isPlayable = this.isCardPlayable(card);
        
        return React.createElement('div', {
            key: card.card_id,
            ref: (el) => this.cardRefs.set(card.card_id, el),
            className: `draggable-card ${isBeingDragged ? 'being-dragged' : ''} ${isPlayable ? 'playable' : 'unplayable'}`,
            onMouseDown: (e) => this.handleCardMouseDown(card, e),
            style: {
                transform: `translateX(${index * 20}px)`,
                zIndex: isBeingDragged ? 1000 : 10 + index
            }
        }, [
            React.createElement(CardDisplay, {
                key: 'card',
                cards: [card],
                layout: 'hand',
                maxCards: 1
            }),
            
            // Play hint overlay
            isPlayable && React.createElement('div', {
                key: 'hint',
                className: 'play-hint'
            }, '🎯 Drag to play')
        ]);
    }

    renderDropZone(zone) {
        const isValidTarget = this.state.validDropZone && 
                              this.state.validDropZone.id === zone.id;
        const isActive = this.state.isDragging && 
                         this.state.draggedCard && 
                         this.canDropCardInZone(this.state.draggedCard, zone);
        
        return React.createElement('div', {
            key: zone.id,
            ref: (el) => this.dropZoneRefs.set(zone.id, el),
            className: `drop-zone ${isActive ? 'active' : ''} ${isValidTarget ? 'valid-target' : ''}`
        }, [
            React.createElement('div', {
                key: 'header',
                className: 'drop-zone-header'
            }, [
                React.createElement('h3', {
                    key: 'name',
                    className: 'heading-4'
                }, zone.name),
                React.createElement('div', {
                    key: 'accepts',
                    className: 'accepts-types'
                }, zone.accepts.map(type => 
                    React.createElement('span', {
                        key: type,
                        className: `type-badge type-badge--${type}`
                    }, type)
                ))
            ]),
            
            React.createElement('div', {
                key: 'description',
                className: 'drop-zone-description text-small'
            }, zone.description),
            
            isValidTarget && React.createElement('div', {
                key: 'target-indicator',
                className: 'target-indicator'
            }, '🎯 Drop here')
        ]);
    }

    renderDragGhost() {
        if (!this.state.isDragging || !this.state.draggedCard) {
            return null;
        }

        const { dragPosition, dragOffset } = this.state;
        const ghostStyle = {
            position: 'fixed',
            left: dragPosition.x - dragOffset.x,
            top: dragPosition.y - dragOffset.y,
            zIndex: 10000,
            pointerEvents: 'none',
            opacity: 0.8,
            transform: 'rotate(-5deg) scale(0.9)',
            transition: 'none'
        };

        return React.createElement('div', {
            className: 'drag-ghost',
            style: ghostStyle
        }, React.createElement(CardDisplay, {
            cards: [this.state.draggedCard],
            layout: 'hand',
            maxCards: 1
        }));
    }

    render() {
        const { cards = [], title = "Your Hand" } = this.props;
        const { isDragging, draggedCard } = this.state;

        return React.createElement('div', {
            className: `card-play-interface ${isDragging ? 'dragging' : ''}`
        }, [
            // Player hand section
            React.createElement('div', {
                key: 'hand',
                className: 'player-hand-section'
            }, [
                React.createElement('div', {
                    key: 'header',
                    className: 'section__header'
                }, [
                    React.createElement('h2', {
                        key: 'title',
                        className: 'section__title'
                    }, title),
                    React.createElement('div', {
                        key: 'count',
                        className: 'card-count badge badge--neutral'
                    }, `${cards.length} cards`)
                ]),
                
                React.createElement('div', {
                    key: 'cards',
                    className: 'hand-cards'
                }, cards.map((card, index) => this.renderCard(card, index)))
            ]),

            // Drop zones section
            React.createElement('div', {
                key: 'drop-zones',
                className: 'drop-zones-section'
            }, [
                React.createElement('h3', {
                    key: 'title',
                    className: 'heading-3'
                }, 'Play Areas'),
                
                React.createElement('div', {
                    key: 'zones',
                    className: 'drop-zones-container'
                }, this.state.dropZones.map(zone => this.renderDropZone(zone)))
            ]),

            // Drag ghost
            this.renderDragGhost()
        ]);
    }
}

// Register component globally
window.CardPlayInterface = CardPlayInterface;