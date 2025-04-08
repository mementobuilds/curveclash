// Export server-side components
export { GameServer } from './server/gameServer';
export { GameManager } from './server/game/gameManager';
export { PlayerManager } from './server/game/playerManager';

// Export client-side components
export { default as CurveClash } from './client/src/CurveClash';

// Export types
export type { GameServerOptions } from './server/gameServer';
export type { GameState, Player, Point, Direction } from './client/src/lib/game/types';