#!/usr/bin/env node
// scripts/health-check.js
// Comprehensive health check for all services

import dotenv from 'dotenv';
import { healthCheck as dbHealthCheck, initializeDatabase } from '../src/lib/database.js';
import { healthCheck as discordHealthCheck } from '../src/lib/discord.js';
import { length as queueLength, QUEUE_NAMES } from '../src/lib/queue.js';
import { Redis } from '@upstash/redis';

dotenv.config();

const redis = Redis.fromEnv();

async function checkRedis() {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkQueues() {
  try {
    const queueStats = {};
    
    for (const [name, queueName] of Object.entries(QUEUE_NAMES)) {
      try {
        const length = await queueLength(queueName);
        queueStats[name] = {
          name: queueName,
          length,
          status: 'healthy'
        };
      } catch (error) {
        queueStats[name] = {
          name: queueName,
          status: 'unhealthy',
          error: error.message
        };
      }
    }
    
    return {
      status: 'healthy',
      queues: queueStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkHubSpot() {
  try {
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      return {
        status: 'not_configured',
        message: 'HUBSPOT_ACCESS_TOKEN not set',
        timestamp: new Date().toISOString()
      };
    }

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } else {
      const errorText = await response.text();
      return {
        status: 'unhealthy',
        error: `HTTP ${response.status}: ${errorText}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function checkGoogleAI() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return {
        status: 'not_configured',
        message: 'GOOGLE_API_KEY not set',
        timestamp: new Date().toISOString()
      };
    }

    // Simple test to check if the API key works
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (response.ok) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } else {
      const errorText = await response.text();
      return {
        status: 'unhealthy',
        error: `HTTP ${response.status}: ${errorText}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function runHealthCheck() {
  console.log('🏥 Starting comprehensive health check...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    services: {}
  };

  // Check PostgreSQL Database
  console.log('🔍 Checking PostgreSQL Database...');
  if (process.env.DATABASE_URL) {
    try {
      initializeDatabase();
      results.services.database = await dbHealthCheck();
      console.log(`   ${results.services.database.status === 'healthy' ? '✅' : '❌'} Database: ${results.services.database.status}`);
    } catch (error) {
      results.services.database = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      console.log(`   ❌ Database: ${error.message}`);
    }
  } else {
    results.services.database = {
      status: 'not_configured',
      message: 'DATABASE_URL not set'
    };
    console.log('   ⚠️ Database: Not configured');
  }

  // Check Redis
  console.log('🔍 Checking Redis...');
  results.services.redis = await checkRedis();
  console.log(`   ${results.services.redis.status === 'healthy' ? '✅' : '❌'} Redis: ${results.services.redis.status} ${results.services.redis.latency || ''}`);

  // Check Queues
  console.log('🔍 Checking Queues...');
  results.services.queues = await checkQueues();
  console.log(`   ${results.services.queues.status === 'healthy' ? '✅' : '❌'} Queues: ${results.services.queues.status}`);
  if (results.services.queues.queues) {
    Object.entries(results.services.queues.queues).forEach(([name, queue]) => {
      console.log(`     - ${name}: ${queue.length} items ${queue.status === 'healthy' ? '✅' : '❌'}`);
    });
  }

  // Check Discord
  console.log('🔍 Checking Discord...');
  results.services.discord = await discordHealthCheck();
  console.log(`   ${results.services.discord.webhook?.available ? '✅' : '❌'} Discord Webhook: ${results.services.discord.webhook?.configured ? 'Configured' : 'Not configured'}`);
  console.log(`   ${results.services.discord.bot?.available ? '✅' : '❌'} Discord Bot: ${results.services.discord.bot?.configured ? 'Configured' : 'Not configured'}`);

  // Check HubSpot
  console.log('🔍 Checking HubSpot...');
  results.services.hubspot = await checkHubSpot();
  console.log(`   ${results.services.hubspot.status === 'healthy' ? '✅' : results.services.hubspot.status === 'not_configured' ? '⚠️' : '❌'} HubSpot: ${results.services.hubspot.status}`);

  // Check Google AI
  console.log('🔍 Checking Google AI...');
  results.services.googleai = await checkGoogleAI();
  console.log(`   ${results.services.googleai.status === 'healthy' ? '✅' : results.services.googleai.status === 'not_configured' ? '⚠️' : '❌'} Google AI: ${results.services.googleai.status}`);

  // Overall health assessment
  const healthyServices = Object.values(results.services).filter(s => s.status === 'healthy').length;
  const totalServices = Object.keys(results.services).length;
  const overallHealth = healthyServices === totalServices ? 'healthy' : healthyServices > totalServices / 2 ? 'degraded' : 'unhealthy';

  results.overall = {
    status: overallHealth,
    healthy_services: healthyServices,
    total_services: totalServices,
    health_percentage: Math.round((healthyServices / totalServices) * 100)
  };

  console.log('\n📊 Health Check Summary:');
  console.log(`   Overall Status: ${overallHealth === 'healthy' ? '✅' : overallHealth === 'degraded' ? '⚠️' : '❌'} ${overallHealth.toUpperCase()}`);
  console.log(`   Healthy Services: ${healthyServices}/${totalServices} (${results.overall.health_percentage}%)`);

  // Output JSON if requested
  if (process.argv.includes('--json')) {
    console.log('\n📄 JSON Output:');
    console.log(JSON.stringify(results, null, 2));
  }

  // Exit with appropriate code
  const exitCode = overallHealth === 'unhealthy' ? 1 : 0;
  process.exit(exitCode);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run health check
runHealthCheck();