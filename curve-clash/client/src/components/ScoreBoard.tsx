import React from 'react';
import { useGameStore } from '../lib/stores/useGameStore';

interface ScoreBoardProps {
  compact?: boolean;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ compact = false }) => {
  const players = useGameStore(state => state.players);
  const playerId = useGameStore(state => state.playerId);
  
  // Sort players by score (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  if (compact) {
    return (
      <div className="scoreboard-compact bg-gray-900/80 backdrop-blur-sm p-2 rounded">
        <h3 className="text-sm font-semibold mb-1">Scores</h3>
        <div className="scores space-y-1">
          {sortedPlayers.map(player => (
            <div 
              key={player.id} 
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className={player.id === playerId ? "font-bold" : ""}>
                  {player.name.slice(0, 8)}{player.name.length > 8 ? '...' : ''}
                </span>
              </div>
              <span className="font-mono">{player.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="scoreboard bg-gray-900/80 backdrop-blur-sm p-4 rounded">
      <h3 className="text-lg font-semibold mb-2">Scoreboard</h3>
      <div className="scores space-y-2">
        {sortedPlayers.map((player, index) => (
          <div 
            key={player.id} 
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="rank w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-sm">
                {index + 1}
              </div>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className={player.id === playerId ? "font-bold" : ""}>
                {player.name}
              </span>
            </div>
            <span className="font-mono text-xl">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreBoard;