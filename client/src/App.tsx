import { useEffect, useState, useCallback } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import Game from "./components/Game";
import Lobby from "./components/Lobby";
import MobileControls from "./components/MobileControls";
import useGameStore from "./lib/stores/useGameStore";
import "@fontsource/inter";
import "./index.css";

// Class for managing global controls with direct DOM access for optimal performance
class GlobalControlsManager {
  private socketId: string | null = null;
  private socket: any = null;
  private playing: boolean = false;
  private currentDirection: 'left' | 'right' | 'none' = 'none';
  private keyStates: { [key: string]: boolean } = {};
  
  constructor() {
    // Attach event listeners directly to document
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    console.log('GlobalControlsManager: Initialized and attached event listeners');
  }
  
  // Public setter for socket
  setSocket(socket: any) {
    this.socket = socket;
    this.socketId = socket?.id || null;
    console.log(`GlobalControlsManager: Socket set, ID: ${this.socketId}`);
  }
  
  // Public setter for playing state
  setPlaying(playing: boolean) {
    this.playing = playing;
    console.log(`GlobalControlsManager: Playing state set to ${playing}`);
  }
  
  // Public method to send a direction
  sendDirection(direction: 'left' | 'right' | 'none') {
    if (!this.socket) {
      console.error('GlobalControlsManager: Cannot send direction, socket not initialized');
      return;
    }
    
    if (this.currentDirection === direction) {
      // Avoid duplicate emissions
      return;
    }
    
    this.currentDirection = direction;
    console.log(`GlobalControlsManager: Sending direction: ${direction}`);
    
    try {
      // Emit the changeDirection event
      this.socket.emit('changeDirection', { direction });
    } catch (error) {
      console.error('GlobalControlsManager: Error sending direction:', error);
    }
  }
  
  // Handle key down events
  private handleKeyDown = (e: KeyboardEvent) => {
    // Update key state
    this.keyStates[e.key.toLowerCase()] = true;
    
    // Check if we can process input
    if (!this.socket || !this.playing) return;
    
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
  
  // Handle key up events
  private handleKeyUp = (e: KeyboardEvent) => {
    // Update key state
    this.keyStates[e.key.toLowerCase()] = false;
    
    // Check if we can process input
    if (!this.socket || !this.playing) return;
    
    const key = e.key.toLowerCase();
    console.log(`GlobalControlsManager: Key up: ${key}`);
    
    // Only switch to 'none' if both direction keys are up
    if ((key === 'arrowleft' || key === 'a') || (key === 'arrowright' || key === 'd')) {
      // Check if any direction key is still down
      const leftDown = this.keyStates['arrowleft'] || this.keyStates['a'];
      const rightDown = this.keyStates['arrowright'] || this.keyStates['d'];
      
      if (!leftDown && !rightDown) {
        console.log('GlobalControlsManager: All direction keys released, sending NONE');
        this.sendDirection('none');
      } else if (leftDown) {
        // Left still pressed
        this.sendDirection('left');
      } else if (rightDown) {
        // Right still pressed
        this.sendDirection('right');
      }
    }
  }
  
  // Public method for when touch events come in from MobileControls
  handleTouchDirection(direction: 'left' | 'right' | 'none') {
    if (!this.socket || !this.playing) {
      console.log(`GlobalControlsManager: Ignoring touch direction (socket or playing not ready)`);
      return;
    }
    
    console.log(`GlobalControlsManager: Touch direction: ${direction}`);
    this.sendDirection(direction);
  }
  
  // Clean up
  dispose() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    console.log('GlobalControlsManager: Cleaned up event listeners');
  }
}

// Singleton instance
const controlsManager = new GlobalControlsManager();

function App() {
  const { 
    gameState, 
    initializeSocket, 
    socket, 
    localPlayer
  } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);

  // Direct socket handler
  useEffect(() => {
    if (socket) {
      controlsManager.setSocket(socket);
    }
  }, [socket]);
  
  // Update playing state
  useEffect(() => {
    const isPlaying = gameState === 'playing' || gameState === 'countdown';
    controlsManager.setPlaying(isPlaying && !!localPlayer && !!socket);
  }, [gameState, localPlayer, socket]);
  
  // Expose the controls manager for other components
  // @ts-ignore - add to window for debugging and for mobile controls to access
  window.controlsManager = controlsManager;

  useEffect(() => {
    // Initialize the socket connection
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

    // We don't need to cleanup the socket here
    // The socket will be managed by the store
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
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-black text-white">
        {gameState === "lobby" ? <Lobby /> : <Game />}
        <MobileControls />
      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
