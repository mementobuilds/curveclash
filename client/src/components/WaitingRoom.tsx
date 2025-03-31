import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Share2 } from "lucide-react";
import useGameStore from "../lib/stores/useGameStore";

const WaitingRoom = () => {
  const { 
    players, 
    gameId, 
    socket, 
    startGame,
    resetGame,
    setGameState 
  } = useGameStore();
  
  const [shareUrl, setShareUrl] = useState("");
  
  useEffect(() => {
    if (gameId) {
      const url = `${window.location.origin}?game=${gameId}`;
      setShareUrl(url);
    }
  }, [gameId]);
  
  const handleStartGame = () => {
    if (players.length < 2) {
      toast.error("Need at least 2 players to start");
      return;
    }
    
    startGame();
  };
  
  const handleCopyGameLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => toast.success("Game link copied to clipboard"))
      .catch(() => toast.error("Failed to copy game link"));
  };
  
  const handleBackToLobby = () => {
    resetGame();
    setGameState("lobby");
    if (socket) {
      socket.emit('leaveGame');
    }
  };
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-4">Waiting for Players</h2>
        
        {gameId && (
          <div className="mb-6">
            <p className="text-center text-gray-400 mb-2">Share this game ID:</p>
            <div className="flex items-center mb-2">
              <div className="flex-1 p-2 bg-gray-700 rounded border border-gray-600 font-mono text-green-400 text-center overflow-x-auto">
                {gameId}
              </div>
              <Button 
                variant="outline" 
                className="ml-2 bg-transparent border-gray-600 hover:bg-gray-700"
                onClick={handleCopyGameLink}
              >
                <Share2 size={16} />
              </Button>
            </div>
            <p className="text-xs text-center text-gray-500">
              Or send them this link: <span className="text-blue-400">{shareUrl}</span>
            </p>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Players:</h3>
          <div className="bg-gray-900 rounded p-2 max-h-40 overflow-y-auto">
            {players.map((player) => (
              <div key={player.id} className="flex items-center mb-1 last:mb-0">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: player.color }}
                />
                <span>{player.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={handleBackToLobby}
            variant="outline"
            className="flex-1 bg-red-500 text-white hover:bg-red-700 border-transparent"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Start Game {players.length < 2 ? `(Need ${2 - players.length} more)` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;