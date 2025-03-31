import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { GameManager } from "./game/gameManager";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create Socket.IO server
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Initialize game manager
  const gameManager = new GameManager(io);
  
  // API routes
  app.get('/api/games', (req, res) => {
    const games = gameManager.getActiveGames();
    res.json({ games });
  });
  
  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Create a new game
    socket.on('createGame', (data: { playerName: string, color: string }, callback) => {
      try {
        const { gameId, playerId } = gameManager.createGame(socket.id, data.playerName, data.color);
        
        // Join the socket to the game room
        socket.join(gameId);
        
        // Send successful response
        callback({ success: true, gameId, playerId });
        
        // Emit game created event
        socket.emit('gameCreated', { gameId, playerId });
        
        // Broadcast updated players list
        io.to(gameId).emit('players', gameManager.getPlayersInGame(gameId));
        
        // Update game state
        io.to(gameId).emit('gameState', { state: 'waiting', gameId });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });
    
    // Join an existing game
    socket.on('joinGame', (data: { gameId: string, playerName: string, color: string }, callback) => {
      try {
        const { gameId, playerId } = gameManager.joinGame(socket.id, data.gameId, data.playerName, data.color);
        
        // Join the socket to the game room
        socket.join(gameId);
        
        // Send successful response
        callback({ success: true, gameId, playerId });
        
        // Emit game joined event
        socket.emit('gameJoined', { gameId, playerId });
        
        // Broadcast updated players list
        io.to(gameId).emit('players', gameManager.getPlayersInGame(gameId));
        
        // Update game state
        io.to(gameId).emit('gameState', { state: 'waiting', gameId });
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });
    
    // Start the game
    socket.on('startGame', (data: { gameId: string }) => {
      try {
        const { gameId } = data;
        gameManager.startGame(gameId, socket.id);
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });
    
    // Change player direction
    socket.on('changeDirection', (data: { direction: 'left' | 'right' | 'none' }) => {
      try {
        gameManager.changePlayerDirection(socket.id, data.direction);
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });
    
    // Quick match - find an available game or create a new one
    socket.on('findGame', (data: { playerName: string, color: string }, callback) => {
      try {
        // Get all active games with room for more players
        const availableGames = gameManager.getActiveGames()
          .filter(game => game.playerCount < 6 && game.state === 'waiting');
        
        if (availableGames.length > 0) {
          // Join the first available game
          const gameToJoin = availableGames[0];
          const { gameId, playerId } = gameManager.joinGame(socket.id, gameToJoin.id, data.playerName, data.color);
          
          // Join the socket to the game room
          socket.join(gameId);
          
          // Send successful response
          callback({ success: true, gameId, playerId });
          
          // Emit game joined event
          socket.emit('gameJoined', { gameId, playerId });
          
          // Broadcast updated players list
          io.to(gameId).emit('players', gameManager.getPlayersInGame(gameId));
          
          // Update game state
          io.to(gameId).emit('gameState', { state: 'waiting', gameId });
        } else {
          // No available games, user needs to create a new one
          callback({ success: false });
        }
      } catch (error: any) {
        callback({ success: false, error: error.message });
      }
    });
    
    // Leave game
    socket.on('leaveGame', () => {
      try {
        gameManager.removePlayerBySocketId(socket.id);
      } catch (error: any) {
        socket.emit('error', error.message);
      }
    });
    
    // Disconnect handling
    // Change player direction
    socket.on('changeDirection', (data: { direction: 'left' | 'right' | 'none' }) => {
      try {
        gameManager.changePlayerDirection(socket.id, data.direction);
      } catch (error: any) {
        console.error('Error changing direction:', error.message);
        socket.emit('error', error.message);
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      try {
        gameManager.removePlayerBySocketId(socket.id);
      } catch (error) {
        console.error('Error removing player on disconnect:', error);
      }
    });
  });

  return httpServer;
}
