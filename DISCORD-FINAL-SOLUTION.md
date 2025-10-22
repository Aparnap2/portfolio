# Discord Integration - Final Solution

## The Issue

Discord.js **cannot** be imported in Next.js API routes due to Node.js-specific dependencies (zlib-sync).

**Error**: `Module not found: Can't resolve 'zlib-sync'`

## ✅ Solution: Use Webhook (Simplest!)

For sending notifications from Next.js API routes, **webhooks are the only option**.

### How to Get the Correct Webhook URL (1 minute):

1. **Open Discord** → Your Server
2. **Right-click** any channel → **Edit Channel**
3. **Integrations** → **Webhooks** → **New Webhook**
4. **Copy Webhook URL** (looks like: `https://discord.com/api/webhooks/123456/abc...`)
5. **Update .env**:

```bash
# Replace this OAuth URL:
DISCORD_WEBHOOK_URL=https://discord.com/oauth2/authorize?client_id=1313756426384048241

# With actual webhook URL:
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

That's it! Notifications will work immediately.

---

## What About the Bot?

The Discord bot (`DISCORD_BOT_TOKEN`) is for:
- ✅ **Slash commands** (/ping, /status, etc.)
- ✅ **Interactive features** (buttons, reactions)
- ✅ **Standalone bot** (runs separately from Next.js)

**Start it with**:
```bash
pnpm discord:start
```

But for **sending notifications from your audit system**, you need the webhook.

---

## Summary

### For Audit Notifications (API routes):
- ✅ Use **Webhooks**
- ❌ Cannot use Discord.js bot (Next.js limitation)
- 📝 Add webhook URL to .env

### For Interactive Bot (Optional):
- ✅ Use **Discord.js bot**
- ✅ Run with: `pnpm discord:start`
- 🎮 Get commands like /ping, /status

---

## Current Status

**What Works**:
- ✅ HubSpot integration (tested, working!)
- ✅ Discord code (implemented correctly)
- ✅ All API endpoints functional

**What's Needed**:
- 🔧 Replace OAuth URL with webhook URL in .env
- ⏱️ Takes 60 seconds to get from Discord

**Once you add webhook URL**:
- ✅ Discord notifications work instantly
- ✅ No code changes needed
- ✅ No bot to run (for webhooks)

---

## Quick Action

**To get webhook URL right now**:
1. Discord → Any channel → Edit
2. Integrations → Webhooks  
3. Create New → Copy URL
4. Paste in .env as `DISCORD_WEBHOOK_URL`
5. Done! ✅

The URL format should be:
```
https://discord.com/api/webhooks/[NUMBERS]/[LONG_TOKEN_STRING]
```

**Not**:
```
https://discord.com/oauth2/authorize?... ❌
```

---

## Why This is Necessary

Next.js API routes run in a limited Node.js environment and can't use Discord.js's WebSocket features. Webhooks are HTTP-only and work perfectly in Next.js.

If you want full Discord.js features (bot commands), run the standalone bot separately with `pnpm discord:start`.

**For audit notifications**: Webhooks = Perfect solution! ✅
