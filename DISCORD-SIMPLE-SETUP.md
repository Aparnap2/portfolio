# Discord Setup - Simple Guide

## You Don't Need a Webhook! ✅

You already have all the bot credentials. Just need to:

### Step 1: Get Your Channel ID (30 seconds)

1. Open Discord
2. Go to User Settings → Advanced
3. Enable "Developer Mode"
4. Right-click on the channel where you want notifications
5. Click "Copy Channel ID"

### Step 2: Add Channel ID to .env (10 seconds)

Add this line to your `.env` file:
```bash
DISCORD_NOTIFICATION_CHANNEL_ID=your-channel-id-here
```

**Optional**: You can remove or comment out the webhook URL since you don't need it:
```bash
# DISCORD_WEBHOOK_URL=...  # Not needed with bot
```

### Step 3: Start the Bot (1 command)

```bash
# Register commands (one-time)
pnpm discord:register

# Start the bot
pnpm discord:start
```

That's it! Your bot will now send notifications directly to Discord.

---

## What You Get

### With Bot (What you have now):
- ✅ **Send notifications** to any channel
- ✅ **Slash commands** (/ping, /status, /alert-lead, etc.)
- ✅ **Interactive features** (reactions, buttons, etc.)
- ✅ **Better control** over messages
- ✅ **No webhook needed**

### With Webhook (Not needed):
- ⚠️ Simple but limited
- ⚠️ Need separate webhook per channel
- ⚠️ No interactive features

---

## Current Status

Your `.env` has:
- ✅ `DISCORD_BOT_TOKEN` - Ready
- ✅ `DISCORD_APP_ID` - Ready
- ✅ `DISCORD_SERVER_ID` - Ready
- ✅ `DISCORD_PUBLIC_KEY` - Ready
- ⚠️ `DISCORD_WEBHOOK_URL` - Wrong URL (can remove)
- ❌ `DISCORD_NOTIFICATION_CHANNEL_ID` - **Add this!**

---

## Quick Start

```bash
# 1. Add channel ID to .env
echo "DISCORD_NOTIFICATION_CHANNEL_ID=your-channel-id" >> .env

# 2. Register bot commands
pnpm discord:register

# 3. Start the bot
pnpm discord:start

# 4. Test in Discord
# Use /ping command in your server
```

---

## How Notifications Work

```
Audit Completed
      ↓
sendBotNotification() called
      ↓
Bot sends message to channel
      ↓
✅ Rich embed appears in Discord
```

No webhook needed!

---

## Need Help?

**Bot not showing up?**
- Make sure bot is added to your server
- Check bot has permission to send messages in the channel
- Verify channel ID is correct

**Can't see slash commands?**
- Run `pnpm discord:register` first
- Wait a few minutes for Discord to sync
- Make sure bot has "applications.commands" permission

**Still prefer webhook?**
- That's fine too!
- Get webhook URL from Channel Settings → Integrations
- Replace the OAuth URL in .env with webhook URL
- Format: `https://discord.com/api/webhooks/{id}/{token}`

---

## Summary

**Just add the channel ID and start the bot - that's all you need!** 🎉

No webhook required when using Discord.js bot.
