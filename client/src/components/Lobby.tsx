import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import useGameStore from "../lib/stores/useGameStore";
import { PLAYER_COLORS } from "../lib/game/constants";

const Lobby = () => {
  const { 
    socket, 
    players, 
    setGameState, 
    setLocalPlayer,
    joinGame,
    createGame
  } = useGameStore();
  
  const [playerName, setPlayerName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0]);
  const [gameId, setGameId] = useState("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [availableColors, setAvailableColors] = useState<string[]>(PLAYER_COLORS);

  // Update available colors based on already selected colors
  useEffect(() => {
    if (players.length > 0) {
      const usedColors = players.map(p => p.color);
      setAvailableColors(PLAYER_COLORS.filter(color => !usedColors.includes(color)));
    } else {
      setAvailableColors(PLAYER_COLORS);
    }
  }, [players]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;
    
    const handleGameJoined = (data: { gameId: string, playerId: string }) => {
      toast.success(`Joined game ${data.gameId}`);
      setGameState("waiting");
    };
    
    const handleGameCreated = (data: { gameId: string, playerId: string }) => {
      toast.success(`Created game ${data.gameId}`);
      setGameState("waiting");
    };
    
    const handleError = (message: string) => {
      toast.error(message);
      setIsCreatingGame(false);
      setIsJoiningGame(false);
    };
    
    socket.on('gameJoined', handleGameJoined);
    socket.on('gameCreated', handleGameCreated);
    socket.on('error', handleError);
    
    return () => {
      socket.off('gameJoined', handleGameJoined);
      socket.off('gameCreated', handleGameCreated);
      socket.off('error', handleError);
    };
  }, [socket, setGameState]);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }
    
    setIsCreatingGame(true);
    
    try {
      // Set local player information
      setLocalPlayer({
        id: '',
        name: playerName,
        color: selectedColor,
        x: 0,
        y: 0,
        angle: 0,
        score: 0,
        isAlive: true,
        points: []
      });
      
      // Create game on server
      await createGame(playerName, selectedColor);
    } catch (error) {
      toast.error("Failed to create game");
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }
    
    if (!gameId.trim()) {
      toast.error("Please enter a game ID");
      return;
    }
    
    setIsJoiningGame(true);
    
    try {
      // Set local player information
      setLocalPlayer({
        id: '',
        name: playerName,
        color: selectedColor,
        x: 0,
        y: 0,
        angle: 0,
        score: 0,
        isAlive: true,
        points: []
      });
      
      // Join game on server
      await joinGame(gameId, playerName, selectedColor);
    } catch (error) {
      toast.error("Failed to join game");
      setIsJoiningGame(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6">Achtung die Kurve</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              maxLength={15}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Choose Color</label>
            <div className="flex flex-wrap gap-2">
              {PLAYER_COLORS.map((color) => (
                <div
                  key={color}
                  className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                    selectedColor === color ? 'border-white' : 'border-transparent'
                  } ${!availableColors.includes(color) && color !== selectedColor ? 'opacity-30' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    if (availableColors.includes(color) || color === selectedColor) {
                      setSelectedColor(color)
                    }
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="border-t border-gray-700 my-4"></div>
          
          <div className="space-y-4">
            <Button
              onClick={handleCreateGame}
              disabled={isCreatingGame || !playerName}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isCreatingGame ? "Creating..." : "Create New Game"}
            </Button>
            
            <div className="text-center text-sm text-gray-400">- OR -</div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Game ID</label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter game ID"
              />
            </div>
            
            <Button
              onClick={handleJoinGame}
              disabled={isJoiningGame || !playerName || !gameId}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isJoiningGame ? "Joining..." : "Join Game"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
