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
    console.log('\n🚀 Starting E2E Test\n');
    
    // Start session
    console.log('Step 1: Starting audit session...');
    let res = await api.post('/api/audit/start', {
      ipAddress: '127.0.0.1',
      userAgent: 'Test'
    });
    
    const sessionId = res.data.sessionId;
    console.log(`✅ Session: ${sessionId}`);
    console.log(`   Step: ${res.data.response.current_step}`);
    console.log(`   AI: ${res.data.response.messages[res.data.response.messages.length - 1].content.substring(0, 100)}...\n`);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Industry
    console.log('Step 2: Sending industry...');
    res = await api.post('/api/audit/answer', {
      sessionId,
      message: 'We run an e-commerce business selling consumer electronics'
    });
    console.log(`✅ Step: ${res.data.response.current_step}`);
    console.log(`   AI: ${res.data.response.messages[res.data.response.messages.length - 1].content.substring(0, 100)}...\n`);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Company size
    console.log('Step 3: Sending company size...');
    res = await api.post('/api/audit/answer', {
      sessionId,
      message: 'We have 75 employees'
    });
    console.log(`✅ Step: ${res.data.response.current_step}`);
    console.log(`   AI: ${res.data.response.messages[res.data.response.messages.length - 1].content.substring(0, 100)}...\n`);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Business flows
    console.log('Step 4: Sending business flows...');
    res = await api.post('/api/audit/answer', {
      sessionId,
      message: 'We use Google Ads and ship via FedEx'
    });
    console.log(`✅ Step: ${res.data.response.current_step}`);
    if (res.data.response.extracted_data?.discovery) {
      console.log(`   📊 Discovery data: ${JSON.stringify(res.data.response.extracted_data.discovery)}`);
    }
    console.log(`   AI: ${res.data.response.messages[res.data.response.messages.length - 1].content.substring(0, 100)}...\n`);
    
    console.log('\n✅ Test completed successfully!');
    console.log(`\nFinal state:`);
    console.log(`  - Step: ${res.data.response.current_step}`);
    console.log(`  - Messages: ${res.data.response.messages.length}`);
    console.log(`  - Data keys: ${Object.keys(res.data.response.extracted_data || {}).join(', ')}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
  }
}

test();
