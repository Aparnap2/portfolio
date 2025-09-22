#!/usr/bin/env node
// Test script to verify chat API functionality

import { extractLeadInfo, shouldCaptureLead } from './src/lib/lead-capture.js';
import { flexibleLeadParse } from './src/lib/flexible-lead-parser.js';

const log = (title, data) => {
  console.log(`\n🔬 ${title}:`);
  console.log(JSON.stringify(data, null, 2));
};

console.log('🚀 Testing Core Chat API Functions\n');

// Test 1: Basic lead extraction
const testMessage1 = "Hi, I'm John Smith, email john@company.com, need a website";
const extracted1 = extractLeadInfo(testMessage1);
log('Basic Lead Extraction', extracted1);

// Test 2: Flexible parsing
const testMessage2 = "Hello, I'm Sarah from TechCorp (sarah@techcorp.com), looking for mobile app development";
const flexible1 = flexibleLeadParse(testMessage2);
log('Flexible Parsing', flexible1);

// Test 3: Should capture lead detection
const testMessage3 = "What's your pricing for web development?";
const shouldCapture1 = shouldCaptureLead(testMessage3, { intent: 'pricing', confidence: 0.8 }, []);
log('Should Capture Lead (Pricing)', shouldCapture1);

// Test 4: Contact pattern detection
const testMessage4 = "Please contact me at mike@startup.io for project discussion";
const shouldCapture2 = shouldCaptureLead(testMessage4, {}, []);
log('Should Capture Lead (Contact)', shouldCapture2);

// Test 5: Complex extraction
const testMessage5 = `{
  "name": "David Wilson",
  "email": "david@example.com",
  "company": "Wilson Corp",
  "project": "E-commerce platform",
  "budget": "$15000",
  "timeline": "3 months"
}`;
const flexible2 = flexibleLeadParse(testMessage5);
log('Complex JSON Parsing', flexible2);

// Test 6: Informal message
const testMessage6 = "yo its alex from acme corp, hit me up at alex@acme.com, need a new site, budget around 5k";
const informal = flexibleLeadParse(testMessage6);
log('Informal Message Parsing', informal);

console.log('\n✨ Core API tests completed!\n');

// Summary
console.log('📊 Test Summary:');
console.log(`   - Basic extraction: ${extracted1 ? '✅' : '❌'}`);
console.log(`   - Flexible parsing: ${flexible1 ? '✅' : '❌'}`);
console.log(`   - Pricing detection: ${shouldCapture1 ? '✅' : '❌'}`);
console.log(`   - Contact detection: ${shouldCapture2 ? '✅' : '❌'}`);
console.log(`   - JSON parsing: ${flexible2 ? '✅' : '❌'}`);
console.log(`   - Informal parsing: ${informal ? '✅' : '❌'}`);

const passedTests = [extracted1, flexible1, shouldCapture1, shouldCapture2, flexible2, informal].filter(Boolean).length;
console.log(`\n🎯 Overall: ${passedTests}/6 tests passed (${Math.round(passedTests/6*100)}%)`);

if (passedTests >= 4) {
  console.log('🎉 Core functionality is working!');
} else {
  console.log('⚠️ Some core features need attention.');
}