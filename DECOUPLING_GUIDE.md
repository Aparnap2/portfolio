# Portfolio Decoupling Implementation Guide

This guide explains the decoupled architecture implemented to make the portfolio application more resilient, scalable, and maintainable.

## 🎯 Overview

The decoupling implementation introduces several key improvements:

1. **Database-First Lead Storage** - Always store leads locally before external syncs
2. **Queue-Based Processing** - Asynchronous processing of external integrations
3. **Graceful Degradation** - Application works even when external services fail
4. **Standalone Workers** - Independent processes for background tasks
5. **Comprehensive Monitoring** - Health checks and notifications for all services

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │───▶│   Next.js API    │───▶│   PostgreSQL    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        │
                       ┌──────────────────┐              │
                       │   Redis Queue    │              │
                       └──────────────────┘              │
                                │                        │
                       ┌────────┴────────┐               │
                       ▼                 ▼               ▼
              ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
              │ HubSpot Worker  │ │ Discord Worker  │ │ Health Monitor  │
              └─────────────────┘ └─────────────────┘ └─────────────────┘
                       │                 │
                       ▼                 ▼
              ┌─────────────────┐ ┌─────────────────┐
              │    HubSpot      │ │    Discord      │
              └─────────────────┘ └─────────────────┘
```

## 📁 New File Structure

```
src/
├── lib/
│   ├── database.js          # PostgreSQL operations
│   ├── lead-capture.js      # Decoupled lead capture service
│   ├── discord.js           # Discord notifications
│   └── rabbitmq.js          # RabbitMQ integration (optional)
├── app/api/
│   ├── chat/route.js        # Enhanced with decoupling
│   └── workers/
│       ├── hubspot/route.js # Enhanced HubSpot worker
│       └── discord/route.js # New Discord worker
workers/
├── hubspot-worker.js        # Standalone HubSpot worker
├── discord-worker.js        # Standalone Discord worker
scripts/
└── health-check.js          # Comprehensive health monitoring
```

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file and configure your services:

```bash
cp .env.example .env
```

Key configurations:
- `DATABASE_URL` - PostgreSQL connection (optional but recommended)
- `LEAD_CAPTURE_ALWAYS_STORE=true` - Enable decoupled lead capture
- `HUBSPOT_DECOUPLED=true` - Enable queue-based HubSpot sync
- `DISCORD_WEBHOOK_URL` - Discord notifications (optional)

### 2. Database Setup (Optional)

If using PostgreSQL for persistent storage:

```bash
# Run database migrations
node scripts/migrate.js

# Or manually create tables using the schema in src/lib/database.js
```

### 3. Start the Application

```bash
# Start the Next.js application
pnpm dev

# In separate terminals, start the workers:
node workers/hubspot-worker.js
node workers/discord-worker.js
```

### 4. Health Check

```bash
# Run comprehensive health check
node scripts/health-check.js

# Get JSON output
node scripts/health-check.js --json
```

## 🔧 Configuration Options

### Lead Capture Modes

1. **Decoupled Mode** (Recommended)
   ```env
   LEAD_CAPTURE_ALWAYS_STORE=true
   DATABASE_URL=postgresql://...
   ```
   - Always stores leads in PostgreSQL first
   - Queues external syncs asynchronously
   - Never fails due to external service issues

2. **Legacy Mode**
   ```env
   LEAD_CAPTURE_ALWAYS_STORE=false
   HUBSPOT_DECOUPLED=true
   ```
   - Uses existing queue-based HubSpot sync
   - Falls back to direct API calls if queue fails

3. **Direct Mode**
   ```env
   HUBSPOT_DECOUPLED=false
   ```
   - Direct API calls to HubSpot (original behavior)
   - Synchronous processing

### Vector Database Options

1. **Full Vector Search** (Default)
   ```env
   ENABLE_VECTOR_DB=true
   ENABLE_EMBEDDINGS=true
   ```

2. **Disabled Vector Search**
   ```env
   ENABLE_VECTOR_DB=false
   ```
   - Uses static portfolio content
   - Reduces dependencies and complexity

## 🔄 Worker Management

### Standalone Workers

The workers can run independently of the main application:

```bash
# HubSpot Worker
node workers/hubspot-worker.js

# Discord Worker  
node workers/discord-worker.js

# Run once (for testing)
node workers/hubspot-worker.js --once
node workers/discord-worker.js --once
```

### API-Based Workers

Workers can also be triggered via API endpoints:

```bash
# Trigger HubSpot worker
curl -X POST http://localhost:3000/api/workers/hubspot

