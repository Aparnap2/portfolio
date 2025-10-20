import { 
  Client, 
  Events, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  ChatInputCommandInteraction,
  ActivityType,
  Collection
} from 'discord.js';
import { DiscordLogger, DiscordMetrics, BotMaintenance, rateLimitCheck } from './utils';
import { CommandHandler } from './commands';
import { DiscordConfig, CommandResult, BotHealthCheck } from './types';
import * as Sentry from '@sentry/nextjs';

export class DiscordBot {
  private client: Client;
  private config: DiscordConfig;
  private logger: DiscordLogger;
  private metrics: DiscordMetrics;
  private maintenance: BotMaintenance;
  private commandHandler: CommandHandler;
  private isShuttingDown = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config?: Partial<DiscordConfig>) {
    this.config = {
      token: process.env.DISCORD_BOT_TOKEN!,
      clientId: process.env.DISCORD_APP_ID!,
      serverId: process.env.DISCORD_SERVER_ID,
      publicKey: process.env.DISCORD_PUBLIC_KEY,
      logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      enableMetrics: process.env.NODE_ENV === 'production',
      ...config,
    };

    this.logger = DiscordLogger.getInstance(this.config.logLevel);
    this.metrics = DiscordMetrics.getInstance();
    this.maintenance = BotMaintenance.getInstance();
    this.commandHandler = new CommandHandler();

    this.validateConfig();

    // Initialize Discord client
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventListeners();
    this.setupGracefulShutdown();
  }

  private validateConfig(): void {
    if (!this.config.token) {
      throw new Error('DISCORD_BOT_TOKEN is required');
    }
    if (!this.config.clientId) {
      throw new Error('DISCORD_APP_ID is required');
    }

    this.logger.debug('Discord config validated', {
      hasToken: !!this.config.token,
      hasClientId: !!this.config.clientId,
      hasServerId: !!this.config.serverId,
      logLevel: this.config.logLevel,
      enableMetrics: this.config.enableMetrics,
    });
  }

  private setupEventListeners(): void {
    // Ready event
    this.client.once(Events.ClientReady, async (readyClient) => {
      this.logger.info(`Logged in as ${readyClient.user.tag}`, {
        userId: readyClient.user.id,
        guilds: readyClient.guilds.cache.size,
      });

      // Set bot activity
      readyClient.user.setActivity('AI Audits | /help', {
        type: ActivityType.Playing,
      });

      // Update metrics
      this.metrics.incrementCounter('guilds', readyClient.guilds.cache.size);
      
      // Start health checks
      this.startHealthChecks();
      
      // Start cleanup tasks
      this.startCleanupTasks();

      // Send startup notification
      if (process.env.NODE_ENV === 'production') {
        this.sendStartupNotification(readyClient);
      }
    });

    // Guild join event
    this.client.on(Events.GuildCreate, async (guild) => {
      this.logger.info(`Joined new guild: ${guild.name}`, {
        guildId: guild.id,
        memberCount: guild.memberCount,
      });
      
      this.metrics.incrementCounter('guilds_joined');
    });

    // Guild leave event
    this.client.on(Events.GuildDelete, async (guild) => {
      this.logger.info(`Left guild: ${guild.name}`, {
        guildId: guild.id,
      });
      
      this.metrics.incrementCounter('guilds_left');
    });

    // Error handling
    this.client.on('error', (error) => {
      this.logger.error('Discord client error', error);
      Sentry.captureException(error, { tags: { component: 'discord', event: 'client_error' } });
    });

    this.client.on(Events.Warn, (warning) => {
      this.logger.warn('Discord client warning', { warning });
    });

    this.client.on(Events.Debug, (message) => {
      this.logger.debug('Discord debug', { message });
    });

    // Rate limit handling
    this.client.on(Events.RateLimit, (rateLimitInfo) => {
      this.logger.warn('Rate limit hit', {
        route: rateLimitInfo.route,
        timeout: rateLimitInfo.timeout,
        global: rateLimitInfo.global,
      });
    });

    // Interaction create (slash commands)
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      try {
        // Apply rate limiting
        const rateLimitResult = await rateLimitCheck(interaction.user.id);
        
        if (!rateLimitResult.allowed) {
          await interaction.reply({
            content: `❌ Rate limit exceeded. Please try again <t:${Math.floor(rateLimitResult.resetTime / 1000)}:R>.`,
            ephemeral: true,
          });
          return;
        }

        await this.handleInteraction(interaction);
        
      } catch (error) {
        this.logger.error('Error handling interaction', error as Error, {
          command: interaction.commandName,
          userId: interaction.user.id,
          guildId: interaction.guildId,
        });

        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ An unexpected error occurred. Please try again later.',
            ephemeral: true,
          });
        }
      }
    });
  }

  private async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
    const result = await this.commandHandler.executeCommand(interaction);
    
    if (!result.success && !interaction.replied) {
      await interaction.reply({
        content: result.error || 'Command failed to execute',
        ephemeral: true,
      });
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      this.logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        // Stop health checks
        if (this.healthCheckInterval) {
          clearInterval(this.healthCheckInterval);
        }
        if (this.cleanupInterval) {
          clearInterval(this.cleanupInterval);
        }

        // Update bot activity
        if (this.client.isReady()) {
          this.client.user?.setActivity('Shutting down...', { type: ActivityType.Playing });
          
          // Send shutdown notification in production
          if (process.env.NODE_ENV === 'production') {
            await this.sendShutdownNotification();
          }
        }

        // Destroy Discord client
        this.client.destroy();
        
        this.logger.info('Bot shutdown complete');
        process.exit(0);
        
      } catch (error) {
        this.logger.error('Error during shutdown', error as Error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection', new Error(String(reason)), { promise });
    });
  }

  private startHealthChecks(): void {
    // Run health check every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.maintenance.performHealthCheck();
        
        if (health.status !== 'healthy') {
          this.logger.warn('Bot health degraded', health);
          
          if (process.env.NODE_ENV === 'production' && health.status === 'unhealthy') {
            await this.sendHealthAlert(health);
          }
        }
      } catch (error) {
        this.logger.error('Health check failed', error as Error);
      }
    }, 5 * 60 * 1000);
  }

  private startCleanupTasks(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.maintenance.cleanupOldMetrics();
      } catch (error) {
        this.logger.error('Cleanup task failed', error as Error);
      }
    }, 60 * 60 * 1000);
  }

  private async sendStartupNotification(client: Client): Promise<void> {
    try {
      this.logger.info('Bot started successfully', {
        tag: client.user.tag,
        id: client.user.id,
        guilds: client.guilds.cache.size,
      });
    } catch (error) {
      this.logger.error('Failed to send startup notification', error as Error);
    }
  }

  private async sendShutdownNotification(): Promise<void> {
    try {
      this.logger.info('Bot shutting down');
    } catch (error) {
      this.logger.error('Failed to send shutdown notification', error as Error);
    }
  }

  private async sendHealthAlert(health: BotHealthCheck): Promise<void> {
    try {
      const level = health.status === 'unhealthy' ? 'error' : 'warning';
      const message = `Bot health status: ${health.status.toUpperCase()}\n` +
                     `Uptime: ${Math.floor(health.uptime / 60)} minutes\n` +
                     `Latency: ${health.latency}ms\n` +
                     `Memory: ${Math.round(health.memoryUsage.heapUsed / 1024 / 1024)}MB\n` +
                     `Errors (1h): ${health.errorsInLastHour}`;

      const { sendDiscordSystemAlert } = await import('../integrations/discord');
      await sendDiscordSystemAlert(message, level);
      
    } catch (error) {
      this.logger.error('Failed to send health alert', error as Error);
    }
  }

  public async registerCommands(): Promise<void> {
    if (!this.config.serverId) {
      this.logger.warn('Server ID not provided, skipping command registration');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(this.config.token);
    const commands = this.commandHandler.getCommandData();

    try {
      this.logger.info(`Refreshing ${commands.length} application commands`);
      
      await rest.put(
        Routes.applicationGuildCommands(this.config.clientId, this.config.serverId),
        { body: commands },
      );

      this.logger.info('Successfully registered application commands');
    } catch (error) {
      this.logger.error('Error registering commands', error as Error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      this.logger.info('Starting Discord bot...');

      // Register commands first
      await this.registerCommands();
      
      // Login to Discord
      await this.client.login(this.config.token);
      
      this.logger.info('Discord bot started successfully');
    } catch (error) {
      this.logger.error('Failed to start Discord bot', error as Error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    this.logger.info('Stopping Discord bot...');
    
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Destroy client
    this.client.destroy();
    
    this.logger.info('Discord bot stopped');
  }

  public getClient(): Client {
    return this.client;
  }

  public isReady(): boolean {
    return this.client.isReady();
  }

  public getConfig(): DiscordConfig {
    return { ...this.config };
  }

  public async getHealthStatus(): Promise<BotHealthCheck> {
    return this.maintenance.performHealthCheck();
  }

  public async getStats(): Promise<any> {
    return this.maintenance.getBotStats();
  }

  public getLogger(): DiscordLogger {
    return this.logger;
  }

  public getMetrics(): DiscordMetrics {
    return this.metrics;
  }

  public getCommands(): any[] {
    return this.commandHandler.getCommandData();
  }
}

// Singleton instance for the application
let botInstance: DiscordBot | null = null;

export function getDiscordBot(config?: Partial<DiscordConfig>): DiscordBot {
  if (!botInstance) {
    botInstance = new DiscordBot(config);
  }
  return botInstance;
}

export function createDiscordBot(config?: Partial<DiscordConfig>): DiscordBot {
  botInstance = new DiscordBot(config);
  return botInstance;
}

// Reset singleton (useful for testing)
export function resetDiscordBot(): void {
  if (botInstance) {
    botInstance.stop().catch(console.error);
    botInstance = null;
  }
}
