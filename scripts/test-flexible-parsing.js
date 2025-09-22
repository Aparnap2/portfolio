#!/usr/bin/env node
// scripts/test-flexible-parsing.js
// Test the flexible lead parsing capabilities

import { flexibleLeadParse, parseLeadFromText, parseStructuredLead } from '../src/lib/flexible-lead-parser.js';
import { extractLeadInfoFlexible } from '../src/lib/lead-capture.js';

// Test cases that simulate various LLM formatting inconsistencies
const testCases = [
  // Standard formats
  {
    name: "Standard format",
    input: "Hi, I'm John Smith. My email is john.smith@company.com and my phone is 555-123-4567. I work at Tech Corp and need a website for our new product.",
    expected: { email: true, name: true, phone: true, company: true }
  },
  
  // Malformed/inconsistent formats
  {
    name: "Malformed email spacing",
    input: "Contact me at john . smith @ company . com, I'm John Smith from Tech Corp",
    expected: { email: true, name: true, company: true }
  },
  
  // JSON-like but malformed
  {
    name: "Malformed JSON",
    input: `{
      "name": "Sarah Johnson",
      "email": "sarah@startup.io"
      "company": "StartupCorp",
      "project": "mobile app"
    }`,
    expected: { email: true, name: true, company: true }
  },
  
  // Partial information
  {
    name: "Email only",
    input: "You can reach me at mike.wilson@example.com",
    expected: { email: true, name: true } // Should extract name from email
  },
  
  // Conversational format
  {
    name: "Conversational",
    input: "Hey there! I'm Lisa and I work for Design Studio. We're looking for help with our website redesign. Budget is around $5000 and we need it done in 2 months. You can call me at 555-987-6543",
    expected: { name: true, company: true, budget: true, timeline: true, phone: true }
  },
  
  // Mixed case and punctuation
  {
    name: "Mixed formatting",
    input: "NAME: robert BROWN\nEMAIL: robert.brown@CORP.COM\nPHONE: (555) 444-3333\nCOMPANY: big corp inc",
    expected: { email: true, name: true, phone: true, company: true }
  },
  
  // Structured but with typos
  {
    name: "Structured with typos",
    input: JSON.stringify({
      "naem": "Alex Turner", // typo in field name
      "emial": "alex@tech.com", // typo in field name
      "compnay": "TechStart", // typo in field name
      "phone": "555.111.2222"
    }),
    expected: { name: false, email: false, company: false, phone: true } // Should handle some typos
  },
  
  // Very informal
  {
    name: "Very informal",
    input: "yo its dave from acme corp hit me up at dave123@acme.com need a new site asap budget like 3k",
    expected: { name: true, company: true, email: true, budget: true, timeline: true }
  },
  
  // Multiple emails/phones
  {
    name: "Multiple contacts",
    input: "I'm Jennifer Lopez, you can reach me at jen@company.com or jennifer.lopez@personal.com. Office: 555-111-2222, Mobile: 555-333-4444",
    expected: { name: true, email: true, phone: true }
  },
  
  // International format
  {
    name: "International",
    input: "Bonjour, je suis Pierre Dubois from Paris Tech. Email: pierre.dubois@paristech.fr, Téléphone: +33 1 23 45 67 89",
    expected: { name: true, email: true, phone: true, company: true }
  }
];

function testParser() {
  console.log('🧪 Testing Flexible Lead Parsing\n');
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`\n📝 Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: ${testCase.input.substring(0, 100)}${testCase.input.length > 100 ? '...' : ''}`);
    
    try {
      const result = flexibleLeadParse(testCase.input);
      
      if (result) {
        console.log('✅ Parsed successfully:');
        console.log(`   Email: ${result.email || 'N/A'}`);
        console.log(`   Name: ${result.name || 'N/A'}`);
        console.log(`   Phone: ${result.phone || 'N/A'}`);
        console.log(`   Company: ${result.company || 'N/A'}`);
        console.log(`   Project: ${result.project_type || 'N/A'}`);
        console.log(`   Budget: ${result.budget || 'N/A'}`);
        console.log(`   Timeline: ${result.timeline || 'N/A'}`);
        console.log(`   Confidence: ${result.confidence || 'N/A'}`);
        
        // Check expectations
        let testPassed = true;
        Object.keys(testCase.expected).forEach(field => {
          const expected = testCase.expected[field];
          const actual = !!result[field];
          if (expected !== actual) {
            console.log(`   ❌ Expected ${field}: ${expected}, got: ${actual}`);
            testPassed = false;
          }
        });
        
        if (testPassed) {
          console.log('   ✅ Test passed!');
          passed++;
        } else {
          console.log('   ❌ Test failed - expectations not met');
        }
        
      } else {
        console.log('❌ No lead information extracted');
        
        // Check if we expected no extraction
        const expectedAny = Object.values(testCase.expected).some(v => v === true);
        if (!expectedAny) {
          console.log('   ✅ Test passed - correctly extracted nothing');
          passed++;
        } else {
          console.log('   ❌ Test failed - expected extraction but got none');
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  });
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed - parser may need improvements');
  }
}

// Test specific parsing strategies
function testParsingStrategies() {
  console.log('\n🔬 Testing Individual Parsing Strategies\n');
  
  const testInput = "Hi I'm John Smith from Tech Corp, email john@tech.com, phone 555-123-4567, need website, budget $5000, timeline 2 months";
  
  console.log('Input:', testInput);
  console.log('\n📊 Strategy Results:');
  
  try {
    const textResult = parseLeadFromText(testInput);
    console.log('Text parsing:', textResult ? '✅' : '❌', textResult);
    
    const structuredResult = parseStructuredLead(JSON.stringify({
      name: "John Smith",
      email: "john@tech.com",
      company: "Tech Corp"
    }));
    console.log('Structured parsing:', structuredResult ? '✅' : '❌', structuredResult);
    
    const flexibleResult = flexibleLeadParse(testInput);
    console.log('Flexible parsing:', flexibleResult ? '✅' : '❌', flexibleResult);
    
  } catch (error) {
    console.error('Error testing strategies:', error);
  }
}

// Test integration with lead capture
function testLeadCaptureIntegration() {
  console.log('\n🔗 Testing Lead Capture Integration\n');
  
  const testMessage = "Hi, I'm Sarah from StartupCorp. Email: sarah@startup.com. We need a mobile app, budget around $10k, timeline 3 months.";
  
  try {
    const result = extractLeadInfoFlexible(testMessage, {
      previousMessages: ["I'm interested in your services", "Can you help with mobile development?"]
    });
    
    console.log('Lead capture integration:', result ? '✅' : '❌');
    if (result) {
      console.log('Extracted:', result);
    }
    
  } catch (error) {
    console.error('Error testing integration:', error);
  }
}

// Run all tests
console.log('🚀 Starting Flexible Lead Parsing Tests\n');
testParser();
testParsingStrategies();
testLeadCaptureIntegration();

console.log('\n✨ Testing complete!');