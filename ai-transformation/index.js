const fastify = require('fastify')({ logger: true });
const { AITransformationOrchestrator } = require('./src/orchestrator');
const { ErrorHandler } = require('./src/middleware/errorHandler');

fastify.register(require('@fastify/cors'));

const orchestrator = new AITransformationOrchestrator();

// Global error handler
fastify.setErrorHandler(ErrorHandler.handleAPIError);

// Health check
fastify.get('/api/health', async (request, reply) => {
  const health = await orchestrator.getSystemHealth();
  return health;
});

// Phase 1: Education & Alignment
fastify.post('/api/phase1/start', async (request, reply) => {
  try {
    const { companyInfo } = request.body;
    
    if (!companyInfo) {
      return reply.code(400).send({ error: 'Company information is required' });
    }
    
    const result = await orchestrator.startPhase1(companyInfo);
    return { success: true, ...result };
  } catch (error) {
    throw error; // Let global error handler manage it
  }
});

// Phase 2: Identification & Auditing  
fastify.post('/api/phase2/interview', async (request, reply) => {
  try {
    const { companyId, role, answers } = request.body;
    
    if (!companyId || !role || !answers) {
      return reply.code(400).send({ 
        error: 'Missing required fields: companyId, role, answers' 
      });
    }
    
    const result = await orchestrator.processInterview({ companyId, role, answers });
    return { success: true, ...result };
  } catch (error) {
    throw error;
  }
});

// Get interview progress
fastify.get('/api/phase2/progress/:companyId', async (request, reply) => {
  try {
    const progress = await orchestrator.getInterviewProgress(request.params.companyId);
    return progress;
  } catch (error) {
    throw error;
  }
});

// Generate roadmap
fastify.get('/api/phase2/roadmap/:companyId', async (request, reply) => {
  try {
    const roadmap = await orchestrator.generateRoadmap(request.params.companyId);
    return { success: true, roadmap };
  } catch (error) {
    throw error;
  }
});

// Export roadmap as PDF (placeholder)
fastify.get('/api/roadmap/:companyId/export', async (request, reply) => {
  try {
    // This would integrate with a PDF generation service
    return { 
      downloadUrl: `/downloads/roadmap-${request.params.companyId}.pdf`,
      message: 'PDF generation initiated'
    };
  } catch (error) {
    throw error;
  }
});

// Rate limiting middleware
fastify.register(async function (fastify) {
  const requests = new Map();
  
  fastify.addHook('preHandler', async (request, reply) => {
    const ip = request.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return;
    }
    
    const requestData = requests.get(ip);
    
    if (now > requestData.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return;
    }
    
    if (requestData.count >= maxRequests) {
      return reply.code(429).send({
        error: 'Too many requests',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }
    
    requestData.count++;
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: '0.0.0.0' });
    console.log('🚀 AI Transformation System running on port 3002');
    console.log('📊 Health check: http://localhost:3002/api/health');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await fastify.close();
  process.exit(0);
});

start();
