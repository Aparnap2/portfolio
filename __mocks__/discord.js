// Mock Discord.js with comprehensive implementation
const EventEmitter = require('events');

// Mock Intents as numbers
const Intents = {
  Guilds: 1,
  GuildMessages: 2,
  MessageContent: 4,
  GuildMembers: 8,
  DirectMessages: 16,
  GuildMessageReactions: 32,
  GuildMessageTyping: 64,
  DirectMessageReactions: 128,
  DirectMessageTyping: 256,
  GuildPresences: 512,
  GuildScheduledEvents: 1024,
  GuildBans: 2048,
  GuildEmojisAndStickers: 4096,
  GuildIntegrations: 8192,
  GuildWebhooks: 16384,
  GuildInvites: 32768,
  GuildVoiceStates: 65536,
  GuildExpressions: 131072,
  AutoModerationConfiguration: 262144,
  AutoModerationExecution: 524288,
  GuildMessagePolls: 1048576,
  DirectMessagePolls: 2097152,
  // Non-privileged intents
  GuildScheduledEvents: 1024,
  // Default intents
  Default: 32509, // Guilds | GuildMessages | MessageContent | GuildMessageReactions | DirectMessages
  // Privileged intents
  NonPrivileged: 32509, // Same as Default
  Privileged: 0, // No privileged intents by default
  // All intents
  All: 131071, // All intents except AutoModeration
  AllPrivileged: 131071, // All intents including privileged
  // AutoModeration intents
  AutoModeration: 786432, // AutoModerationConfiguration | AutoModerationExecution
  // Message content intents
  MessageContent: 4,
  // Guild member intents
  GuildMembers: 8,
  // Guild presence intents
  GuildPresences: 512,
};

// Mock Client class
class MockClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.token = null;
    this.user = null;
    this.application = null;
    this.readyAt = null;
    this.uptime = 0;
    this.ws = {
      ping: 0,
      status: 0,
      shard: null,
    };
    this.guilds = new Map();
    this.channels = new Map();
    this.users = new Map();
    this.emojis = new Map();
    this.stickers = new Map();
    this.voiceStates = new Map();
    this.presences = new Map();
    
    // Mock login method
    this.login = jest.fn().mockImplementation((token) => {
      this.token = token;
      this.user = {
        id: '123456789',
        username: 'TestBot',
        discriminator: '0001',
        avatar: null,
        bot: true,
        system: false,
        flags: 0,
      };
      this.readyAt = new Date();
      this.uptime = 0;
      
      // Simulate successful login
      setTimeout(() => {
        this.emit('ready');
      }, 100);
      
      return Promise.resolve(this.token);
    });
    
    // Mock destroy method
    this.destroy = jest.fn().mockImplementation(() => {
      this.token = null;
      this.user = null;
      this.readyAt = null;
      this.uptime = 0;
      this.removeAllListeners();
      return Promise.resolve();
    });
    
    // Mock other methods
    this.on = jest.fn((event, listener) => {
      super.on(event, listener);
      return this;
    });
    
    this.once = jest.fn((event, listener) => {
      super.once(event, listener);
      return this;
    });
    
    this.emit = jest.fn((event, ...args) => {
      super.emit(event, ...args);
      return this;
    });
    
    this.off = jest.fn((event, listener) => {
      super.off(event, listener);
      return this;
    });
    
    this.removeAllListeners = jest.fn((event) => {
      super.removeAllListeners(event);
      return this;
    });
  }
  
  // Mock additional client methods
  isReady() {
    return this.readyAt !== null;
  }
  
  uptime() {
    return this.readyAt ? Date.now() - this.readyAt.getTime() : 0;
  }
  
  ping() {
    return this.ws.ping;
  }
  
  status() {
    return this.ws.status;
  }
  
  fetchGuilds() {
    return Promise.resolve([]);
  }
  
  fetchUser(id) {
    return Promise.resolve({
      id,
      username: 'TestUser',
      discriminator: '0001',
      avatar: null,
      bot: false,
      system: false,
      flags: 0,
    });
  }
  
  fetchChannel(id) {
    return Promise.resolve({
      id,
      type: 0, // Text channel
      name: 'test-channel',
      topic: null,
      nsfw: false,
      position: 0,
      permissionOverwrites: [],
      rateLimitPerUser: 0,
      parentID: null,
      lastMessageID: null,
    });
  }
}

// Mock Collection class
class MockCollection extends Map {
  constructor(...args) {
    super(...args);
  }
  
  get(key) {
    return super.get(key);
  }
  
