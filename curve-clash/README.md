# Curve Clash

A multiplayer snake-like game inspired by the classic "Achtung die Kurve" (Curve Fever). Players control continuously moving colored lines on a dark canvas, steering left or right while trying to avoid collisions with other players' lines and walls.

## Features

- Real-time multiplayer gameplay with Socket.IO
- Responsive design that works on both desktop and mobile devices
- Simple left/right controls that work with keyboard and touch
- Modular design for easy integration with existing applications
- Support for authentication integration

## Installation

```bash
npm install curve-clash
```

## Usage

### Standalone Game

```jsx
import React from 'react';
import { CurveClash } from 'curve-clash';

const StandaloneCurveClash = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <CurveClash />
    </div>
  );
};

export default StandaloneCurveClash;
```

### Integration with Authentication

```jsx
import React from 'react';
import { CurveClash, GameServer } from 'curve-clash';

// Component that integrates Curve Clash with an authenticated app
const GameIntegration = ({ user }) => {
  // Handle game end event
  const handleGameEnd = (winner) => {
    console.log(`Game ended! Winner: ${winner}`);
    // You can add analytics or save game results to your database here
  };
  
  if (!user) {
    return <div>Please log in to play</div>;
  }
  
  return (
    <div className="game-container">
      <h1>Welcome to Curve Clash, {user.username}!</h1>
      
      {/* The CurveClash component with auth integration */}
      <CurveClash 
        serverUrl={window.location.origin}
        userId={user.id}
        username={user.username}
        onGameEnd={handleGameEnd}
      />
    </div>
  );
};

export default GameIntegration;
```

### Setting up the Game Server

```js
import express from 'express';
import { GameServer } from 'curve-clash';

const app = express();

// Create and configure the game server
const gameServer = new GameServer({
  corsOrigin: process.env.FRONTEND_URL || '*',
  port: process.env.GAME_PORT || 3001,
  apiPrefix: '/api/game',
});

// Start the server
gameServer.start()
  .then(port => {
    console.log(`Game server running on port ${port}`);
  })
  .catch(err => {
    console.error('Failed to start game server:', err);
  });

// Your other express routes and middleware
app.get('/', (req, res) => {
  res.send('Main application server');
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Main server running on port ${process.env.PORT || 3000}`);
});
```

## API Reference

### CurveClash Component

| Prop | Type | Description |
|------|------|-------------|
| serverUrl | string | URL of the game server. Defaults to window.location.origin. |
| userId | string | Optional user ID from your auth system. |
| username | string | Optional username to pre-fill in the game lobby. |
| onGameEnd | function | Callback fired when a game ends. Receives winner ID as parameter. |

### GameServer Class

| Option | Type | Description |
|--------|------|-------------|
| corsOrigin | string \| string[] | CORS origin(s) to allow. Defaults to '*'. |
| port | number | Port to run the game server on. Defaults to 3001. |
| apiPrefix | string | Prefix for API routes. Defaults to '/api'. |
| customAuthMiddleware | function | Optional Express middleware for authentication. |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## License

MIT