# AI-Powered Lead Capture System

This system transforms your chatbot from a Q&A RAG pipeline into an intelligent lead capture and qualification engine.

## 🚀 Key Features

### 🎯 **Intelligent Lead Capture**
- **Natural Conversation Flow**: Proactive questions guide users through qualification
- **Smart Information Extraction**: Automatically captures name, email, company, requirements, budget, timeline
- **Lead Scoring**: AI-powered scoring based on conversation quality (0-100)
- **Conversation Summaries**: Automated summaries for context preservation

### 🤖 **Advanced AI Integration**
- **Google Gemini Models**: For conversation and lead extraction
- **Proactive Engagement**: 70% of conversations use contextual prompts
- **Conversation Staging**: Dynamic flow through: Greeting → Business Understanding → Solutions → Lead Capture
- **Context-Aware Responses**: Adapts based on conversation history

### 📊 **HubSpot CRM Integration**
- **Contact Creation**: Automatic contact creation with enrichment
- **Company Creation**: Company records with association to contacts
- **Deal Generation**: Automatic deal creation for qualified leads (score ≥ 50)
- **Data Enrichment**: All conversation data captured and stored
- **Batch Processing**: Efficient bulk operations with error handling

### ⚡ **Asynchronous Processing (Upstash QStash)**
- **Queue-Based Processing**: Priority queues (high/normal/low priority leads)
- **Retry Logic**: Automatic retry with exponential backoff
- **Rate Limiting**: Protects against API limits
- **Scheduled Follow-ups**: Automated follow-up task scheduling
- **Health Monitoring**: Queue health and performance metrics

### 📱 **Multi-Channel Communication**
- **Slack Integration**: Real-time notifications for high-quality leads
- **Email Integration**: Direct email contact buttons
- **Direct Messaging**: Slack message links for instant communication
- **Rich Notifications**: Formatted messages with action buttons

### 🗄️ **Session Management (Upstash Redis)**
- **Conversation State**: Persistent conversation history
- **Lead Caching**: Local fallback for failed HubSpot uploads
- **Analytics**: Daily metrics and performance tracking
- **Session Recovery**: Maintains context across page reloads

## 📋 **Architecture Overview**

```
Frontend (React Chatbot)
        ↓
API Route (/api/chat)
        ↓
Google Gemini (LLM) + Upstash Redis (State)
        ↓
Intelligent Lead Extraction
        ↓
QStash Queue (Async Processing)
        ↓
Webhook Processors
        ↓
HubSpot API + Slack Notifications
```

## 🛠 **Installation & Setup**

### 1. Install Dependencies
```bash
npm install @upstash/qstash @upstash/redis @langchain/google-genai @langchain/core @langchain/community
```

### 2. Environment Variables
Copy `env-updated.example` to `.env.local` and configure:

```env
# Required for all functionality
GOOGLE_API_KEY=your_google_api_key
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token
QSTASH_TOKEN=your_qstash_token
HUBSPOT_ACCESS_TOKEN=your_hubspot_token
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional for Slack notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url
SLACK_BOT_TOKEN=xoxb-your_slack_bot_token
```

### 3. Service Setup

#### **Upstash Redis**
1. Create a Redis database
2. Get REST URL and token
3. Add to environment variables

#### **Upstash QStash**
1. Create QStash account
2. Get token and signing key
3. Add to environment variables

#### **HubSpot**
1. Create a Private App in HubSpot
2. Enable CRM objects (contacts, companies, deals)
3. Get access token
4. Add to environment variables

#### **Slack (Optional)**
1. Create a Slack app
2. Add incoming webhook
3. Add bot token with chat:write scope
4. Add to environment variables

## 🔧 **Configuration**

### **Lead Scoring Criteria**
- **Requirements Clarity** (25 points)
- **Budget Availability** (25 points)
- **Timeline Urgency** (25 points)
- **Decision Making Authority** (25 points)

### **Queue Priorities**
- **High Priority** (score ≥ 80): Immediate processing
- **Normal Priority** (score ≥ 60): Standard processing
- **Low Priority** (score < 60): Delayed processing

### **Conversation Flow**
1. **Initial Greeting**: Business-focused opening
2. **Business Understanding**: Company, challenges, current processes
3. **Solution Exploration**: Automation opportunities, requirements, budget, timeline
4. **Lead Capture**: Contact details and next steps

## 📊 **Monitoring & Analytics**

### **Available Metrics**
- Daily lead volume
- Lead quality distribution
- Queue health metrics
- Processing success rates
- HubSpot sync status

### **Access Analytics**
```javascript
// Redis analytics data
const analyticsKey = `qstash_analytics:${new Date().toISOString().split('T')[0]}`;
const analytics = await redis.hgetall(analyticsKey);
```

## 🔒 **Security Considerations**

- All API tokens stored securely in environment variables
- Input validation and sanitization
- Rate limiting on external API calls
- Error handling prevents sensitive data exposure
- Webhook verification for Slack integration

## 🎨 **Frontend Features**

### **Lead-Focused UI Components**
- **Quick Action Buttons**: Pre-configured qualification prompts
- **Conversation Stage Indicator**: Visual progress tracking
- **Lead Capture Success**: Confirmation and next steps
- **Direct Contact Options**: Email and Slack integration

### **Smart Conversation Handling**
- **Proactive Questions**: Context-aware engagement
- **Natural Flow**: Avoids repetitive questions
- **Progressive Disclosure**: Requests information naturally
- **Token Optimization**: Efficient conversation design

## 🔄 **Migration from RAG System**

### **Removed Components**
- AstraDB vector store (`/src/lib/astradb.js`)
- Embedding pipeline (`/src/lib/data_processor.js`)
- Document retrieval logic
- Knowledge base search functionality

### **Enhanced Components**
- `/src/app/api/chat/route.js`: Lead-focused conversation logic
- `/src/lib/hubspot_client.js`: Comprehensive CRM integration
- `/src/lib/qstash_client.js`: Async processing system
- `/src/app/component/chatbot/ChatbotComponent.jsx`: Lead-focused UI

## 🚀 **Performance Optimizations**

- **Circuit Breakers**: Prevent cascade failures
- **Request Batching**: Efficient HubSpot API usage
- **Connection Pooling**: Reuse API connections
- **Lazy Loading**: Load components as needed
- **Error Boundaries**: Graceful error handling

## 🧪 **Testing**

### **Manual Testing Checklist**
- [ ] Lead capture from natural conversation
- [ ] Quick action button functionality
- [ ] HubSpot contact creation
- [ ] Company creation and association
- [ ] Deal creation for qualified leads
- [ ] Slack notifications
- [ ] Email integration
- [ ] Conversation persistence
- [ ] Error handling and fallbacks

### **Integration Testing**
```bash
# Test chat API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hi, I'm John from TechCorp and need automation help"}]}'

# Test Slack webhook
curl -X POST http://localhost:3000/api/slacks/notify \
  -H "Content-Type: application/json" \
  -d '{"text":"Test notification"}'
```

## 🔮 **Future Enhancements**

- **Lead Enrichment**: Automatic company research
- **Email Sequences**: Automated nurture campaigns
- **Calendar Integration**: Direct scheduling
- **Analytics Dashboard**: Lead conversion tracking
- **A/B Testing**: Conversation optimization
- **Multi-language Support**: Global lead capture

## 📞 **Support**

For implementation support:
1. Check environment variable configuration
2. Verify API credentials and permissions
3. Review service health dashboards
4. Check error logs in browser console
5. Monitor Redis and QStash queue status

---

**Note**: This system is production-ready and designed for scale. All components include error handling, retries, and monitoring capabilities.