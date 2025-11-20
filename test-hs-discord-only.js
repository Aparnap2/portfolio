#!/usr/bin/env node

/**
 * Test only HubSpot and Discord integrations from the test suite
 */

import { config } from 'dotenv';
config();

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

class TestSuite {
  constructor() {
    this.results = [];
  }

  async runTest(testName, testFunction, category = 'General') {
    const result = new TestResult(testName, category);
    console.log(`🧪 ${testName}...`);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), 30000)
      );

      const testPromise = testFunction();
      const data = await Promise.race([testPromise, timeoutPromise]);

      result.pass(data);
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      result.fail(error);
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
    }

    this.results.push(result);
    return result;
  }

  // Test HubSpot API authentication
  async testHubSpotAuth() {
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
  }

  // Test Discord webhook
  async testDiscordWebhook() {
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

        // Discord webhooks return 204 No Content on success
        const text = await response.text();
        const result = text ? JSON.parse(text) : { success: true };

        return {
          messageId: result.id || 'sent',
          delivered: true,
          leadEmail: testLead.email
        };
      },
      'Discord Webhook'
    );
  }

  generateReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('📊 HUBSPOT & DISCORD INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests} | Pass Rate: ${passRate}%`);

    console.log('\n📋 Test Results:');
    this.results.forEach(result => {
      console.log(`  ${result.toString()}`);
    });

    if (failedTests === 0) {
      console.log('\n🎉 All tests passed! Both integrations are working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the implementation.');
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      passRate: parseFloat(passRate),
      results: this.results
    };
  }
}

// Main execution
async function main() {
  console.log('🚀 Testing HubSpot and Discord Integration Fixes...');
  console.log('='.repeat(60));

  const testSuite = new TestSuite();

  // Run tests
  await testSuite.testHubSpotAuth();
  await testSuite.testDiscordWebhook();

  return testSuite.generateReport();
}

main().catch(console.error);