  set(key, value) {
    return super.set(key, value);
  }
  
  has(key) {
    return super.has(key);
  }
  
  delete(key) {
    return super.delete(key);
  }
  
  clear() {
    return super.clear();
  }
  
  size() {
    return super.size;
  }
  
  forEach(callback) {
    return super.forEach(callback);
  }
  
  map(callback) {
    return Array.from(this.values()).map(callback);
  }
  
  filter(callback) {
    return Array.from(this.values()).filter(callback);
  }
  
  find(callback) {
    return Array.from(this.values()).find(callback);
  }
  
  first() {
    return this.values().next().value;
  }
  
  last() {
    const values = Array.from(this.values());
    return values[values.length - 1];
  }
  
  random() {
    const values = Array.from(this.values());
    return values[Math.floor(Math.random() * values.length)];
  }
  
  array() {
    return Array.from(this.values());
  }
  
  keyArray() {
    return Array.from(this.keys());
  }
}

// Mock Message class
class MockMessage {
  constructor(client, data = {}) {
    this.client = client;
    this.id = data.id || '123456789';
    this.channelId = data.channelId || '987654321';
    this.guildId = data.guildId || '555666777';
    this.author = data.author || {
      id: '123456789',
      username: 'TestUser',
      discriminator: '0001',
      avatar: null,
      bot: false,
      system: false,
      flags: 0,
    };
    this.content = data.content || 'Test message';
    this.createdAt = data.createdAt || new Date();
    this.editedAt = data.editedAt || null;
    this.tts = data.tts || false;
    this.mentionEveryone = data.mentionEveryone || false;
    this.mentions = data.mentions || [];
    this.mentionRoles = data.mentionRoles || [];
    this.mentionChannels = data.mentionChannels || [];
    this.attachments = data.attachments || [];
    this.embeds = data.embeds || [];
    this.reactions = data.reactions || new MockCollection();
    this.pinned = data.pinned || false;
    this.webhookId = data.webhookId || null;
    this.type = data.type || 0;
    this.activity = data.activity || null;
    this.application = data.application || null;
    this.messageReference = data.messageReference || null;
    this.flags = data.flags || 0;
    this.crossposted = data.crossposted || false;
    this.referencedMessage = data.referencedMessage || null;
    this.interaction = data.interaction || null;
    this.cleanContent = data.cleanContent || this.content;
    this.member = data.member || null;
    
    // Mock methods
    this.reply = jest.fn().mockImplementation((options) => {
      if (typeof options === 'string') {
        options = { content: options };
      }
      return Promise.resolve(new MockMessage(client, {
        ...options,
        author: client.user,
        channelId: this.channelId,
      }));
    });
    
    this.edit = jest.fn().mockImplementation((options) => {
      if (typeof options === 'string') {
        this.content = options;
      } else {
        Object.assign(this, options);
      }
      this.editedAt = new Date();
      return Promise.resolve(this);
    });
    
    this.delete = jest.fn().mockImplementation(() => {
      return Promise.resolve();
    });
    
    this.react = jest.fn().mockImplementation((emoji) => {
      return Promise.resolve();
    });
    
    this.pin = jest.fn().mockImplementation(() => {
      this.pinned = true;
      return Promise.resolve();
    });
    
    this.unpin = jest.fn().mockImplementation(() => {
      this.pinned = false;
      return Promise.resolve();
    });
  }
}

// Mock Guild class
class MockGuild {
  constructor(client, data = {}) {
    this.client = client;
    this.id = data.id || '555666777';
    this.name = data.name || 'Test Guild';
    this.icon = data.icon || null;
    this.description = data.description || null;
    this.ownerId = data.ownerId || '123456789';
    this.memberCount = data.memberCount || 1;
    this.large = data.large || false;
    this.features = data.features || [];
    this.emojis = data.emojis || new MockCollection();
    this.stickers = data.stickers || new MockCollection();
    this.voiceStates = data.voiceStates || new MockCollection();
    this.presences = data.presences || new MockCollection();
    this.channels = data.channels || new MockCollection();
    this.members = data.members || new MockCollection();
    this.roles = data.roles || new MockCollection();
    this.createdAt = data.createdAt || new Date();
  }
}

