import { useEffect } from "react";
import { toast } from "sonner";
import Canvas from "./Canvas";
import Controls from "./Controls";
import ScoreBoard from "./ScoreBoard";
import WaitingRoom from "./WaitingRoom";
import useGameStore from "../lib/stores/useGameStore";
import { useAudio } from "../lib/stores/useAudio";
import { Button } from "./ui/button";

const Game = () => {
  const { 
    gameState, 
    socket, 
    players, 
    localPlayer, 
    setGameState, 
    resetGame,
    winner,
    roundWinner
  } = useGameStore();
  
  // Sound effects
  const { hitSound, successSound, setHitSound, setSuccessSound, playHit, playSuccess } = useAudio();

  useEffect(() => {
    // Load sounds
    if (!hitSound) {
      const sound = new Audio("/sounds/hit.mp3");
      setHitSound(sound);
    }
    
    if (!successSound) {
      const sound = new Audio("/sounds/success.mp3");
      setSuccessSound(sound);
    }
    
    // Handle round end event
    const handleRoundEnd = (data: { winner: string }) => {
      if (data.winner) {
        toast.info(`Round won by ${players.find(p => p.id === data.winner)?.name || 'Unknown'}`);
        playHit();
      }
    };
    
    // Handle game end event
    const handleGameEnd = (data: { winner: string }) => {
      if (data.winner) {
        toast.success(`Game won by ${players.find(p => p.id === data.winner)?.name || 'Unknown'}`);
        playSuccess();
      }
    };
    
    // Set up socket event listeners
    if (socket) {
      socket.on('roundEnd', handleRoundEnd);
      socket.on('gameEnd', handleGameEnd);
    }
    
    return () => {
      // Clean up event listeners
      if (socket) {
        socket.off('roundEnd', handleRoundEnd);
        socket.off('gameEnd', handleGameEnd);
      }
    };
  }, [socket, hitSound, successSound, setHitSound, setSuccessSound, playHit, playSuccess, players]);
  
  const handleBackToLobby = () => {
    resetGame();
    setGameState("lobby");
    if (socket) {
      socket.emit('leaveGame');
    }
  };
  
  return (
    <div className="flex flex-col h-screen w-full p-2 md:p-4">
      <div className="flex justify-between items-center mb-2 md:mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-white">Achtung die Kurve</h1>
        <Button 
          onClick={handleBackToLobby}
          variant="outline"
          className="bg-red-500 text-white hover:bg-red-700 text-sm md:text-base"
        >
          Back to Lobby
        </Button>
      </div>
      
      {/* Responsive layout - column on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row flex-1">
        <div className="flex-1 relative mb-2 md:mb-0">
          <Canvas />
          
          {gameState === "waiting" && <WaitingRoom />}
          
          {gameState === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-center">
                <div className="text-3xl md:text-5xl font-bold text-white">Get ready!</div>
              </div>
            </div>
          )}
          
          {(gameState === "roundEnd" || gameState === "gameEnd") && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-center p-4 md:p-8 bg-gray-800 rounded-lg max-w-full md:max-w-md mx-2">
                {gameState === "roundEnd" && roundWinner && (
                  <>
                    <div className="text-xl md:text-2xl mb-2">Round Over!</div>
                    <div className="text-2xl md:text-3xl font-bold mb-4">
                      {players.find(p => p.id === roundWinner)?.name || 'Unknown'} wins the round!
                    </div>
                    <div className="text-base md:text-lg">Next round starting soon...</div>
                  </>
                )}
                
                {gameState === "gameEnd" && winner && (
                  <>
                    <div className="text-xl md:text-2xl mb-2">Game Over!</div>
                    <div className="text-2xl md:text-4xl font-bold mb-4" style={{
                      color: players.find(p => p.id === winner)?.color || '#FFFFFF'
                    }}>
                      {players.find(p => p.id === winner)?.name || 'Unknown'} wins the game!
                    </div>
                    <Button 
                      onClick={handleBackToLobby}
                      className="mt-4 bg-blue-500 hover:bg-blue-700"
                    >
                      Back to Lobby
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar - full width on mobile, fixed width on desktop */}
        <div className="w-full md:w-64 md:ml-4">
          <ScoreBoard />
          <Controls />
        </div>
      </div>
    </div>
  );
};

export default Game;
