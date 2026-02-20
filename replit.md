# Curve Clash - Multiplayer Snake Game

## Overview

Curve Clash is a real-time multiplayer game inspired by the classic "Achtung die Kurve" (Curve Fever). Players control continuously moving colored curves on a canvas, steering left or right while trying to avoid collisions with walls, other players' trails, and their own trails. The application is built as a full-stack solution with both client and server components, designed for easy integration into existing applications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Radix UI components for consistent design
- **State Management**: Zustand stores for game state, audio, and player management
- **Real-time Communication**: Socket.IO client for bidirectional communication
- **Build Tool**: Vite with custom configuration for client-side bundling
- **3D Graphics**: Three.js with React Three Fiber for enhanced visual effects
- **Canvas Rendering**: HTML5 Canvas for game graphics with manual drawing utilities

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Real-time Communication**: Socket.IO server for handling multiplayer connections
- **Game Logic**: Custom game manager with collision detection and player management
- **Session Management**: In-memory storage for development, designed for database integration
- **API Structure**: RESTful endpoints with Socket.IO event handlers

### Modular Package Structure
The application includes a separate `curve-clash` package that can be distributed as a standalone NPM module, allowing easy integration into other applications.

## Key Components

### Game Engine
- **Game Manager**: Orchestrates multiple concurrent games, handles game lifecycle
- **Player Manager**: Manages player states, directions, and scoring
- **Collision Detection**: Real-time collision checking against boundaries, other players, and self
- **Game Loop**: Server-side game loop running at consistent intervals for smooth gameplay

### Client Components
- **Canvas**: Custom HTML5 canvas rendering system for smooth game graphics
- **Lobby**: Player matching and game creation interface
- **Waiting Room**: Pre-game lobby with player list and game settings
- **Mobile Controls**: Touch-optimized controls for mobile devices
- **Global Controls**: Unified input handling system for keyboard and touch events

### UI System
- **Radix UI**: Comprehensive component library for accessible UI elements
- **Responsive Design**: Mobile-first approach with touch controls
- **Audio System**: Sound effects with mute/unmute functionality
- **Toast Notifications**: User feedback system using Sonner

## Data Flow

### Game Session Flow
1. **Connection**: Client establishes Socket.IO connection
2. **Lobby**: Player enters name, selects color, creates/joins game
3. **Waiting Room**: Players gather, game settings configured
4. **Game Start**: Server initializes game state, starts game loop
5. **Gameplay**: Real-time input processing and state synchronization
6. **Collision Detection**: Server validates moves and handles collisions
7. **Scoring**: Round/game completion triggers score updates
8. **Game End**: Final scores displayed, option to restart

### Input Processing
1. **Input Capture**: Global controls manager captures keyboard/touch input
2. **Direction Change**: Input translated to left/right/none directions
3. **Socket Emission**: Direction sent to server via Socket.IO
4. **Server Processing**: Game manager updates player direction
5. **State Broadcast**: Updated game state sent to all clients
6. **Canvas Update**: Client renders new positions on canvas

## External Dependencies

### Core Dependencies
- **Database**: Drizzle ORM configured for PostgreSQL with Neon serverless
- **Real-time**: Socket.IO for bidirectional communication
- **UI Framework**: React with Radix UI components
- **Styling**: Tailwind CSS with custom configuration
- **Build Tools**: Vite, esbuild for production builds
- **3D Graphics**: Three.js ecosystem for enhanced visuals

### Development Tools
- **TypeScript**: Full type safety across client and server
- **ESLint/Prettier**: Code formatting and linting
- **tsx**: TypeScript execution for development server

## Deployment Strategy

### Development Environment
- **Dev Server**: tsx for TypeScript execution
- **Hot Reload**: Vite HMR with custom error overlay
- **CORS**: Configured for development cross-origin requests

### Production Build
- **Client Build**: Vite builds optimized static assets
- **Server Build**: esbuild bundles server code with external packages
- **Asset Handling**: Support for GLTF models, audio files, and textures
- **Database Migration**: Drizzle kit for schema management

### Environment Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **Socket.IO**: Configurable CORS origins for different environments
- **Port Configuration**: Flexible port assignment for deployment platforms

## Changelog
- February 20, 2026. Integrated Bedrock Passport (Orange ID) authentication with Google and Apple login. Added user profile display (display name + picture) in lobby, waiting room, and scoreboard.
- June 30, 2025. Initial setup

## Authentication
- **Provider**: Bedrock Passport (Orange ID) via `@bedrock_org/passport`
- **Login Methods**: Google, Apple, Email
- **Required Environment Variables**:
  - `VITE_TENANT_ID` - Bedrock Passport tenant ID (from https://developer.orangeweb3.com/)
  - `VITE_SUBSCRIPTION_KEY` - Bedrock Passport API key
  - `VITE_WALLET_CONNECT_ID` - WalletConnect project ID
  - `VITE_AUTH_CALLBACK_URL` - Auth callback URL (auto-set to `{origin}/auth/callback`)
  - `VITE_BASE_URL` - API base URL (set to `https://api.bedrockpassport.com`)
- **Auth Flow**: User must sign in before accessing the game lobby. After login, display name and profile picture are shown in the lobby, waiting room, and scoreboard.

## User Preferences

Preferred communication style: Simple, everyday language.