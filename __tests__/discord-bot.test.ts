import { createDiscordBot, resetDiscordBot } from '../lib/discord/bot';
import { DiscordLogger } from '../lib/discord/utils';
import { Client, GatewayIntentBits } from 'discord.js';

// Mock Sentry to avoid errors in tests
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

// Mock Redis functions
jest.mock('../lib/redis', () => ({
  redis: {
    ping: jest.fn().mockResolvedValue('PONG'),
    zadd: jest.fn().mockResolvedValue(1),
    zrange: jest.fn().mockResolvedValue([]),
    zcard: jest.fn().mockResolvedValue(0),
    zremrangebyrank: jest.fn().mockResolvedValue(0),
    zremrangebyscore: jest.fn().mockResolvedValue(0),
    zrangebyscore: jest.fn().mockResolvedValue([]),
    expire: jest.fn().mockResolvedValue(1),
  },
}));

describe('Discord Bot', () => {
  let bot: any;
  const mockToken = 'test-token';
  const mockClientId = 'test-client-id';
  const mockServerId = 'test-server-id';

  beforeEach(() => {
    process.env.DISCORD_BOT_TOKEN = mockToken;
    process.env.DISCORD_APP_ID = mockClientId;
    process.env.DISCORD_SERVER_ID = mockServerId;
    process.env.NODE_ENV = 'test';
    
    // Reset bot instance before each test
    resetDiscordBot();
  });

  afterEach(() => {
    resetDiscordBot();
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.DISCORD_APP_ID;
    delete process.env.DISCORD_SERVER_ID;
    delete process.env.NODE_ENV;
  });

  describe('Bot Initialization', () => {
    it('should initialize with correct intents', () => {
      bot = createDiscordBot();
      expect(bot.getClient()).toBeInstanceOf(Client);
      
      // Check that the client has the correct intents
      const client = bot.getClient();
      expect(client.options.intents).toContain(GatewayIntentBits.Guilds);
      expect(client.options.intents).toContain(GatewayIntentBits.GuildMessages);
      expect(client.options.intents).toContain(GatewayIntentBits.MessageContent);
    });

    it('should throw error if DISCORD_BOT_TOKEN is missing', () => {
      delete process.env.DISCORD_BOT_TOKEN;
      
      expect(() => createDiscordBot()).toThrow('DISCORD_BOT_TOKEN is required');
    });

    it('should create logger instance', () => {
      bot = createDiscordBot();
      expect(bot.getLogger()).toBeInstanceOf(DiscordLogger);
    });

    it('should return correct config', () => {
      bot = createDiscordBot();
      const config = bot.getConfig();
      
      expect(config.token).toBe(mockToken);
      expect(config.clientId).toBe(mockClientId);
      expect(config.serverId).toBe(mockServerId);
    });
  });

  describe('Command Registration', () => {
    it('should register ping command', async () => {
      bot = createDiscordBot();
      
      const commands = bot.getCommands();
      const pingCommand = commands.find((cmd: any) => cmd.name === 'ping');
      
      expect(pingCommand).toBeDefined();
      expect(pingCommand?.description).toBe('Check bot latency and response time');
    });

    it('should register lead alert command', async () => {
      bot = createDiscordBot();
      
      const commands = bot.getCommands();
      const leadCommand = commands.find((cmd: any) => cmd.name === 'alert-lead');
      
      expect(leadCommand).toBeDefined();
      expect(leadCommand?.description).toBe('Send a lead alert notification');
    });

    it('should register status command', async () => {
      bot = createDiscordBot();
      
      const commands = bot.getCommands();
      const statusCommand = commands.find((cmd: any) => cmd.name === 'status');
      
      expect(statusCommand).toBeDefined();
      expect(statusCommand?.description).toBe('Get detailed bot status and statistics');
    });
  });

  describe('Bot Status and Health', () => {
    beforeEach(() => {
      bot = createDiscordBot();
    });

    it('should return health status', async () => {
      const health = await bot.getHealthStatus();
      
      expect(health).toBeDefined();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('latency');
      expect(health).toHaveProperty('memoryUsage');
    });

    it('should return bot stats', async () => {
      const stats = await bot.getStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('guildCount');
      expect(stats).toHaveProperty('userCount');
      expect(stats).toHaveProperty('commandCount');
      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('memoryUsage');
    });
  });

  describe('Bot Lifecycle', () => {
    it('should be initially not ready', () => {
      bot = createDiscordBot();
      expect(bot.isReady()).toBe(false);
    });

    it('should have metrics instance', () => {
      bot = createDiscordBot();
 expect(bot.getMetrics()).toBeDefined();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const bot1 = createDiscordBot();
      const bot2 = createDiscordBot();
      expect(bot1).toBe(bot2);
    });

    it('should reset instance when called', () => {
      const bot1 = createDiscordBot();
      resetDiscordBot();
      const bot2 = createDiscordBot();
      expect(bot1).not.toBe(bot2);
    });
  });
});
