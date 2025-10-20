import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnly,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';
import { DiscordLogger } from './utils';
import { sendDiscordAlert, sendDiscordSystemAlert } from '../integrations/discord';
import { CommandContext, CommandResult, LeadAlertData, SystemAlertData } from './types';

const logger = DiscordLogger.getInstance();

export class CommandHandler {
  private commands = new Map<string, any>();

  constructor() {
    this.registerCommands();
  }

  private registerCommands(): void {
    // Ping command
    this.commands.set('ping', {
      data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency and response time'),
      async execute(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const startTime = Date.now();
        await interaction.reply('🏓 Pinging...');
        
        const latency = Date.now() - startTime;
        const apiLatency = Math.round(interaction.client.ws.ping);
        
        const embed = new EmbedBuilder()
          .setTitle('🏓 Pong!')
          .setColor(0x00ff00)
          .addFields(
            { name: 'Bot Latency', value: `${latency}ms`, inline: true },
            { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        
        return { success: true, data: { latency, apiLatency } };
      },
    });

    // Bot status command
    this.commands.set('status', {
      data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get detailed bot status and statistics'),
      async execute(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const { BotMaintenance } = await import('./utils');
        const maintenance = BotMaintenance.getInstance();
        
        const health = await maintenance.performHealthCheck();
        const stats = await maintenance.getBotStats();

        const statusColor = health.status === 'healthy' ? 0x00ff00 : 
                           health.status === 'degraded' ? 0xffaa00 : 0xff0000;

        const embed = new EmbedBuilder()
          .setTitle('🔧 Bot Status')
          .setColor(statusColor)
          .addFields(
            { 
              name: 'Status', 
              value: health.status.toUpperCase(), 
              inline: true 
            },
            { 
              name: 'Uptime', 
              value: require('./utils').formatDuration(Math.floor(health.uptime)), 
              inline: true 
            },
            { 
              name: 'Latency', 
              value: `${health.latency}ms`, 
              inline: true 
            },
            { 
              name: 'Guilds', 
              value: stats.guildCount.toString(), 
              inline: true 
            },
            { 
              name: 'Commands', 
              value: stats.commandCount.toString(), 
              inline: true 
            },
            { 
              name: 'Errors (1h)', 
              value: health.errorsInLastHour.toString(), 
              inline: true 
            },
            { 
              name: 'Memory Usage', 
              value: `${Math.round(health.memoryUsage.heapUsed / 1024 / 1024)}MB`, 
              inline: true 
            }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        return { success: true, data: { health, stats } };
      },
    });

    // Lead alert command
    this.commands.set('alert-lead', {
      data: new SlashCommandBuilder()
        .setName('alert-lead')
        .setDescription('Send a lead alert notification')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Lead name (required)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('email')
            .setDescription('Lead email (required)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('company')
            .setDescription('Lead company')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option.setName('pain-score')
            .setDescription('Pain score (0-100)')
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option.setName('estimated-value')
            .setDescription('Estimated value in USD')
            .setMinValue(0)
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('timeline')
            .setDescription('Project timeline')
            .addChoices(
              { name: 'Immediate', value: 'immediately' },
              { name: '1 month', value: '1_month' },
              { name: '1-3 months', value: '1-3_months' },
              { name: '3+ months', value: '3_plus_months' }
            )
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('top-opportunity')
            .setDescription('Top opportunity identified')
            .setRequired(false)
        ),
      async execute(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        try {
          const name = interaction.options.getString('name')!;
          const email = interaction.options.getString('email')!;
          const company = interaction.options.getString('company');
          const painScore = interaction.options.getInteger('pain-score');
          const estimatedValue = interaction.options.getInteger('estimated-value');
          const timeline = interaction.options.getString('timeline');
          const topOpportunity = interaction.options.getString('top-opportunity');

          // Validate email
          if (!require('./utils').validateEmail(email)) {
            await interaction.reply({
              content: '❌ Invalid email format',
              ephemeral: true,
            });
            return { success: false, error: 'Invalid email format' };
          }

          await interaction.deferReply({ ephemeral: true });

          const leadData: LeadAlertData = {
            sessionId: `manual-${Date.now()}-${interaction.user.id}`,
            name: require('./utils').sanitizeString(name),
            email: email.toLowerCase(),
            company: company ? require('./utils').sanitizeString(company) : undefined,
            painScore: painScore || undefined,
            estimatedValue: estimatedValue || undefined,
            timeline: timeline || undefined,
            topOpportunity: topOpportunity ? require('./utils').sanitizeString(topOpportunity, 200) : undefined,
          };

          const result = await sendDiscordAlert(leadData);

          if (result.success) {
            const embed = new EmbedBuilder()
              .setTitle('✅ Lead Alert Sent')
              .setColor(0x00ff00)
              .setDescription(`Successfully sent lead alert for ${name}`)
              .addFields(
                { name: 'Name', value: leadData.name, inline: true },
                { name: 'Email', value: leadData.email, inline: true },
                { name: 'Company', value: leadData.company || 'Not specified', inline: true }
              )
              .setTimestamp();

            if (leadData.painScore) {
              embed.addFields({ 
                name: 'Pain Score', 
                value: `${leadData.painScore}/100`, 
                inline: true 
              });
            }

            if (leadData.estimatedValue) {
              embed.addFields({ 
                name: 'Estimated Value', 
                value: require('./utils').formatCurrency(leadData.estimatedValue), 
                inline: true 
              });
            }

            await interaction.editReply({ embeds: [embed] });
            
            logger.info('Manual lead alert sent', { 
              user: interaction.user.id, 
              leadData 
            });

            return { success: true, data: leadData };
          } else {
            throw new Error(result.error || 'Failed to send lead alert');
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          await interaction.editReply({
            content: `❌ Failed to send lead alert: ${errorMessage}`,
          });

          logger.error('Lead alert command failed', error as Error, {
            user: interaction.user.id,
          });

          return { success: false, error: errorMessage };
        }
      },
    });

    // System alert command (admin only)
    this.commands.set('alert-system', {
      data: new SlashCommandBuilder()
        .setName('alert-system')
        .setDescription('Send a system alert (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Alert message (required)')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('level')
            .setDescription('Alert level')
            .addChoices(
              { name: 'Info', value: 'info' },
              { name: 'Warning', value: 'warning' },
              { name: 'Error', value: 'error' },
              { name: 'Critical', value: 'critical' }
            )
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('source')
            .setDescription('Alert source')
            .setRequired(false)
        ),
      async execute(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        try {
          const message = interaction.options.getString('message')!;
          const level = (interaction.options.getString('level') || 'info') as SystemAlertData['level'];
          const source = interaction.options.getString('source');

          await interaction.deferReply({ ephemeral: true });

          const alertData: SystemAlertData = {
            message: require('./utils').sanitizeString(message, 2000),
            level,
            source: source ? require('./utils').sanitizeString(source, 100) : undefined,
            context: {
              triggeredBy: interaction.user.tag,
              triggeredById: interaction.user.id,
              timestamp: new Date().toISOString(),
            },
          };

          const result = await sendDiscordSystemAlert(alertData.message, alertData.level);

          if (result.success) {
            const embed = new EmbedBuilder()
              .setTitle('📢 System Alert Sent')
              .setColor(0x0099ff)
              .setDescription(alertData.message)
              .addFields(
                { name: 'Level', value: level.toUpperCase(), inline: true },
                { name: 'Source', value: alertData.source || 'Manual', inline: true },
                { name: 'Sent by', value: interaction.user.tag, inline: true }
              )
              .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            
            logger.info('Manual system alert sent', { 
              user: interaction.user.id, 
              level,
              message: alertData.message 
            });

            return { success: true, data: alertData };
          } else {
            throw new Error(result.error || 'Failed to send system alert');
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          await interaction.editReply({
            content: `❌ Failed to send system alert: ${errorMessage}`,
          });

          logger.error('System alert command failed', error as Error, {
            user: interaction.user.id,
          });

          return { success: false, error: errorMessage };
        }
      },
    });

    // Help command
    this.commands.set('help', {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display available commands and their usage'),
      async execute(interaction: ChatInputCommandInteraction): Promise<CommandResult> {
        const commandList = Array.from(this.commands.values())
          .map(cmd => ({
            name: cmd.data.name,
            description: cmd.data.description,
          }))
          .filter(cmd => cmd.name !== 'help'); // Don't show help in the list

        const embed = new EmbedBuilder()
          .setTitle('🤖 Bot Commands')
          .setColor(0x0099ff)
          .setDescription('Here are all available commands:')
          .addFields(
            commandList.map(cmd => ({
              name: `/${cmd.name}`,
              value: cmd.description,
              inline: false,
            }))
          )
          .setFooter({ text: 'Use /command-name to execute a command' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        return { success: true };
      },
    });

    logger.info(`Registered ${this.commands.size} commands`);
  }

  public getCommands(): Map<string, any> {
    return this.commands;
  }

  public getCommandData(): any[] {
    return Array.from(this.commands.values()).map(cmd => cmd.data);
  }

  public async executeCommand(
    interaction: ChatInputCommandInteraction
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      return { success: false, error: 'Command not found' };
    }

    try {
      const result = await command.execute(interaction);
      const executionTime = Date.now() - startTime;

      // Record metrics
      const { DiscordMetrics } = await import('./utils');
      await DiscordMetrics.getInstance().recordCommandExecution({
        commandName: interaction.commandName,
        userId: interaction.user.id,
        guildId: interaction.guildId || 'DM',
        executionTime,
        success: result.success,
        error: result.error,
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Record failed metrics
      const { DiscordMetrics } = await import('./utils');
      await DiscordMetrics.getInstance().recordCommandExecution({
        commandName: interaction.commandName,
        userId: interaction.user.id,
        guildId: interaction.guildId || 'DM',
        executionTime,
        success: false,
        error: errorMessage,
      });

      logger.error(`Command execution failed: ${interaction.commandName}`, error as Error, {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      return { success: false, error: errorMessage };
    }
  }
}
