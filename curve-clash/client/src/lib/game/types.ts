// Game state enum
export enum GameState {
  WAITING = 'waiting',
  STARTING = 'starting',
  PLAYING = 'playing',
  ROUND_OVER = 'roundOver',
  GAME_OVER = 'gameOver'
}

// Player interface
export interface Player {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  angle: number;
  alive: boolean;
  score: number;
  trail: Point[];
  gap?: boolean;
  gapTimer?: number;
}

// Point interface
export interface Point {
  x: number;
  y: number;
  gap?: boolean;
}

// Direction type
export type Direction = 'left' | 'right' | 'none';