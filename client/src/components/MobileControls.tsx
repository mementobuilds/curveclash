import { useState } from 'react';
import useGameStore from '../lib/stores/useGameStore';
import { useIsMobile } from "../hooks/use-is-mobile";

const MobileControls = () => {
  const { localPlayer, socket, gameState, updatePlayerDirection } = useGameStore();
  const isMobile = useIsMobile();
  const [activeDirection, setActiveDirection] = useState<'left' | 'right' | 'none'>('none');

  // If not mobile or game is not playing, don't show the controls
  if (!isMobile || gameState !== 'playing') {
    return null;
  }

  // Handle direction changes
  const handleDirectionChange = (direction: 'left' | 'right' | 'none') => {
    if (!socket || !localPlayer) return;
    
    setActiveDirection(direction);
    updatePlayerDirection(direction);
  };

  return (
    <div className="mobile-controls">
      <button 
        className={`control-button control-button-left ${activeDirection === 'left' ? 'opacity-100' : ''}`}
        onTouchStart={() => handleDirectionChange('left')}
        onTouchEnd={() => handleDirectionChange('none')}
        onMouseDown={() => handleDirectionChange('left')}
        onMouseUp={() => handleDirectionChange('none')}
        onMouseLeave={() => activeDirection === 'left' && handleDirectionChange('none')}
      >
        ←
      </button>
      
      <button 
        className={`control-button control-button-right ${activeDirection === 'right' ? 'opacity-100' : ''}`}
        onTouchStart={() => handleDirectionChange('right')}
        onTouchEnd={() => handleDirectionChange('none')}
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