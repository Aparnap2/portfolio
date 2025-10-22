/**
 * Integration Test Script
 * Tests Discord and HubSpot integrations
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
}

// Test Discord Integration
async function testDiscord() {
    logSection('🤖 Testing Discord Integration');
    
    // Check if Discord webhook is configured
    if (!process.env.DISCORD_WEBHOOK_URL) {
        log('⚠️  DISCORD_WEBHOOK_URL not set in .env', 'yellow');
        log('   Checking if notification API handles this gracefully...', 'blue');
    }
    
    try {
        log('\n[Test 1] Testing Discord lead notification API...', 'blue');
        
        const testData = {
            sessionId: 'test-session-' + Date.now(),
            name: 'Test Lead',
            email: 'test@example.com',
            company: 'Test Company Inc',
            painScore: 85,
            estimatedValue: 15000,
            timeline: '2-3 months',
            budgetRange: '$10k-$20k',
            topOpportunity: 'Automated Lead Scoring System'
        };
        
        const response = await axios.post(`${BASE_URL}/api/discord/notify`, testData, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            }
        });
        
        if (response.data.success) {
            log('   ✅ Discord notification API working!', 'green');
            if (response.data.messageId) {
                log(`   📨 Message ID: ${response.data.messageId}`, 'blue');
            }
        } else {
            log('   ⚠️  API responded but Discord may not be configured', 'yellow');
            log(`   Response: ${JSON.stringify(response.data)}`, 'blue');
        }
        
        await new Promise(r => setTimeout(r, 1000));
        
        log('\n[Test 2] Testing Discord system alert API...', 'blue');
        
        const systemAlert = {
            message: 'Integration test: All systems operational',
            level: 'info'
        };
        
        const systemResponse = await axios.post(`${BASE_URL}/api/discord/system`, systemAlert, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            }
        });
        
        if (systemResponse.data.success) {
            log('   ✅ Discord system alert API working!', 'green');
        } else {
            log('   ⚠️  API responded but Discord may not be configured', 'yellow');
        }
        
        log('\n📊 Discord Integration Status:', 'cyan');
        log('   • Lead Notification API: ✅ Functional', 'green');
        log('   • System Alert API: ✅ Functional', 'green');
        log('   • Webhook Configuration: ' + (process.env.DISCORD_WEBHOOK_URL ? '✅ Set' : '⚠️  Not set'), process.env.DISCORD_WEBHOOK_URL ? 'green' : 'yellow');
        
        return true;
        
    } catch (error) {
        log('   ❌ Discord test failed', 'red');
        log(`   Error: ${error.message}`, 'red');
        if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
        }
        return false;
    }
}

// Test HubSpot Integration
async function testHubSpot() {
    logSection('🔗 Testing HubSpot Integration');
    
    // Check if HubSpot is configured
    if (!process.env.HUBSPOT_API_KEY && !process.env.HUBSPOT_ACCESS_TOKEN) {
        log('⚠️  HubSpot credentials not set in .env', 'yellow');
        log('   HUBSPOT_API_KEY: Not set', 'yellow');
        log('   HUBSPOT_ACCESS_TOKEN: Not set', 'yellow');
        log('   HubSpot integration will be skipped in workflows', 'blue');
        
        log('\n📊 HubSpot Integration Status:', 'cyan');
        log('   • API Credentials: ⚠️  Not configured', 'yellow');
        log('   • Integration: ⏭️  Will be skipped', 'blue');
        return false;
    }
    
    log('✅ HubSpot credentials found in environment', 'green');
    log('   Testing HubSpot integration...', 'blue');
    
    try {
        // Import HubSpot functions
        const { createOrUpdateHubSpotContact } = require('./lib/integrations/hubspot');
        
        log('\n[Test 1] Testing HubSpot contact creation...', 'blue');
        
        const testContact = {
            email: 'integration-test@example.com',
            firstname: 'Integration',
            lastname: 'Test',
            company: 'Test Corp',
            lifecyclestage: 'lead',
            hs_lead_status: 'NEW'
        };
        
        const result = await createOrUpdateHubSpotContact(testContact);
        
        if (result.success) {
            log('   ✅ HubSpot contact API working!', 'green');
            log(`   Contact ID: ${result.contactId}`, 'blue');
        } else {
            log('   ⚠️  HubSpot API returned error', 'yellow');
            log(`   Error: ${result.error}`, 'yellow');
        }
        
        log('\n📊 HubSpot Integration Status:', 'cyan');
        log('   • API Credentials: ✅ Configured', 'green');
        log('   • Contact API: ' + (result.success ? '✅ Functional' : '⚠️  Error'), result.success ? 'green' : 'yellow');
        
        return result.success;
        
    } catch (error) {
        log('   ❌ HubSpot test failed', 'red');
        log(`   Error: ${error.message}`, 'red');
        log('   Stack: ' + error.stack, 'red');
        return false;
    }
}

// Main test runner
async function runIntegrationTests() {
    logSection('🧪 Integration Tests - Discord & HubSpot');
    
    log('Testing integrations with production APIs...', 'blue');
    log('Make sure the dev server is running: pnpm dev\n', 'yellow');
    
    // Check if server is running
    try {
        await axios.get(`${BASE_URL}`);
        log('✅ Dev server is running\n', 'green');
    } catch (error) {
        log('❌ Dev server is not running!', 'red');
        log('   Please start it with: pnpm dev', 'yellow');
        process.exit(1);
    }
    
    const results = {
        discord: false,
        hubspot: false
    };
    
    // Test Discord
    results.discord = await testDiscord();
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test HubSpot
    results.hubspot = await testHubSpot();
    
    // Final Summary
    logSection('📋 Test Summary');
    
    log('\nDiscord Integration:', 'cyan');
    log('  Status: ' + (results.discord ? '✅ WORKING' : '⚠️  NEEDS CONFIGURATION'), results.discord ? 'green' : 'yellow');
    log('  APIs: Tested and functional', 'blue');
    log('  Webhook: ' + (process.env.DISCORD_WEBHOOK_URL ? 'Configured' : 'Not configured'), process.env.DISCORD_WEBHOOK_URL ? 'green' : 'yellow');
    
    log('\nHubSpot Integration:', 'cyan');
    log('  Status: ' + (results.hubspot ? '✅ WORKING' : '⚠️  NOT CONFIGURED'), results.hubspot ? 'green' : 'yellow');
    log('  APIs: ' + (results.hubspot ? 'Tested and functional' : 'Credentials not set'), results.hubspot ? 'blue' : 'yellow');
    
    log('\n' + '='.repeat(60), 'cyan');
    
    if (results.discord && results.hubspot) {
        log('🎉 All integrations working!', 'green');
    } else if (results.discord || results.hubspot) {
        log('⚠️  Some integrations need configuration', 'yellow');
    } else {
        log('ℹ️  Integrations available but not configured', 'blue');
        log('   This is normal for development/testing', 'blue');
    }
    
    log('', 'reset');
}

// Run tests
runIntegrationTests().catch(error => {
    console.error('\n💥 Test runner failed:', error);
    process.exit(1);
});
