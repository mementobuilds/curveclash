import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { Player, Point, GameState } from "../game/types";

// Singleton socket instance to avoid recreating on each store access
let socketInstance: Socket | null = null;

interface GameStoreState {
  // Game state
  gameState: GameState;
  players: Player[];
  localPlayer: Player | null;
  gameId: string | null;
  socket: Socket | null;
  winner: string | null;
  roundWinner: string | null;
  
  // Actions
  setGameState: (state: GameState) => void;
  setPlayers: (players: Player[]) => void;
  setLocalPlayer: (player: Player) => void;
  setGameId: (id: string | null) => void;
  setWinner: (id: string | null) => void;
  setRoundWinner: (id: string | null) => void;
  
  // Socket initialization
  initializeSocket: () => Promise<void>;
  
  // Game actions
  createGame: (playerName: string, color: string) => Promise<void>;
  joinGame: (gameId: string, playerName: string, color: string) => Promise<void>;
  startGame: () => void;
  resetGame: () => void;
  
  // Player actions
  updatePlayerDirection: (direction: 'left' | 'right' | 'none') => void;
  updatePlayerPosition: (playerId: string, x: number, y: number, angle: number, points: Point[]) => void;
  setPlayerAlive: (playerId: string, isAlive: boolean) => void;
  incrementPlayerScore: (playerId: string) => void;
  clearPlayers: () => void;
}

const useGameStore = create<GameStoreState>((set, get) => ({
  // Initial state
  gameState: "lobby",
  players: [],
  localPlayer: null,
  gameId: null,
  socket: null,
  winner: null,
  roundWinner: null,
  
  // State setters
  setGameState: (state) => set({ gameState: state }),
  setPlayers: (players) => set({ players }),
  setLocalPlayer: (player) => set({ localPlayer: player }),
  setGameId: (id) => set({ gameId: id }),
  setWinner: (id) => set({ winner: id }),
  setRoundWinner: (id) => set({ roundWinner: id }),
  
  // Initialize socket connection
  initializeSocket: async () => {
    // If the socket is already initialized in the store, return
    const { socket } = get();
    if (socket !== null) {
      return; // Socket already exists in the store
    }
    
    // If we have a singleton socket instance, use that
    if (socketInstance !== null) {
      set({ socket: socketInstance });
      return;
    }
    
    // Connect to the socket server
    // Use the same origin as the React app - no need to specify port
    try {
      // Create new socket instance - no need to specify port
      socketInstance = io();
      
      // Setup socket event listeners
      socketInstance.on('connect', () => {
        console.log('Connected to server');
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Disconnected from server');
      });
      
      socketInstance.on('players', (players: Player[]) => {
        const { localPlayer } = get();
        set({ players });
        
        // Update the local player ID if needed
        if (localPlayer && !localPlayer.id) {
          const foundPlayer = players.find(p => p.name === localPlayer.name && p.color === localPlayer.color);
          if (foundPlayer) {
            set({ localPlayer: foundPlayer });
          }
        }
      });
      
      socketInstance.on('gameState', (data: { state: GameState, gameId?: string }) => {
        set({ gameState: data.state });
        if (data.gameId) {
          set({ gameId: data.gameId });
        }
      });
      
      socketInstance.on('roundWinner', (data: { playerId: string }) => {
        set({ roundWinner: data.playerId });
      });
      
      socketInstance.on('gameWinner', (data: { playerId: string }) => {
        set({ winner: data.playerId });
      });
      
      // Set the socket at the end after all event listeners are attached
      set({ socket: socketInstance });
    } catch (error) {
      console.error('Failed to connect to socket server:', error);
      throw error;
    }
  },
  
  // Game actions
  createGame: async (playerName, color) => {
    const { socket } = get();
    if (!socket) throw new Error("Socket not connected");
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('createGame', { playerName, color }, (response: { success: boolean, error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || "Failed to create game"));
        }
      });
    });
  },
  
  joinGame: async (gameId, playerName, color) => {
    const { socket } = get();
    if (!socket) throw new Error("Socket not connected");
    
    return new Promise<void>((resolve, reject) => {
      socket.emit('joinGame', { gameId, playerName, color }, (response: { success: boolean, error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || "Failed to join game"));
        }
      });
    });
  },
  
  startGame: () => {
    const { socket, gameId } = get();
    if (socket && gameId) {
      socket.emit('startGame', { gameId });
    }
  },
  
  resetGame: () => {
    set({
      gameState: "lobby",
      winner: null,
      roundWinner: null
    });
  },
  
  // Player actions
  updatePlayerDirection: (direction) => {
    const { socket, localPlayer } = get();
    if (socket && localPlayer) {
      // Send direction to server
      socket.emit('changeDirection', { direction });
    }
  },
  
  updatePlayerPosition: (playerId, x, y, angle, points) => {
    set(state => ({
      players: state.players.map(player => {
        if (player.id === playerId) {
          return { ...player, x, y, angle, points };
        }
        return player;
      })
    }));
  },
  
  setPlayerAlive: (playerId, isAlive) => {
    set(state => ({
      players: state.players.map(player => {
        if (player.id === playerId) {
          return { ...player, isAlive };
        }
        return player;
      })
    }));
  },
  
  incrementPlayerScore: (playerId) => {
    set(state => ({
      players: state.players.map(player => {
        if (player.id === playerId) {
          return { ...player, score: player.score + 1 };
        }
        return player;
      })
    }));
  },
  
  clearPlayers: () => {
    set(state => ({
      players: state.players.map(player => ({
        ...player,
        points: [],
        isAlive: true
      }))
    }));
  }
}));

export default useGameStore;
