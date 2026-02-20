import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useBedrockPassport } from "@bedrock_org/passport";
import useGameStore from "../lib/stores/useGameStore";
import useAuthStore from "../lib/stores/useAuthStore";
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

  const { isLoggedIn, signOut, signIn } = useBedrockPassport();
  const { user: authUser, logout: authLogout } = useAuthStore();
  
  const [playerName, setPlayerName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0]);
  const [gameId, setGameId] = useState("");
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [availableColors, setAvailableColors] = useState<string[]>(PLAYER_COLORS);

  useEffect(() => {
    if (authUser && !playerName) {
      setPlayerName(authUser.displayName || authUser.name || "");
    }
  }, [authUser]);

  useEffect(() => {
    if (players.length > 0) {
      const usedColors = players.map(p => p.color);
      setAvailableColors(PLAYER_COLORS.filter(color => !usedColors.includes(color)));
    } else {
      setAvailableColors(PLAYER_COLORS);
    }
  }, [players]);

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

  const handleLogout = async () => {
    try {
      const accessToken =
        localStorage.getItem("bedrock:accessToken") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("bedrock:accessToken");
      if (accessToken) {
        await fetch("https://api.bedrockpassport.com/api/v1/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch {
    }

    await signOut();
    authLogout();

    try {
      localStorage.removeItem("bedrock:accessToken");
      localStorage.removeItem("bedrock:refreshToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("passport-token");
      sessionStorage.removeItem("bedrock:accessToken");
      sessionStorage.removeItem("bedrock:refreshToken");
    } catch {}
  };

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      toast.error("Please enter a player name");
      return;
    }
    
    setIsCreatingGame(true);
    
    try {
      setLocalPlayer({
        id: '',
        name: playerName,
        color: selectedColor,
        x: 0,
        y: 0,
        angle: 0,
        score: 0,
        isAlive: true,
        points: [],
        profilePicture: authUser?.picture || "",
        displayName: authUser?.displayName || playerName,
      });
      
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
      setLocalPlayer({
        id: '',
        name: playerName,
        color: selectedColor,
        x: 0,
        y: 0,
        angle: 0,
        score: 0,
        isAlive: true,
        points: [],
        profilePicture: authUser?.picture || "",
        displayName: authUser?.displayName || playerName,
      });
      
      await joinGame(gameId, playerName, selectedColor);
    } catch (error) {
      toast.error("Failed to join game");
      setIsJoiningGame(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen py-8 bg-black overflow-y-auto">
        <div className="max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-center mb-6 text-white">Curve Clash</h1>
          <div className="bg-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-lg font-bold text-white">Sign in with</span>
              <img
                src="https://irp.cdn-website.com/e81c109a/dms3rep/multi/orange-web3-logo-v2a-20241018.svg"
                alt="Orange Web3"
                className="h-6 md:h-8"
              />
            </div>
            <div className="space-y-3">
              <button
                onClick={() => signIn("GOOGLE" as any)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button
                onClick={() => signIn("APPLE" as any)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors border border-gray-600"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Continue with Apple
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 mt-4">Powered by Orange ID</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-4">Curve Clash</h1>
        
        {authUser && (
          <div className="flex items-center justify-between mb-6 bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-3">
              {authUser.picture ? (
                <img 
                  src={authUser.picture} 
                  alt={authUser.displayName} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  {(authUser.displayName || authUser.name || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{authUser.displayName || authUser.name}</p>
                <p className="text-xs text-gray-400">{authUser.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="text-xs bg-transparent border-gray-600 hover:bg-gray-600"
            >
              Sign Out
            </Button>
          </div>
        )}

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
              onClick={() => {
                if (!playerName.trim()) {
                  toast.error("Please enter a player name");
                  return;
                }
                
                setLocalPlayer({
                  id: '',
                  name: playerName,
                  color: selectedColor,
                  x: 0,
                  y: 0,
                  angle: 0,
                  score: 0,
                  isAlive: true,
                  points: [],
                  profilePicture: authUser?.picture || "",
                  displayName: authUser?.displayName || playerName,
                });
                
                socket?.emit('findGame', { playerName, color: selectedColor, profilePicture: authUser?.picture || "", displayName: authUser?.displayName || playerName }, (response: { success: boolean, gameId?: string, error?: string }) => {
                  if (response.success && response.gameId) {
                    toast.success(`Joined game ${response.gameId}`);
                    setGameState("waiting");
                  } else {
                    handleCreateGame();
                  }
                });
              }}
              disabled={!playerName}
              className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
            >
              Quick Match
            </Button>
            
            <div className="text-center text-sm text-gray-400 pt-2">- OR -</div>
            
            <div className="border-t border-gray-700 my-2 pt-2">
              <Button
                onClick={handleCreateGame}
                disabled={isCreatingGame || !playerName}
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
              >
                {isCreatingGame ? "Creating..." : "Create New Game"}
              </Button>
            </div>
            
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
