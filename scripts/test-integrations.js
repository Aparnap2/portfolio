#!/usr/bin/env node

/**
 * Quick verification script to test our critical integrations
 * Tests the fixes applied to resolve the integration issues
 */

import { captureLeadToHubSpot } from '../src/lib/hubspot_client.js';
import { createLeadProcessingTask } from '../src/lib/qstash_client.js';
import { sendLeadToDiscord } from '../src/lib/discord_client.js';

const testLeadData = {
  name: 'Test User',
  email: 'test@example.com',
  company: 'Test Company',
  requirements: 'Test integration',
  budget: '$10k-20k',
  timeline: '30 days',
  lead_score: 85,
  conversation_summary: 'Testing integration fixes'
};

async function testHubSpotIntegration() {
  console.log('🧪 Testing HubSpot integration...');
  try {
    const result = await captureLeadToHubSpot(testLeadData);
    console.log('✅ HubSpot integration result:', result);
    return true;
  } catch (error) {
    console.error('❌ HubSpot integration failed:', error.message);
    return false;
  }
}

async function testQStashIntegration() {
  console.log('🧪 Testing QStash integration...');
  try {
    const result = await createLeadProcessingTask(testLeadData);
    console.log('✅ QStash integration result:', result);
    return true;
  } catch (error) {
    console.error('❌ QStash integration failed:', error.message);
    return false;
  }
}

async function testDiscordIntegration() {
  console.log('🧪 Testing Discord integration...');
  try {
    const result = await sendLeadToDiscord(testLeadData);
    console.log('✅ Discord integration result:', result);
    return true;
  } catch (error) {
    console.error('❌ Discord integration failed:', error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting integration verification tests...\n');

  const results = {
    hubspot: await testHubSpotIntegration(),
    qstash: await testQStashIntegration(),
    discord: await testDiscordIntegration()
  };

  console.log('\n📊 Test Results Summary:');
  console.log('HubSpot:', results.hubspot ? '✅ PASS' : '❌ FAIL');
  console.log('QStash:', results.qstash ? '✅ PASS' : '❌ FAIL');
  console.log('Discord:', results.discord ? '✅ PASS' : '❌ FAIL');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} integrations working`);

  if (passedTests === totalTests) {
    console.log('🎉 All integration fixes are working correctly!');
    process.exit(0);
  } else {
    console.log('⚠️  Some integrations may need environment variables or further configuration');
    process.exit(1);
  }
}

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

runIntegrationTests().catch(console.error);