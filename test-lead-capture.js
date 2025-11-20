#!/usr/bin/env node

/**
 * Lead Capture System Testing Script
 *
 * This script tests all components of the AI-powered lead capture system:
 * 1. Chat API with intelligent lead extraction
 * 2. QStash async processing
 * 3. HubSpot CRM integration
 * 4. Discord notifications
 * 5. Slack fallback notifications
 */

const fetch = require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testEmail: `test-${Date.now()}@example.com`,
  testLead: {
    name: 'John Test User',
    company: 'Test Tech Corp',
    email: '', // Will be set dynamically
    phone: '+1-555-0123',
    industry: 'Technology',
    requirements: 'Need automation for customer support and data processing',
    budget: '$10,000 - $25,000',
    timeline: 'Within 3 months',
    company_size: '50-100 employees',
    current_challenges: 'Manual data entry and slow customer response times'
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function testChatAPI() {
  log('\n🧪 Testing Chat API with Lead Extraction', colors.cyan);
  log('=' .repeat(50));

  const testLead = { ...TEST_CONFIG.testLead };
  testLead.email = TEST_CONFIG.testEmail;

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `Hi! I'm ${testLead.name} from ${testLead.company}. We're looking for AI automation solutions. Our email is ${testLead.email} and phone is ${testLead.phone}. We're in the ${testLead.industry} industry with ${testLead.company_size} employees. Our main challenges are ${testLead.current_challenges} and we need help with ${testLead.requirements}. Our budget is ${testLead.budget} and timeline is ${testLead.timeline}.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';
    let metadataReceived = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop();

      for (const chunk of chunks) {
        if (!chunk.startsWith('data:')) continue;

        const data = chunk.replace(/^data:\s*/, '').trim();
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);

          if (parsed.metadata) {
            logSuccess(`Metadata received: Intent=${parsed.metadata.intent}, Confidence=${parsed.metadata.confidence}, Topics=${parsed.metadata.topics.join(', ')}`);
            metadataReceived = true;
          } else if (parsed.content) {
            fullResponse += parsed.content;
          }
        } catch (e) {
          logWarning(`Failed to parse chunk: ${e.message}`);
        }
      }
    }

    logSuccess(`Chat API responded successfully`);
    logInfo(`Response length: ${fullResponse.length} characters`);
    logInfo(`Metadata received: ${metadataReceived}`);

    return {
      success: true,
      response: fullResponse,
      metadataReceived
    };

  } catch (error) {
    logError(`Chat API test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testQStashQueuing() {
  log('\n🧪 Testing QStash Async Processing', colors.cyan);
  log('=' .repeat(50));

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhooks/lead-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Task-ID': `test-${Date.now()}`,
        'X-Task-Type': 'lead_processing'
      },
      body: JSON.stringify({
        id: `test-${Date.now()}`,
        type: 'lead_processing',
        data: {
          ...TEST_CONFIG.testLead,
          email: TEST_CONFIG.testEmail,
          lead_score: 85,
          conversation_summary: 'Test lead interested in AI automation solutions'
        },
        timestamp: new Date().toISOString(),
        priority: 'high'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    logSuccess(`QStash processing initiated`);
    logInfo(`Task ID: ${result.taskId}`);
    logInfo(`Lead Email: ${result.leadEmail}`);
    logInfo(`Lead Score: ${result.leadScore}`);

    return { success: true, result };

  } catch (error) {
    logError(`QStash test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testHubSpotIntegration() {
  log('\n🧪 Testing HubSpot Integration', colors.cyan);
  log('=' .repeat(50));

  try {
    // This would normally be tested through the lead processor
    // For direct testing, we'll simulate a HubSpot client test
    logInfo('Note: HubSpot integration is tested indirectly through the lead processor');
    logInfo('Direct HubSpot API testing requires valid access token');

    // Check if HubSpot environment variables are set
    const hubspotToken = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!hubspotToken) {
      logWarning('HUBSPOT_ACCESS_TOKEN not set in environment');
      return { success: false, error: 'HubSpot token not configured' };
    }

    logSuccess('HubSpot environment variables are configured');
    logInfo('HubSpot integration will be tested when lead processor runs');

    return { success: true, message: 'Configuration verified' };

  } catch (error) {
    logError(`HubSpot test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDiscordIntegration() {
  log('\n🧪 Testing Discord Integration', colors.cyan);
  log('=' .repeat(50));

  try {
    // Check Discord webhook configuration
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhook) {
      logWarning('DISCORD_WEBHOOK_URL not set in environment');
      return { success: false, error: 'Discord webhook not configured' };
    }

    // Test Discord webhook directly
    const testPayload = {
      username: 'Aparna\'s AI Assistant',
      embeds: [{
        title: '🧪 Test Notification',
        description: 'This is a test message from the lead capture system',
        color: 0x00FF00,
        fields: [
          {
            name: 'Test Type',
            value: 'Discord Integration Test',
            inline: true
          },
          {
            name: 'Timestamp',
            value: new Date().toISOString(),
            inline: true
          }
        ],
        footer: {
          text: 'Lead Capture System Test'
        }
      }]
    };

    const response = await fetch(discordWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    logSuccess(`Discord webhook test successful`);
    logInfo(`Message ID: ${result.id}`);

    return { success: true, messageId: result.id };

  } catch (error) {
    logError(`Discord test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSlackIntegration() {
  log('\n🧪 Testing Slack Integration (Optional)', colors.cyan);
  log('=' .repeat(50));

  try {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (!slackWebhook) {
      logWarning('SLACK_WEBHOOK_URL not set in environment (optional)');
      return { success: false, error: 'Slack webhook not configured (optional)' };
    }

    const testPayload = {
      text: '🧪 This is a test message from the lead capture system - Slack integration test'
    };

    const response = await fetch(slackWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    logSuccess(`Slack webhook test successful`);
    return { success: true };

  } catch (error) {
    logError(`Slack test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testConversationFlow() {
  log('\n🧪 Testing Conversation Flow Scenarios', colors.cyan);
  log('=' .repeat(50));

  const scenarios = [
    {
      name: 'Pricing Inquiry',
      message: 'What are your pricing plans for AI automation?',
      expectedIntent: 'pricing'
    },
    {
      name: 'Consultation Request',
      message: 'I\'d like to schedule a consultation to discuss automation for my business',
      expectedIntent: 'demo'
    },
    {
      name: 'General Information',
      message: 'Can you tell me more about how AI automation can help my company?',
      expectedIntent: 'information'
    }
  ];

  const results = [];

  for (const scenario of scenarios) {
    try {
      logInfo(`Testing scenario: ${scenario.name}`);

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: scenario.message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let metadataReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();

        for (const chunk of chunks) {
          if (!chunk.startsWith('data:')) continue;

          const data = chunk.replace(/^data:\s*/, '').trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.metadata) {
              logInfo(`  Intent: ${parsed.metadata.intent}, Confidence: ${parsed.metadata.confidence}`);
              metadataReceived = true;
              results.push({
                scenario: scenario.name,
                success: true,
                intent: parsed.metadata.intent,
                confidence: parsed.metadata.confidence
              });
            }
          } catch (e) {
            // Ignore parsing errors during streaming
          }
        }
      }

      if (!metadataReceived) {
        logWarning(`No metadata received for ${scenario.name}`);
        results.push({
          scenario: scenario.name,
          success: false,
          error: 'No metadata received'
        });
      }

    } catch (error) {
      logError(`Scenario ${scenario.name} failed: ${error.message}`);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

async function generateTestReport(results) {
  log('\n📊 Test Report Summary', colors.magenta);
  log('=' .repeat(50));

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result =>
    Array.isArray(result) ? result.every(r => r.success) : result.success
  ).length;

  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`);
  log(`Failed: ${totalTests - passedTests}`);
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  log('\nDetailed Results:');
  Object.entries(results).forEach(([testName, result]) => {
    const status = Array.isArray(result)
      ? result.every(r => r.success) ? '✅' : '❌'
      : result.success ? '✅' : '❌';

    log(`  ${status} ${testName}`);

    if (Array.isArray(result)) {
      result.forEach(r => {
        if (!r.success) {
          log(`    ❌ ${r.scenario}: ${r.error || 'Unknown error'}`);
        }
      });
    } else if (!result.success) {
      log(`    Error: ${result.error || 'Unknown error'}`);
    }
  });

  log('\n🎯 Recommendations:');

  if (!results.chatAPI?.success) {
    log('  • Fix Chat API - Check server is running and API keys are configured');
  }

  if (!results.discord?.success) {
    log('  • Configure Discord webhook - Create a webhook in your Discord server');
  }

  if (!results.qstash?.success) {
    log('  • Configure QStash - Set up QStash account and add token to environment');
  }

  if (results.conversationFlow && results.conversationFlow.length > 0) {
    const failedScenarios = results.conversationFlow.filter(r => !r.success);
    if (failedScenarios.length > 0) {
      log('  • Improve conversation flow - Some scenarios are not being properly categorized');
    }
  }

  log('\n🚀 Next Steps:');
  log('  1. Set up all required environment variables');
  log('  2. Create Discord webhook in your server');
  log('  3. Configure HubSpot Private App with proper permissions');
  log('  4. Set up QStash account for async processing');
  log('  5. Test with real lead data');
  log('  6. Monitor system performance and analytics');
}

async function runAllTests() {
  log('🚀 Starting Lead Capture System Tests', colors.cyan);
  log('='.repeat(60));

  const results = {};

  // Run all tests
  results.chatAPI = await testChatAPI();
  results.qstash = await testQStashQueuing();
  results.hubspot = await testHubSpotIntegration();
  results.discord = await testDiscordIntegration();
  results.slack = await testSlackIntegration();
  results.conversationFlow = await testConversationFlow();

  // Generate report
  await generateTestReport(results);

  // Exit with appropriate code
  const allPassed = Object.values(results).every(result =>
    Array.isArray(result) ? result.every(r => r.success) : result.success
  );

  process.exit(allPassed ? 0 : 1);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testChatAPI,
  testQStashQueuing,
  testHubSpotIntegration,
  testDiscordIntegration,
  testSlackIntegration,
  testConversationFlow,
  runAllTests
};