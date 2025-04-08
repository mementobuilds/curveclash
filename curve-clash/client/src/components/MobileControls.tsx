import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface MobileControlsProps {
  visible: boolean;
}

// Interface for the global controls manager
interface IControlsManager {
  handleTouchDirection(direction: 'left' | 'right' | 'none'): void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ visible }) => {
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  
  // Safely access the controls manager from the window object
  const controlsManager = typeof window !== 'undefined' 
    ? (window as any).controlsManager as IControlsManager | undefined
    : undefined;
  
  // Handler for left button touch events
  const handleLeftTouchStart = () => {
    setLeftPressed(true);
    controlsManager?.handleTouchDirection('left');
  };
  
  // Handler for right button touch events
  const handleRightTouchStart = () => {
    setRightPressed(true);
    controlsManager?.handleTouchDirection('right');
  };
  
  // Handler for touch end
  const handleTouchEnd = () => {
    setLeftPressed(false);
    setRightPressed(false);
    controlsManager?.handleTouchDirection('none');
  };
  
  // Monitor for any touches that might end outside the buttons
  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      if (leftPressed || rightPressed) {
        setLeftPressed(false);
        setRightPressed(false);
        controlsManager?.handleTouchDirection('none');
      }
    };
    
    document.addEventListener('touchend', handleGlobalTouchEnd);
    
    return () => {
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [leftPressed, rightPressed, controlsManager]);
  
  if (!visible) return null;
  
  return (
    <div className="mobile-controls fixed bottom-0 left-0 right-0 p-4 pb-8 flex justify-between z-50">
      <button
        className={cn(
          "control-button left-control w-24 h-24 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 active:bg-black/70",
          leftPressed && "bg-black/70 border-white/60"
        )}
        onTouchStart={handleLeftTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Turn Left"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-12 h-12 text-white/80"
        >
          <path d="m12 19-7-7 7-7"/>
          <path d="M19 12H5"/>
        </svg>
      </button>
      
      <button
        className={cn(
          "control-button right-control w-24 h-24 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 active:bg-black/70",
          rightPressed && "bg-black/70 border-white/60"
        )}
        onTouchStart={handleRightTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Turn Right"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-12 h-12 text-white/80"
        >
          <path d="m12 5 7 7-7 7"/>
          <path d="M5 12h14"/>
        </svg>
      </button>
    </div>
  );
};

export default MobileControls;