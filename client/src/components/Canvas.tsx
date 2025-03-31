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
  useEffect(() => {
    if (!socket || !localPlayer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        updatePlayerDirection('left');
        socket.emit('changeDirection', { direction: 'left' });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        updatePlayerDirection('right');
        socket.emit('changeDirection', { direction: 'right' });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (
        (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') ||
        (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D')
      ) {
        updatePlayerDirection('none');
        socket.emit('changeDirection', { direction: 'none' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, localPlayer, socket, updatePlayerDirection]);

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
