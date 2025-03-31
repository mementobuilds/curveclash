import { Server as SocketServer } from "socket.io";
import { PlayerManager } from "./playerManager";
import { checkCollisions } from "./collisionDetection";
import { nanoid } from "nanoid";
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_SPEED, TURN_SPEED, GAP_FREQUENCY, GAP_DURATION, WIN_SCORE, INITIAL_HOLE_PERIOD, COUNTDOWN_DURATION, ROUND_END_DURATION } from "../../client/src/lib/game/constants";
import { calculateStartPositions } from "../../client/src/lib/game/utils";
import { Player, GameState } from "../../client/src/lib/game/types";

interface Game {
  id: string;
  playerManager: PlayerManager;
  state: GameState;
  players: Player[];
  gameLoop: NodeJS.Timeout | null;
  frameCount: number;
  winningScore: number;
  roundWinner: string | null;
  gameWinner: string | null;
}

export class GameManager {
  private io: SocketServer;
  private games: Map<string, Game>;
  private playerToGame: Map<string, string>; // Maps playerId to gameId
  private socketToPlayer: Map<string, string>; // Maps socketId to playerId

  constructor(io: SocketServer) {
    this.io = io;
    this.games = new Map();
    this.playerToGame = new Map();
    this.socketToPlayer = new Map();
  }

  /**
   * Create a new game
   */
  createGame(socketId: string, playerName: string, color: string): { gameId: string; playerId: string } {
    // Generate a unique game ID (shorter for easier sharing)
    const gameId = nanoid(6);
    
    // Create player manager for this game
    const playerManager = new PlayerManager();
    
    // Add the player
    const playerId = playerManager.addPlayer(socketId, playerName, color);
    
    // Create the game
    this.games.set(gameId, {
      id: gameId,
      playerManager,
      state: "waiting",
      players: playerManager.getPlayers(),
      gameLoop: null,
      frameCount: 0,
      winningScore: WIN_SCORE,
      roundWinner: null,
      gameWinner: null
    });
    
    // Map the player to the game
    this.playerToGame.set(playerId, gameId);
    this.socketToPlayer.set(socketId, playerId);
    
    return { gameId, playerId };
  }

  /**
   * Join an existing game
   */
  joinGame(socketId: string, gameId: string, playerName: string, color: string): { gameId: string; playerId: string } {
    // Check if the game exists
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    // Check if the game is joinable
    if (game.state !== "waiting") {
      throw new Error("Cannot join a game that has already started");
    }
    
    // Add the player
    const playerId = game.playerManager.addPlayer(socketId, playerName, color);
    
    // Update the game players
    game.players = game.playerManager.getPlayers();
    
    // Map the player to the game
    this.playerToGame.set(playerId, gameId);
    this.socketToPlayer.set(socketId, playerId);
    
    return { gameId, playerId };
  }

  /**
   * Start a game
   */
  startGame(gameId: string, socketId: string): void {
    // Check if the game exists
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    // Ensure there are at least 2 players
    if (game.players.length < 2) {
      throw new Error("Need at least 2 players to start the game");
    }
    
    // Begin countdown
    game.state = "countdown";
    this.io.to(gameId).emit('gameState', { state: game.state });
    
    // Start the countdown
    setTimeout(() => {
      this.startRound(gameId);
    }, COUNTDOWN_DURATION * 1000);
  }

  /**
   * Start a round
   */
  private startRound(gameId: string): void {
    // Check if the game exists
    const game = this.games.get(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found when starting round`);
      return;
    }
    
    // Reset round state
    game.state = "playing";
    game.frameCount = 0;
    game.roundWinner = null;
    
    // Calculate starting positions for players
    const players = game.players;
    const startPositions = calculateStartPositions(
      players.length, 
      CANVAS_WIDTH / 2, 
      CANVAS_HEIGHT / 2
    );
    
    // Set initial positions for all players
    players.forEach((player, index) => {
      // Position might be undefined if there are more players than calculated positions
      const position = startPositions[index] || startPositions[0];
      
      player.x = position.x;
      player.y = position.y;
      player.angle = position.angle;
      player.isAlive = true;
      player.points = [{ x: position.x, y: position.y }];
    });
    
    // Update the game
    game.players = players;
    
    // Notify clients that a new round is starting
    this.io.to(gameId).emit('newRound');
    this.io.to(gameId).emit('gameState', { state: game.state });
    this.io.to(gameId).emit('players', game.players);
    
    // Start the game loop
    if (game.gameLoop) {
      clearInterval(game.gameLoop);
    }
    
    // Run the game loop at 60 fps (approximately)
    game.gameLoop = setInterval(() => {
      this.updateGame(gameId);
    }, 1000 / 60);
  }

  /**
   * Update the game state (game loop)
   */
  private updateGame(gameId: string): void {
    // Check if the game exists
    const game = this.games.get(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found when updating game`);
      return;
    }
    
    // Skip if the game is not in playing state
    if (game.state !== "playing") {
      return;
    }
    
    // Increment frame counter
    game.frameCount++;
    
    // Get all active players
    const players = game.players;
    let activePlayers = players.filter(player => player.isAlive);
    
