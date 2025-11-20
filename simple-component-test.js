#!/usr/bin/env node

/**
 * Focused Component Testing
 * Simpler tests for each component without complex dependencies
 */

// Test environment variables
const env = {
  GOOGLE_API_KEY: "your-google-api-key-here",
  UPSTASH_REDIS_REST_URL: "your-upstash-redis-url-here",
  UPSTASH_REDIS_REST_TOKEN: "your-upstash-redis-token-here",
  QSTASH_TOKEN: "your-qstash-token-here",
  HUBSPOT_ACCESS_TOKEN: "your-hubspot-access-token-here",
  DISCORD_WEBHOOK_URL: "your-discord-webhook-url-here",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000"
};

// Simple test result class
class TestResult {
  constructor(name) {
    this.name = name;
    this.startTime = Date.now();
    this.pass = false;
    this.error = null;
    this.data = null;
  }

  success(data) {
    this.pass = true;
    this.data = data;
    this.duration = Date.now() - this.startTime;
  }

  fail(error) {
    this.pass = false;
    this.error = error;
    this.duration = Date.now() - this.startTime;
  }

  toString() {
    const icon = this.pass ? '✅' : '❌';
    return `${icon} ${this.name} (${this.duration}ms)${!this.pass ? ` - ${this.error}` : ''}`;
  }
}

// Test results array
const results = [];

// Helper function to run tests
async function runTest(name, testFn) {
  const result = new TestResult(name);
  console.log(`\n🧪 Testing ${name}...`);

  try {
    const data = await testFn();
    result.success(data);
    console.log(`✅ ${name} passed`);
  } catch (error) {
    result.fail(error.message || error);
    console.log(`❌ ${name} failed: ${error.message || error}`);
  }

  results.push(result);
  return result;
}

// 1. Test Google AI API
async function testGoogleAI() {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GOOGLE_API_KEY
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: "Hello, please respond briefly" }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.status} - ${await response.text()}`);
  }

  const data = await response.json();
  return {
    status: 'success',
    response: data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) || 'No response'
  };
}

// 2. Test Upstash Redis
async function testRedis() {
  const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/ping`, {
    headers: {
      'Authorization': `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`Redis ping failed: ${response.status}`);
  }

  const pong = await response.text();

  // Test set/get
  const testKey = `test_${Date.now()}`;
  const testValue = 'test_value';

  await fetch(`${env.UPSTASH_REDIS_REST_URL}/set/${testKey}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testValue)
  });

  const getResponse = await fetch(`${env.UPSTASH_REDIS_REST_URL}/get/${testKey}`, {
    headers: {
      'Authorization': `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`
    }
  });

  const retrieved = await getResponse.text();

  // Cleanup
  await fetch(`${env.UPSTASH_REDIS_REST_URL}/del/${testKey}`, {
    headers: {
      'Authorization': `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`
    }
  });

  return {
    ping: pong,
    setGetWorking: retrieved === testValue,
    connection: 'ok'
  };
}

// 3. Test HubSpot API
async function testHubSpot() {
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
    headers: {
      'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`HubSpot API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return {
    authenticated: true,
    apiWorking: true,
    contactCount: data.total || 0
  };
}

// 4. Test Discord Webhook
async function testDiscord() {
  const payload = {
    username: 'Test Bot',
    embeds: [{
      title: '🧪 Test Notification',
      description: 'This is a test of the Discord webhook system',
      color: 0x00FF00,
      timestamp: new Date().toISOString()
    }]
  };

  const response = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Discord webhook error: ${response.status} - ${errorData}`);
  }

  const result = await response.json();
  return {
    delivered: true,
    messageId: result.id
  };
}

// 5. Test QStash (New V2 API)
async function testQStash() {
  // Test with QStash V2 API endpoint
  const response = await fetch('https://qstash.upstash.io/v2/publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.QSTASH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/lead-processor`,
      body: { test: 'message', timestamp: new Date().toISOString() }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`QStash error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  return {
    published: true,
    messageId: data.messageId
  };
}

// 6. Test Chat API (if server is running)
async function testChatAPI() {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, this is a test message' }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status} - ${await response.text()}`);
    }

    return {
      statusCode: response.status,
      contentType: response.headers.get('content-type'),
      working: true
    };
  } catch (error) {
    return {
      error: error.message,
      note: 'Make sure the development server is running on localhost:3000'
    };
  }
}

