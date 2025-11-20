# Lead Capture System Setup Guide

This guide will help you set up and test the complete AI-powered lead capture system.

## 🚀 Quick Setup (15 minutes)

### 1. Environment Variables

Copy `env-updated.example` to `.env.local`:

```bash
cp env-updated.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Required - Google AI (for LLM)
GOOGLE_API_KEY=your_google_api_key_here

# Required - Upstash Redis (for sessions)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# Required - Upstash QStash (for async processing)
QSTASH_TOKEN=your_qstash_token_here

# Required - HubSpot CRM (for lead storage)
HUBSPOT_ACCESS_TOKEN=your_hubspot_access_token

# Required - Discord (for automatic notifications)
DISCORD_WEBHOOK_URL=your_discord_webhook_url

# Application settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install @upstash/qstash @upstash/redis @langchain/google-genai @langchain/core @langchain-community
```

Or with pnpm:
```bash
pnpm add @upstash/qstash @upstash/redis @langchain/google-genai @langchain/core @langchain-community
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test the System

```bash
node test-lead-capture.js
```

## 🔧 Detailed Service Setup

### **Google AI (Gemini)**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add `GOOGLE_API_KEY=your_key` to `.env.local`

### **Upstash Redis** (Sessions & Caching)
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a Redis database
3. Get REST URL and token
4. Add to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token
   ```

### **Upstash QStash** (Async Processing)
1. In Upstash Console, go to QStash
2. Get your QStash token
3. Add `QSTASH_TOKEN=your_token` to `.env.local`

### **HubSpot CRM** (Lead Storage)
1. Go to HubSpot → Developers → Private Apps
2. Create a new Private App
3. Enable these scopes:
   - `crm.objects.contacts.write`
   - `crm.objects.companies.write`
   - `crm.objects.deals.write`
   - `crm.schemas.contacts.write`
4. Install the app and get access token
5. Add `HUBSPOT_ACCESS_TOKEN=your_token` to `.env.local`

### **Discord Webhook** (Automatic Notifications)
1. In your Discord server, go to Channel Settings → Integrations
2. Create a Webhook
3. Copy the webhook URL
4. Add to `.env.local`:
   ```env
   DISCORD_WEBHOOK_URL=your_webhook_url
   ```

### **Slack** (Optional - User Choice)
1. Create a Slack workspace or use existing one
2. Go to your workspace settings → Build → Create New App
3. Add Incoming Webhooks
4. Create a webhook and copy URL
5. Add to `.env.local`:
   ```env
   SLACK_WEBHOOK_URL=your_slack_webhook_url
   ```

## 🧪 Testing the System

### Manual Testing

1. **Open the chatbot**: Visit `http://localhost:3000` and click the chat button
2. **Try these test conversations**:

```
User: Hi! I'm John from TechCorp and need automation help
Bot: [Should ask about your business and challenges]

User: We have 50 employees and struggle with manual data entry
Bot: [Should explore solutions and ask about budget]

User: Our budget is $15k and we need it done in 2 months
Bot: [Should ask for contact details]

User: john@techcorp.com
Bot: [Should capture lead and show success message]
```

### Automated Testing

Run the test suite:

```bash
node test-lead-capture.js
```

Expected output:
```
✅ Chat API: Passed
✅ Discord Integration: Passed
✅ QStash Processing: Passed
✅ Conversation Flow: Passed
⚠️  HubSpot: Configuration verified
⚠️  Slack: Optional (not configured)

Success Rate: 80.0%
```

## 📊 What Happens When a Lead is Captured

### 1. **Conversation Flow**
```
User Chat → AI Extraction → Lead Score (0-100) → QStash Queue → HubSpot + Discord
```

### 2. **Automatic Notifications**
- **Discord**: Rich embed with all lead details (primary)
- **Slack**: Backup notification for hot leads (optional)

### 3. **HubSpot Records**
- Contact created with all information
- Company created and associated
- Deal created for qualified leads (score ≥ 50)

### 4. **Data Stored**
- Conversation summary
- Lead scoring details
- Requirements and challenges
- Budget and timeline

## 🎯 Lead Quality Scoring

The system scores leads 0-100 based on:
- **Requirements Clarity** (25 points)
- **Budget Availability** (25 points)
- **Timeline Urgency** (25 points)
- **Decision Making Authority** (25 points)

**Score Interpretation:**
- **85-100**: 🔥 Hot Lead - Immediate follow-up required
- **70-84**: 📈 Qualified Lead - High priority
- **50-69**: 👥 Warm Lead - Good potential
- **<50**: ❄️ Cold Lead - Nurturing required

## 🐛 Troubleshooting

### **Common Issues**

**Chat API not responding:**
- Check if server is running: `npm run dev`
- Verify `GOOGLE_API_KEY` is set correctly

**Discord notifications not working:**
- Verify webhook URL is correct
- Check webhook has permission to post in channel

**HubSpot integration failing:**
- Verify access token has correct scopes
- Check Private App is installed

**QStash processing stuck:**
- Verify `QSTASH_TOKEN` is set
- Check QStash dashboard for queue status

### **Debug Mode**

Enable debug logging by setting:
```env
NODE_ENV=development
```

Check browser console and server logs for detailed error messages.

## 📈 Monitoring

### **Key Metrics to Track**
- Lead conversion rate
- Average lead score
- Response time
- HubSpot sync success rate
- Discord notification delivery

### **View System Health**
```bash
# Check queue health
curl http://localhost:3000/api/webhooks/lead-processor

# Test Discord webhook
curl -X POST http://localhost:3000/api/slacks/notify \
  -H "Content-Type: application/json" \
  -d '{"text":"Test notification"}'
```

## 🚀 Production Deployment

### **Vercel Deployment**
1. Connect your GitHub repo to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy and test the production URL

### **Environment Variables for Production**
Make sure to add all variables to your hosting platform:
- `GOOGLE_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `QSTASH_TOKEN`
- `HUBSPOT_ACCESS_TOKEN`
- `DISCORD_WEBHOOK_URL`
- `NEXT_PUBLIC_APP_URL=https://your-domain.com`

### **Post-Deployment Testing**
1. Test the complete flow on production URL
2. Verify all webhooks are working
3. Check HubSpot integration
4. Monitor first few lead captures

## 💡 Pro Tips

1. **Test with real data** - Use actual business scenarios
2. **Monitor daily** - Check Discord notifications for new leads
3. **Optimize conversation** - Review chat logs for improvements
4. **Customize Discord embeds** - Adjust colors and fields as needed
5. **Set up follow-up automation** - Use QStash for scheduled reminders

## 🔗 Useful Links

- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Upstash Console](https://console.upstash.com/)
- [HubSpot Developers](https://developers.hubspot.com/)
- [Discord Developer Portal](https://discord.com/developers/docs/intro)
- [QStash Documentation](https://upstash.com/docs/qstash)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs and browser console
3. Verify all environment variables are set
4. Test each service individually using the test script

The system is designed to be resilient and will continue working even if some services fail, with local fallbacks and retry logic built in.