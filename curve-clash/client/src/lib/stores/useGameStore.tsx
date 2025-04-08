import { create } from 'zustand';
import { GameState, Player } from '../game/types';

interface GameStore {
  // Connection state
  socket: any | null;
  connected: boolean;
  playerId: string | null;
  gameId: string | null;
  
  // Game state
  gameState: GameState;
  players: Player[];
  countdown: number;
  roundWinner: string | null;
  gameWinner: string | null;
  
  // Actions
  setSocket: (socket: any) => void;
  setConnected: (connected: boolean) => void;
  setPlayerId: (id: string | null) => void;
  setGameId: (id: string | null) => void;
  setGameState: (state: GameState) => void;
  setPlayers: (players: Player[]) => void;
  setCountdown: (countdown: number) => void;
  setRoundWinner: (winner: string | null) => void;
  setGameWinner: (winner: string | null) => void;
  
  // Reset state
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  socket: null,
  connected: false,
  playerId: null,
  gameId: null,
  gameState: GameState.WAITING,
  players: [],
  countdown: 0,
  roundWinner: null,
  gameWinner: null,
  
  // Actions
  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ connected }),
  setPlayerId: (playerId) => set({ playerId }),
  setGameId: (gameId) => set({ gameId }),
  setGameState: (gameState) => set({ gameState }),
  setPlayers: (players) => set({ players }),
  setCountdown: (countdown) => set({ countdown }),
  setRoundWinner: (roundWinner) => set({ roundWinner }),
  setGameWinner: (gameWinner) => set({ gameWinner }),
  
  // Reset state
  resetGame: () => set({
    playerId: null,
    gameId: null,
    gameState: GameState.WAITING,
    players: [],
    countdown: 0,
    roundWinner: null,
    gameWinner: null
  })
}));