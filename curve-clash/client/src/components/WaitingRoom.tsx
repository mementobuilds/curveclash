import React from 'react';
import { useGameStore } from '../lib/stores/useGameStore';
import { GameState } from '../lib/game/types';

interface WaitingRoomProps {
  onLeaveGame: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ onLeaveGame }) => {
  const gameState = useGameStore(state => state.gameState);
  const players = useGameStore(state => state.players);
  const playerId = useGameStore(state => state.playerId);
  const countdown = useGameStore(state => state.countdown);
  const roundWinner = useGameStore(state => state.roundWinner);
  const gameWinner = useGameStore(state => state.gameWinner);
  
  // Find the host player (first player in the list)
  const hostPlayer = players.length > 0 ? players[0] : null;
  const isHost = hostPlayer?.id === playerId;
  
  if (gameState === GameState.PLAYING) {
    return null;
  }
  
  // Round over state
  if (gameState === GameState.ROUND_OVER) {
    // Find the player who won the round
    const winner = players.find(p => p.id === roundWinner);
    
    return (
      <div className="waiting-room fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
        <div className="content bg-gray-900 p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Round Over</h2>
          
          {winner ? (
            <p className="text-xl mb-6">
              <span style={{ color: winner.color }}>{winner.name}</span> wins the round!
            </p>
          ) : (
            <p className="text-xl mb-6">Round Complete!</p>
          )}
          
          <div className="scores mb-6">
            <h3 className="text-lg font-semibold mb-2">Current Scores</h3>
            <div className="grid grid-cols-2 gap-2">
              {players
                .sort((a, b) => b.score - a.score)
                .map(player => (
                  <div 
                    key={player.id} 
                    className="flex items-center justify-between p-2 bg-gray-800 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span>{player.name}</span>
                    </div>
                    <span className="font-mono">{player.score}</span>
                  </div>
                ))
              }
            </div>
          </div>
          
          <p className="text-gray-400">
            Next round starting...
          </p>
        </div>
      </div>
    );
  }
  
  // Game over state
  if (gameState === GameState.GAME_OVER) {
    // Find the player who won the game
    const winner = players.find(p => p.id === gameWinner);
    
    return (
      <div className="waiting-room fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
        <div className="content bg-gray-900 p-6 rounded-lg max-w-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Game Over</h2>
          
          {winner ? (
            <p className="text-2xl mb-8">
              <span style={{ color: winner.color }}>{winner.name}</span> wins the game!
            </p>
          ) : (
            <p className="text-2xl mb-8">Game Complete!</p>
          )}
          
          <div className="final-scores mb-8">
            <h3 className="text-lg font-semibold mb-3">Final Scores</h3>
            <div className="space-y-2">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div 
                    key={player.id} 
                    className="flex items-center justify-between p-3 bg-gray-800 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="text-lg">{player.name}</span>
                    </div>
                    <span className="font-mono text-lg">{player.score}</span>
                  </div>
                ))
              }
            </div>
          </div>
          
          <button 
            onClick={onLeaveGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }
  
  // Countdown state
  if (gameState === GameState.STARTING) {
    return (
      <div className="countdown fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
        <div className="text-center">
          <div className="text-6xl font-bold mb-4">
            {countdown > 0 ? countdown : "GO!"}
          </div>
          <p className="text-xl">Get ready!</p>
        </div>
      </div>
    );
  }
  
  return null;
};

export default WaitingRoom;