# Portfolio Feature Confidence Scoring - Database Removal & HubSpot Integration Plan

## 🎯 Objective
Remove all database dependencies (PostgreSQL, AstraDB, Redis, Vector DB) and implement HubSpot-only lead storage with Discord integration using RabbitMQ and CloudAMQP.

## 📋 Step-by-Step Implementation Plan

### Phase 1: Environment Configuration & Setup
**Priority: HIGH | Time: 30 minutes**

1. **Update Environment Variables**
   - Remove: `DATABASE_URL`, `ASTRA_DB_ID`, `ASTRA_DB_REGION`, `ASTRA_DB_KEYSPACE`, `ASTRA_DB_APPLICATION_TOKEN`
   - Add: `CLOUDAMQP_URL`, `HUBSPOT_ACCESS_TOKEN`, `DISCORD_WEBHOOK_URL`, `DISCORD_GUILD_ID`, `DISCORD_BOT_TOKEN`
   - Update: `HUBSPOT_DECOUPLED=true`, `ENABLE_VECTOR_DB=false`, `ENABLE_EMBEDDINGS=false`

2. **Install Required Dependencies**
   ```bash
   npm install @hubspot/api-client
   npm install --save-dev @types/amqplib
   ```

### Phase 2: Database Removal & HubSpot Integration
**Priority: HIGH | Time: 2 hours**

1. **Remove Database Files**
   - Delete `src/lib/database.js`
   - Delete `src/lib/prospect_store.js`
   - Remove database-related imports from all files

2. **Create HubSpot Service Module**
   - Create `src/lib/hubspot-service.js` for direct HubSpot API calls
   - Implement contact creation with custom properties
   - Add duplicate detection via email lookup
   - Handle lead scoring and qualification

3. **Update Lead Capture Logic**
   - Replace `captureLead()` in `lead-capture.js` to use HubSpot directly
   - Remove local storage logic
   - Implement immediate HubSpot contact creation

### Phase 3: Discord Integration
**Priority: MEDIUM | Time: 1.5 hours**

1. **Discord Webhook Service**
   - Create `src/lib/discord-webhook.js` for notifications
   - Implement rich embed notifications for new leads
   - Add lead qualification details in notifications

2. **Chatbot Discord Button**
   - Add Discord button to chat interface (top-right corner)
   - Implement direct Discord invite link
   - Add hover effects and animations

3. **Real-time Notifications**
   - Send Discord notifications for new qualified leads
   - Include lead score and confidence metrics
   - Add project type and budget information

### Phase 4: RabbitMQ & CloudAMQP Configuration
**Priority: HIGH | Time: 1 hour**

1. **CloudAMQP Connection**
   - Update `src/lib/rabbitmq.js` for CloudAMQP URL
   - Add connection retry logic and health checks
   - Implement connection pooling

2. **Message Queues Optimization**
   - Create `hubspot-sync-queue` for HubSpot operations
   - Create `discord-notification-queue` for Discord alerts
   - Add dead letter queue for failed messages

3. **Worker Updates**
   - Update `workers/hubspot-worker.js` for direct HubSpot API
   - Update `workers/discord-worker.js` for webhook notifications
   - Add error handling and retry mechanisms

### Phase 5: Chatbot UI/UX Improvements
**Priority: MEDIUM | Time: 2 hours**

1. **Performance Optimization**
   - Remove vector database queries
   - Implement response caching
   - Add loading states and skeleton screens
   - Optimize message rendering

2. **Discord Button Implementation**
   - Position: Top-right corner of chat interface
   - Style: Glass-morphism with hover effects
   - Functionality: Direct Discord server invite
   - Mobile-responsive design

3. **Response Time Improvements**
   - Cache frequently asked questions
   - Implement pre-loading for common responses
   - Add typing indicators
   - Optimize API response handling

### Phase 6: Testing & Validation
**Priority: HIGH | Time: 1 hour**

1. **Integration Testing**
   - Test HubSpot contact creation
   - Verify Discord webhook notifications
   - Test RabbitMQ message queuing
   - Validate error handling

2. **End-to-End Testing**
   - Complete lead capture flow
   - Verify Discord button functionality
   - Test CloudAMQP connection stability
   - Performance benchmarking

### Phase 7: Deployment & Monitoring
**Priority: MEDIUM | Time: 30 minutes**

1. **Environment Deployment**
   - Deploy to Vercel with new environment variables
   - Verify CloudAMQP connection in production
   - Test Discord webhook in production

2. **Monitoring Setup**
   - Add health check endpoints
   - Implement error tracking
   - Add performance monitoring
   - Set up alerts for failures

## 🔧 Technical Implementation Details

### HubSpot Contact Structure
```javascript
const contactProperties = {
  email: leadData.email,
  firstname: leadData.name.split(' ')[0],
  lastname: leadData.name.split(' ').slice(1).join(' ') || '',
  company: leadData.company,
  phone: leadData.phone,
  project_type__c: leadData.project_type,
  budget_range__c: leadData.budget,
  timeline__c: leadData.timeline,
  notes__c: leadData.notes,
  lead_source__c: 'AI Chatbot',
  lead_score__c: calculateLeadScore(leadData),
  confidence_score__c: leadData.confidence || 0
};
```

### Discord Webhook Format
```javascript
const discordEmbed = {
  title: "🎯 New Qualified Lead",
  description: `**${leadData.name}** from **${leadData.company}**`,
  color: 0x00ff88,
  fields: [
    { name: "Email", value: leadData.email, inline: true },
    { name: "Budget", value: leadData.budget, inline: true },
    { name: "Timeline", value: leadData.timeline, inline: true },
    { name: "Project Type", value: leadData.project_type, inline: true },
    { name: "Lead Score", value: `${leadScore}/100`, inline: true }
  ],
  timestamp: new Date().toISOString()
};
```

### RabbitMQ Queue Structure
- **hubspot-sync**: HubSpot contact creation and updates
- **discord-notifications**: Real-time Discord alerts
- **failed-messages**: Dead letter queue for retry logic

## 📊 Performance Targets

- **Response Time**: <2 seconds for chat responses
- **Lead Processing**: <500ms for HubSpot contact creation
- **Discord Notifications**: <1 second delay
- **Uptime**: 99.9% availability

## ✅ Success Criteria

1. ✅ All database dependencies removed
2. ✅ HubSpot contacts created successfully
3. ✅ Discord notifications working
4. ✅ Discord button visible and functional
5. ✅ Response times under 2 seconds
6. ✅ CloudAMQP integration stable
7. ✅ Zero data loss during migration

## 🚀 Next Steps

1. Start with Phase 1: Environment configuration
2. Execute Phase 2: Database removal (highest priority)
3. Implement Phase 3: Discord integration
4. Complete remaining phases sequentially
5. Test thoroughly before production deployment

## 📞 Support & Monitoring

- **Health Check**: `/api/health`
- **HubSpot Status**: Check HubSpot API rate limits
- **Discord Status**: Monitor webhook delivery
- **CloudAMQP**: Monitor queue depths and connection status

---

**Estimated Total Time**: 7-8 hours
**Risk Level**: Medium (due to database removal)
**Rollback Plan**: Git revert + database backup restore