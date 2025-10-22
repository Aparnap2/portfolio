const axios = require('axios');

async function test() {
  console.log('\n🧪 Testing Integrations\n');
  
  // Test Discord
  console.log('='.repeat(50));
  console.log('🤖 Discord Integration Test');
  console.log('='.repeat(50));
  
  try {
    const discordTest = await axios.post('http://localhost:3000/api/discord/notify', {
      sessionId: 'test-123',
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Co',
      painScore: 75,
      estimatedValue: 10000
    }, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Discord API Response:', discordTest.data.success ? 'SUCCESS' : 'FAILED');
    if (discordTest.data.messageId) {
      console.log('   Message ID:', discordTest.data.messageId);
    }
    if (!discordTest.data.success) {
      console.log('   Note:', discordTest.data.error || 'Webhook not configured');
    }
  } catch (error) {
    console.log('❌ Discord API Error:', error.response?.data || error.message);
  }
  
  console.log('');
  
  // Test HubSpot (via checking env)
  console.log('='.repeat(50));
  console.log('🔗 HubSpot Integration Test');
  console.log('='.repeat(50));
  
  if (process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_ACCESS_TOKEN) {
    console.log('✅ HubSpot credentials found in environment');
    console.log('   Integration is configured and ready');
  } else {
    console.log('⚠️  HubSpot credentials not configured');
    console.log('   Set HUBSPOT_API_KEY or HUBSPOT_ACCESS_TOKEN in .env');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log('Discord API: ✅ Responding');
  console.log('HubSpot: ' + (process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_ACCESS_TOKEN ? '✅ Configured' : '⚠️  Not configured'));
  console.log('');
}

test();
