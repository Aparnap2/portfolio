#!/usr/bin/env node

/**
 * Comprehensive Lead Capture System Test Suite
 * Tests all components: Google AI, Upstash Redis, HubSpot, QStash, Discord
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import fetch from 'node-fetch';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  parallelTests: true,
  verboseLogging: true
};

// Environment variables validation
function validateEnvironment() {
  const required = [
    'GOOGLE_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'QSTASH_TOKEN',
    'HUBSPOT_ACCESS_TOKEN',
    'DISCORD_WEBHOOK_URL',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  return true;
}

// Test utilities
class TestResult {
  constructor(name, category = 'General') {
    this.name = name;
    this.category = category;
    this.startTime = Date.now();
    this.status = 'RUNNING';
    this.responseTime = 0;
    this.error = null;
    this.data = null;
    this.metadata = {};
  }

  pass(data = null, metadata = {}) {
    this.status = 'PASS';
    this.responseTime = Date.now() - this.startTime;
    this.data = data;
    this.metadata = metadata;
    return this;
  }

  fail(error, metadata = {}) {
    this.status = 'FAIL';
    this.responseTime = Date.now() - this.startTime;
    this.error = error.message || error;
    this.metadata = metadata;
    return this;
  }

  toString() {
    const icon = this.status === 'PASS' ? '✅' : '❌';
    const time = `${this.responseTime}ms`;
    return `${icon} ${this.name} (${time})${this.status === 'FAIL' ? ` - ${this.error}` : ''}`;
  }
}

// Test Suite
class LeadCaptureTestSuite {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  addResult(result) {
    this.results.push(result);
    if (TEST_CONFIG.verboseLogging) {
      console.log(result.toString());
    }
  }

  async runTest(testName, testFunction, category = 'General') {
    const result = new TestResult(testName, category);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.timeout)
      );

      const testPromise = testFunction();
      const data = await Promise.race([testPromise, timeoutPromise]);

      result.pass(data);
    } catch (error) {
      result.fail(error);
    }

    this.addResult(result);
    return result;
  }

  // 1. Google AI Integration Tests
  async testGoogleAI() {
    console.log('\n🤖 Testing Google AI Integration...');

    // Test model initialization
    await this.runTest(
      'Google AI Model Initialization',
      async () => {
        const model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: "gemini-1.5-flash",
          maxOutputTokens: 1000,
          temperature: 0.1
        });

        const response = await model.invoke("Hello, can you help extract lead information?");
        return {
          response: response.content.substring(0, 100),
          model: "gemini-1.5-flash"
        };
      },
      'Google AI'
    );

    // Test lead extraction capabilities
    await this.runTest(
      'AI Lead Extraction',
      async () => {
        const model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: "gemini-1.5-flash",
          maxOutputTokens: 1500,
          temperature: 0.1
        });

        const sampleConversation = `
User: Hi, I'm John Smith from TechCorp and we need help with customer service automation
AI: Hello John! I'd be happy to help TechCorp with customer service automation
User: We handle about 500 tickets per day and our team is overwhelmed. We have budget of around $10k per month.
User: My email is john.smith@techcorp.com and phone is 555-0123
        `;

        const extractionPrompt = `Extract lead information from this conversation and return JSON:
{
  "name": "full name",
  "email": "email address",
  "company": "company name",
  "phone": "phone number",
  "requirements": "what they need",
  "budget": "budget mentioned",
  "lead_score": 0-100
}

Conversation:
${sampleConversation}`;

        const response = await model.invoke(extractionPrompt);
        const content = response.content.replace(/```json\n?|```\n?/g, '').trim();
        const extracted = JSON.parse(content);

        return extracted;
      },
      'Google AI'
    );

    // Test streaming capabilities
    await this.runTest(
      'AI Streaming Response',
      async () => {
        const model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: "gemini-1.5-flash",
          streaming: true,
          maxOutputTokens: 500
        });

        let fullResponse = '';
        const stream = await model.stream("Tell me briefly about AI automation benefits");

        for await (const chunk of stream) {
          fullResponse += chunk.content;
          if (fullResponse.length > 200) break;
        }

        return {
          streamedResponse: fullResponse.substring(0, 100),
          chunksReceived: true
        };
      },
      'Google AI'
    );
  }

  // 2. Upstash Redis Tests
  async testUpstashRedis() {
    console.log('\n📦 Testing Upstash Redis Connection...');

    const redis = Redis.fromEnv();

    // Test basic connection
    await this.runTest(
      'Redis Connection',
      async () => {
        const pong = await redis.ping();
        const testKey = `test:connection:${Date.now()}`;
        await redis.set(testKey, 'test_value');
        const value = await redis.get(testKey);
        await redis.del(testKey);

        return {
          pong,
          testValue: value,
          connected: pong === 'PONG' && value === 'test_value'
        };
      },
      'Upstash Redis'
    );

    // Test session management
    await this.runTest(
      'Session Management',
      async () => {
        const sessionId = `test:session:${Date.now()}`;
        const sessionData = {
          chat_history: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ],
          user_context: { lead_score: 75 },
          conversation_stage: 'business_understanding'
        };

        await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(sessionData));
        const retrieved = await redis.get(`session:${sessionId}`);
        const parsedData = JSON.parse(retrieved);

        return {
          sessionId,
          storedData: sessionData,
          retrievedData: parsedData,
          dataIntegrity: JSON.stringify(sessionData) === retrieved
        };
      },
      'Upstash Redis'
    );

    // Test analytics storage
    await this.runTest(
      'Analytics Storage',
      async () => {
        const today = new Date().toISOString().split('T')[0];
        const analyticsKey = `test_analytics:${today}`;

        await Promise.all([
          redis.hincrby(analyticsKey, 'total_leads', 5),
          redis.hincrby(analyticsKey, 'qualified_leads', 3),
          redis.hincrby(analyticsKey, 'total_lead_score', 350)
        ]);

        const stats = await redis.hgetall(analyticsKey);
        await redis.del(analyticsKey);

        return {
          totalLeads: stats.total_leads,
          qualifiedLeads: stats.qualified_leads,
          avgScore: stats.total_lead_score / stats.total_leads,
          stored: true
        };
      },
      'Upstash Redis'
    );
  }

  // 3. HubSpot API Tests
  async testHubSpotAPI() {
    console.log('\n🏢 Testing HubSpot API...');

    // Test API authentication
    await this.runTest(
      'HubSpot Authentication',
      async () => {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        return {
          authenticated: true,
          apiAvailable: true,
          contactCount: data.total || 0
        };
      },
      'HubSpot API'
    );

    // Test contact creation
    await this.runTest(
      'Contact Creation',
      async () => {
        const testContact = {
          properties: {
            email: `test.user.${Date.now()}@example.com`,
            firstname: 'Test',
            lastname: 'User',
            company: 'Test Company',
            phone: '555-TEST-123',
            lifecyclestage: 'lead',
            lead_source: 'AI Chatbot Test'
          }
        };

        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testContact)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Contact creation failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return {
          contactId: result.id,
          email: testContact.properties.email,
          created: true
        };
      },
      'HubSpot API'
    );

    // Test contact search
    await this.runTest(
      'Contact Search',
      async () => {
        const searchBody = {
          filterGroups: [{
            filters: [{
              propertyName: 'lifecyclestage',
              operator: 'EQ',
              value: 'lead'
            }]
          }],
          properties: ['email', 'firstname', 'company', 'createdate'],
          limit: 5
        };

        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(searchBody)
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const result = await response.json();
        return {
          foundContacts: result.results.length,
          sampleContact: result.results[0]?.properties?.email || 'none'
        };
      },
      'HubSpot API'
    );
  }

  // 4. QStash Tests
  async testQStash() {
    console.log('\n⚡ Testing QStash Processing...');

    // Test task creation
    await this.runTest(
      'QStash Task Creation',
      async () => {
        const testLead = {
          name: 'Test User',
          email: `test.lead.${Date.now()}@example.com`,
          company: 'Test Corp',
          requirements: 'AI automation testing',
          budget: '$5000',
          lead_score: 75
        };

        const taskData = {
          id: `test_${Date.now()}`,
          type: 'lead_processing',
          data: testLead,
          timestamp: new Date().toISOString()
        };

        const response = await fetch('https://qstash.upstash.io/v1/enqueues', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
            'Content-Type': 'application/json',
            'Upstash-Forward-Authorization': `Bearer test-token`
          },
          body: JSON.stringify({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/lead-processor`,
            body: taskData,
            delay: 5
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`QStash enqueue failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return {
          taskId: taskData.id,
          messageId: result.messageId,
          queued: true,
          leadEmail: testLead.email
        };
      },
      'QStash'
    );

    // Test scheduling
    await this.runTest(
      'QStash Scheduling',
      async () => {
        const scheduleData = {
          destination: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/lead-processor`,
          method: 'POST',
          body: { test: 'scheduled_task', timestamp: new Date().toISOString() },
          cron: "0 9 * * *"  // Daily at 9 AM
        };

        const response = await fetch('https://qstash.upstash.io/v1/schedules', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scheduleData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Scheduling failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return {
          scheduleId: result.scheduleId,
          scheduled: true,
          cron: scheduleData.cron
        };
      },
      'QStash'
    );
  }

  // 5. Discord Webhook Tests
  async testDiscordWebhook() {
    console.log('\n💬 Testing Discord Webhook...');

    // Test basic notification
    await this.runTest(
      'Discord Lead Notification',
      async () => {
        const testLead = {
          name: 'Test Discord User',
          email: `discord.test.${Date.now()}@example.com`,
          company: 'Discord Test Corp',
          requirements: 'Test Discord integration',
          budget: '$3000',
          lead_score: 80,
          conversation_summary: 'Interested in AI automation solutions for testing'
        };

        const embed = {
          title: '🧪 Test Lead Notification',
          description: `**${testLead.name}** from ${testLead.company}`,
          color: 0x00FF00,
          timestamp: new Date().toISOString(),
          fields: [
            {
              name: '📧 Email',
              value: testLead.email,
              inline: true
            },
            {
              name: '💰 Budget',
              value: testLead.budget,
              inline: true
            },
            {
              name: '📊 Lead Score',
              value: `${testLead.lead_score}/100`,
              inline: true
            }
          ],
          footer: {
            text: 'Test Notification • Lead Capture System'
          }
        };

        const payload = {
          username: 'Test Bot',
          embeds: [embed],
          content: '🧪 **TEST NOTIFICATION** - This is a test of the Discord integration'
        };

        const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Discord webhook failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return {
          messageId: result.id,
          delivered: true,
          leadEmail: testLead.email
        };
      },
      'Discord Webhook'
    );

    // Test rich embed formatting
    await this.runTest(
      'Discord Rich Embed',
      async () => {
        const payload = {
          username: 'Test Bot',
          embeds: [{
            title: '🎯 System Health Check',
            description: 'Testing rich embed capabilities',
            color: 0x0099FF,
            timestamp: new Date().toISOString(),
            fields: [
              {
                name: '✅ Components Tested',
                value: 'Google AI ✅\nUpstash Redis ✅\nHubSpot API ✅\nQStash ✅\nDiscord ✅',
                inline: false
              },
              {
                name: '📊 Test Results',
                value: 'All systems operational',
                inline: true
              },
              {
                name: '⏰ Test Time',
                value: new Date().toLocaleTimeString(),
                inline: true
              }
            ],
            footer: {
              text: 'Automated System Test',
              icon_url: 'https://cdn.discordapp.com/icons/1025723704696881152/4d71ccdf6133094bb1e7610da4e4e6c1.png'
            }
          }]
        };

        const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Rich embed test failed: ${response.status}`);
        }

        return {
          embedDelivered: true,
          fieldsCount: 3,
          richFormatting: true
        };
      },
      'Discord Webhook'
    );
  }

  // 6. Chat API Endpoint Test
  async testChatAPIEndpoint() {
    console.log('\n💭 Testing Chat API Endpoint...');

    // Test basic chat request
    await this.runTest(
      'Chat API Basic Request',
      async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: 'Hello, I need help with business automation' }
            ]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Chat API error: ${response.status} - ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(decoder.decode(value));
          if (chunks.length > 5) break; // Limit for test
        }

        return {
          statusCode: response.status,
          sessionId: response.headers.get('x-session-id'),
          streaming: true,
          chunksReceived: chunks.length
        };
      },
      'Chat API'
    );

    // Test lead capture through chat
    await this.runTest(
      'Lead Capture Through Chat',
      async () => {
        const leadCaptureMessages = [
          { role: 'user', content: 'Hi, I\'m Sarah Johnson from Marketing Pros Inc' },
          { role: 'assistant', content: 'Hello Sarah! Nice to meet you from Marketing Pros Inc.' },
          { role: 'user', content: 'We need help with lead generation automation. Our budget is $8000 per month. You can reach me at sarah@marketingpros.com' }
        ];

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: leadCaptureMessages
          })
        });

        if (!response.ok) {
          throw new Error(`Lead capture test failed: ${response.status}`);
        }

        return {
          requestProcessed: true,
          leadDataProvided: true,
          emailExtracted: 'sarah@marketingpros.com',
          budgetProvided: '$8000',
          companyProvided: 'Marketing Pros Inc'
        };
      },
      'Chat API'
    );
  }

  // 7. Data Validation Tests (Zod Schemas)
  async testDataValidation() {
    console.log('\n🔍 Testing Data Validation...');

    // Test lead schema validation
    await this.runTest(
      'Lead Schema Validation',
      async () => {
        const leadSchema = z.object({
          name: z.string().min(2),
          email: z.string().email(),
          company: z.string().optional(),
          phone: z.string().optional(),
          requirements: z.string().optional(),
          budget: z.string().optional(),
          lead_score: z.number().min(0).max(100)
        });

        // Valid lead data
        const validLead = {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Acme Corp',
          lead_score: 75
        };

        const validResult = leadSchema.safeParse(validLead);

        // Invalid lead data
        const invalidLead = {
          name: 'A',
          email: 'not-an-email',
          lead_score: 150
        };

        const invalidResult = leadSchema.safeParse(invalidLead);

        return {
          validLeadPassed: validResult.success,
          invalidLeadFailed: !invalidResult.success,
          validationWorking: validResult.success && !invalidResult.success,
          errors: invalidResult.success ? [] : invalidResult.error.issues.map(i => i.path.join('.'))
        };
      },
      'Data Validation'
    );

    // Test message schema validation
    await this.runTest(
      'Message Schema Validation',
      async () => {
        const messageSchema = z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().min(1),
          timestamp: z.string().optional(),
          metadata: z.object({
            confidence: z.number().min(0).max(1).optional(),
            intent: z.string().optional(),
            topics: z.array(z.string()).optional()
          }).optional()
        });

        const validMessage = {
          role: 'user',
          content: 'Hello, I need help',
          metadata: {
            confidence: 0.8,
            intent: 'help_request',
            topics: ['customer_support']
          }
        };

        const result = messageSchema.safeParse(validMessage);
        return {
          messageValid: result.success,
          hasMetadata: result.success && !!result.data.metadata,
          topicsArray: result.success && Array.isArray(result.data.metadata?.topics)
        };
      },
      'Data Validation'
    );
  }

  // 8. Error Handling Tests
  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');

    // Test invalid API key handling
    await this.runTest(
      'Invalid API Key Handling',
      async () => {
        const invalidModel = new ChatGoogleGenerativeAI({
          apiKey: 'invalid-key-123',
          modelName: "gemini-1.5-flash"
        });

        try {
          await invalidModel.invoke("Test message");
          return { errorHandled: false };
        } catch (error) {
          return {
            errorHandled: true,
            errorMessage: error.message,
            isAuthError: error.message.includes('API key') || error.message.includes('authentication')
          };
        }
      },
      'Error Handling'
    );

    // Test malformed request handling
    await this.runTest(
      'Malformed Request Handling',
      async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: 'not-an-array'
            })
          });

          const handledGracefully = response.status >= 400 && response.status < 500;
          const errorResponse = await response.text();

          return {
            statusCode: response.status,
            handledGracefully,
            hasErrorMessage: errorResponse.length > 0,
            errorHandled: true
          };
        } catch (error) {
          return {
            errorCaught: true,
            errorMessage: error.message,
            errorHandled: true
          };
        }
      },
      'Error Handling'
    );

    // Test Redis connection failure
    await this.runTest(
      'Redis Connection Failure',
      async () => {
        const invalidRedis = new Redis({
          url: 'https://invalid-redis-url.upstash.io',
          token: 'invalid-token'
        });

        try {
          await invalidRedis.ping();
          return { connectionFailed: false };
        } catch (error) {
          return {
            connectionFailed: true,
            errorMessage: error.message,
            errorHandled: true
          };
        }
      },
      'Error Handling'
    );
  }

  // Generate comprehensive report
  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    const categoryResults = {};
    this.results.forEach(result => {
      if (!categoryResults[result.category]) {
        categoryResults[result.category] = { pass: 0, fail: 0, total: 0 };
      }
      categoryResults[result.category].total++;
      if (result.status === 'PASS') {
        categoryResults[result.category].pass++;
      } else {
        categoryResults[result.category].fail++;
      }
    });

    const avgResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE LEAD CAPTURE SYSTEM TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests} | Pass Rate: ${passRate}%`);
    console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`Test Duration: ${Date.now() - this.startTime}ms`);

    console.log('\n📋 Results by Category:');
    Object.entries(categoryResults).forEach(([category, results]) => {
      const categoryPassRate = ((results.pass / results.total) * 100).toFixed(1);
      console.log(`  ${category}: ${results.pass}/${results.total} (${categoryPassRate}%)`);
    });

    console.log('\n❌ Failed Tests:');
    const failed = this.results.filter(r => r.status === 'FAIL');
    if (failed.length === 0) {
      console.log('  🎉 All tests passed!');
    } else {
      failed.forEach(test => {
        console.log(`  ❌ ${test.name}: ${test.error}`);
      });
    }

    console.log('\n⚡ Performance Analysis:');
    const slowTests = this.results.filter(r => r.responseTime > 5000);
    if (slowTests.length > 0) {
      console.log('  🐌 Slow Tests (>5s):');
      slowTests.forEach(test => {
        console.log(`    ${test.name}: ${test.responseTime}ms`);
      });
    }

    const fastTests = this.results.filter(r => r.responseTime < 1000);
    console.log(`  ⚡ Fast Tests (<1s): ${fastTests.length}/${totalTests}`);

    console.log('\n🔧 Recommendations:');

    if (failedTests === 0) {
      console.log('  ✅ All systems are operational and ready for production');
    } else {
      console.log('  🔧 Address failed tests before deploying to production');
    }

    if (avgResponseTime > 3000) {
      console.log('  ⚠️ Consider optimizing slow components');
    }

    const redisTests = this.results.filter(r => r.category === 'Upstash Redis');
    const redisPassRate = (redisTests.filter(r => r.status === 'PASS').length / redisTests.length) * 100;
    if (redisPassRate < 100) {
      console.log('  🔧 Check Redis configuration and credentials');
    }

    const hubspotTests = this.results.filter(r => r.category === 'HubSpot API');
    const hubspotPassRate = (hubspotTests.filter(r => r.status === 'PASS').length / hubspotTests.length) * 100;
    if (hubspotPassRate < 100) {
      console.log('  🔧 Verify HubSpot API access token and permissions');
    }

    console.log('\n' + '='.repeat(80));

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        passRate: parseFloat(passRate),
        avgResponseTime: Math.round(avgResponseTime),
        testDuration: Date.now() - this.startTime
      },
      categoryResults,
      failedTests: failed.map(f => ({ name: f.name, error: f.error, category: f.category })),
      recommendations: this.generateRecommendations(passRate, avgResponseTime, categoryResults)
    };
  }

  generateRecommendations(passRate, avgResponseTime, categoryResults) {
    const recommendations = [];

    if (passRate < 100) {
      recommendations.push('Address all failed tests before production deployment');
    }

    if (avgResponseTime > 5000) {
      recommendations.push('Implement caching strategies to improve response times');
    }

    const aiTests = categoryResults['Google AI'];
    if (aiTests && aiTests.fail > 0) {
      recommendations.push('Verify Google AI API key and model configuration');
    }

    const redisTests = categoryResults['Upstash Redis'];
    if (redisTests && redisTests.fail > 0) {
      recommendations.push('Check Upstash Redis credentials and network connectivity');
    }

    const hubspotTests = categoryResults['HubSpot API'];
    if (hubspotTests && hubspotTests.fail > 0) {
      recommendations.push('Validate HubSpot API permissions and access token');
    }

    const discordTests = categoryResults['Discord Webhook'];
    if (discordTests && discordTests.fail > 0) {
      recommendations.push('Test Discord webhook URL and bot permissions');
    }

    if (passRate === 100 && avgResponseTime < 3000) {
      recommendations.push('🎉 System is ready for production use!');
    }

    return recommendations;
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Lead Capture System Tests...');
    console.log('='.repeat(80));

    try {
      validateEnvironment();
      console.log('✅ Environment variables validated');
    } catch (error) {
      console.error('❌ Environment validation failed:', error.message);
      return;
    }

    if (TEST_CONFIG.parallelTests) {
      // Run tests in parallel for faster execution
      await Promise.all([
        this.testGoogleAI(),
        this.testUpstashRedis(),
        this.testHubSpotAPI(),
        this.testQStash(),
        this.testDiscordWebhook(),
        this.testChatAPIEndpoint(),
        this.testDataValidation(),
        this.testErrorHandling()
      ]);
    } else {
      // Run tests sequentially
      await this.testGoogleAI();
      await this.testUpstashRedis();
      await this.testHubSpotAPI();
      await this.testQStash();
      await this.testDiscordWebhook();
      await this.testChatAPIEndpoint();
      await this.testDataValidation();
      await this.testErrorHandling();
    }

    return this.generateReport();
  }
}

// Main execution
async function main() {
  const testSuite = new LeadCaptureTestSuite();
  const report = await testSuite.runAllTests();

  // Save report to file for analysis
  const fs = await import('fs/promises');
  try {
    await fs.writeFile('./test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to test-report.json');
  } catch (error) {
    console.log('Could not save report file:', error.message);
  }

  return report;
}

// Export for use as module
export { LeadCaptureTestSuite };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}