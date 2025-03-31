import { useState, useEffect } from 'react';
import useGameStore from '../lib/stores/useGameStore';
import { useIsMobile } from "../hooks/use-is-mobile";

// Typings for global controls manager (simplified)
interface IControlsManager {
  handleTouchDirection(direction: 'left' | 'right' | 'none'): void;
}

const MobileControls = () => {
  const { gameState } = useGameStore();
  const isMobile = useIsMobile();
  const [activeDirection, setActiveDirection] = useState<'left' | 'right' | 'none'>('none');

  // Handle mobile touch events using the global controls manager
  const handleDirectionChange = (direction: 'left' | 'right' | 'none') => {
    // Update UI state
    setActiveDirection(direction);
    
    // Forward to the global controls manager
    if (window.controlsManager) {
      console.log(`MobileControls: Forwarding touch direction: ${direction}`);
      window.controlsManager.handleTouchDirection(direction);
    } else {
      console.error('MobileControls: Global controls manager not available');
    }
  };
  
  // Handle full-screen touch events
  useEffect(() => {
    if (!isMobile || gameState !== 'playing') return;
    
    // Touch handler for the entire screen
    const handleTouchStart = (event: TouchEvent) => {
      const touchX = event.touches[0].clientX;
      const windowWidth = window.innerWidth;
      const middleScreen = windowWidth / 2;
      
      console.log(`MobileControls: Screen touch at x=${touchX}, middle=${middleScreen}`);
      
      if (touchX < middleScreen) {
        // Left side of screen - turn left
        handleDirectionChange('left');
      } else {
        // Right side of screen - turn right
        handleDirectionChange('right');
      }
      
      // Prevent default to avoid scrolling
      event.preventDefault();
    };
    
    const handleTouchEnd = () => {
      console.log('MobileControls: Screen touch ended');
      handleDirectionChange('none');
    };
    
    // Add touch handlers with passive:false to allow preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      console.log('MobileControls: Touch handlers removed');
    };
  }, [gameState, isMobile]);
  
  // If not mobile or game is not playing, don't show the controls
  if (!isMobile || gameState !== 'playing') {
    return null;
  }

  return (
    <div className="mobile-controls">
      <button 
        className={`control-button control-button-left ${activeDirection === 'left' ? 'bg-blue-600' : 'bg-gray-800'}`}
        onTouchStart={(e) => {
          e.stopPropagation(); // Stop event bubbling to prevent document handler
          handleDirectionChange('left');
        }}
        onTouchEnd={(e) => {
          e.stopPropagation(); // Stop event bubbling to prevent document handler
          handleDirectionChange('none');
        }}
        onMouseDown={() => handleDirectionChange('left')}
        onMouseUp={() => handleDirectionChange('none')}
        onMouseLeave={() => activeDirection === 'left' && handleDirectionChange('none')}
      >
        ←
      </button>
      
      <button 
        className={`control-button control-button-right ${activeDirection === 'right' ? 'bg-blue-600' : 'bg-gray-800'}`}
        onTouchStart={(e) => {
          e.stopPropagation(); // Stop event bubbling to prevent document handler
          handleDirectionChange('right');
        }}
        onTouchEnd={(e) => {
          e.stopPropagation(); // Stop event bubbling to prevent document handler
          handleDirectionChange('none');
        }}
        onMouseDown={() => handleDirectionChange('right')}
        onMouseUp={() => handleDirectionChange('none')}
        onMouseLeave={() => activeDirection === 'right' && handleDirectionChange('none')}
      >
        →
      </button>
    </div>
  );
};

export default MobileControls;