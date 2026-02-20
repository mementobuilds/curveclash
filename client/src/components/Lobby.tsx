import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useBedrockPassport, LoginPanel } from "@bedrock_org/passport";
import useGameStore from "../lib/stores/useGameStore";
import useAuthStore from "../lib/stores/useAuthStore";
import { PLAYER_COLORS } from "../lib/game/constants";

interface LobbyProps {
  gamePass: {
    passEnabled: boolean;
    togglePassEnabled: (enabled: boolean) => void;
    isGuestMode: boolean;
    passToken: string | null;
    passValidated: boolean;
    passTimeRemaining: number;
    passExpired: boolean;
    isRedeeming: boolean;
    cameWithPass: boolean;
    redeemPass: (token: string) => Promise<{ valid: boolean; error?: string; secondsRemaining?: number }>;
    canStartGame: () => boolean;
    formatTime: (seconds: number) => string;
    handlePlayAsGuest: () => void;
    handleGetNewPass: () => void;
  };
}

const Lobby = ({ gamePass }: LobbyProps) => {
  const { 
    socket, 
    players, 
    setGameState, 
    setLocalPlayer,
    joinGame,
    createGame
  } = useGameStore();

  const { isLoggedIn, user, signOut } = useBedrockPassport();
  const { user: authUser, setUser, logout: authLogout } = useAuthStore();
  
  const urlGameId = new URLSearchParams(window.location.search).get("game") || "";
  const [playerName, setPlayerName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0]);
  const [gameId, setGameId] = useState(urlGameId);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [availableColors, setAvailableColors] = useState<string[]>(PLAYER_COLORS);
  const userSyncedRef = useRef(false);
  const autoJoinedRef = useRef(false);
  useEffect(() => {
    if (isLoggedIn && user && !userSyncedRef.current) {
      userSyncedRef.current = true;
      const u = user as any;
      setUser({
        id: u.id || "",
        email: u.email || "",
        name: u.name || "",
        displayName: u.displayName || u.name || "",
        picture: u.picture || u.photoUrl || "",
        provider: u.provider || "",
      });
      if (!playerName) {
        setPlayerName(u.displayName || u.name || "");
      }
    }
    if (!isLoggedIn) {
      userSyncedRef.current = false;
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!urlGameId || !socket || !isLoggedIn || autoJoinedRef.current) return;
    if (!userSyncedRef.current || !user) return;

    autoJoinedRef.current = true;
    const u = user as any;
    const name = u.displayName || u.name || "Player";
    const color = selectedColor;
    const pic = u.picture || u.photoUrl || "";
    const dName = u.displayName || u.name || name;

    setPlayerName(name);
    setLocalPlayer({
      id: '',
      name,
      color,
      x: 0, y: 0, angle: 0, score: 0,
      isAlive: true,
      points: [],
      profilePicture: pic,
      displayName: dName,
    });

    socket.emit('joinGame', {
      gameId: urlGameId,
      playerName: name,
      color,
      profilePicture: pic,
      displayName: dName,
    }, (response: { success: boolean, error?: string }) => {
      if (response.success) {
        toast.success(`Joined game ${urlGameId}`);
        setGameState("waiting");
        window.history.replaceState({}, '', '/');
      } else {
        toast.error(response.error || "Game not found");
        autoJoinedRef.current = false;
      }
    });
  }, [urlGameId, socket, isLoggedIn, user]);

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

    if (gamePass.passEnabled && !gamePass.canStartGame()) {
      toast.error("You need a valid Game Pass to start a game");
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

    if (gamePass.passEnabled && !gamePass.canStartGame()) {
      toast.error("You need a valid Game Pass to join a game");
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

  if (!isLoggedIn && !gamePass.isGuestMode) {
    if (urlGameId) {
      localStorage.setItem("pendingGameId", urlGameId);
    }
    return (
      <div className="login-panel-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem 0', backgroundColor: '#000', overflowY: 'auto' }}>
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 1rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5rem', color: '#fff' }}>Curve Clash</h1>
          <LoginPanel
            title="Sign in to"
            logo="https://irp.cdn-website.com/e81c109a/dms3rep/multi/orange-web3-logo-v2a-20241018.svg"
            logoAlt="Orange Web3"
            walletButtonText="Connect Wallet"
            showConnectWallet={false}
            separatorText="OR"
            features={{
              enableWalletConnect: false,
              enableAppleLogin: true,
              enableGoogleLogin: true,
              enableEmailLogin: false,
            }}
            titleClass="text-xl font-bold text-white"
            logoClass="ml-2 md:h-8 h-6"
            panelClass="p-4 md:p-8 rounded-2xl bg-gray-900 text-white"
            buttonClass="hover:border-orange-500"
            separatorTextClass="bg-gray-900 text-gray-500"
            separatorClass="bg-gray-700"
            linkRowClass="justify-center"
            headerClass="justify-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-center mb-4">Curve Clash</h1>
        
        {authUser && !gamePass.isGuestMode && (
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

        {gamePass.isGuestMode && (
          <div className="mb-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-center">
            <p className="text-yellow-300 text-sm font-medium">Playing as Guest</p>
            <p className="text-yellow-400/70 text-xs mt-1">Scores won't be saved to leaderboard</p>
          </div>
        )}

        {gamePass.passEnabled && gamePass.passValidated && gamePass.passTimeRemaining > 0 && (
          <div className="mb-4 bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center justify-between">
            <span className="text-green-300 text-sm font-medium">Game Pass Active</span>
            <span className="text-green-400 font-mono text-lg font-bold">
              {gamePass.formatTime(gamePass.passTimeRemaining)}
            </span>
          </div>
        )}

        {gamePass.passEnabled && !gamePass.isGuestMode && !gamePass.isRedeeming && !gamePass.canStartGame() && (
          <div className={`mb-4 ${gamePass.passExpired ? 'bg-red-900/30 border-red-700' : 'bg-orange-900/30 border-orange-700'} border rounded-lg p-3 text-center`}>
            <p className={`${gamePass.passExpired ? 'text-red-300' : 'text-orange-300'} text-sm font-medium`}>
              {gamePass.passExpired ? "Game Pass Expired" : "No active Game Pass"}
            </p>
            <div className="flex gap-2 mt-2 justify-center">
              <Button
                size="sm"
                onClick={gamePass.handlePlayAsGuest}
                className="bg-gray-600 hover:bg-gray-700 text-xs"
              >
                Play as Guest
              </Button>
              <Button
                size="sm"
                onClick={gamePass.handleGetNewPass}
                className="bg-orange-600 hover:bg-orange-700 text-xs"
              >
                Get New Pass
              </Button>
            </div>
          </div>
        )}

        {gamePass.isRedeeming && (
          <div className="mb-4 bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-center">
            <p className="text-blue-300 text-sm font-medium">Validating Game Pass...</p>
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

                if (gamePass.passEnabled && !gamePass.canStartGame()) {
                  toast.error("You need a valid Game Pass to play");
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
              disabled={!playerName || (gamePass.passEnabled && !gamePass.canStartGame())}
              className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-3"
            >
              Quick Match
            </Button>
            
            <div className="text-center text-sm text-gray-400 pt-2">- OR -</div>
            
            <div className="border-t border-gray-700 my-2 pt-2">
              <Button
                onClick={handleCreateGame}
                disabled={isCreatingGame || !playerName || (gamePass.passEnabled && !gamePass.canStartGame())}
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
              disabled={isJoiningGame || !playerName || !gameId || (gamePass.passEnabled && !gamePass.canStartGame())}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isJoiningGame ? "Joining..." : "Join Game"}
            </Button>
          </div>

          <div className="border-t border-gray-700 my-4"></div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Game Pass Mode</label>
            <button
              onClick={() => gamePass.togglePassEnabled(!gamePass.passEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                gamePass.passEnabled ? 'bg-orange-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  gamePass.passEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
