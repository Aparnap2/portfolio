const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Origin': 'http://localhost:3000',
    'Content-Type': 'application/json'
  }
});

async function test() {
  try {
    console.log('\n====================================');
    console.log('🚀 E2E Production Test - Real AI');
    console.log('====================================\n');
    
    // Start session
    console.log('[1] Starting audit session...');
    let res = await api.post('/api/audit/start', {
      ipAddress: '127.0.0.1',
      userAgent: 'E2E Test'
    });
    
    const sessionId = res.data.sessionId;
    console.log(`✅ Session created: ${sessionId}`);
    console.log(`   Current step: ${res.data.response.current_step}`);
    console.log(`   Messages: ${res.data.response.messages.length}`);
    
    if (res.data.response.messages && res.data.response.messages.length > 0) {
      const msg = res.data.response.messages[res.data.response.messages.length - 1];
      if (msg && msg.content) {
        console.log(`   AI says: "${msg.content.substring(0, 80)}..."`);
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Test 2
    console.log('\n[2] User: Industry information...');
    res = await api.post('/api/audit/answer', {
      sessionId,
      message: 'We are an e-commerce company selling consumer electronics like smartphones, laptops, and accessories'
    });
    
    console.log(`✅ Response received`);
    console.log(`   Step: ${res.data.response.current_step}`);
    console.log(`   Messages: ${res.data.response.messages.length}`);
    
    if (res.data.response.messages && res.data.response.messages.length > 0) {
      const msg = res.data.response.messages[res.data.response.messages.length - 1];
      if (msg && msg.content) {
        console.log(`   AI says: "${msg.content.substring(0, 80)}..."`);
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Test 3
    console.log('\n[3] User: Company size...');
    res = await api.post('/api/audit/answer', {
      sessionId,
      message: 'Our company has 75 employees across multiple departments including sales, operations, and customer support'
    });
    
    console.log(`✅ Response received`);
    console.log(`   Step: ${res.data.response.current_step}`);
    console.log(`   Messages: ${res.data.response.messages.length}`);
    
    if (res.data.response.messages && res.data.response.messages.length > 0) {
      const msg = res.data.response.messages[res.data.response.messages.length - 1];
      if (msg && msg.content) {
        console.log(`   AI says: "${msg.content.substring(0, 80)}..."`);
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Test 4
    console.log('\n[4] User: Business flows...');
    res = await api.post('/api/audit/answer', {
      sessionId,
      message: 'We acquire customers through paid advertising on Google and Facebook. We ship products using FedEx and UPS with automated tracking'
    });
    
    console.log(`✅ Response received`);
    console.log(`   Step: ${res.data.response.current_step}`);
    
    if (res.data.response.extracted_data && res.data.response.extracted_data.discovery) {
      console.log(`\n   📊 DISCOVERY DATA EXTRACTED!`);
      console.log(`   ${JSON.stringify(res.data.response.extracted_data.discovery, null, 2)}`);
    }
    
    console.log('\n====================================');
    console.log('✅ E2E Test Completed!');
    console.log('====================================');
    console.log(`\nSummary:`);
    console.log(`  Session ID: ${sessionId}`);
    console.log(`  Current Step: ${res.data.response.current_step}`);
    console.log(`  Total Messages: ${res.data.response.messages.length}`);
    console.log(`  Data Collected: ${Object.keys(res.data.response.extracted_data || {}).join(', ')}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`\nStatus: ${error.response.status}`);
      console.error(`Response:`, JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

test();
