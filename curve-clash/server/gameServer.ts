import express, { Express, Request, Response, NextFunction } from 'express';
import http, { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import { GameManager } from './game/gameManager';

export interface GameServerOptions {
  corsOrigin?: string | string[];
  port?: number;
  apiPrefix?: string;
  customAuthMiddleware?: (req: Request, res: Response, next: NextFunction) => void;
}

export class GameServer {
  private app: Express;
  private server: Server | null = null;
  private io: SocketServer | null = null;
  private gameManager: GameManager | null = null;
  private options: GameServerOptions;

  constructor(options: GameServerOptions = {}) {
    this.options = {
      corsOrigin: options.corsOrigin || '*',
      port: options.port || 3001,
      apiPrefix: options.apiPrefix || '/api',
      customAuthMiddleware: options.customAuthMiddleware
    };

    this.app = express();
    
    // Configure CORS
    this.app.use(cors({
      origin: this.options.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }));
    
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Apply custom auth middleware if provided
    if (this.options.customAuthMiddleware) {
      this.app.use(this.options.customAuthMiddleware);
    }
    
    // Register API routes
    this.registerRoutes();
  }

  public start(): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        // Create HTTP server
        this.server = http.createServer(this.app);
        
        // Create Socket.IO server
        this.io = new SocketServer(this.server, {
          cors: {
            origin: this.options.corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true
          }
        });
        
        // Initialize game manager
        this.gameManager = new GameManager(this.io);
        
        // Set up Socket.IO connection handling
        this.io.on('connection', (socket) => {
          console.log(`Socket connected: ${socket.id}`);
          
          // Handle player creating a new game
          socket.on('createGame', ({ playerName, color }) => {
            try {
              const { gameId, playerId } = this.gameManager?.createGame(socket.id, playerName, color) || { gameId: '', playerId: '' };
              socket.join(gameId);
              socket.emit('gameCreated', { gameId, playerId });
            } catch (error) {
              socket.emit('error', { message: 'Failed to create game' });
            }
          });
          
          // Handle player joining an existing game
          socket.on('joinGame', ({ gameId, playerName, color }) => {
            try {
              const result = this.gameManager?.joinGame(socket.id, gameId, playerName, color);
              if (result) {
                socket.join(gameId);
                socket.emit('gameJoined', { gameId: result.gameId, playerId: result.playerId });
              } else {
                socket.emit('error', { message: 'Failed to join game' });
              }
            } catch (error) {
              console.error('Error joining game:', error);
              socket.emit('error', { message: 'Failed to join game' });
            }
          });
          
          // Handle player starting the game
          socket.on('startGame', ({ gameId }) => {
            try {
              this.gameManager?.startGame(gameId, socket.id);
            } catch (error) {
              socket.emit('error', { message: 'Failed to start game' });
            }
          });
          
          // Handle player direction changes
          socket.on('changeDirection', ({ direction }) => {
            try {
              this.gameManager?.changePlayerDirection(socket.id, direction);
            } catch (error) {
              console.error('Error changing direction:', error);
            }
          });
          
          // Handle disconnections
          socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            try {
              this.gameManager?.removePlayerBySocketId(socket.id);
            } catch (error) {
              console.error('Error removing player:', error);
            }
          });
        });
        
        // Start listening on specified port
        const port = this.options.port as number;
        this.server.listen(port, () => {
          console.log(`Game server listening on port ${port}`);
          resolve(port);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.server) {
          this.server.close(() => {
            console.log('Game server stopped');
            resolve();
          });
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  public getExpressApp(): Express {
    return this.app;
  }

  public getGameManager(): GameManager | null {
    return this.gameManager;
  }

  public getIOServer(): SocketServer | null {
    return this.io;
  }

  private registerRoutes(): void {
    // Get active games
    this.app.get(`${this.options.apiPrefix}/games`, (req, res) => {
      const activeGames = this.gameManager?.getActiveGames() || [];
      res.json({ games: activeGames });
    });
    
    // Get players in a game
    this.app.get(`${this.options.apiPrefix}/games/:gameId/players`, (req, res) => {
      const { gameId } = req.params;
      try {
        const players = this.gameManager?.getPlayersInGame(gameId) || [];
        res.json({ players });
      } catch (error) {
        res.status(404).json({ message: 'Game not found' });
      }
    });
    
    // Health check
    this.app.get(`${this.options.apiPrefix}/health`, (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
  }
}