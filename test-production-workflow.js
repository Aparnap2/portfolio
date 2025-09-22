#!/usr/bin/env node
// test-production-workflow.js
// Comprehensive test of the production workflow with extensive debugging

// Using built-in fetch (Node.js 18+)
import { extractLeadInfoFlexible, captureLead } from './src/lib/lead-capture.js';
import { upsertContact } from './src/lib/hubspot-service.js';
import { sendLeadNotification, sendSystemNotification } from './src/lib/discord-service.js';
import { flexibleLeadParse } from './src/lib/flexible-lead-parser.js';

const API_BASE = 'http://localhost:3000';

const log = (category, message, data = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`\n🕐 ${timestamp} [${category.toUpperCase()}] ${message}`);
  if (Object.keys(data).length > 0) {
    console.log('   📊 Data:', JSON.stringify(data, null, 2));
  }
};

const testCases = [
  {
    name: 'Simple Lead with Email and Name',
    message: 'Hi, I\'m John Smith and my email is john.smith@company.com. I need a website for my business.',
    expectedLead: true
  },
  {
    name: 'Pricing Inquiry',
    message: 'What are your pricing options for web development?',
    expectedLead: false
  },
  {
    name: 'Complex Lead Information',
    message: 'Hello, I\'m Sarah Johnson from TechCorp (sarah@techcorp.com), phone: 555-123-4567. We need a mobile app, budget around $15k, timeline 3 months.',
    expectedLead: true
  },
  {
    name: 'Contact Request',
    message: 'Please contact me at mike@startup.io to discuss our project requirements.',
    expectedLead: true
  }
];

async function testChatAPI(message, sessionId = null) {
  log('API TEST', `Testing chat API with message: "${message.substring(0, 50)}..."`);
  
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId,
        context: { testMode: true }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    log('API TEST', 'Chat API response received', {
      responseLength: result.response?.length || 0,
      sessionId: result.sessionId,
      processingTime: result.processingTime,
      hasError: !!result.error
    });

    return {
      success: true,
      data: result,
      sessionId: result.sessionId
    };
  } catch (error) {
    log('API TEST', 'Chat API failed', {
      error: error.message,
      stack: error.stack?.split('\n')[0]
    });
    return {
      success: false,
      error: error.message
    };
  }
}

async function testLeadCaptureDirect(leadData) {
  log('LEAD CAPTURE', 'Testing direct lead capture', leadData);
  
  try {
    const result = await captureLead(leadData);
    log('LEAD CAPTURE', 'Direct capture completed', {
      success: result.success,
      leadId: result.leadId,
      qualified: result.qualified,
      processingTime: result.processingTime
    });
    return result;
  } catch (error) {
    log('LEAD CAPTURE', 'Direct capture failed', {
      error: error.message,
      stack: error.stack?.split('\n')[0]
    });
    return {
      success: false,
      error: error.message
    };
  }
}

async function testHubSpotIntegration(leadData) {
  log('HUBSPOT', 'Testing HubSpot integration', leadData);
  
  try {
    const result = await upsertContact(leadData);
    log('HUBSPOT', 'HubSpot integration completed', {
      id: result.id,
      qualified: result.isQualified,
      score: result.leadScore
    });
    return result;
  } catch (error) {
    log('HUBSPOT', 'HubSpot integration failed', {
      error: error.message,
      statusCode: error.statusCode,
      stack: error.stack?.split('\n')[0]
    });
    return {
      success: false,
      error: error.message
    };
  }
}

async function testDiscordIntegration(leadData, hubspotResult) {
  log('DISCORD', 'Testing Discord notification');
  
  try {
    const result = await sendLeadNotification(leadData, hubspotResult);
    log('DISCORD', 'Discord notification completed', {
      sent: result,
      webhookConfigured: process.env.DISCORD_WEBHOOK_URL && process.env.DISCORD_WEBHOOK_URL !== 'your_discord_webhook_url'
    });
    return result;
  } catch (error) {
    log('DISCORD', 'Discord notification failed', {
      error: error.message,
      stack: error.stack?.split('\n')[0]
    });
    return false;
  }
}

async function testEnvironmentVariables() {
  log('ENV CHECK', 'Checking environment configuration');
  
  const envVars = {
    GEMINI_MODEL_NAME: !!process.env.GEMINI_MODEL_NAME,
    GOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    HUBSPOT_ACCESS_TOKEN: !!process.env.HUBSPOT_ACCESS_TOKEN,
    DISCORD_WEBHOOK_URL: !!process.env.DISCORD_WEBHOOK_URL,
    NEXT_PUBLIC_DISCORD_INVITE_URL: !!process.env.NEXT_PUBLIC_DISCORD_INVITE_URL
  };
  
  log('ENV CHECK', 'Environment variables status', envVars);
  
  const criticalMissing = [];
  if (!envVars.GOOGLE_GENERATIVE_AI_API_KEY) criticalMissing.push('GOOGLE_GENERATIVE_AI_API_KEY');
  if (!envVars.UPSTASH_REDIS_REST_URL) criticalMissing.push('UPSTASH_REDIS_REST_URL');
  if (!envVars.UPSTASH_REDIS_REST_TOKEN) criticalMissing.push('UPSTASH_REDIS_REST_TOKEN');
  if (!envVars.HUBSPOT_ACCESS_TOKEN) criticalMissing.push('HUBSPOT_ACCESS_TOKEN');
  
  if (criticalMissing.length > 0) {
    log('ENV CHECK', 'Critical environment variables missing', { missing: criticalMissing });
    return false;
  }
  
  log('ENV CHECK', 'All critical environment variables present');
  return true;
}

