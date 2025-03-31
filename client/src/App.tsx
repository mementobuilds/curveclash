import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";
import Game from "./components/Game";
import Lobby from "./components/Lobby";
import useGameStore from "./lib/stores/useGameStore";
import "@fontsource/inter";
import "./index.css";

function App() {
  const { gameState, initializeSocket, socket } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

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
      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
