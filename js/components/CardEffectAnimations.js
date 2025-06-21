// CardEffectAnimations.js - Card effect animations and visual feedback
class CardEffectAnimations extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeAnimations: [],
            animationQueue: [],
            isProcessing: false
        };
        
        this.animationId = 0;
        this.animationContainer = React.createRef();
    }

    componentDidMount() {
        // Listen for card effect events
        if (this.props.gameStateManager) {
            this.props.gameStateManager.on('cardPlayed', this.handleCardPlayed);
            this.props.gameStateManager.on('cardEffect', this.handleCardEffect);
        }
    }

    componentWillUnmount() {
        if (this.props.gameStateManager) {
            this.props.gameStateManager.off('cardPlayed', this.handleCardPlayed);
            this.props.gameStateManager.off('cardEffect', this.handleCardEffect);
        }
    }

    handleCardPlayed = (data) => {
        const { card, dropZone, player } = data;
        this.queueAnimation({
            type: 'cardPlay',
            card,
            dropZone,
            player,
            duration: 1000
        });
    };

    handleCardEffect = (data) => {
        const { card, effect, value, target } = data;
        this.queueAnimation({
            type: 'cardEffect',
            card,
            effect,
            value,
            target,
            duration: 1500
        });
    };

    queueAnimation = (animation) => {
        const id = ++this.animationId;
        const animationWithId = { ...animation, id };
        
        this.setState(prevState => ({
            animationQueue: [...prevState.animationQueue, animationWithId]
        }), () => {
            if (!this.state.isProcessing) {
                this.processAnimationQueue();
            }
        });
    };

    processAnimationQueue = async () => {
        if (this.state.animationQueue.length === 0) {
            this.setState({ isProcessing: false });
            return;
        }

        this.setState({ isProcessing: true });
        
        const nextAnimation = this.state.animationQueue[0];
        
        // Remove from queue and add to active
        this.setState(prevState => ({
            animationQueue: prevState.animationQueue.slice(1),
            activeAnimations: [...prevState.activeAnimations, nextAnimation]
        }));

        // Start the animation
        await this.playAnimation(nextAnimation);
        
        // Remove from active animations
        this.setState(prevState => ({
            activeAnimations: prevState.activeAnimations.filter(a => a.id !== nextAnimation.id)
        }));

        // Process next animation
        setTimeout(() => this.processAnimationQueue(), 100);
    };

    playAnimation = (animation) => {
        return new Promise(resolve => {
            switch (animation.type) {
                case 'cardPlay':
                    this.playCardPlayAnimation(animation, resolve);
                    break;
                case 'cardEffect':
                    this.playCardEffectAnimation(animation, resolve);
                    break;
                default:
                    resolve();
            }
        });
    };

    playCardPlayAnimation = (animation, onComplete) => {
        const { card, dropZone } = animation;
        
        // Create floating card animation
        this.createFloatingMessage({
            message: `${card.card_name} played to ${dropZone.name}`,
            type: 'cardPlay',
            duration: 1000,
            onComplete
        });
    };

    playCardEffectAnimation = (animation, onComplete) => {
        const { card, effect, value } = animation;
        
        const effectMessages = {
            'money': `+$${value?.toLocaleString() || '0'}`,
            'loan': `Loan: $${value?.toLocaleString() || '0'}`,
            'time': `+${value} days`,
            'draw': `Draw ${value} cards`,
            'discard': `Discard ${value} cards`,
            'move': 'Move forward',
            'skip': 'Skip turn'
        };

        const message = effectMessages[effect] || `${card.card_name} effect`;
        
        this.createFloatingMessage({
            message,
            type: 'cardEffect',
            effectType: effect,
            duration: 1500,
            onComplete
        });
    };

    createFloatingMessage = (options) => {
        const { message, type, effectType, duration, onComplete } = options;
        
        const messageElement = {
            id: ++this.animationId,
            message,
            type,
            effectType,
            startTime: Date.now(),
            duration
        };

        this.setState(prevState => ({
            activeAnimations: [...prevState.activeAnimations, messageElement]
        }));

        setTimeout(() => {
            this.setState(prevState => ({
                activeAnimations: prevState.activeAnimations.filter(a => a.id !== messageElement.id)
            }));
            if (onComplete) onComplete();
        }, duration);
    };

    getEffectIcon = (effectType) => {
        const icons = {
            'money': '💰',
            'loan': '🏦',
            'time': '⏰',
            'draw': '🃏',
            'discard': '🗑️',
            'move': '🚀',
            'skip': '⏸️',
            'cardPlay': '🎯'
        };
        return icons[effectType] || '✨';
    };

    getEffectColor = (effectType) => {
        const colors = {
            'money': 'var(--secondary-green)',
            'loan': 'var(--primary-blue)',
            'time': 'var(--accent-orange)',
            'draw': 'var(--primary-blue)',
            'discard': 'var(--error-red)',
            'move': 'var(--secondary-green)',
            'skip': 'var(--warning-amber)',
            'cardPlay': 'var(--primary-blue)'
        };
        return colors[effectType] || 'var(--neutral-600)';
    };

    renderFloatingMessage = (animation) => {
        const { id, message, type, effectType, startTime, duration } = animation;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const icon = this.getEffectIcon(effectType || type);
        const color = this.getEffectColor(effectType || type);
        
        // Animation phases: rise (0-0.2), hold (0.2-0.8), fade (0.8-1.0)
        let opacity = 1;
        let translateY = 0;
        let scale = 1;
        
        if (progress < 0.2) {
            // Rising phase
            const phase = progress / 0.2;
            translateY = -50 * phase;
            scale = 0.8 + 0.2 * phase;
        } else if (progress < 0.8) {
            // Holding phase
            translateY = -50;
            scale = 1;
        } else {
            // Fading phase
            const phase = (progress - 0.8) / 0.2;
            translateY = -50 - 30 * phase;
            opacity = 1 - phase;
            scale = 1 + 0.1 * phase;
        }

        const style = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
            opacity,
            zIndex: 10000 + id,
            pointerEvents: 'none',
            color,
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${color}`,
            boxShadow: 'var(--shadow-xl)',
            animation: 'none' // Prevent CSS animations from interfering
        };

        return React.createElement('div', {
            key: id,
            className: 'floating-message',
            style
        }, [
            React.createElement('span', {
                key: 'icon',
                className: 'message-icon',
                style: { marginRight: 'var(--space-2)' }
            }, icon),
            React.createElement('span', {
                key: 'text',
                className: 'message-text'
            }, message)
        ]);
    };

    // Trigger animations manually for testing
    triggerTestAnimation = (type) => {
        switch (type) {
            case 'money':
                this.queueAnimation({
                    type: 'cardEffect',
                    card: { card_name: 'Business Loan' },
                    effect: 'money',
                    value: 50000,
                    duration: 1500
                });
                break;
            case 'loan':
                this.queueAnimation({
                    type: 'cardEffect',
                    card: { card_name: 'Bank Financing' },
                    effect: 'loan',
                    value: 1000000,
                    duration: 1500
                });
                break;
            case 'draw':
                this.queueAnimation({
                    type: 'cardEffect',
                    card: { card_name: 'Project Expansion' },
                    effect: 'draw',
                    value: 3,
                    duration: 1500
                });
                break;
            case 'cardPlay':
                this.queueAnimation({
                    type: 'cardPlay',
                    card: { card_name: 'Emergency Repair' },
                    dropZone: { name: 'Play Area' },
                    duration: 1000
                });
                break;
        }
    };

    renderTestControls = () => {
        if (!this.props.showTestControls) {
            return null;
        }

        return React.createElement('div', {
            className: 'animation-test-controls card card--compact',
            style: {
                position: 'fixed',
                bottom: 'var(--space-4)',
                right: 'var(--space-4)',
                zIndex: 1000
            }
        }, [
            React.createElement('h4', {
                key: 'title',
                className: 'heading-4'
            }, 'Test Animations'),
            
            React.createElement('div', {
                key: 'buttons',
                className: 'test-buttons',
                style: {
                    display: 'flex',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap'
                }
            }, [
                React.createElement('button', {
                    key: 'money',
                    className: 'btn btn--sm btn--success',
                    onClick: () => this.triggerTestAnimation('money')
                }, '💰 Money'),
                React.createElement('button', {
                    key: 'loan',
                    className: 'btn btn--sm btn--primary',
                    onClick: () => this.triggerTestAnimation('loan')
                }, '🏦 Loan'),
                React.createElement('button', {
                    key: 'draw',
                    className: 'btn btn--sm btn--secondary',
                    onClick: () => this.triggerTestAnimation('draw')
                }, '🃏 Draw'),
                React.createElement('button', {
                    key: 'play',
                    className: 'btn btn--sm btn--warning',
                    onClick: () => this.triggerTestAnimation('cardPlay')
                }, '🎯 Play')
            ])
        ]);
    };

    render() {
        const { activeAnimations } = this.state;

        return React.createElement('div', {
            ref: this.animationContainer,
            className: 'card-effect-animations'
        }, [
            // Floating messages
            ...activeAnimations.map(animation => this.renderFloatingMessage(animation)),
            
            // Test controls
            this.renderTestControls()
        ]);
    }
}

// Register component globally
window.CardEffectAnimations = CardEffectAnimations;