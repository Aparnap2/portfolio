const fastify = require('fastify')({ logger: true });
const { LeadOrchestrator } = require('./src/orchestrator');

// Register plugins
fastify.register(require('@fastify/cors'));
fastify.register(require('@fastify/swagger'));

const orchestrator = new LeadOrchestrator();

// Validation schemas
const leadSchema = {
  type: 'object',
  required: ['firstName', 'lastName', 'email', 'company'],
  properties: {
    firstName: { type: 'string', minLength: 1 },
    lastName: { type: 'string', minLength: 1 },
    email: { type: 'string', format: 'email' },
    company: { type: 'string', minLength: 1 }
  }
};

// Routes
fastify.post('/api/leads', {
  schema: {
    body: leadSchema
  }
}, async (request, reply) => {
  try {
    const result = await orchestrator.processLead(request.body);
    return { success: true, leadId: result.leadId, status: result.status };
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
});

fastify.get('/api/leads/:id', async (request, reply) => {
  try {
    const lead = await orchestrator.getLeadStatus(request.params.id);
    if (!lead) {
      reply.code(404).send({ error: 'Lead not found' });
      return;
    }
    return lead;
  } catch (error) {
    reply.code(404).send({ error: 'Lead not found' });
  }
});

fastify.get('/api/dashboard', async (request, reply) => {
  try {
    const stats = await orchestrator.getDashboardStats();
    return stats;
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
});

// Error handler for validation
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    reply.code(400).send({ 
      error: 'Invalid email format',
      details: error.validation 
    });
  } else {
    reply.code(500).send({ error: error.message });
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Lead Enrichment System running on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = fastify;
