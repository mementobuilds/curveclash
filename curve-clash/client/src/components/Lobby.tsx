import React, { useState, useEffect } from 'react';
import { useGameStore } from '../lib/stores/useGameStore';
import { useAudio } from '../lib/stores/useAudio';
import { cn, getRandomPlayerColor } from '../lib/utils';
import { GameState } from '../lib/game/types';

interface LobbyProps {
  username?: string;
  onQuickMatch?: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ 
  username = '',
  onQuickMatch 
}) => {
  const [playerName, setPlayerName] = useState(username || '');
  const [gameIdInput, setGameIdInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(getRandomPlayerColor());
  const [error, setError] = useState<string | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  
  const socket = useGameStore(state => state.socket);
  const playerId = useGameStore(state => state.playerId);
  const gameId = useGameStore(state => state.gameId);
  const players = useGameStore(state => state.players);
  const gameState = useGameStore(state => state.gameState);
  const setGameId = useGameStore(state => state.setGameId);
  const setPlayerId = useGameStore(state => state.setPlayerId);
  const resetGame = useGameStore(state => state.resetGame);
  const playSound = useAudio(state => state.playSound);
  
  // Reset state on unmount
  useEffect(() => {
    return () => {
      setError(null);
      setIsCreatingGame(false);
      setIsJoiningGame(false);
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Handle successful game creation
    const handleGameCreated = (data: { gameId: string; playerId: string }) => {
      console.log('Game created:', data);
      setGameId(data.gameId);
      setPlayerId(data.playerId);
      setIsCreatingGame(false);
      playSound('success');
    };
    
    // Handle successful game join
    const handleGameJoined = (data: { gameId: string; playerId: string }) => {
      console.log('Game joined:', data);
      setGameId(data.gameId);
      setPlayerId(data.playerId);
      setIsJoiningGame(false);
      playSound('success');
    };
    
    // Handle game not found error
    const handleError = (data: { message: string }) => {
      console.error('Game error:', data.message);
      setError(data.message);
      setIsCreatingGame(false);
      setIsJoiningGame(false);
      playSound('error');
    };
    
    // Register event listeners
    socket.on('gameCreated', handleGameCreated);
    socket.on('gameJoined', handleGameJoined);
    socket.on('error', handleError);
    
    // Clean up event listeners on unmount
    return () => {
      socket.off('gameCreated', handleGameCreated);
      socket.off('gameJoined', handleGameJoined);
      socket.off('error', handleError);
    };
  }, [socket, setGameId, setPlayerId, playSound]);
  
  // Create a new game
  const handleCreateGame = () => {
    if (!socket) return;
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setIsCreatingGame(true);
    setError(null);
    socket.emit('createGame', {
      playerName: playerName.trim(),
      color: selectedColor
    });
    
    playSound('click');
  };
  
  // Join an existing game
  const handleJoinGame = () => {
    if (!socket) return;
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!gameIdInput.trim()) {
      setError('Please enter a game ID');
      return;
    }
    
    setIsJoiningGame(true);
    setError(null);
    socket.emit('joinGame', {
      gameId: gameIdInput.trim(),
      playerName: playerName.trim(),
      color: selectedColor
    });
    
    playSound('click');
  };
  
  // Handle quick match (auto-create or join)
  const handleQuickMatch = () => {
    if (onQuickMatch) {
      onQuickMatch();
      return;
    }
    
    // Default implementation: create a new game
    handleCreateGame();
  };
  
  // Start the game (host only)
  const handleStartGame = () => {
    if (!socket || !gameId) return;
    
    socket.emit('startGame', { gameId });
    playSound('click');
  };
  
  // Leave the current game
  const handleLeaveGame = () => {
    if (!socket) return;
    
    // Disconnect from game
    socket.emit('leaveGame');
    
    // Reset game state
    resetGame();
    setGameIdInput('');
    
    playSound('click');
  };
  
  // Handle color change
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    playSound('select');
  };
  
  // Find the host player (first player in the list)
  const hostPlayer = players.length > 0 ? players[0] : null;
  const isHost = hostPlayer?.id === playerId;
  
  // Determine if the game can be started
  const canStartGame = isHost && players.length >= 2 && gameState === GameState.WAITING;
  
  // Render player list if in a game lobby
  const renderPlayerList = () => {
    if (!gameId || players.length === 0) return null;
    
    return (
      <div className="player-list mt-4">
        <h3 className="text-lg font-semibold mb-2">Players:</h3>
        <ul className="space-y-2">
          {players.map(player => (
            <li
              key={player.id}
              className="flex items-center gap-2 p-2 rounded bg-gray-800"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span>
                {player.name} {player.id === playerId ? '(You)' : ''}
                {player.id === hostPlayer?.id ? ' (Host)' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render game setup or waiting lobby
  if (gameId && playerId) {
    return (
      <div className="game-lobby p-4 rounded-lg bg-gray-900 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Game Lobby</h2>
        
        <div className="game-info mb-4">
          <p className="mb-2">
            <span className="font-semibold">Game ID:</span> {gameId}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Share this ID with friends so they can join your game
          </p>
        </div>
        
        {renderPlayerList()}
        
        <div className="flex gap-4 mt-6">
          {canStartGame && (
            <button
              onClick={handleStartGame}
              className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 transition-colors flex-1"
            >
              Start Game
            </button>
          )}
          
          <button
            onClick={handleLeaveGame}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 transition-colors"
          >
            Leave Game
          </button>
        </div>
        
        {gameState === GameState.WAITING && !canStartGame && isHost && (
          <p className="text-yellow-400 mt-4 text-center">
            Waiting for more players to join...
          </p>
        )}
        
        {gameState === GameState.WAITING && !isHost && (
          <p className="text-yellow-400 mt-4 text-center">
            Waiting for the host to start the game...
          </p>
        )}
        
        {error && (
          <p className="text-red-500 mt-4 text-center">{error}</p>
        )}
      </div>
    );
  }

  // Render game setup form
  return (
    <div className="game-setup p-4 rounded-lg bg-gray-900 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Curve Clash</h2>
      
      {error && (
        <div className="error-message bg-red-900/50 text-red-400 p-2 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="playerName" className="block mb-1 font-medium">
          Your Name
        </label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your name"
          maxLength={15}
          disabled={isCreatingGame || isJoiningGame}
        />
      </div>
      
      <div className="mb-6">
        <label className="block mb-1 font-medium">Your Color</label>
        <div className="color-picker grid grid-cols-5 gap-2">
          {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF8000', '#8000FF', '#0080FF', '#FF0080'].map(color => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={cn(
                "w-8 h-8 rounded-full border-2",
                selectedColor === color ? "border-white" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
              disabled={isCreatingGame || isJoiningGame}
            />
          ))}
        </div>
      </div>
      
      <div className="actions space-y-4">
        <button
          onClick={handleQuickMatch}
          className="w-full px-4 py-3 rounded bg-green-600 hover:bg-green-700 transition-colors font-bold"
          disabled={isCreatingGame || isJoiningGame}
        >
          {isCreatingGame ? 'Creating Game...' : 'Quick Match'}
        </button>
        
        <p className="text-center text-gray-400">- or -</p>
        
        <div className="mb-4">
          <label htmlFor="gameId" className="block mb-1 font-medium">
            Game ID
          </label>
          <input
            id="gameId"
            type="text"
            value={gameIdInput}
            onChange={(e) => setGameIdInput(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter game ID to join"
            disabled={isCreatingGame || isJoiningGame}
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={handleCreateGame}
            className="flex-1 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
            disabled={isCreatingGame || isJoiningGame}
          >
            {isCreatingGame ? 'Creating...' : 'Create Game'}
          </button>
          
          <button
            onClick={handleJoinGame}
            className="flex-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 transition-colors"
            disabled={isCreatingGame || isJoiningGame}
          >
            {isJoiningGame ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;