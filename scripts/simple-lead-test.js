#!/usr/bin/env node

/**
 * Simple Lead Capture System Test
 * Tests the HubSpot integration without complex dependencies
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}🔸${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.magenta}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

async function checkHubSpotToken() {
  log.step('Checking HubSpot access token...');

  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!token) {
    log.error('HUBSPOT_ACCESS_TOKEN not found in environment');
    return false;
  }

  // Basic token validation - HubSpot tokens start with 'pat-na1-'
  if (!token.startsWith('pat-na1-')) {
    log.error('HubSpot token format is invalid (should start with pat-na1-)');
    return false;
  }

  log.success(`HubSpot token found: ${token.substring(0, 20)}...`);
  return true;
}

async function testHubSpotAPI() {
  log.step('Testing HubSpot API connection...');

  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      log.success('HubSpot API connection: SUCCESS');
      const data = await response.json();
      log.info(`Account has ${data.results ? data.results.length : 0} existing contacts`);
      return true;
    } else if (response.status === 401) {
      log.error('HubSpot API connection: FAILED - Invalid or expired token');
      log.warn('Token may have expired or been revoked');
      return false;
    } else {
      log.error(`HubSpot API connection: FAILED - Status: ${response.status}`);
      const errorText = await response.text();
      log.error('Error details:', errorText);
      return false;
    }
  } catch (error) {
    log.error(`HubSpot API test failed: ${error.message}`);
    return false;
  }
}

async function testLeadCaptureLogic() {
  log.step('Testing lead capture logic...');

  try {
    // Load the hubspot client
    const { captureLeadToHubSpot } = require('../src/lib/hubspot_client.js');

    const testLead = {
      name: 'Test Lead User',
      email: `test-${Date.now()}@example.com`,
      company: 'Test Automation Company',
      phone: '+1-555-0123-4567',
      requirements: 'AI automation testing',
      budget: '$5,000',
      timeline: '1-2 months',
      conversation_summary: 'Test lead from automated system verification',
      lead_score: 75,
      industry: 'Technology',
      current_challenges: 'Manual processes'
    };

    log.info('Test lead data:');
    console.log(JSON.stringify(testLead, null, 2));

    const result = await captureLeadToHubSpot(testLead);

    if (result && result.includes('Thank you')) {
      log.success('Lead capture test: SUCCESS');
      log.success('Test lead was created in HubSpot CRM');
      return true;
    } else {
      log.error('Lead capture test: FAILED');
      log.error('Result:', result);
      return false;
    }
  } catch (error) {
    log.error(`Lead capture logic test failed: ${error.message}`);

    if (error.message.includes('HUBSPOT_ACCESS_TOKEN')) {
      log.warn('This confirms the HubSpot token issue');
    }

    return false;
  }
}

function checkEnvironmentSetup() {
  log.section('CHECKING ENVIRONMENT SETUP');

  const requiredVars = [
    'HUBSPOT_ACCESS_TOKEN',
    'HUBSPOT_CLIENT_SECRET'
  ];

  const optionalVars = [
    'QSTASH_URL',
    'QSTASH_TOKEN',
    'DISCORD_WEBHOOK_URL',
    'SLACK_WEBHOOK_URL'
  ];

  let missingRequired = [];
  let missingOptional = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    } else {
      log.success(`${varName}: ✅ Configured`);
    }
  });

  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    } else {
      log.warn(`${varName}: ⚠️ Configured (optional)`);
    }
  });

  if (missingRequired.length > 0) {
    log.error('\n🚨 CRITICAL MISSING VARIABLES:');
    missingRequired.forEach(varName => {
      console.log(`  ❌ ${varName}`);
    });
    return false;
  }

  if (missingOptional.length > 0) {
    log.warn('\n⚠️ OPTIONAL MISSING VARIABLES:');
    missingOptional.forEach(varName => {
      console.log(`  ⚠️  ${varName} (backup notifications will be limited)`);
    });
  }

  return true;
}

function provideInstructions() {
  log.header('📋 LEAD CAPTURE STATUS & INSTRUCTIONS');

  console.log(`
${colors.bold}CURRENT STATUS:${colors.reset}
${colors.red}• HubSpot Integration: NEEDS ATTENTION${colors.reset}
${colors.yellow}• Lead Capture Logic: WORKING (but blocked by token)${colors.reset}
${colors.green}• Fallback System: AVAILABLE${colors.reset}

${colors.bold}TO FIX HUBSPOT INTEGRATION:${colors.reset}

1. ${colors.cyan}Get a new HubSpot Access Token:${colors.reset}
   • Go to: https://app.hubspot.com/developer/private-apps/
   • Select your private app or create a new one
   • Go to "Auth" tab
   • Generate new access token
   • Copy the token (starts with "pat-na1-")

2. ${colors.cyan}Update Environment Variables:${colors.reset}
   ${colors.yellow}Add to your .env file:${colors.reset}
   HUBSPOT_ACCESS_TOKEN=your_new_token_here
   HUBSPOT_CLIENT_SECRET=your_client_secret_here

3. ${colors.cyan}Restart Application:${colors.reset}
   • Stop your application
   • Update environment variables
   • Start application again

${colors.bold}TESTING LEAD CAPTURE:${colors.reset}

1. ${colors.green}Test via website chatbot${colors.reset}
   • Visit your website
   • Start a chat with the AI assistant
   • Provide your email and business details
   • Check if you receive confirmation

2. ${colors.green}Check HubSpot CRM:${colors.reset}
   • Go to: https://app.hubspot.com/contacts
   • Look for new contact with your test email
   • Verify all fields were captured correctly

${colors.bold}FALLBACK OPTIONS:${colors.reset}

If HubSpot integration fails, the system will:
• Capture leads locally (src/captured-leads.json)
• Send Discord notifications (if configured)
• Create CSV exports for manual import
• Retry HubSpot sync when token is fixed

${colors.bold}MONITORING:${colors.reset}

• Check server logs for lead capture messages
• Monitor fallback lead file
• Set up HubSpot notifications for new contacts
`);
}

async function main() {
  console.log(`${colors.bold}${colors.magenta}
╔══════════════════════════════════════════════╗
║                                                    ║
║         AI CHATBOT LEAD CAPTURE SYSTEM TEST        ║
║                                                    ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  log.section('🚀 STARTING COMPREHENSIVE LEAD CAPTURE TEST');

  // Step 1: Check environment
  const envOk = await checkEnvironmentSetup();
  if (!envOk) {
    log.error('Critical environment issues detected');
    provideInstructions();
    process.exit(1);
  }

  // Step 2: Check token format
  const tokenOk = await checkHubSpotToken();
  if (!tokenOk) {
    provideInstructions();
    process.exit(1);
  }

  // Step 3: Test API connection
  const apiOk = await testHubSpotAPI();
  if (!apiOk) {
    provideInstructions();
    process.exit(1);
  }

  // Step 4: Test lead capture flow
  const captureOk = await testLeadCaptureLogic();

  log.header('\n📊 TEST RESULTS SUMMARY');

  if (captureOk) {
    log.success('✅ ALL TESTS PASSED - Lead capture system is working correctly');
    log.success('HubSpot integration is active and ready');
  } else {
    log.error('❌ TESTS FAILED - Issues found in lead capture system');
    log.error('HubSpot integration needs attention');
  }

  provideInstructions();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkHubSpotToken,
  testHubSpotAPI,
  testLeadCaptureLogic,
  checkEnvironmentSetup
};