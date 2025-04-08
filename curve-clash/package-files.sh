#!/bin/bash

# Create required directories
mkdir -p curve-clash/client/src/components/ui
mkdir -p curve-clash/client/src/lib/game/
mkdir -p curve-clash/client/src/lib/stores
mkdir -p curve-clash/client/public
mkdir -p curve-clash/server/game

# Copy client files
cp -r client/src/components/* curve-clash/client/src/components/
cp -r client/src/components/ui/* curve-clash/client/src/components/ui/
cp -r client/src/lib/game/* curve-clash/client/src/lib/game/
cp -r client/src/lib/stores/* curve-clash/client/src/lib/stores/
cp client/src/lib/queryClient.ts curve-clash/client/src/lib/
cp client/src/lib/utils.ts curve-clash/client/src/lib/
cp client/src/index.css curve-clash/client/src/
cp -r client/public/* curve-clash/client/public/

# Copy server files
cp -r server/game/* curve-clash/server/game/

# Copy package files
cp package.json curve-clash/
cp tsconfig.json curve-clash/
cp vite.config.ts curve-clash/
cp tailwind.config.ts curve-clash/
cp postcss.config.js curve-clash/

echo "Files packaged successfully to curve-clash/ directory"