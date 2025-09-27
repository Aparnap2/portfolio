# 🚀 Aparna Pradhan - AI SaaS Developer Portfolio

A sophisticated, production-ready portfolio website showcasing expertise in AI agent development, featuring a **24/7 lead capture system** with **virtual AI automation audits** and **real-time notifications**.

![Portfolio Preview](https://img.shields.io/badge/Status-Production%20Ready-green) ![Next.js](https://img.shields.io/badge/Next.js-14.2.8-black) ![AI Powered](https://img.shields.io/badge/AI%20Powered-Yes-blue)

## 🌟 Key Features

### 🤖 **24/7 Lead Capture System**
- **Event-Driven Architecture** - Real-time lead processing using Next.js API routes
- **Intelligent Data Parsing** - Flexible parser handles multiple lead formats
- **Async Storage** - PostgreSQL database with optimized lead management
- **Multi-Channel Notifications** - Discord and HubSpot integration

### 🔍 **Virtual AI Automation Audit**
- **3-Phase Assessment Process** - Comprehensive business analysis
- **AI-Powered Interviews** - Role-based process mapping and automation identification
- **Strategic Roadmap Generation** - Custom AI transformation strategies
- **ROI Projections** - Detailed cost-benefit analysis

### 💬 **Advanced AI Chatbot**
- **RAG-Enhanced Responses** - Context-aware conversations using vector search
- **LangChain Orchestration** - Sophisticated AI agent workflows
- **Streaming Responses** - Real-time chat with typing indicators
- **Session Management** - Persistent conversation context

### 🔧 **Technical Excellence**
- **Next.js 14** - App Router with server-side rendering
- **Tailwind CSS** - Modern, responsive design system
- **TypeScript Ready** - Full type safety support
- **Production Optimized** - Code splitting and performance optimization

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│   API Routes     │───▶│   External APIs │
│   (Frontend)    │    │   (Event-Driven) │    │   (HubSpot, AI) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis Cache    │    │   Discord Bot   │
│   (Lead Store)  │    │   (Sessions)     │    │   (Notifications)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Gemini API key
- HubSpot API access token
- Discord webhook URL

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aparnap2/portfolio.git
   cd portfolio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database credentials
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   ```
   http://localhost:3000
   ```

## 📊 System Capabilities

### Lead Management
- ✅ **Real-time lead capture** from multiple sources
- ✅ **Intelligent data parsing** and validation
- ✅ **Automated lead scoring** and qualification
- ✅ **Multi-channel notifications** (Discord, HubSpot)
- ✅ **Lead enrichment** with external data sources

### AI Assessment System
- ✅ **Company onboarding** and business analysis
- ✅ **Role-based interviews** for process mapping
- ✅ **AI automation opportunity identification**
- ✅ **Custom roadmap generation** with ROI projections
- ✅ **Implementation timeline** and cost analysis

### Technical Features
- ✅ **Event-driven architecture** - No background workers needed
- ✅ **Async database operations** with PostgreSQL
- ✅ **Vector search integration** with AstraDB
- ✅ **Real-time chat** with streaming responses
- ✅ **GitHub portfolio integration**
- ✅ **Responsive design** with glass effects

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads` | POST | Capture and process new leads |
| `/api/phase1/start` | POST | Initiate AI assessment process |
| `/api/phase2/interview` | POST | Process role-based interviews |
| `/api/phase2/roadmap/[companyId]` | GET | Generate AI strategy roadmap |
| `/api/chat` | POST | AI chatbot with RAG capabilities |
| `/api/workers/hubspot` | POST | HubSpot lead synchronization |
| `/api/workers/discord` | POST | Discord notification system |

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - Modern React with hooks and async patterns
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions

### Backend & AI
- **Next.js API Routes** - Serverless functions for all endpoints
- **LangChain** - AI orchestration and agent workflows
- **Google Gemini API** - Advanced AI responses and analysis
- **PostgreSQL** - Robust data storage and querying

### External Integrations
- **HubSpot CRM** - Lead management and marketing automation
- **Discord** - Real-time notifications and alerts
- **AstraDB** - Vector database for RAG functionality
- **GitHub API** - Portfolio project integration
- **Upstash Redis** - Session management and caching

## 📈 Performance & Production

### Optimization Features
- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js built-in image optimization
- **Edge Runtime** - Fast API responses with Vercel Edge
- **Database Indexing** - Optimized queries for lead processing
- **Caching Strategy** - Redis for session and API caching

### Production Ready
- ✅ **Environment configurations** (development, production)
- ✅ **Error handling** and logging
- ✅ **Security headers** and CORS configuration
- ✅ **Database migrations** and schema management
- ✅ **Monitoring** and health check endpoints

## 🤝 Business Value

### For Potential Clients
1. **Immediate Lead Capture** - Every visitor interaction captured
2. **AI-Powered Assessment** - Comprehensive business analysis in minutes
3. **Strategic Roadmaps** - Clear AI transformation strategies
4. **Professional Presentation** - Enterprise-grade portfolio showcasing expertise

### For Development
1. **Modern Tech Stack** - Latest technologies and best practices
2. **Scalable Architecture** - Handles growth and increased traffic
3. **Maintainable Codebase** - Clean, documented, and well-structured
4. **Production Ready** - Deployable to any modern hosting platform

## 📝 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing & Quality
npm run lint            # Run ESLint
npm run test:parsing    # Test lead parsing functionality

# Database
npm run db:migrate      # Run database migrations

# Health Checks
npm run health:check    # System health check
npm run health:json     # Health check with JSON output
```

## 🔒 Security & Privacy

- **API Key Protection** - Environment variables for all sensitive data
- **Input Validation** - Comprehensive validation on all endpoints
- **SQL Injection Protection** - Parameterized queries throughout
- **CORS Configuration** - Secure cross-origin resource sharing
- **Rate Limiting** - Built-in protection against abuse

## 📞 Support & Contact

For questions, suggestions, or collaboration opportunities:

- **Portfolio Website**: [Live Demo](https://your-portfolio-url.com)
- **LinkedIn**: [Aparna Pradhan](https://linkedin.com/in/aparnapradhan)
- **GitHub**: [Portfolio Repository](https://github.com/Aparnap2/portfolio)
- **Email**: Available through contact form

---

**Built with ❤️ using Next.js, AI, and modern web technologies**

*This portfolio demonstrates expertise in AI agent development, lead generation systems, and enterprise-grade web applications.*