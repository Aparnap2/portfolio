# AI Audit Chatbot Documentation

## Overview

This is a production-ready AI-powered chatbot application for business automation audits, built with Next.js 15, TypeScript, and modern web technologies.

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   pnpm db:push
   pnpm db:generate
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

## Project Structure

```
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/                 # Core business logic
├── stores/              # Zustand state management
├── hooks/               # Custom React hooks
├── docs/                # Documentation
└── __tests__/           # Test files
```

## Features

- 🤖 AI-powered business automation audits
- 📊 Real-time chat interface
- 🔄 Multi-step workflow validation
- 📧 Automated email notifications
- 💬 Discord integration
- 📄 Google Docs report generation
- 🔗 HubSpot CRM integration
- 📈 Performance monitoring
- 🔒 Security-first design

## API Documentation

### Core Endpoints

- `POST /api/audit/start` - Start new audit session
- `POST /api/audit/answer` - Process chat messages
- `POST /api/audit/generate` - Generate audit report

### Integrations

- **Google AI** - Conversation processing
- **Redis** - Session storage and caching
- **Discord** - Notification delivery
- **HubSpot** - Lead management
- **Gmail/Google Docs** - Report generation

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio

# Testing
pnpm test             # Run all tests
pnpm test:integration # Run integration tests
pnpm test:unit        # Run unit tests

# Infrastructure
pnpm discord:start    # Start Discord bot
pnpm health-check     # Check system health
```

### Environment Variables

See `.env.example` for all required environment variables.

## Deployment

For detailed deployment instructions, see:
- [Production Deployment Guide](PRODUCTION-DEPLOYMENT.md)
- [Docker Configuration](docker-compose.prod.yml)
- [CI/CD Pipeline](.github/workflows/deploy-production.yml)

## Architecture Principles

- **Server Components First** - Optimize for performance
- **Type Safety** - Full TypeScript coverage with Zod validation
- **Atomic Design** - Modular component architecture
- **Error Boundaries** - Comprehensive error handling
- **Progressive Enhancement** - Works without JavaScript

## Contributing

1. Follow the established code patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure TypeScript compliance

## License

This project is proprietary. See LICENSE file for details.

---

*Built with Next.js 15, React 19, and modern web technologies.*
