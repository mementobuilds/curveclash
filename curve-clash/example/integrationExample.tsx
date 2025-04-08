import React, { useState, useEffect } from 'react';
import { CurveClash, GameServer } from '../index';

// Hypothetical auth types from your existing app
interface User {
  id: string;
  username: string;
  // ... other user fields
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Mock auth hook - replace with your actual auth hook
const useAuth = (): AuthState => {
  // This would be your actual auth implementation
  return {
    user: { id: '123', username: 'Player1' },
    isAuthenticated: true,
    loading: false
  };
};

// Example authentication middleware for the game server
const authMiddleware = (req: any, res: any, next: any) => {
  // This would contain your actual auth logic
  // Example: check a session token, verify JWT, etc.
  const isAuthenticated = true; // Replace with actual auth check
  
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  next();
};

// Component that integrates Curve Clash with an authenticated app
const GameIntegration: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [gameServerStarted, setGameServerStarted] = useState(false);
  const [gameServerPort, setGameServerPort] = useState<number | null>(null);
  
  // Start the game server when the component mounts
  useEffect(() => {
    const startGameServer = async () => {
      try {
        // Create instance of the game server
        const gameServer = new GameServer({
          port: 5001, // Use a different port than your main app
          customAuthMiddleware: authMiddleware,
          apiPrefix: '/api/game'
        });
        
        // Start the server
        const port = await gameServer.start();
        setGameServerPort(port);
        setGameServerStarted(true);
        
        console.log(`Game server started on port ${port}`);
        
        // Clean up when component unmounts
        return () => {
          gameServer.stop()
            .then(() => console.log('Game server stopped'))
            .catch(err => console.error('Error stopping game server:', err));
        };
      } catch (error) {
        console.error('Failed to start game server:', error);
      }
    };
    
    startGameServer();
  }, []);
  
  // Handle game end event
  const handleGameEnd = (winner: string) => {
    console.log(`Game ended! Winner: ${winner}`);
    // You can add analytics or save game results to your database here
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Please log in to play</div>;
  }
  
  if (!gameServerStarted) {
    return <div>Starting game server...</div>;
  }
  
  return (
    <div className="game-container">
      <h1>Welcome to Curve Clash, {user?.username}!</h1>
      
      {/* The CurveClash component with auth integration */}
      <CurveClash 
        serverUrl={`http://localhost:${gameServerPort}`}
        userId={user?.id}
        username={user?.username}
        onGameEnd={handleGameEnd}
      />
    </div>
  );
};

export default GameIntegration;