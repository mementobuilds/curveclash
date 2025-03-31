// Canvas dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Game settings
export const GAME_SPEED = 2; // Base movement speed
export const LINE_WIDTH = 4; // Thickness of the player lines
export const TURN_SPEED = 0.08; // Radians per frame
export const GAP_FREQUENCY = 300; // Gap every N frames
export const GAP_DURATION = 15; // Gap lasts for N frames
export const INITIAL_HOLE_PERIOD = 120; // Number of frames before first gap appears

// Player settings
export const PLAYER_START_DISTANCE = 200; // Distance from center when spawning
export const MAX_PLAYERS = 6;
export const WIN_SCORE = 5; // Score needed to win the game

// Player colors
export const PLAYER_COLORS = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
];

// Game states
export const COUNTDOWN_DURATION = 3; // Seconds
export const ROUND_END_DURATION = 3; // Seconds
