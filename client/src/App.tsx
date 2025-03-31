import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import Game from "./components/Game";
import Lobby from "./components/Lobby";
import MobileControls from "./components/MobileControls";
import useGameStore from "./lib/stores/useGameStore";
import "@fontsource/inter";
import "./index.css";

function App() {
  const { 
    gameState, 
    initializeSocket, 
    socket, 
    localPlayer, 
    updatePlayerDirection 
  } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);

  // Global keyboard event handlers
  useEffect(() => {
    if (!socket || !localPlayer || gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('App.tsx - Global key down:', e.key);
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        console.log('App.tsx - Setting direction to LEFT');
        updatePlayerDirection('left');
        // Direct socket emission as backup
        socket.emit('changeDirection', { direction: 'left' });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        console.log('App.tsx - Setting direction to RIGHT');
        updatePlayerDirection('right');
        // Direct socket emission as backup
        socket.emit('changeDirection', { direction: 'right' });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      console.log('App.tsx - Global key up:', e.key);
      
      if (
        (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') ||
        (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D')
      ) {
        console.log('App.tsx - Setting direction to NONE');
        updatePlayerDirection('none');
        // Direct socket emission as backup
        socket.emit('changeDirection', { direction: 'none' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socket, localPlayer, gameState, updatePlayerDirection]);

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
