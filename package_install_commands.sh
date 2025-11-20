#!/bin/bash

# Command to install required npm packages
# Using npm:
echo "Attempting to install packages using npm..."
npm install axios limiter

# Alternatively, if you use pnpm:
# echo "Attempting to install packages using pnpm..."
# pnpm add axios limiter

echo "Installation command executed. Please check for any errors above."
echo "If you intended to use pnpm and the above failed or you prefer pnpm, "
echo "make sure pnpm is installed and then run: pnpm add axios limiter"
