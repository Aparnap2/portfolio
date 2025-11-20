#!/usr/bin/env node

/**
 * Test HubSpot and Discord Integration Fixes
 */

import { config } from 'dotenv';
config();

import { captureLeadToHubSpot } from './src/lib/hubspot_client.js';
import { sendLeadToDiscord } from './src/lib/discord_client.js';

// Test data
const testLead = {
  name: 'Test User',
  email: `test.user.${Date.now()}@example.com`,
  company: 'Test Company',
  phone: '555-123-4567',
  requirements: 'Testing integration fixes',
  budget: '$5000',
  lead_score: 75,
  conversation_summary: 'Test lead for integration validation'
};

console.log('🧪 Testing Integration Fixes...\n');

// Test HubSpot integration
async function testHubSpotIntegration() {
  console.log('1️⃣ Testing HubSpot Integration...');
  try {
    const result = await captureLeadToHubSpot(testLead);
    console.log('✅ HubSpot test result:', result);
  } catch (error) {
    console.log('❌ HubSpot test failed:', error.message);
  }
  console.log('');
}

// Test Discord integration
async function testDiscordIntegration() {
  console.log('2️⃣ Testing Discord Integration...');
  try {
    const result = await sendLeadToDiscord(testLead);
    console.log('✅ Discord test result:', result);
  } catch (error) {
    console.log('❌ Discord test failed:', error.message);
  }
  console.log('');
}

// Run tests
async function runTests() {
  console.log('Testing HubSpot and Discord integration fixes...\n');

  await testHubSpotIntegration();
  await testDiscordIntegration();

  console.log('🏁 Integration tests completed!');
  console.log('\n💡 Expected Results:');
  console.log('- Discord: Should work successfully (returns success: true)');
  console.log('- HubSpot: Will show auth error but handle gracefully (no crashes)');
}

runTests().catch(console.error);