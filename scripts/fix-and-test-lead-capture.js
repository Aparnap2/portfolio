#!/usr/bin/env node

/**
 * Lead Capture System Fix and Test Script
 *
 * This script:
 * 1. Diagnoses HubSpot integration issues
 * 2. Provides clear instructions for fixing them
 * 3. Tests the complete lead capture flow
 * 4. Creates fallback mechanisms
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
  success: (...args) => console.log(`${colors.green}✅${colors.reset}`, ...args),
  error: (...args) => console.log(`${colors.red}❌${colors.reset}`, ...args),
  warn: (...args) => console.log(`${colors.yellow}⚠️${colors.reset}`, ...args),
  info: (...args) => console.log(`${colors.blue}ℹ️${colors.reset}`, ...args),
  step: (...args) => console.log(`${colors.cyan}🔸${colors.reset}`, ...args),
  header: (...args) => console.log(`\n${colors.bold}${colors.magenta}${args.join('')}${colors.reset}`),
  section: (...args) => console.log(`\n${colors.bold}${colors.blue}${args.join('')}${colors.reset}`)
};

async function checkEnvironmentVariables() {
  log.section('🔍 CHECKING ENVIRONMENT VARIABLES');

  const requiredVars = {
    'HUBSPOT_ACCESS_TOKEN': {
      description: 'HubSpot Private App Access Token',
      critical: true
    },
    'HUBSPOT_CLIENT_SECRET': {
      description: 'HubSpot Client Secret',
      critical: true
    },
    'NEXT_PUBLIC_APP_URL': {
      description: 'Your application URL (for webhooks)',
      critical: false
    }
  };

  const optionalVars = {
    'QSTASH_URL': {
      description: 'QStash Redis URL',
      critical: false
    },
    'QSTASH_TOKEN': {
      description: 'QStash Redis Token',
      critical: false
    },
    'DISCORD_WEBHOOK_URL': {
      description: 'Discord Webhook URL',
      critical: false
    },
    'SLACK_WEBHOOK_URL': {
      description: 'Slack Webhook URL',
      critical: false
    }
  };

  let criticalMissing = [];
  let optionalMissing = [];

  // Check required variables
  for (const [key, config] of Object.entries(requiredVars)) {
    if (!process.env[key]) {
      if (config.critical) {
        criticalMissing.push({ key, ...config });
      } else {
        optionalMissing.push({ key, ...config });
      }
    } else {
      log.success(`${key}: ✅ Configured`);
    }
  }

  // Check optional variables
  for (const [key, config] of Object.entries(optionalVars)) {
    if (!process.env[key]) {
      optionalMissing.push({ key, ...config });
      log.warn(`${key}: ⚠️ Not configured (${config.description})`);
    } else {
      log.success(`${key}: ✅ Configured`);
    }
  }

  // Print summary
  if (criticalMissing.length > 0) {
    log.error('\n🚨 CRITICAL ISSUES FOUND:');
    criticalMissing.forEach(({ key, description }) => {
      console.log(`   ${colors.red}•${colors.reset} ${key}: ${description}`);
    });

    log.header('\n📋 HOW TO FIX HUBSPOT INTEGRATION:');
    console.log(`
1. ${colors.cyan}Create a HubSpot Private App:${colors.reset}
   • Go to https://app.hubspot.com/developer/private-apps/
   • Click "Create private app"
   • Give it a name like "AI Lead Capture"

2. ${colors.cyan}Configure Scopes:${colors.reset}
   • Under "Scopes", add these OAuth scopes:
     • ${colors.bold}crm.objects.contacts.write${colors.reset} (to create/update contacts)
     • ${colors.bold}crm.objects.deals.write${colors.reset} (to create deals)
     • ${colors.bold}crm.objects.companies.write${colors.reset} (to create companies)

3. ${colors.cyan}Get Access Token:${colors.reset}
   • After creating the app, go to the app's details
   • Copy the ${colors.bold}Access Token${colors.reset} from the app's authentication section

4. ${colors.cyan}Update Environment:${colors.reset}
   • Add to your ${colors.bold}.env${colors.reset} file:
   ${colors.yellow}HUBSPOT_ACCESS_TOKEN=your_access_token_here${colors.reset}
   ${colors.yellow}HUBSPOT_CLIENT_SECRET=your_client_secret_here${colors.reset}

5. ${colors.cyan}Restart Application:${colors.reset}
   • Stop and restart your application to load new environment variables
`);

    return { success: false, criticalMissing };
  }

  if (optionalMissing.length > 0) {
    log.warn('\n⚠️ OPTIONAL INTEGRATIONS MISSING:');
    optionalMissing.forEach(({ key, description }) => {
      console.log(`   • ${key}: ${description}`);
    });
  }

  return { success: true, criticalMissing: [] };
}

async function testHubSpotConnection() {
  log.section('🔌 TESTING HUBSPOT CONNECTION');

  try {
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      log.error('HUBSPOT_ACCESS_TOKEN not found');
      return false;
    }

    log.step('Testing HubSpot API access...');
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
      log.warn('Please check your HUBSPOT_ACCESS_TOKEN in .env file');
      return false;
    } else {
      log.error(`HubSpot API connection: FAILED - Status: ${response.status}`);
      const errorText = await response.text();
      log.error('Error details:', errorText);
      return false;
    }
  } catch (error) {
    log.error('HubSpot connection test failed:', error.message);
    return false;
  }
}

async function testLeadCaptureFlow() {
  log.section('🎯 TESTING LEAD CAPTURE FLOW');

  try {
    // Import the HubSpot client
    const { captureLeadToHubSpot } = require('../src/lib/hubspot_client.js');

    log.step('Testing lead capture with sample data...');

    const testLead = {
      name: 'Test User',
      email: 'test-' + Date.now() + '@example.com',
      company: 'Test Automation Company',
      phone: '+1-555-0123-4567',
      requirements: 'AI automation for customer service',
      budget: '$5,000 - $10,000',
      timeline: '1-3 months',
      conversation_summary: 'Test lead from automated lead capture system verification',
      lead_score: 85,
      industry: 'Technology',
      current_challenges: 'Manual customer service processes'
    };

    const result = await captureLeadToHubSpot(testLead);

    if (result && result.includes('Thank you')) {
      log.success('Lead capture test: SUCCESS');
      log.info('Sample lead was created in HubSpot');
      log.info('Check your HubSpot CRM to verify the new contact');
      return true;
    } else {
      log.error('Lead capture test: FAILED');
      log.error('Result:', result);
      return false;
    }
  } catch (error) {
    log.error('Lead capture flow test failed:', error.message);

    if (error.message.includes('HUBSPOT_ACCESS_TOKEN')) {
      log.warn('This confirms the HubSpot token issue from environment check');
    }
    return false;
  }
}

function createFallbackLeadCapture() {
  log.section('🛡️ CREATING FALLBACK LEAD CAPTURE');

  const fallbackScript = `
/**
 * Fallback Lead Capture System
 *
 * This captures leads and stores them locally when HubSpot is unavailable
 * and provides alternative notification methods.
 */

