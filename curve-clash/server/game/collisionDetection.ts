import { Player, Point } from "../../client/src/lib/game/types";
import { LINE_WIDTH } from "../../client/src/lib/game/constants";

/**
 * Check for collisions between players and boundaries
 */
export function checkCollisions(players: Player[], canvasWidth: number, canvasHeight: number): Player[] {
  // Filter out players that have collided with anything
  return players.filter(player => {
    // Skip players that are already out
    if (!player.isAlive) return false;
    
    // Get the player's current position
    const { x, y } = player;
    
    // Check for boundary collisions
    if (x <= 0 || x >= canvasWidth || y <= 0 || y >= canvasHeight) {
      return false;
    }
    
    // Check for collisions with other players' lines
    for (const otherPlayer of players) {
      // Skip checking against self or players that are out
      if (otherPlayer.id === player.id || !otherPlayer.isAlive) continue;
      
      // Check for collision with other player's line segments
      const points = otherPlayer.points;
      
      for (let i = 1; i < points.length; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        
        // Skip gaps in the line
        if (
          prevPoint.x === -1 && prevPoint.y === -1 || 
          currentPoint.x === -1 && currentPoint.y === -1
        ) {
          continue;
        }
        
        // Check if the player's position collides with this line segment
        if (linePointCollision(prevPoint, currentPoint, { x, y }, LINE_WIDTH / 2)) {
          return false;
        }
      }
    }
    
    // Check for collisions with the player's own line segments
    // Skip the last few segments to prevent immediate self-collision
    const safeSegmentCount = 10; // Adjust this value as needed
    const points = player.points;
    
    if (points.length > safeSegmentCount) {
      for (let i = 1; i < points.length - safeSegmentCount; i++) {
        const prevPoint = points[i - 1];
        const currentPoint = points[i];
        
        // Skip gaps in the line
        if (
          prevPoint.x === -1 && prevPoint.y === -1 || 
          currentPoint.x === -1 && currentPoint.y === -1
        ) {
          continue;
        }
        
        // Check if the player's position collides with this line segment
        if (linePointCollision(prevPoint, currentPoint, { x, y }, LINE_WIDTH / 2)) {
          return false;
        }
      }
    }
    
    // No collisions found, player is still alive
    return true;
  });
}

/**
 * Check if a point is colliding with a line segment
 */
function linePointCollision(lineStart: Point, lineEnd: Point, point: Point, threshold: number): boolean {
  // Calculate the distance from the point to the line segment
  const distance = distanceToLineSegment(lineStart, lineEnd, point);
  
  // Check if the distance is less than the threshold
  return distance < threshold;
}

/**
 * Calculate the distance from a point to a line segment
 */
function distanceToLineSegment(lineStart: Point, lineEnd: Point, point: Point): number {
  const { x: x1, y: y1 } = lineStart;
  const { x: x2, y: y2 } = lineEnd;
  const { x, y } = point;
  
  // Calculate the squared length of the line segment
  const lengthSquared = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  
  // If the line segment is actually a point, return the distance to that point
  if (lengthSquared === 0) return Math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1));
  
  // Calculate the projection of the point onto the line
  const t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
  
  // Calculate the closest point on the line segment
  const projectionX = x1 + t * (x2 - x1);
  const projectionY = y1 + t * (y2 - y1);
  
  // Return the distance from the point to the closest point on the line segment
  return Math.sqrt((x - projectionX) * (x - projectionX) + (y - projectionY) * (y - projectionY));
}
