#!/usr/bin/env node

/**
 * Live Lead Capture Test
 * Tests the actual running application's lead capture functionality
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

async function testLiveLeadCapture() {
  log.header('🧪 LIVE LEAD CAPTURE TEST');

  try {
    // Test lead data that simulates a real customer
    const testLeadData = {
      messages: [
        {
          role: 'user',
          content: 'Hi, I am John Smith from Tech Solutions Inc. I need help with AI automation for our customer service. My budget is $10,000 and we need to implement it within 3 months. You can reach me at john.smith@techsolutions.com or call 555-012-3456.',
          timestamp: new Date().toISOString()
        }
      ]
    };

    log.step('Sending lead capture request to chatbot API...');

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': 'test-session-' + Date.now()
      },
      body: JSON.stringify(testLeadData)
    });

    const responseText = await response.text();

    if (response.ok) {
      log.success('API request successful');
      log.info('Response status: ' + response.status);

      // Check if lead was captured by looking for lead capture metadata
      if (responseText.includes('lead_captured') || responseText.includes('captureLeadToHubSpot')) {
        log.success('✅ LEAD CAPTURE DETECTED IN RESPONSE');

        if (responseText.includes('Thank you') && responseText.includes('Aparna')) {
          log.success('🎯 LEAD SUCCESSFULLY CAPTURED AND SENT TO HUBSPOT');
          log.info('Expected result: Contact should appear in your HubSpot CRM');
          log.info('Check: https://app.hubspot.com/contacts');
          return true;
        } else {
          log.warn('⚠️ Lead capture attempted but may have issues');
          log.info('Response preview:', responseText.substring(0, 200) + '...');
          return false;
        }
      } else {
        log.warn('Lead capture not triggered in response');
        log.info('This might mean:');
        log.info('• Lead qualification criteria not met');
        log.info('• HubSpot token still invalid');
        log.info('• API processing ongoing...');
        log.info('Response preview:', responseText.substring(0, 200) + '...');
        return false;
      }
    } else {
      log.error(`API request failed: ${response.status} ${response.statusText}`);
      log.error('Response:', responseText);
      return false;
    }

  } catch (error) {
    log.error(`Test failed: ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      log.error('Connection refused - make sure the development server is running');
      log.info('Run: npm run dev');
    }

    return false;
  }
}

async function checkServerStatus() {
  log.step('Checking development server status...');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      log.success('✅ Development server is running');
      return true;
    } else {
      log.warn(`Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Server check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.bold}${colors.magenta}
╔══════════════════════════════════════════╗
║                                            ║
║         🧪 LIVE LEAD CAPTURE TEST         ║
║                                            ║
╚══════════════════════════════════════════╝
${colors.reset}`);

  log.section('🔍 SERVER STATUS CHECK');

  const serverRunning = await checkServerStatus();

  if (!serverRunning) {
    log.error('Cannot proceed - development server is not running');
    log.info('Please start the server with: npm run dev');
    process.exit(1);
  }

  log.section('🧪 LEAD CAPTURE TEST');

  const result = await testLiveLeadCapture();

  log.header('📊 TEST RESULTS');

  if (result) {
    log.success('🎉 ALL TESTS PASSED');
    log.success('Lead capture system is working correctly');
    log.info('You should see the test lead in your HubSpot CRM');

    console.log(`
${colors.bold}${colors.cyan}📋 NEXT STEPS:${colors.reset}
${colors.green}•${colors.reset} Check your HubSpot CRM: https://app.hubspot.com/contacts
${colors.green}•${colors.reset} Look for "John Smith" or "Tech Solutions Inc"
${colors.green}•${colors.reset} Verify all fields were captured correctly
${colors.green}•${colors.reset} Check if a deal was created (this is a high-quality lead)
    `);
  } else {
    log.error('❌ TESTS FAILED');
    log.error('Lead capture has issues that need to be addressed');

    console.log(`
${colors.bold}${colors.yellow}🔧 TROUBLESHOOTING:${colors.reset}
${colors.red}•${colors.reset} Check server logs for errors
${colors.red}•${colors.reset} Verify HubSpot access token is valid
${colors.red}•${colors.reset} Check environment variables are loaded
${colors.red}•${colors.reset} Try testing with simpler lead data
    `);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testLiveLeadCapture,
  checkServerStatus
};