    // Update player positions based on their direction
    activePlayers.forEach(player => {
      // Get the player's direction
      const direction = game.playerManager.getPlayerDirection(player.id);
      
      // Update angle based on direction
      if (direction === "left") {
        player.angle -= TURN_SPEED;
      } else if (direction === "right") {
        player.angle += TURN_SPEED;
      }
      
      // Calculate new position
      const newX = player.x + Math.cos(player.angle) * GAME_SPEED;
      const newY = player.y + Math.sin(player.angle) * GAME_SPEED;
      
      // Check if we should create a gap (hole) in the line
      // Initial delay before gaps start appearing
      const shouldCreateGap = 
        game.frameCount > INITIAL_HOLE_PERIOD && 
        game.frameCount % GAP_FREQUENCY < GAP_DURATION;
      
      // If creating a gap, use special coordinates (-1, -1) to indicate a gap
      if (shouldCreateGap) {
        player.points.push({ x: -1, y: -1 });
      } else {
        // Add the new point to the player's trail
        player.points.push({ x: newX, y: newY });
      }
      
      // Update player position
      player.x = newX;
      player.y = newY;
    });
    
    // Check for collisions
    activePlayers = checkCollisions(activePlayers, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update player alive status in the original array
    players.forEach(player => {
      const activePlayer = activePlayers.find(p => p.id === player.id);
      player.isAlive = !!activePlayer;
    });
    
    // Check if the round is over (0 or 1 player left)
    if (activePlayers.length <= 1) {
      // Round is over
      
      // If one player is left, they win the round
      if (activePlayers.length === 1) {
        const winnerId = activePlayers[0].id;
        
        // Update score
        const winnerIndex = players.findIndex(p => p.id === winnerId);
        if (winnerIndex !== -1) {
          players[winnerIndex].score += 1;
          game.roundWinner = winnerId;
          
          // Notify clients of the round winner
          this.io.to(gameId).emit('roundWinner', { playerId: winnerId });
          
          // Check if we have a game winner
          if (players[winnerIndex].score >= game.winningScore) {
            game.gameWinner = winnerId;
          }
        }
      }
      
      // End the round
      this.endRound(gameId);
    }
    
    // Send the updated game state to clients
    this.io.to(gameId).emit('gameState', { players });
  }

  /**
   * End a round
   */
  private endRound(gameId: string): void {
    // Check if the game exists
    const game = this.games.get(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found when ending round`);
      return;
    }
    
    // Stop the game loop
    if (game.gameLoop) {
      clearInterval(game.gameLoop);
      game.gameLoop = null;
    }
    
    // If we have a game winner, end the game
    if (game.gameWinner) {
      game.state = "gameEnd";
      this.io.to(gameId).emit('gameState', { state: game.state });
      this.io.to(gameId).emit('gameWinner', { playerId: game.gameWinner });
      return;
    }
    
    // Otherwise, just end the round
    game.state = "roundEnd";
    this.io.to(gameId).emit('gameState', { state: game.state });
    
    // Start the next round after a delay
    setTimeout(() => {
      this.startRound(gameId);
    }, ROUND_END_DURATION * 1000);
  }

  /**
   * Change a player's direction
   */
  changePlayerDirection(socketId: string, direction: 'left' | 'right' | 'none'): void {
    // Get the player ID
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) {
      throw new Error("Player not found");
    }
    
    // Get the game ID
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) {
      throw new Error("Game not found for player");
    }
    
    // Get the game
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    
    // Update the player's direction
    game.playerManager.setPlayerDirection(playerId, direction);
  }

  /**
   * Remove a player by socket ID
   */
  removePlayerBySocketId(socketId: string): void {
    // Get the player ID
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) {
      return; // Player not found, might have already been removed
    }
    
    // Get the game ID
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) {
      return; // Game not found, might have already been removed
    }
    
    // Get the game
    const game = this.games.get(gameId);
    if (!game) {
      return; // Game not found, might have already been removed
    }
    
    // Remove the player from the game
    game.playerManager.removePlayer(playerId);
    
    // Update the game players
    game.players = game.playerManager.getPlayers();
    
    // Remove mappings
    this.socketToPlayer.delete(socketId);
    this.playerToGame.delete(playerId);
    
    // Notify other players
    this.io.to(gameId).emit('players', game.players);
    
    // If no players remain, remove the game
    if (game.players.length === 0) {
      if (game.gameLoop) {
        clearInterval(game.gameLoop);
      }
      this.games.delete(gameId);
      return;
    }
    
    // If the game is in progress and we now have fewer than 2 players, end the round
    if ((game.state === "playing" || game.state === "roundEnd") && game.players.length < 2) {
      if (game.gameLoop) {
        clearInterval(game.gameLoop);
        game.gameLoop = null;
      }
      
      game.state = "waiting";
      this.io.to(gameId).emit('gameState', { state: game.state });
    }
  }

  /**
   * Get all active games
   */
  getActiveGames(): { id: string; playerCount: number }[] {
    const activeGames: { id: string; playerCount: number }[] = [];
    
    this.games.forEach((game, id) => {
      activeGames.push({
        id,
        playerCount: game.players.length
      });
    });
    
    return activeGames;
  }

  /**
   * Get all players in a game
   */
  getPlayersInGame(gameId: string): Player[] {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    return game.players;
  }
}
