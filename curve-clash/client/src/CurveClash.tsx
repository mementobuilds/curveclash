import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { queryClient } from './lib/queryClient';
import { GameState } from './lib/game/types';
import Game from './components/Game';
import Lobby from './components/Lobby';
import MobileControls from './components/MobileControls';
import { useGameStore } from './lib/stores/useGameStore';
import { useAudio } from './lib/stores/useAudio';
import ScoreBoard from './components/ScoreBoard';
import WaitingRoom from './components/WaitingRoom';

// Declare global window types for controls manager
declare global {
  interface Window {
    controlsManager: any; // Use any to avoid circular reference
    updateStoreDirection?: (direction: DirectionType) => void;
  }
}

type DirectionType = 'left' | 'right' | 'none';

// Global controls manager to handle keyboard and touch inputs
class GlobalControlsManager {
  private socketId: string | null = null;
  private socket: Socket | null = null;
  private playing: boolean = false;
  private currentDirection: DirectionType = 'none';
  private keyStates: { [key: string]: boolean } = {};

  constructor() {
    // Add keyboard event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Make it accessible globally
    window.controlsManager = this;
  }

  setSocket(socket: Socket | null) {
    this.socket = socket;
  }

  setPlaying(playing: boolean) {
    this.playing = playing;
    
    // Reset direction when starting to play
    if (playing) {
      this.currentDirection = 'none';
      if (this.socket) {
        this.socket.emit('changeDirection', { direction: 'none' });
      }
      
      // Also update the store if the function exists
      if (window.updateStoreDirection) {
        window.updateStoreDirection('none');
      }
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  sendDirection(direction: DirectionType) {
    if (!this.playing || !this.socket) return;
    
    // Only send if direction changed
    if (this.currentDirection !== direction) {
      this.currentDirection = direction;
      this.socket.emit('changeDirection', { direction });
      
      // Also update the store if the function exists
      if (window.updateStoreDirection) {
        window.updateStoreDirection(direction);
      }
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.playing) return;
    
    // Update key state
    this.keyStates[e.code] = true;
    
    // Determine direction based on key states
    let direction: DirectionType = 'none';
    
    if (this.keyStates['ArrowLeft'] || this.keyStates['KeyA']) {
      direction = 'left';
    } else if (this.keyStates['ArrowRight'] || this.keyStates['KeyD']) {
      direction = 'right';
    }
    
    this.sendDirection(direction);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (!this.playing) return;
    
    // Update key state
    this.keyStates[e.code] = false;
    
    // Determine direction after key released
    let direction: DirectionType = 'none';
    
    if (this.keyStates['ArrowLeft'] || this.keyStates['KeyA']) {
      direction = 'left';
    } else if (this.keyStates['ArrowRight'] || this.keyStates['KeyD']) {
      direction = 'right';
    }
    
    this.sendDirection(direction);
  };

  handleTouchDirection(direction: DirectionType) {
    this.sendDirection(direction);
  }

  dispose() {
    // Clean up event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}

// Define the component props for integration
interface CurveClashProps {
  serverUrl?: string;
  userId?: string;
  username?: string;
  onGameEnd?: (winner: string) => void;
}

// Main game component
export const CurveClash: React.FC<CurveClashProps> = ({
  serverUrl = '',
  userId = '',
  username = '',
  onGameEnd
}) => {
  const [controlsManager] = useState(() => new GlobalControlsManager());
  const [isMobile, setIsMobile] = useState(false);
  
  // Get game state from store
  const socket = useGameStore(state => state.socket);
  const connected = useGameStore(state => state.connected);
  const setSocket = useGameStore(state => state.setSocket);
  const setConnected = useGameStore(state => state.setConnected);
  const setPlayers = useGameStore(state => state.setPlayers);
  const setGameState = useGameStore(state => state.setGameState);
  const setCountdown = useGameStore(state => state.setCountdown);
  const setRoundWinner = useGameStore(state => state.setRoundWinner);
  const setGameWinner = useGameStore(state => state.setGameWinner);
  const resetGame = useGameStore(state => state.resetGame);
  const gameState = useGameStore(state => state.gameState);
  const gameWinner = useGameStore(state => state.gameWinner);
  
  // Setup socket connection
  useEffect(() => {
    // Connect to game server
    const socketUrl = serverUrl || window.location.origin;
    const socketInstance = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Store socket in game store
    setSocket(socketInstance);
    
    // Setup global controls manager
    controlsManager.setSocket(socketInstance);
    
    // Socket event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });
    
    socketInstance.on('gameState', (data) => {
      setGameState(data.state);
      setPlayers(data.players);
      
      // Update controls manager based on game state
      controlsManager.setPlaying(data.state === GameState.PLAYING);
    });
    
    socketInstance.on('countdown', (data) => {
      setCountdown(data.count);
    });
    
    socketInstance.on('roundOver', (data) => {
      setRoundWinner(data.winner);
    });
    
    socketInstance.on('gameOver', (data) => {
      setGameWinner(data.winner);
      
      // Call onGameEnd callback if provided
      if (onGameEnd && data.winner) {
        onGameEnd(data.winner);
      }
    });
    
    // Function to allow the game store to update direction
    window.updateStoreDirection = (direction: DirectionType) => {
      // This could update a local state if needed
    };
    
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
      controlsManager.dispose();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Handle leaving a game
  const handleLeaveGame = () => {
    resetGame();
    
    // Notify server if needed
    if (socket) {
      socket.emit('leaveGame');
    }
  };
  
  // Handle quick match
  const handleQuickMatch = () => {
    if (!socket) return;
    
    socket.emit('createGame', {
      playerName: username || 'Player',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });
  };
  
  return (
    <div className="curve-clash-container w-full h-full flex flex-col">
      {/* Main game area */}
      <div className="game-area flex-1 relative">
        {/* Show lobby if not in a game */}
        {gameState === GameState.WAITING && (
          <Lobby 
            username={username} 
            onQuickMatch={handleQuickMatch}
          />
        )}
        
        {/* Show game if in a game */}
        {(gameState === GameState.PLAYING || 
          gameState === GameState.STARTING || 
          gameState === GameState.ROUND_OVER ||
          gameState === GameState.GAME_OVER) && (
          <>
            <Game canvasWidth={800} canvasHeight={600} />
            <div className="absolute top-4 right-4">
              <ScoreBoard compact />
            </div>
          </>
        )}
        
        {/* Show waiting room overlay */}
        <WaitingRoom onLeaveGame={handleLeaveGame} />
      </div>
      
      {/* Mobile controls */}
      {isMobile && (
        <MobileControls 
          visible={gameState === GameState.PLAYING} 
        />
      )}
    </div>
  );
};

export default CurveClash;