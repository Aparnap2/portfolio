#!/usr/bin/env tsx

import { getDiscordBot } from '../bot';
import { DiscordLogger } from '../utils';

// Load environment variables
require('dotenv').config();

const logger = DiscordLogger.getInstance();

async function startDiscordBot(): Promise<void> {
  try {
    logger.info('Starting Discord bot from script...');

    // Create and start bot instance
    const bot = getDiscordBot({
      logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      enableMetrics: process.env.NODE_ENV === 'production',
    });

    await bot.start();

    // Handle shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down bot...`);
      await bot.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    logger.info('Discord bot is running. Press Ctrl+C to stop.');

  } catch (error) {
    logger.error('Failed to start Discord bot', error as Error);
    process.exit(1);
  }
}

// Start the bot
startDiscordBot();
