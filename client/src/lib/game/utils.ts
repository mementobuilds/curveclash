import { Player, Point } from "./types";
import { LINE_WIDTH, CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";

/**
 * Draw a player's line on the canvas
 */
export const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
  if (!player.isAlive) return;
  
  ctx.strokeStyle = player.color;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  // Draw the line segments if there are points
  if (player.points.length >= 2) {
    for (let i = 1; i < player.points.length; i++) {
      const prevPoint = player.points[i - 1];
      const currentPoint = player.points[i];
      
      // Skip if this is a gap
      if (
        prevPoint.x === -1 && prevPoint.y === -1 || 
        currentPoint.x === -1 && currentPoint.y === -1
      ) {
        continue;
      }
      
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }
  }
  
  // Draw the player's current position as a dot (slightly larger during countdown)
  if (player.x >= 0 && player.y >= 0) {
    // If no points or very few points, this player might be in countdown state
    // Make the indicator dot larger for better visibility
    const dotSize = player.points.length < 5 ? LINE_WIDTH * 1.5 : LINE_WIDTH / 2;
    
    ctx.beginPath();
    ctx.arc(player.x, player.y, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    
    // Add a direction indicator - a small line showing which way the player is pointing
    const indicatorLength = LINE_WIDTH * 2;
    const endX = player.x + Math.cos(player.angle) * indicatorLength;
    const endY = player.y + Math.sin(player.angle) * indicatorLength;
    
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
};

/**
 * Clear the canvas
 */
export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};

/**
 * Check if a point is within the canvas boundaries
 */
export const isPointInBounds = (x: number, y: number): boolean => {
  return x >= 0 && x <= CANVAS_WIDTH && y >= 0 && y <= CANVAS_HEIGHT;
};

/**
 * Calculate distance between two points
 */
export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Distribute players evenly around a circle
 */
export const calculateStartPositions = (
  numPlayers: number, 
  centerX: number = CANVAS_WIDTH / 2, 
  centerY: number = CANVAS_HEIGHT / 2,
  radius: number = 200
): Array<{ x: number, y: number, angle: number }> => {
  const positions = [];
  
  for (let i = 0; i < numPlayers; i++) {
    // Calculate position on the circle
    const angle = (i / numPlayers) * Math.PI * 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    // Calculate angle to point toward center
    const angleToCenter = Math.atan2(centerY - y, centerX - x);
    
    positions.push({
      x,
      y,
      angle: angleToCenter
    });
  }
  
  return positions;
};
