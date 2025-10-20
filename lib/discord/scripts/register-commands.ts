#!/usr/bin/env tsx

import { createDiscordBot } from '../bot';
import { DiscordLogger } from '../utils';

// Load environment variables
require('dotenv').config();

const logger = DiscordLogger.getInstance();

async function registerCommands(): Promise<void> {
  try {
    logger.info('Registering Discord slash commands...');

    // Create bot instance (without starting it)
    const bot = createDiscordBot({
      logLevel: 'info',
      enableMetrics: false,
    });

    // Register commands only
    await bot.registerCommands();

    logger.info('Commands registered successfully!');
    process.exit(0);

  } catch (error) {
    logger.error('Failed to register commands', error as Error);
    process.exit(1);
  }
}

// Register commands
registerCommands();
