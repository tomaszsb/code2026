/**
 * PathVisualizer - Dynamic SVG arrow drawing for game board path visualization
 * Draws lines and arrows between spaces to show available moves and path connections
 */

function PathVisualizer({ gameState, currentPlayer, availableMoves, boardState, explorationPath }) {
    const { useState, useEffect, useRef } = React;
    const svgRef = useRef();
    const [arrowPaths, setArrowPaths] = useState([]);
    
    // Update arrow paths when game state or exploration changes
    useEffect(() => {
        // Small delay to ensure DOM is rendered
        const timer = setTimeout(() => {
            const paths = calculateArrowPaths();
            setArrowPaths(paths);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [currentPlayer?.position, availableMoves, boardState, explorationPath]);
    
    const calculateArrowPaths = () => {
        // Determine what to draw based on exploration state
        let sourceSpaceName, destinationSpaces;
        
        if (explorationPath) {
            // Interactive exploration mode: draw from exploration source to its destinations
            sourceSpaceName = explorationPath.source;
            destinationSpaces = explorationPath.destinations;
        } else if (currentPlayer && availableMoves.length > 0) {
            // Default focus view: draw from current player to available moves
            sourceSpaceName = currentPlayer.position;
            destinationSpaces = availableMoves;
        } else {
            return []; // No paths to draw
        }
        
        // Find source space element
        const sourceElement = document.querySelector(`[data-space="${sourceSpaceName}"]`);
        if (!sourceElement) return [];
        
        const paths = [];
        const sourceRect = sourceElement.getBoundingClientRect();
        const boardContainer = document.querySelector('.visual-board') || document.querySelector('.snake-grid');
        
        if (!boardContainer) return [];
        
        const boardRect = boardContainer.getBoundingClientRect();
        
        // Calculate source space center relative to board
        const sourceCenter = {
            x: sourceRect.left + sourceRect.width / 2 - boardRect.left,
            y: sourceRect.top + sourceRect.height / 2 - boardRect.top
        };
        
        destinationSpaces.forEach(destSpaceName => {
            // Find destination space element
            const destElement = document.querySelector(`[data-space="${destSpaceName}"]`);
            
            if (destElement) {
                const destRect = destElement.getBoundingClientRect();
                const destCenter = {
                    x: destRect.left + destRect.width / 2 - boardRect.left,
                    y: destRect.top + destRect.height / 2 - boardRect.top
                };
                
                paths.push({
                    from: sourceCenter,
                    to: destCenter,
                    id: `arrow-${sourceSpaceName}-${destSpaceName}`
                });
            }
        });
        
        return paths;
    };
    
    // Helper function to calculate arrow path with offset to avoid overlap
    const createArrowPath = (from, to, id) => {
        // Calculate offset from center to edge of space
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 10) return null; // Too close, skip
        
        // Normalize and apply offset
        const offsetDistance = 50; // Distance from space center to arrow start/end
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        const startX = from.x + normalizedDx * offsetDistance;
        const startY = from.y + normalizedDy * offsetDistance;
        const endX = to.x - normalizedDx * offsetDistance;
        const endY = to.y - normalizedDy * offsetDistance;
        
        return {
            id,
            startX,
            startY,
            endX,
            endY,
            midX: (startX + endX) / 2,
            midY: (startY + endY) / 2
        };
    };
    
    if (!arrowPaths.length) {
        return null; // No arrows to draw
    }
    
    return React.createElement('svg', {
        ref: svgRef,
        className: 'path-visualizer-overlay',
        style: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10
        }
    }, [
        // Define arrowhead marker
        React.createElement('defs', { key: 'defs' },
            React.createElement('marker', {
                id: 'arrowhead',
                markerWidth: 10,
                markerHeight: 7,
                refX: 9,
                refY: 3.5,
                orient: 'auto'
            },
                React.createElement('polygon', {
                    points: '0 0, 10 3.5, 0 7',
                    fill: '#4285f4',
                    stroke: '#4285f4',
                    strokeWidth: 1
                })
            )
        ),
        
        // Draw arrows
        ...arrowPaths.map(path => {
            const arrow = createArrowPath(path.from, path.to, path.id);
            if (!arrow) return null;
            
            return React.createElement('g', { key: arrow.id }, [
                // Main arrow line
                React.createElement('line', {
                    key: `${arrow.id}-line`,
                    x1: arrow.startX,
                    y1: arrow.startY,
                    x2: arrow.endX,
                    y2: arrow.endY,
                    stroke: '#4285f4',
                    strokeWidth: 3,
                    markerEnd: 'url(#arrowhead)',
                    opacity: 0.8
                }),
                
                // Subtle glow effect
                React.createElement('line', {
                    key: `${arrow.id}-glow`,
                    x1: arrow.startX,
                    y1: arrow.startY,
                    x2: arrow.endX,
                    y2: arrow.endY,
                    stroke: '#4285f4',
                    strokeWidth: 6,
                    opacity: 0.2
                })
            ]);
        }).filter(Boolean)
    ]);
}

// Export component
window.PathVisualizer = PathVisualizer;