async function runFullWorkflowTest() {
  console.log('🚀 Starting Full Production Workflow Test\n');
  console.log('=' .repeat(80));
  
  // Test 1: Environment Check
  const envOK = await testEnvironmentVariables();
  if (!envOK) {
    console.log('\n❌ Environment check failed. Please configure required environment variables.');
    return;
  }
  
  let totalTests = 0;
  let passedTests = 0;
  let sessionId = null;
  
  // Test 2: Chat API Tests
  console.log('\n' + '='.repeat(40) + ' CHAT API TESTS ' + '='.repeat(40));
  
  for (const testCase of testCases) {
    totalTests++;
    log('TEST CASE', `Running: ${testCase.name}`);
    
    const apiResult = await testChatAPI(testCase.message, sessionId);
    sessionId = apiResult.sessionId || sessionId;
    
    if (apiResult.success) {
      passedTests++;
      log('TEST CASE', `✅ ${testCase.name} - API call successful`);
    } else {
      log('TEST CASE', `❌ ${testCase.name} - API call failed`, { error: apiResult.error });
    }
    
    // Test lead extraction
    const leadExtracted = extractLeadInfoFlexible(testCase.message, {
      previousMessages: [],
      metadata: { intent: 'contact', confidence: 0.8 }
    });
    
    if (testCase.expectedLead && leadExtracted) {
      log('TEST CASE', `✅ ${testCase.name} - Lead extraction successful`, {
        email: leadExtracted.email ? '✓' : '✗',
        name: leadExtracted.name ? '✓' : '✗'
      });
    } else if (!testCase.expectedLead && !leadExtracted) {
      log('TEST CASE', `✅ ${testCase.name} - Correctly identified no lead`);
    } else {
      log('TEST CASE', `⚠️ ${testCase.name} - Lead extraction mismatch`, {
        expected: testCase.expectedLead,
        extracted: !!leadExtracted
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  
  // Test 3: Direct Lead Capture
  console.log('\n' + '='.repeat(35) + ' DIRECT LEAD CAPTURE TESTS ' + '='.repeat(35));
  
  const testLead = {
    email: 'test@example.com',
    name: 'Test User',
    company: 'Test Company',
    phone: '555-123-4567',
    project_type: 'Website',
    budget: '10000',
    timeline: '2 months',
    source: 'production_test',
    notes: 'This is a test lead for production verification'
  };
  
  totalTests++;
  const captureResult = await testLeadCaptureDirect(testLead);
  if (captureResult.success) {
    passedTests++;
    log('DIRECT CAPTURE', '✅ Lead capture successful');
    
    // Test Discord notification if capture succeeded
    if (captureResult.leadId) {
      const hubspotResult = {
        id: captureResult.leadId,
        isQualified: captureResult.qualified,
        leadScore: 75
      };
      
      await testDiscordIntegration(testLead, hubspotResult);
    }
  } else {
    log('DIRECT CAPTURE', '❌ Lead capture failed', { error: captureResult.error });
  }
  
  // Test 4: HubSpot Integration
  console.log('\n' + '='.repeat(35) + ' HUBSPOT INTEGRATION TEST ' + '='.repeat(35));
  
  totalTests++;
  const hubspotResult = await testHubSpotIntegration({
    email: 'integration.test@example.com',
    name: 'Integration Test',
    company: 'Test Corp',
    source: 'integration_test'
  });
  
  if (hubspotResult.id) {
    passedTests++;
    log('HUBSPOT', '✅ HubSpot integration successful');
  } else {
    log('HUBSPOT', '❌ HubSpot integration failed');
  }
  
  // Test 5: System Notification
  console.log('\n' + '='.repeat(35) + ' DISCORD SYSTEM NOTIFICATION ' + '='.repeat(35));
  
  await sendSystemNotification(
    `Production workflow test completed. Results: ${passedTests}/${totalTests} tests passed.`,
    'info'
  );
  
  // Final Results
  console.log('\n' + '='.repeat(40) + ' FINAL RESULTS ' + '='.repeat(40));
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  log('FINAL RESULTS', 'Production workflow test completed', {
    totalTests,
    passedTests,
    successRate: `${successRate}%`,
    status: successRate >= 80 ? '✅ PRODUCTION READY' : '⚠️ NEEDS ATTENTION'
  });
  
  if (successRate >= 80) {
    console.log('\n🎉 System is working correctly and ready for production use!');
  } else {
    console.log('\n⚠️ Some components need attention before production deployment.');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✨ Production workflow test complete!');
}

// Run the test
runFullWorkflowTest().catch(error => {
  console.error('\n💥 Production workflow test crashed:', error);
  process.exit(1);
});
