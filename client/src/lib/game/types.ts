// Player position point
export interface Point {
  x: number;
  y: number;
}

// Player data
export interface Player {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  angle: number;
  score: number;
  isAlive: boolean;
  points: Point[];
}

// Game state types
export type GameState = 
  | "lobby"      // Waiting in the lobby
  | "waiting"    // Waiting for players to join
  | "countdown"  // Countdown before starting
  | "playing"    // Game in progress
  | "roundEnd"   // Round ended, showing results
  | "gameEnd";   // Game ended, showing final results

// Direction types
export type Direction = "left" | "right" | "none";
