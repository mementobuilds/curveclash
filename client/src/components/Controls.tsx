import { useEffect } from 'react';
import useGameStore from '../lib/stores/useGameStore';

const Controls = () => {
  const { localPlayer, socket, gameState } = useGameStore();

  // Define touch controls for mobile devices
  useEffect(() => {
    if (!socket || !localPlayer || gameState !== 'playing') return;

    // Touch controls for mobile devices
    const handleTouchStart = (event: TouchEvent) => {
      const touchX = event.touches[0].clientX;
      const windowWidth = window.innerWidth;
      const middleScreen = windowWidth / 2;

      if (touchX < middleScreen) {
        // Left side of screen - turn left
        socket.emit('changeDirection', { direction: 'left' });
      } else {
        // Right side of screen - turn right
        socket.emit('changeDirection', { direction: 'right' });
      }
    };

    const handleTouchEnd = () => {
      socket.emit('changeDirection', { direction: 'none' });
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [localPlayer, socket, gameState]);

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
      
      <div className="mt-8 text-sm text-gray-400">
        <p>Avoid hitting walls, your own line, and other players' lines!</p>
      </div>
    </div>
  );
};

export default Controls;
