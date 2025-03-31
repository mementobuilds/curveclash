import { useEffect, useState, useCallback } from 'react';
import useGameStore from '../lib/stores/useGameStore';
import { useIsMobile } from "../hooks/use-is-mobile";
import { Button } from './ui/button';

const Controls = () => {
  const { localPlayer, socket, gameState, updatePlayerDirection } = useGameStore();
  const isMobile = useIsMobile();
  const [activeDirection, setActiveDirection] = useState<'left' | 'right' | 'none'>('none');

  // Handle direction changes for both mobile and desktop
  // Use useCallback to memoize the function so it doesn't change on every render
  const handleDirectionChange = useCallback((direction: 'left' | 'right' | 'none') => {
    console.log(`Controls component: Handling direction change to: ${direction}`);
    
    // Update UI state regardless of actual game state to make controls feel responsive
    setActiveDirection(direction);
    
    if (!socket || !localPlayer) {
      console.error('Cannot change direction: socket or localPlayer not available');
      return;
    }
    
    // Allow control in both playing and countdown states
    if (gameState !== 'playing' && gameState !== 'countdown') {
      console.log(`Game not in playing/countdown state (current: ${gameState}), direction change ignored`);
      return;
    }
    
    console.log(`Controls component: Sending direction change: ${direction}`);
    
    // Try both methods to maximize chance of success
    try {
      // 1. Use the store method
      updatePlayerDirection(direction);
      
      // 2. Direct socket emission as backup
      socket.emit('changeDirection', { direction });
      
      console.log(`Controls component: Direction successfully sent: ${direction}`);
    } catch (error) {
      console.error('Failed to update direction:', error);
    }
  }, [socket, localPlayer, gameState, updatePlayerDirection]);

  // Keyboard controls for desktop
  useEffect(() => {
    if (!socket || !localPlayer || gameState !== 'playing' || isMobile) return;
    
    console.log('Controls: Setting up keyboard event listeners');
    
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Controls.tsx: Key down event fired:', e.key);
      
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        console.log('Controls.tsx: Left key detected');
        handleDirectionChange('left');
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        console.log('Controls.tsx: Right key detected');
        handleDirectionChange('right');
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      console.log('Controls.tsx: Key up event fired:', e.key);
      
      if (
        e.key === 'ArrowLeft' || 
        e.key.toLowerCase() === 'a' || 
        e.key === 'ArrowRight' || 
        e.key.toLowerCase() === 'd'
      ) {
        console.log('Controls.tsx: Direction key released');
        handleDirectionChange('none');
      }
    };
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    console.log('Controls: Keyboard event listeners added');
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      console.log('Controls: Keyboard event listeners removed');
    };
  }, [socket, localPlayer, gameState, isMobile, handleDirectionChange]);

  return (
    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Controls</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Keyboard</h3>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span>Turn Left:</span> 
              <span className="font-mono bg-gray-700 px-2 rounded">← or A</span>
            </li>
            <li className="flex justify-between">
              <span>Turn Right:</span> 
              <span className="font-mono bg-gray-700 px-2 rounded">→ or D</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Mobile</h3>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span>Left Side:</span> 
              <span>Turn Left</span>
            </li>
            <li className="flex justify-between">
              <span>Right Side:</span> 
              <span>Turn Right</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Mobile control buttons */}
      {isMobile && gameState === 'playing' && (
        <div className="mt-4">
          <div className="flex justify-center gap-8">
            <Button
              className={`w-24 h-16 text-lg ${activeDirection === 'left' ? 'bg-blue-600' : 'bg-blue-500'}`}
              onTouchStart={() => handleDirectionChange('left')}
              onTouchEnd={() => handleDirectionChange('none')}
              onMouseDown={() => handleDirectionChange('left')}
              onMouseUp={() => handleDirectionChange('none')}
              onMouseLeave={() => activeDirection === 'left' && handleDirectionChange('none')}
            >
              ← Left
            </Button>
            <Button
              className={`w-24 h-16 text-lg ${activeDirection === 'right' ? 'bg-blue-600' : 'bg-blue-500'}`}
              onTouchStart={() => handleDirectionChange('right')}
              onTouchEnd={() => handleDirectionChange('none')}
              onMouseDown={() => handleDirectionChange('right')}
              onMouseUp={() => handleDirectionChange('none')}
              onMouseLeave={() => activeDirection === 'right' && handleDirectionChange('none')}
            >
              Right →
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-400">
        <p>Avoid hitting walls, your own line, and other players' lines!</p>
      </div>
    </div>
  );
};

export default Controls;
