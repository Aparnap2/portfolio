---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
This repository contains Aparna Pradhan's portfolio website built with Next.js and React, featuring a lead capture system and AI transformation automation. The project consists of a main Next.js application and two subprojects: a lead enrichment system and an AI transformation automation system.

## Repository Structure
- **src/**: Main Next.js application source code
  - **app/**: Next.js App Router components and routes
  - **components/**: React components
  - **hooks/**: Custom React hooks
  - **lib/**: Utility functions and services
  - **pages/**: Next.js Pages Router components
- **lead-system/**: Lead enrichment system subproject
- **ai-transformation/**: AI transformation automation subproject
- **workers/**: Background worker scripts
- **scripts/**: Utility scripts for various operations
- **public/**: Static assets

## Projects

### Main Portfolio Application
**Configuration File**: package.json

#### Language & Runtime
**Language**: JavaScript/TypeScript
**Version**: TypeScript 5.4.5
**Build System**: Next.js
**Package Manager**: npm/pnpm

#### Dependencies
**Main Dependencies**:
- Next.js 14.2.8
- React 18
- LangChain 0.1.37
- @langchain/langgraph 0.2.65
- @langchain/google-genai 0.0.26
- @datastax/astra-db-ts 1.4.1
- Tailwind CSS 3.4.1

#### Build & Installation
```bash
npm install
npm run dev    # Development
npm run build  # Production build
npm run start  # Production server
```

#### Testing
**Framework**: Jest
**Test Location**: src/lib/__tests__/
**Naming Convention**: *.test.js
**Run Command**:
```bash
npm run test:parsing  # Test flexible parsing
```

### Lead Enrichment System
**Configuration File**: lead-system/package.json

#### Language & Runtime
**Language**: JavaScript
**Version**: Node.js 18
**Build System**: Node.js
**Package Manager**: npm/pnpm

#### Dependencies
**Main Dependencies**:
- Fastify 4.24.3
- @langchain/langgraph 0.2.65
- @langchain/google-genai 0.0.26
- pg 8.11.3
- uuid 11.1.0

#### Build & Installation
```bash
cd lead-system
npm install
npm start
```

#### Docker
**Dockerfile**: lead-system/Dockerfile
**Image**: Node.js 18 Alpine
**Configuration**: Docker Compose with PostgreSQL database
**Run Command**:
```bash
cd lead-system
docker-compose up -d
```

#### Testing
**Framework**: Jest, Playwright
**Test Location**: lead-system/tests/
**Naming Convention**: *.test.js
**Run Command**:
```bash
cd lead-system
npm test            # All tests
npm run test:unit   # Unit tests
npm run test:e2e    # E2E tests with Playwright
```

### AI Transformation Automation
**Configuration File**: ai-transformation/package.json

#### Language & Runtime
**Language**: JavaScript
**Version**: Node.js
**Build System**: Node.js
**Package Manager**: npm/pnpm

#### Dependencies
**Main Dependencies**:
- Fastify 4.24.3
- @langchain/langgraph 0.2.65
- @langchain/google-genai 0.0.26
- pg 8.11.3
- uuid 11.1.0

#### Build & Installation
```bash
cd ai-transformation
npm install
npm start
```

#### Testing
**Framework**: Jest
**Test Location**: ai-transformation/tests/
**Naming Convention**: *.test.js
**Run Command**:
```bash
cd ai-transformation
npm test
npm run validate  # System validation
```