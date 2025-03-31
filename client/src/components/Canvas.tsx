import { useEffect, useRef } from 'react';
import useGameStore from '../lib/stores/useGameStore';
import { drawPlayer, clearCanvas } from '../lib/game/utils';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../lib/game/constants';

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    gameState,
    players,
    localPlayer,
    socket,
    updatePlayerDirection,
    clearPlayers,
  } = useGameStore();

  useEffect(() => {
    // Reset canvas when game state changes to 'playing'
    if (gameState === 'playing') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          clearCanvas(ctx);
        }
      }
    }
  }, [gameState]);

  // Handle player movements from the server and update the canvas
  useEffect(() => {
    if (!socket) return;

    const handleGameState = (gameState: any) => {
      // Update the local game state with the server's game state
      if (gameState.players) {
        for (const player of gameState.players) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              drawPlayer(ctx, player);
            }
          }
        }
      }
    };

    // When a new round starts, clear the canvas
    const handleNewRound = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          clearCanvas(ctx);
        }
      }
    };

    socket.on('gameState', handleGameState);
    socket.on('newRound', handleNewRound);

    return () => {
      socket.off('gameState', handleGameState);
      socket.off('newRound', handleNewRound);
    };
  }, [socket, clearPlayers]);

  // Handle keyboard inputs
  // Previously we had keyboard event handlers here, but they have been moved to
  // App.tsx and Controls.tsx to avoid multiple handlers competing for the same events.
  // This helps ensure that keyboard controls work consistently.

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border border-gray-700 bg-black w-full h-full"
      tabIndex={0}
    />
  );
};

export default Canvas;