// Mock Channel class
class MockChannel {
  constructor(client, data = {}) {
    this.client = client;
    this.id = data.id || '987654321';
    this.type = data.type || 0; // Text channel
    this.guildId = data.guildId || '555666777';
    this.name = data.name || 'test-channel';
    this.topic = data.topic || null;
    this.nsfw = data.nsfw || false;
    this.position = data.position || 0;
    this.permissionOverwrites = data.permissionOverwrites || [];
    this.rateLimitPerUser = data.rateLimitPerUser || 0;
    this.parentId = data.parentId || null;
    this.lastMessageId = data.lastMessageId || null;
    this.createdAt = data.createdAt || new Date();
    
    // Mock methods
    this.send = jest.fn().mockImplementation((options) => {
      if (typeof options === 'string') {
        options = { content: options };
      }
      return Promise.resolve(new MockMessage(client, {
        ...options,
        author: client.user,
        channelId: this.id,
      }));
    });
    
    this.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve(this);
    });
  }
}

// Mock User class
class MockUser {
  constructor(client, data = {}) {
    this.client = client;
    this.id = data.id || '123456789';
    this.username = data.username || 'TestUser';
    this.discriminator = data.discriminator || '0001';
    this.avatar = data.avatar || null;
    this.bot = data.bot || false;
    this.system = data.system || false;
    this.flags = data.flags || 0;
    this.createdAt = data.createdAt || new Date();
  }
}

