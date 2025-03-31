import { nanoid } from "nanoid";
import { Player } from "../../client/src/lib/game/types";

interface PlayerDirection {
  [playerId: string]: 'left' | 'right' | 'none';
}

export class PlayerManager {
  private players: Player[];
  private playerDirections: PlayerDirection;
  private socketToPlayer: Map<string, string>; // Maps socketId to playerId

  constructor() {
    this.players = [];
    this.playerDirections = {};
    this.socketToPlayer = new Map();
  }

  /**
   * Add a new player
   */
  addPlayer(socketId: string, name: string, color: string): string {
    // Generate a unique ID for the player
    const playerId = nanoid();
    
    // Create the player object
    const player: Player = {
      id: playerId,
      name,
      color,
      x: 0,
      y: 0,
      angle: 0,
      score: 0,
      isAlive: true,
      points: []
    };
    
    // Add the player to the list
    this.players.push(player);
    
    // Initialize the player's direction
    this.playerDirections[playerId] = 'none';
    
    // Map the socket to the player
    this.socketToPlayer.set(socketId, playerId);
    
    return playerId;
  }

  /**
   * Remove a player by ID
   */
  removePlayer(playerId: string): void {
    // Remove the player from the list
    this.players = this.players.filter(player => player.id !== playerId);
    
    // Remove the player's direction
    delete this.playerDirections[playerId];
    
    // Remove socket to player mapping
    for (const [socketId, pid] of this.socketToPlayer.entries()) {
      if (pid === playerId) {
        this.socketToPlayer.delete(socketId);
      }
    }
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.find(player => player.id === playerId);
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    return [...this.players];
  }

  /**
   * Set a player's direction
   */
  setPlayerDirection(playerId: string, direction: 'left' | 'right' | 'none'): void {
    this.playerDirections[playerId] = direction;
  }

  /**
   * Get a player's direction
   */
  getPlayerDirection(playerId: string): 'left' | 'right' | 'none' {
    return this.playerDirections[playerId] || 'none';
  }

  /**
   * Get player by socket ID
   */
  getPlayerBySocketId(socketId: string): Player | undefined {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return undefined;
    return this.getPlayer(playerId);
  }
}
