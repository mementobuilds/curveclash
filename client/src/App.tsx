import { useEffect, useState, useCallback } from "react";
import { Toaster } from "sonner";
import Game from "./components/Game";
import Lobby from "./components/Lobby";
import MobileControls from "./components/MobileControls";
import AuthCallback from "./components/AuthCallback";
import BedrockProvider from "./components/BedrockProvider";
import useGameStore from "./lib/stores/useGameStore";
import "@fontsource/inter";
import "./index.css";

class GlobalControlsManager {
  private socketId: string | null = null;
  private socket: any = null;
  private playing: boolean = false;
  private currentDirection: 'left' | 'right' | 'none' = 'none';
  private keyStates: { [key: string]: boolean } = {};
  
  constructor() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    console.log('GlobalControlsManager: Initialized and attached event listeners');
  }
  
  setSocket(socket: any) {
    this.socket = socket;
    this.socketId = socket?.id || null;
    console.log(`GlobalControlsManager: Socket set, ID: ${this.socketId}`);
  }
  
  setPlaying(playing: boolean) {
    this.playing = playing;
    console.log(`GlobalControlsManager: Playing state set to ${playing}`);
  }
  
  isPlaying(): boolean {
    return this.playing;
  }
  
  sendDirection(direction: 'left' | 'right' | 'none') {
    if (!this.socket) {
      console.error('GlobalControlsManager: Cannot send direction, socket not initialized');
      return;
    }
    
    if (this.currentDirection === direction) {
      return;
    }
    
    this.currentDirection = direction;
    console.log(`GlobalControlsManager: Sending direction: ${direction}`);
    
    try {
      console.log(`Socket ID before sending: ${this.socket.id}`);
      this.socket.emit('changeDirection', { direction });
      
      console.log(`Direction ${direction} sent successfully to socket ${this.socket.id}`);
      
      const updateFn = (window as any).updateStoreDirection;
      if (typeof updateFn === 'function') {
        updateFn(direction);
      }
    } catch (error) {
      console.error('GlobalControlsManager: Error sending direction:', error);
    }
  }
  
  private handleKeyDown = (e: KeyboardEvent) => {
    this.keyStates[e.key.toLowerCase()] = true;
    
    if (!this.socket || !this.playing) {
      console.log(`GlobalControlsManager: Key ${e.key} ignored - socket: ${!!this.socket}, playing: ${this.playing}`);
      return;
    }
    
    const key = e.key.toLowerCase();
    console.log(`GlobalControlsManager: Key down: ${key}`);
    
    if (key === 'arrowleft' || key === 'a') {
      console.log('GlobalControlsManager: LEFT key pressed');
      this.sendDirection('left');
    } else if (key === 'arrowright' || key === 'd') {
      console.log('GlobalControlsManager: RIGHT key pressed');
      this.sendDirection('right');
    }
  }
  
  private handleKeyUp = (e: KeyboardEvent) => {
    this.keyStates[e.key.toLowerCase()] = false;
    
    if (!this.socket || !this.playing) {
      console.log(`GlobalControlsManager: Key Up ${e.key} ignored - socket: ${!!this.socket}, playing: ${this.playing}`);
      return;
    }
    
    const key = e.key.toLowerCase();
    console.log(`GlobalControlsManager: Key up: ${key}`);
    
    if ((key === 'arrowleft' || key === 'a') || (key === 'arrowright' || key === 'd')) {
      const leftDown = this.keyStates['arrowleft'] || this.keyStates['a'];
      const rightDown = this.keyStates['arrowright'] || this.keyStates['d'];
      
      if (!leftDown && !rightDown) {
        console.log('GlobalControlsManager: All direction keys released, sending NONE');
        this.sendDirection('none');
      } else if (leftDown) {
        this.sendDirection('left');
      } else if (rightDown) {
        this.sendDirection('right');
      }
    }
  }
  
  handleTouchDirection(direction: 'left' | 'right' | 'none') {
    if (!this.socket || !this.playing) {
      console.log(`GlobalControlsManager: Ignoring touch direction ${direction} - socket: ${!!this.socket}, playing: ${this.playing}`);
      return;
    }
    
    console.log(`GlobalControlsManager: Processing touch direction: ${direction}`);
    this.sendDirection(direction);
  }
  
  dispose() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    console.log('GlobalControlsManager: Cleaned up event listeners');
  }
}

const controlsManager = new GlobalControlsManager();

type DirectionType = 'left' | 'right' | 'none';

declare global {
  interface Window {
    controlsManager: any;
    updateStoreDirection?: (direction: DirectionType) => void;
  }
}

function AppInner() {
  const { 
    gameState, 
    initializeSocket, 
    socket, 
    localPlayer,
    updatePlayerDirection
  } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (socket) {
      controlsManager.setSocket(socket);
    }
  }, [socket]);
  
  useEffect(() => {
    if (!gameState) {
      console.log('Skipping controls update - gameState is undefined');
      return;
    }
    
    const isPlaying = gameState === 'playing' || gameState === 'countdown';
    const canControl = isPlaying && !!localPlayer && !!socket;
    
    if (canControl) {
      console.log(`Controls ENABLED for game state: ${gameState}`);
      controlsManager.setPlaying(true);
    } else {
      console.log(`Controls DISABLED for game state: ${gameState}`);
      controlsManager.setPlaying(false);
    }
  }, [gameState, localPlayer, socket]);
  
  useEffect(() => {
    window.controlsManager = controlsManager;
    
    window.updateStoreDirection = (direction: 'left' | 'right' | 'none') => {
      console.log(`Updating store direction: ${direction}`);
      updatePlayerDirection(direction);
    };
    
    return () => {
      window.updateStoreDirection = undefined;
    };
  }, [updatePlayerDirection]);

  useEffect(() => {
    const initSocket = async () => {
      try {
        await initializeSocket();
      } catch (error) {
        console.error("Failed to initialize socket:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSocket();

    return () => {};
  }, [initializeSocket]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-2xl">Connecting to server...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {gameState === "lobby" ? <Lobby /> : <Game />}
      <MobileControls />
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const isAuthCallback = params.has("token") && params.has("refreshToken");

  return (
    <BedrockProvider>
      {isAuthCallback ? <AuthCallback /> : <AppInner />}
    </BedrockProvider>
  );
}

export default App;
