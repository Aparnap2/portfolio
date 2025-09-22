# 🚀 Setup Guide: HubSpot + Discord Integration

## Overview
This guide will help you set up the new HubSpot + Discord integration that replaces all database dependencies.

## ✅ Quick Start Checklist

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your actual values
nano .env.local
```

### 2. Required Environment Variables

#### Core Services
```bash
# Redis (Required)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Google Gemini AI
GEMINI_API_KEY=your_gemini_key

# HubSpot
HUBSPOT_ACCESS_TOKEN=your_hubspot_token

# Discord
DISCORD_WEBHOOK_URL=your_webhook_url
DISCORD_INVITE_URL=your_discord_invite

# RabbitMQ/CloudAMQP
CLOUDAMQP_URL=your_cloudamqp_url
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Services

#### Development Mode
```bash
# Terminal 1: Start the web app
npm run dev

# Terminal 2: Start Discord worker
npm run worker:discord
```

#### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start

# Start Discord worker in background
npm run worker:discord
```

## 🔧 Configuration Details

### HubSpot Setup
1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Create a private app or use existing one
3. Copy the access token to `HUBSPOT_ACCESS_TOKEN`
4. Required scopes: `crm.objects.contacts.write`, `crm.objects.contacts.read`

### Discord Setup
1. Create a Discord server
2. Go to Server Settings → Integrations → Webhooks
3. Create a new webhook and copy the URL
4. Set `DISCORD_WEBHOOK_URL` in environment
5. Create a Discord invite link and set `DISCORD_INVITE_URL`

### Redis Setup (Upstash)
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy REST URL and Token
4. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### CloudAMQP Setup
1. Go to [CloudAMQP](https://customer.cloudamqp.com/)
2. Create a new instance (free tier works)
3. Copy the AMQP URL
4. Set `CLOUDAMQP_URL` in environment

## 🎯 Features Overview

### ✅ What's Working
- **Database-Free**: No PostgreSQL, MongoDB, or Vector DB required
- **HubSpot Integration**: Automatic lead capture and contact management
- **Discord Notifications**: Real-time notifications for new leads
- **Discord Button**: Direct chat link in chatbot header
- **RabbitMQ**: Asynchronous processing with CloudAMQP
- **Redis**: Session management and caching
- **Fast Responses**: Optimized chatbot with 8-second timeout

### 🔄 Message Flow
1. **User Interaction** → Chatbot (Redis sessions)
2. **Lead Detection** → RabbitMQ queue
3. **Worker Processing** → HubSpot + Discord
4. **Notification** → Discord webhook

## 📊 Monitoring

### Health Checks
```bash
# Check all services
npm run health:check

# JSON format for monitoring
npm run health:json
```

### Logs
- **Web App**: Check console logs
- **Discord Worker**: `npm run worker:discord` output
- **RabbitMQ**: CloudAMQP dashboard

## 🐛 Troubleshooting

### Common Issues

#### 1. Discord Button Not Working
- Check `DISCORD_INVITE_URL` in `.env.local`
- Ensure Discord server allows public invites

#### 2. No Discord Notifications
- Verify `DISCORD_WEBHOOK_URL` is correct
- Check Discord channel permissions
- Ensure worker is running: `npm run worker:discord`

#### 3. HubSpot Errors
- Verify `HUBSPOT_ACCESS_TOKEN` has correct permissions
- Check HubSpot API rate limits
- Ensure contact properties exist in HubSpot

#### 4. RabbitMQ Connection Issues
- Verify `CLOUDAMQP_URL` format: `amqps://user:pass@host.rmq.cloudamqp.com/vhost`
- Check CloudAMQP instance status
- Ensure worker is running

#### 5. Redis Connection Issues
- Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Check Redis database status

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Test Discord webhook
curl -X POST $DISCORD_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"content": "Test notification"}'
```

## 🚀 Production Deployment

### Docker (Optional)
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=3000
HUBSPOT_ONLY=true
RABBITMQ_ENABLED=true
ENABLE_VECTOR_DB=false
```

### PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start web app
pm2 start npm --name "portfolio-web" -- start

# Start Discord worker
pm2 start npm --name "discord-worker" -- run worker:discord

# Save PM2 config
pm2 save
pm2 startup
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for errors
3. Verify all environment variables
4. Test individual components
5. Contact support via Discord (link in chatbot!)

## 🎉 Success Indicators

When everything is working correctly:
- ✅ Chatbot opens with Discord button visible
- ✅ Messages are stored in Redis
- ✅ Leads appear in HubSpot
- ✅ Discord notifications arrive
- ✅ All health checks pass
- ✅ No database errors in console

---

**Last Updated**: $(date)
**Version**: 2.0.0 (HubSpot + Discord Integration)