import { useState } from 'react';
import useGameStore from '../lib/stores/useGameStore';
import { useIsMobile } from "../hooks/use-is-mobile";
import { Button } from './ui/button';

const Controls = () => {
  const { gameState } = useGameStore();
  const isMobile = useIsMobile();
  const [activeDirection, setActiveDirection] = useState<'left' | 'right' | 'none'>('none');

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
      
      {/* Mobile control display only - actual controls are in MobileControls component */}
      {isMobile && gameState === 'playing' && (
        <div className="mt-4">
          <div className="flex justify-center gap-8">
            <Button
              className={`w-24 h-16 text-lg ${activeDirection === 'left' ? 'bg-blue-600' : 'bg-blue-500'}`}
              disabled
            >
              ← Left
            </Button>
            <Button
              className={`w-24 h-16 text-lg ${activeDirection === 'right' ? 'bg-blue-600' : 'bg-blue-500'}`}
              disabled
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
