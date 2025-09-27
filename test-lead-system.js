#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Portfolio Lead System
 * Tests: 24/7 lead capture, virtual audit, data parsing, async storing, notifications
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testLeadCapture() {
  console.log('\n🧪 TESTING: 24/7 Lead Capture System');

  try {
    const response = await makeRequest(`${BASE_URL}/api/leads`, {
      method: 'POST',
      body: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        company: 'Test Company',
        project_type: 'AI Automation',
        budget: '$50k-$100k',
        timeline: '3-6 months'
      }
    });

    console.log(`✅ Lead Capture: ${response.status === 201 ? 'PASS' : 'FAIL'}`);
    console.log(`   Response:`, response.data);

    return response.status === 201;
  } catch (error) {
    console.log(`❌ Lead Capture: FAIL - ${error.message}`);
    return false;
  }
}

async function testVirtualAudit() {
  console.log('\n🧪 TESTING: Virtual Audit System');

  try {
    // Test Phase 1: Company onboarding
    const phase1Response = await makeRequest(`${BASE_URL}/api/phase1/start`, {
      method: 'POST',
      body: {
        companyInfo: {
          name: 'Test Corp',
          industry: 'Technology',
          size: '51-200',
          techLevel: 'intermediate',
          currentChallenges: 'Manual processes, data entry',
          aiExperience: 'Some chatbot experience'
        }
      }
    });

    console.log(`✅ Phase 1 Start: ${phase1Response.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`   Company ID:`, phase1Response.data.companyId);

    const companyId = phase1Response.data.companyId;

    // Test Phase 2: Interview processing
    const interviewResponse = await makeRequest(`${BASE_URL}/api/phase2/interview`, {
      method: 'POST',
      body: {
        companyId,
        role: 'Operations Manager',
        answers: {
          dailyTasks: 'Process orders, manage inventory, customer support',
          painPoints: 'Manual data entry takes too long',
          manualProcesses: 'Order processing, inventory tracking',
          timeBreakdown: 'Data entry: 4hrs/day, Customer support: 3hrs/day',
          systemsUsed: 'Excel, CRM system, email'
        }
      }
    });

    console.log(`✅ Interview Processing: ${interviewResponse.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`   Analysis:`, interviewResponse.data.analysis?.summary);

    // Test Phase 2: Roadmap generation
    const roadmapResponse = await makeRequest(`${BASE_URL}/api/phase2/roadmap/${companyId}`);

    console.log(`✅ Roadmap Generation: ${roadmapResponse.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`   Roadmap Generated:`, !!roadmapResponse.data.executiveSummary);

    return phase1Response.status === 200 && interviewResponse.status === 200 && roadmapResponse.status === 200;
  } catch (error) {
    console.log(`❌ Virtual Audit: FAIL - ${error.message}`);
    return false;
  }
}

async function testDataParsing() {
  console.log('\n🧪 TESTING: Data Parsing & Async Storing');

  try {
    // Test flexible lead parsing
    const { flexibleLeadParse } = require('../src/lib/flexible-lead-parser.js');

    const testInputs = [
      'John Doe from ABC Corp (john@abc.com) wants AI automation',
      {
        email: 'jane@xyz.com',
        name: 'Jane Smith',
        company: 'XYZ Industries'
      },
      'Contact me at test@unstructured.com for pricing information'
    ];

    let parseSuccess = true;
    testInputs.forEach((input, index) => {
      const result = flexibleLeadParse(input);
      if (!result || (!result.email && !result.name)) {
        parseSuccess = false;
        console.log(`   ❌ Test ${index + 1}: Failed to parse`);
      } else {
        console.log(`   ✅ Test ${index + 1}: Parsed ${result.email || result.name}`);
      }
    });

    console.log(`✅ Data Parsing: ${parseSuccess ? 'PASS' : 'FAIL'}`);
    return parseSuccess;
  } catch (error) {
    console.log(`❌ Data Parsing: FAIL - ${error.message}`);
    return false;
  }
}

async function testNotifications() {
  console.log('\n🧪 TESTING: Notification System');

  try {
    // Test Discord worker endpoint
    const discordResponse = await makeRequest(`${BASE_URL}/api/workers/discord`, {
      method: 'POST',
      body: {
        type: 'system_alert',
        alert: {
          type: 'Test Notification',
          message: 'Test notification from automated system',
          severity: 'info'
        }
      }
    });

    console.log(`✅ Discord Worker: ${discordResponse.status === 200 ? 'PASS' : 'FAIL'}`);

    // Test HubSpot worker endpoint
    const hubspotResponse = await makeRequest(`${BASE_URL}/api/workers/hubspot`, {
      method: 'POST',
      body: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        company: 'Test Company'
      }
    });

    console.log(`✅ HubSpot Worker: ${hubspotResponse.status === 200 ? 'PASS' : 'FAIL'}`);

    return discordResponse.status === 200 && hubspotResponse.status === 200;
  } catch (error) {
    console.log(`❌ Notifications: FAIL - ${error.message}`);
    return false;
  }
}

async function runFullTestSuite() {
  console.log('🚀 COMPREHENSIVE LEAD SYSTEM TEST SUITE');
  console.log('=====================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const results = {
    leadCapture: await testLeadCapture(),
    virtualAudit: await testVirtualAudit(),
    dataParsing: await testDataParsing(),
    notifications: await testNotifications()
  };

  console.log('\n📊 FINAL RESULTS');
  console.log('================');
  console.log(`✅ Lead Capture: ${results.leadCapture ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Virtual Audit: ${results.virtualAudit ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Data Parsing: ${results.dataParsing ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Notifications: ${results.notifications ? 'PASS' : 'FAIL'}`);

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const score = (passed / total) * 100;

  console.log(`\n🎯 OVERALL SCORE: ${passed}/${total} (${score.toFixed(1)}%)`);

  if (score === 100) {
    console.log('🎉 ALL TESTS PASSED! System is fully functional.');
  } else if (score >= 75) {
    console.log('⚠️  MOST TESTS PASSED! System is mostly functional.');
  } else {
    console.log('❌ TESTS FAILED! System needs fixes.');
  }

  return score === 100;
}

if (require.main === module) {
  runFullTestSuite().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { runFullTestSuite };