const fs = require('fs').promises;
const path = require('path');

class FallbackLeadCapture {
  constructor() {
    this.leadsFile = path.join(__dirname, '../captured-leads.json');
    this.leads = [];
    this.loadLeads();
  }

  async loadLeads() {
    try {
      const data = await fs.readFile(this.leadsFile, 'utf8');
      this.leads = JSON.parse(data);
      console.log('Loaded', this.leads.length, 'existing leads from backup');
    } catch (error) {
      console.log('No existing leads file found, starting fresh');
      this.leads = [];
    }
  }

  async saveLead(leadData) {
    try {
      const lead = {
        ...leadData,
        captured_at: new Date().toISOString(),
        id: 'lead_' + Date.now()
      };

      this.leads.push(lead);
      await fs.writeFile(this.leadsFile, JSON.stringify(this.leads, null, 2));

      console.log('✅ Lead captured locally:', lead.email);
      return '✅ Lead captured successfully! We will contact you soon.';
    } catch (error) {
      console.error('❌ Failed to capture lead locally:', error);
      return '❌ Sorry, there was an error capturing your information.';
    }
  }

  async getLeads() {
    return this.leads;
  }

  async exportLeadsForHubSpot() {
    // Creates a CSV file for manual import into HubSpot
    const csvHeader = 'Email,Name,Company,Phone,Requirements,Budget,Timeline,Captured At\\n';
    const csvRows = this.leads.map(lead =>
      \`\${lead.email},\${lead.name || ''},\${lead.company || ''},\${lead.phone || ''},\${lead.requirements || ''},\${lead.budget || ''},\${lead.timeline || ''},\${lead.captured_at || ''}\\n\`
    ).join('');

    const csvContent = csvHeader + csvRows;
    const csvFile = this.leadsFile.replace('.json', '_for_hubspot.csv');

    await fs.writeFile(csvFile, csvContent);
    console.log('📊 CSV file created for manual HubSpot import:', csvFile);
    return csvFile;
  }
}

// Export for use in chat route
if (typeof module !== 'undefined' && module.exports) {
  module.exports = new FallbackLeadCapture();
}

// Usage example:
// const fallbackCapture = require('./fallback_lead_capture');
// await fallbackCapture.saveLead(leadData);
// const csvFile = await fallbackCapture.exportLeadsForHubSpot();
`;

  try {
    require('fs').writeFileSync(
      path.join(__dirname, '../src/lib/fallback_lead_capture.js'),
      fallbackScript
    );
    log.success('Fallback lead capture system created');
    log.info('File created: src/lib/fallback_lead_capture.js');
    return true;
  } catch (error) {
    log.error('Failed to create fallback system:', error.message);
    return false;
  }
}

function provideFinalInstructions() {
  log.header('\n📚 COMPLETE SETUP INSTRUCTIONS');

  console.log(`
${colors.bold}${colors.cyan}1. IMMEDIATE ACTIONS:${colors.reset}
   ${colors.yellow}• Update your .env file with valid HubSpot credentials${colors.reset}
   ${colors.yellow}• Restart your application${colors.reset}
   ${colors.yellow}• Test lead capture using your website's chatbot${colors.reset}

${colors.bold}${colors.cyan}2. HUBSPOT CRM VERIFICATION:${colors.reset}
   ${colors.blue}• Log into your HubSpot account${colors.reset}
   ${colors.blue}• Navigate to Contacts > Lists${colors.reset}
   ${colors.blue}• Look for test leads captured during testing${colors.reset}

${colors.bold}${colors.cyan}3. MONITORING:${colors.reset}
   ${colors.blue}• Check server logs for lead capture messages${colors.reset}
   ${colors.blue}• Monitor the fallback system at src/captured-leads.json${colors.reset}
   ${colors.blue}• Set up HubSpot notifications for new contacts${colors.reset}

${colors.bold}${colors.cyan}4. TROUBLESHOOTING:${colors.reset}
   ${colors.red}• If leads aren't appearing in HubSpot:${colors.reset}
     - Verify the access token hasn't expired
     - Check that OAuth scopes include crm.objects.contacts.write
     - Ensure the private app is properly configured
   ${colors.red}• If you see "Invalid token" errors:${colors.reset}
     - Generate a new access token from HubSpot developer portal
     - Update your .env file immediately

${colors.bold}${colors.green}🎯 SUCCESS METRICS:${colors.reset}
   Track these metrics to measure lead capture success:
   • Number of leads captured per day
   • Lead quality scores (50+ is considered qualified)
   • Conversion rate from chat to contact
   • Time from first interaction to lead capture
`);
}

async function main() {
  console.log(`${colors.bold}${colors.magenta}
╔══════════════════════════════════════════════════╗
║                                                    ║
║         AI CHATBOT LEAD CAPTURE SYSTEM TEST          ║
║                                                    ║
╚══════════════════════════════════════════════════╝
${colors.reset}`);

  log.header('🚀 STARTING COMPREHENSIVE LEAD CAPTURE TEST');

  // Step 1: Check environment
  const envCheck = await checkEnvironmentVariables();
  if (!envCheck.success) {
    log.error('Cannot proceed with testing due to critical issues');
    process.exit(1);
  }

  // Step 2: Test HubSpot connection
  const hubspotTest = await testHubSpotConnection();
  if (!hubspotTest) {
    log.warn('HubSpot connection failed, creating fallback system...');
    await createFallbackLeadCapture();
    provideFinalInstructions();
    log.warn('\n⚠️ TEST RESULT: INCOMPLETE - HubSpot integration needs fixing');
    process.exit(1);
  }

  // Step 3: Test lead capture flow
  const leadCaptureTest = await testLeadCaptureFlow();
  if (!leadCaptureTest) {
    log.error('Lead capture test failed');
    provideFinalInstructions();
    process.exit(1);
  }

  // Step 4: Create fallback anyway (for redundancy)
  await createFallbackLeadCapture();

  log.header('\n🎉 ALL TESTS PASSED!');
  log.success('Lead capture system is working correctly');
  log.success('HubSpot integration is active');
  log.success('Fallback system is available');

  provideFinalInstructions();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error('Test script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  checkEnvironmentVariables,
  testHubSpotConnection,
  testLeadCaptureFlow,
  createFallbackLeadCapture
};
";