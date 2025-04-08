#!/bin/bash

echo "Building Curve Clash package..."

# Step 1: Run the package-files script to ensure all files are in place
bash package-files.sh

# Step 2: Install dependencies
echo "Installing dependencies..."
npm install

# Step 3: Build the package
echo "Building TypeScript files..."
npm run build

# Step 4: Copy additional files to dist
echo "Copying additional files to dist directory..."
cp package.json dist/
cp README.md dist/

echo "Package built successfully! The distributable package is in the 'dist' directory."
echo "You can publish it to npm using: cd dist && npm publish"