// Export all mocks
module.exports = {
  Client: MockClient,
  Intents,
  Collection: MockCollection,
  Message: MockMessage,
  Guild: MockGuild,
  Channel: MockChannel,
  User: MockUser,
  // Additional exports
  GatewayIntentBits: Intents,
  Partials: {
    User: 'USER',
    Channel: 'CHANNEL',
    Guild: 'GUILD',
    GuildMember: 'GUILD_MEMBER',
    Message: 'MESSAGE',
    Reaction: 'REACTION',
    ScheduledEvent: 'SCHEDULED_EVENT',
    ThreadMember: 'THREAD_MEMBER',
  },
  ActivityFlags: {
    Instance: 1 << 0,
    Join: 1 << 1,
    Spectate: 1 << 2,
    JoinRequest: 1 << 3,
    Sync: 1 << 4,
    Play: 1 << 5,
  },
  ActivityType: {
    Playing: 0,
    Streaming: 1,
    Listening: 2,
    Watching: 3,
    Custom: 4,
    Competing: 5,
  },
  ChannelType: {
    Text: 0,
    DM: 1,
    Voice: 2,
    GroupDM: 3,
    Category: 4,
    News: 5,
    Store: 6,
    NewsThread: 10,
    PublicThread: 11,
    PrivateThread: 12,
    StageVoice: 13,
    Directory: 14,
    Forum: 15,
  },
  MessageType: {
    Default: 0,
    RecipientAdd: 1,
    RecipientRemove: 2,
    Call: 3,
    ChannelNameChange: 4,
    ChannelIconChange: 5,
    ChannelPinnedMessage: 6,
    GuildMemberJoin: 7,
    UserPremiumGuildSubscription: 8,
    UserPremiumGuildSubscriptionTier1: 9,
    UserPremiumGuildSubscriptionTier2: 10,
    UserPremiumGuildSubscriptionTier3: 11,
    ChannelFollowAdd: 12,
    GuildDiscoveryDisqualified: 14,
    GuildDiscoveryRequalified: 15,
    GuildDiscoveryGracePeriodInitialWarning: 16,
    GuildDiscoveryGracePeriodFinalWarning: 17,
    ThreadCreated: 18,
    Reply: 19,
    ChatInputCommand: 20,
    ThreadStarterMessage: 21,
    GuildInviteReminder: 22,
    ContextMenuCommand: 23,
    AutoModerationAction: 24,
    RoleSubscriptionPurchase: 25,
    InteractionPremiumUpsell: 26,
    StageStart: 27,
    StageEnd: 28,
    StageSpeaker: 29,
    StageTopic: 31,
    GuildApplicationPremiumSubscription: 32,
  },
  // REST API
  REST: jest.fn().mockImplementation(() => ({
    setToken: jest.fn(),
    get: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({}),
    patch: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  })),
  // Webhook client
  WebhookClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
    edit: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  })),
  // Embed builder
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setURL: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setColor: jest.fn().mockReturnThis(),
    addField: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setThumbnail: jest.fn().mockReturnThis(),
    setImage: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
    setAuthor: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({}),
  })),
  // Action row builder
  ActionRowBuilder: jest.fn().mockImplementation(() => ({
    addComponents: jest.fn().mockReturnThis(),
    setComponents: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({}),
  })),
  // Button builder
  ButtonBuilder: jest.fn().mockImplementation(() => ({
    setLabel: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
    setEmoji: jest.fn().mockReturnThis(),
    setCustomId: jest.fn().mockReturnThis(),
    setURL: jest.fn().mockReturnThis(),
    setDisabled: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({}),
  })),
  // Select menu builder
  StringSelectMenuBuilder: jest.fn().mockImplementation(() => ({
    setPlaceholder: jest.fn().mockReturnThis(),
    setCustomId: jest.fn().mockReturnThis(),
    addOptions: jest.fn().mockReturnThis(),
    setMaxValues: jest.fn().mockReturnThis(),
    setMinValues: jest.fn().mockReturnThis(),
    setDisabled: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({}),
  })),
  // Modal builder
  ModalBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setCustomId: jest.fn().mockReturnThis(),
    addComponents: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({}),
  })),
  // Text input builder
  TextInputBuilder: jest.fn().mockImplementation(() => ({
    setLabel: jest.fn().mockReturnThis(),
    setStyle: jest.fn().mockReturnThis(),
    setCustomId: jest.fn().mockReturnThis(),
    setPlaceholder: jest.fn().mockReturnThis(),
    setValue: jest.fn().mockReturnThis(),
    setRequired: jest.fn().mockReturnThis(),
    setMaxLength: jest.fn().mockReturnThis(),
    setMinLength: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({}),
  })),
  // Slash command builder
  SlashCommandBuilder: jest.fn().mockImplementation(() => ({
    setName: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addStringOption: jest.fn().mockReturnThis(),
    addIntegerOption: jest.fn().mockReturnThis(),
    addBooleanOption: jest.fn().mockReturnThis(),
    addUserOption: jest.fn().mockReturnThis(),
    addChannelOption: jest.fn().mockReturnThis(),
    addRoleOption: jest.fn().mockReturnThis(),
    addMentionableOption: jest.fn().mockReturnThis(),
    addNumberOption: jest.fn().mockReturnThis(),
    addAttachmentOption: jest.fn().mockReturnThis(),
    setDefaultMemberPermissions: jest.fn().mockReturnThis(),
    setDMPermission: jest.fn().mockReturnThis(),
    setDefaultPermission: jest.fn().mockReturnThis(),
    toJSON: jest.fn().mockReturnValue({}),
  })),
  // Permission flags
  PermissionFlagsBits: {
    CreateInstantInvite: 1 << 0,
    KickMembers: 1 << 1,
    BanMembers: 1 << 2,
    Administrator: 1 << 3,
    ManageChannels: 1 << 4,
    ManageGuild: 1 << 5,
    AddReactions: 1 << 6,
    ViewAuditLog: 1 << 7,
    PrioritySpeaker: 1 << 8,
    Stream: 1 << 9,
    ViewChannel: 1 << 10,
    SendMessages: 1 << 11,
    SendTTSMessages: 1 << 12,
    ManageMessages: 1 << 13,
    EmbedLinks: 1 << 14,
    AttachFiles: 1 << 15,
    ReadMessageHistory: 1 << 16,
    MentionEveryone: 1 << 17,
    UseExternalEmojis: 1 << 18,
    ViewGuildInsights: 1 << 19,
    Connect: 1 << 20,
    Speak: 1 << 21,
    MuteMembers: 1 << 22,
    DeafenMembers: 1 << 23,
    MoveMembers: 1 << 24,
    UseVAD: 1 << 25,
    ChangeNickname: 1 << 26,
    ManageNicknames: 1 << 27,
    ManageRoles: 1 << 28,
    ManageWebhooks: 1 << 29,
    ManageEmojisAndStickers: 1 << 30,
    UseApplicationCommands: 1 << 31,
    RequestToSpeak: 1 << 32,
    ManageEvents: 1 << 33,
    ManageThreads: 1 << 34,
    CreatePublicThreads: 1 << 35,
    CreatePrivateThreads: 1 << 36,
    UseExternalStickers: 1 << 37,
    SendMessagesInThreads: 1 << 38,
    UseEmbeddedActivities: 1 << 39,
    ModerateMembers: 1 << 40,
    ViewCreatorMonetizationAnalytics: 1 << 41,
    UseSoundboard: 1 << 42,
    CreateGuildExpressions: 1 << 43,
    CreateEvents: 1 << 44,
    UseExternalSounds: 1 << 45,
    SendVoiceMessages: 1 << 46,
    SetVoiceChannelStatus: 1 << 47,
    SendPolls: 1 << 48,
    UseExternalApps: 1 << 49,
  },
};