# Trigger Discord worker
curl -X POST http://localhost:3000/api/workers/discord
```

### Cron Scheduling

Workers use cron expressions for scheduling:

```env
# Every 2 minutes
HUBSPOT_WORKER_SCHEDULE=*/2 * * * *

# Every minute
DISCORD_WORKER_SCHEDULE=*/1 * * * *
```

## 📊 Monitoring & Health Checks

### Health Check Script

```bash
# Basic health check
node scripts/health-check.js

# Detailed JSON output
node scripts/health-check.js --json
```

### Service Status

The health check monitors:
- ✅ PostgreSQL Database
- ✅ Redis Connection
- ✅ Queue Lengths
- ✅ Discord Webhook
- ✅ HubSpot API
- ✅ Google AI API

### Discord Notifications

Configure Discord webhook to receive:
- 🎯 New lead notifications
- ✅ Successful HubSpot syncs
- ❌ Failed sync alerts
- 🔧 System status updates

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Fails**
   ```bash
   # Check PostgreSQL connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Queue Processing Stops**
   ```bash
   # Check queue lengths
   node scripts/health-check.js
   
   # Restart workers
   node workers/hubspot-worker.js --once
   ```

3. **HubSpot Sync Fails**
   ```bash
   # Test HubSpot API directly
   curl -H "Authorization: Bearer $HUBSPOT_ACCESS_TOKEN" \
        https://api.hubapi.com/crm/v3/objects/contacts?limit=1
   ```

### Debug Mode

Enable debug logging:

```env
DEBUG_CHAT=true
DEBUG_LEAD_CAPTURE=true
DEBUG_WORKERS=true
LOG_LEVEL=debug
```

## 🔄 Migration from Legacy

### Step 1: Enable Database Storage

```env
DATABASE_URL=postgresql://...
LEAD_CAPTURE_ALWAYS_STORE=true
```

### Step 2: Test Decoupled Mode

1. Submit a test lead through the chat
2. Verify it's stored in PostgreSQL
3. Check that HubSpot sync is queued
4. Monitor worker processing

### Step 3: Disable Vector DB (Optional)

If you want to reduce complexity:

```env
ENABLE_VECTOR_DB=false
```

### Step 4: Add Discord Notifications

```env
DISCORD_WEBHOOK_URL=your_webhook_url
```

## 📈 Performance Benefits

### Before Decoupling
- ❌ Lead capture fails if HubSpot is down
- ❌ Slow response times due to external API calls
- ❌ No visibility into sync failures
- ❌ Difficult to scale processing

### After Decoupling
- ✅ Lead capture always succeeds
- ✅ Fast response times (local storage first)
- ✅ Comprehensive monitoring and alerts
- ✅ Scalable worker processes
- ✅ Graceful degradation when services fail

## 🔐 Security Considerations

1. **Database Security**
   - Use connection pooling
   - Enable SSL for production
   - Rotate credentials regularly

2. **API Keys**
   - Store in environment variables
   - Use least-privilege access
   - Monitor API usage

3. **Queue Security**
   - Use Redis AUTH if available
   - Monitor queue sizes
   - Implement rate limiting

## 🚀 Production Deployment

### Docker Compose Example

```yaml
version: '3.8'
services:
  app:
    build: .
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/portfolio
      - LEAD_CAPTURE_ALWAYS_STORE=true
    depends_on:
      - db
      - redis

  hubspot-worker:
    build: .
    command: node workers/hubspot-worker.js
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/portfolio
    depends_on:
      - db
      - redis

  discord-worker:
    build: .
    command: node workers/discord-worker.js
    depends_on:
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=portfolio
      - POSTGRES_PASSWORD=password

  redis:
    image: redis:7-alpine
```

### Process Management

Use PM2 or similar for production:

```json
{
  "apps": [
    {
      "name": "portfolio-app",
      "script": "npm",
      "args": "start"
    },
    {
      "name": "hubspot-worker",
      "script": "workers/hubspot-worker.js"
    },
    {
      "name": "discord-worker", 
      "script": "workers/discord-worker.js"
    }
  ]
}
```

## 📞 Support

For issues or questions about the decoupling implementation:

1. Check the health status: `node scripts/health-check.js`
2. Review logs for error messages
3. Test individual components in isolation
4. Verify environment configuration

The decoupled architecture ensures your portfolio application remains resilient and performant even when external services experience issues.