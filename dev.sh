#!/usr/bin/env bash

# FCBase Development Environment Startup Script
# This script starts the Astro development server

set -e  # Exit on error

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Start the development server
echo "🚀 Starting FCBase development server..."
pnpm run dev
