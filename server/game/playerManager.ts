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
  addPlayer(socketId: string, name: string, color: string, profilePicture?: string, displayName?: string): string {
    const playerId = nanoid();
    
    const player: Player = {
      id: playerId,
      name,
      color,
      x: 0,
      y: 0,
      angle: 0,
      score: 0,
      isAlive: true,
      points: [],
      profilePicture: profilePicture || "",
      displayName: displayName || name,
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
    // Use Array.from to convert the entries to a regular array, avoiding MapIterator issues
    Array.from(this.socketToPlayer.entries()).forEach(([socketId, pid]) => {
      if (pid === playerId) {
        this.socketToPlayer.delete(socketId);
      }
    });
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
    // Check if player exists
    const player = this.getPlayer(playerId);
    if (!player) {
      console.error(`Cannot set direction: Player ${playerId} not found`);
      return;
    }
    
    const currentDirection = this.playerDirections[playerId] || 'none';
    
    // Only log if direction is actually changing
    if (currentDirection !== direction) {
      console.log(`PlayerManager: Player ${player.name} (${playerId}) changing direction: ${currentDirection} -> ${direction}`);
    }
    
    // Update the direction
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
