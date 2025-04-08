import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../lib/stores/useGameStore';
import { useAudio } from '../lib/stores/useAudio';
import { GameState, Player } from '../lib/game/types';

interface GameProps {
  canvasWidth?: number;
  canvasHeight?: number;
}

const Game: React.FC<GameProps> = ({
  canvasWidth = 800,
  canvasHeight = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socket = useGameStore(state => state.socket);
  const players = useGameStore(state => state.players);
  const gameState = useGameStore(state => state.gameState);
  const playerId = useGameStore(state => state.playerId);
  const countdown = useGameStore(state => state.countdown);
  const roundWinner = useGameStore(state => state.roundWinner);
  const gameWinner = useGameStore(state => state.gameWinner);
  const playSound = useAudio(state => state.playSound);

  // Game rendering
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // Draw player trails
    players.forEach(player => {
      // Skip if no trail points
      if (player.trail.length <= 1) return;
      
      // Set line style based on player color
      ctx.strokeStyle = player.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Draw trail segments
      for (let i = 1; i < player.trail.length; i++) {
        // Skip drawing if gap is active
        if (player.trail[i].gap) continue;
        
        const prevPoint = player.trail[i - 1];
        const currentPoint = player.trail[i];
        
        // Skip if the previous point was a gap
        if (prevPoint.gap) continue;
        
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
      }
      
      // Draw player head (only for alive players)
      if (player.alive) {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Game state overlays
    if (gameState === GameState.STARTING) {
      // Countdown overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2);
    } else if (gameState === GameState.ROUND_OVER) {
      // Round over overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (roundWinner) {
        // Get winner info
        const winner = players.find(p => p.id === roundWinner);
        if (winner) {
          ctx.fillText(
            `${winner.name} wins the round!`,
            canvas.width / 2,
            canvas.height / 2 - 40
          );
        }
      } else {
        ctx.fillText(
          'Round over!',
          canvas.width / 2,
          canvas.height / 2 - 40
        );
      }
      
      ctx.font = '24px Arial';
      ctx.fillText(
        'Next round starting...',
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    } else if (gameState === GameState.GAME_OVER) {
      // Game over overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (gameWinner) {
        // Get winner info
        const winner = players.find(p => p.id === gameWinner);
        if (winner) {
          ctx.fillText(
            `${winner.name} wins the game!`,
            canvas.width / 2,
            canvas.height / 2 - 40
          );
        }
      } else {
        ctx.fillText(
          'Game over!',
          canvas.width / 2,
          canvas.height / 2 - 40
        );
      }
      
      ctx.font = '24px Arial';
      ctx.fillText(
        'Thanks for playing Curve Clash!',
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }
  }, [canvasWidth, canvasHeight, players, gameState, countdown, roundWinner, gameWinner]);
  
  // Game state sound effects
  useEffect(() => {
    // Play round start sound
    if (gameState === GameState.STARTING && countdown === 3) {
      playSound('countdown');
    }
    
    // Play round end sound
    if (gameState === GameState.ROUND_OVER) {
      playSound('round_end');
      
      // Play win sound if you are the winner
      if (roundWinner === playerId) {
        playSound('win');
      }
    }
    
    // Play game over sound
    if (gameState === GameState.GAME_OVER) {
      playSound('game_over');
      
      // Play winner sound if you are the winner
      if (gameWinner === playerId) {
        playSound('victory');
      }
    }
  }, [gameState, countdown, roundWinner, gameWinner, playerId, playSound]);

  return (
    <div className="game-canvas-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          border: '1px solid #333',
          borderRadius: '4px',
          maxWidth: '100%',
          height: 'auto',
          aspectRatio: `${canvasWidth} / ${canvasHeight}`
        }}
      />
    </div>
  );
};

export default Game;