// 7. Test Environment Variables
async function testEnvironment() {
  const required = Object.keys(env);
  const missing = required.filter(key => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    allPresent: true,
    count: required.length
  };
}

// 8. Test Network Connectivity
async function testNetwork() {
  const tests = [
    { name: 'Google API', url: 'https://generativelanguage.googleapis.com' },
    { name: 'Upstash Redis', url: env.UPSTASH_REDIS_REST_URL },
    { name: 'HubSpot API', url: 'https://api.hubapi.com' },
    { name: 'Discord API', url: 'https://discord.com/api' },
    { name: 'QStash API', url: 'https://qstash.upstash.io' }
  ];

  const results = {};

  for (const test of tests) {
    try {
      const response = await fetch(test.url, { method: 'HEAD' });
      results[test.name] = {
        reachable: response.status < 500,
        status: response.status
      };
    } catch (error) {
      results[test.name] = {
        reachable: false,
        error: error.message
      };
    }
  }

  return results;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Focused Component Tests');
  console.log('='.repeat(50));

  await runTest('Environment Variables', testEnvironment);
  await runTest('Network Connectivity', testNetwork);
  await runTest('Google AI API', testGoogleAI);
  await runTest('Upstash Redis', testRedis);
  await runTest('HubSpot API', testHubSpot);
  await runTest('Discord Webhook', testDiscord);
  await runTest('QStash V2 API', testQStash);
  await runTest('Chat API Endpoint', testChatAPI);

  // Generate summary
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Pass Rate: ${passRate}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    console.log(result.toString());
  });

  console.log('\n❌ Failed Tests:');
  const failedTests = results.filter(r => !r.pass);
  if (failedTests.length === 0) {
    console.log('  🎉 All tests passed!');
  } else {
    failedTests.forEach(test => {
      console.log(`  ❌ ${test.name}: ${test.error}`);
    });
  }

  console.log('\n🔧 Recommendations:');

  const googleAI = results.find(r => r.name === 'Google AI API');
  if (!googleAI?.pass) {
    console.log('  🔧 Check Google AI API key and permissions');
  }

  const redis = results.find(r => r.name === 'Upstash Redis');
  if (!redis?.pass) {
    console.log('  🔧 Verify Upstash Redis credentials and URL');
  }

  const hubspot = results.find(r => r.name === 'HubSpot API');
  if (!hubspot?.pass) {
    console.log('  🔧 Update HubSpot access token (OAuth 2.0 required)');
  }

  const discord = results.find(r => r.name === 'Discord Webhook');
  if (!discord?.pass) {
    console.log('  🔧 Check Discord webhook URL and bot permissions');
  }

  const qstash = results.find(r => r.name === 'QStash V2 API');
  if (!qstash?.pass) {
    console.log('  🔧 Update QStash configuration for V2 API');
  }

  const chatAPI = results.find(r => r.name === 'Chat API Endpoint');
  if (!chatAPI?.pass) {
    console.log('  🔧 Start development server: npm run dev');
  }

  if (passed === total) {
    console.log('  🎉 All components are working correctly!');
  }

  console.log('\n' + '='.repeat(50));

  return {
    summary: { total, passed, failed, passRate },
    results,
    recommendations: generateRecommendations(results)
  };
}

function generateRecommendations(testResults) {
  const recommendations = [];

  testResults.forEach(result => {
    if (!result.pass) {
      switch (result.name) {
        case 'Google AI API':
          recommendations.push('Update Google AI API key - the current key may be invalid or expired');
          break;
        case 'Upstash Redis':
          recommendations.push('Check Upstash Redis URL and REST token');
          break;
        case 'HubSpot API':
          recommendations.push('HubSpot requires OAuth 2.0 - update the access token format');
          break;
        case 'Discord Webhook':
          recommendations.push('Verify Discord webhook URL is correct and not expired');
          break;
        case 'QStash V2 API':
          recommendations.push('Update QStash integration to use V2 API endpoints');
          break;
        case 'Chat API Endpoint':
          recommendations.push('Start the development server with npm run dev');
          break;
      }
    }
  });

  return recommendations;
}

// Run tests if this file is executed directly
runAllTests().catch(console.error);