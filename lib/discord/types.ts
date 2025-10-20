import {
  ChatInputCommandInteraction,
  GuildMember,
  User,
  Message,
  GuildTextBasedChannel
} from 'discord.js';

export interface DiscordConfig {
  token: string;
  clientId: string;
  serverId?: string;
  publicKey?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
}

export interface BotStats {
  guildCount: number;
  userCount: number;
  commandCount: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
}

export interface CommandContext {
  interaction: ChatInputCommandInteraction;
  user: User;
  member: GuildMember | null;
  guild: any;
  channel: GuildTextBasedChannel | null;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface LeadAlertData {
  sessionId: string;
  name: string;
  email: string;
  company?: string;
  painScore?: number;
  estimatedValue?: number;
  timeline?: string;
  topOpportunity?: string;
  budgetRange?: string;
  userRole?: string;
}

export interface SystemAlertData {
  message: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  context?: Record<string, any>;
  source?: string;
}

export interface AuditMetrics {
  commandName: string;
  userId: string;
  guildId: string;
  executionTime: number;
  success: boolean;
  error?: string;
}

export interface BotHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  latency: number;
  memoryUsage: NodeJS.MemoryUsage;
  guilds: number;
  commandsExecuted: number;
  errorsInLastHour: number;
}
