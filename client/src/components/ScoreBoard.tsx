import useGameStore from "../lib/stores/useGameStore";

const ScoreBoard = () => {
  const { players, localPlayer } = useGameStore();
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Scoreboard</h2>
      
      {sortedPlayers.length === 0 ? (
        <div className="text-gray-400">No players yet</div>
      ) : (
        <div className="space-y-2">
          {sortedPlayers.map((player) => (
            <div 
              key={player.id}
              className={`flex items-center justify-between p-2 rounded ${
                player.id === localPlayer?.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center">
                {player.profilePicture ? (
                  <img 
                    src={player.profilePicture} 
                    alt={player.displayName || player.name} 
                    className="w-6 h-6 rounded-full object-cover mr-2 border"
                    style={{ borderColor: player.color }}
                  />
                ) : (
                  <div 
                    className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: player.color }}
                  >
                    {(player.displayName || player.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`
                  ${player.isAlive ? '' : 'line-through text-gray-400'} 
                  ${player.id === localPlayer?.id ? 'font-bold' : ''}
                `}>
                  {player.displayName || player.name}
                  {player.id === localPlayer?.id ? ' (You)' : ''}
                </span>
              </div>
              <span className="font-bold">{player.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
