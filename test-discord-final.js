const axios = require('axios');
const fs = require('fs');

// Load env
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    }
});

async function test() {
  console.log('\n🧪 Testing Discord Webhook\n');
  
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  console.log('Webhook URL:', webhookUrl ? webhookUrl.substring(0, 50) + '...' : 'NOT SET');
  
  if (!webhookUrl || !webhookUrl.includes('/api/webhooks/')) {
    console.log('❌ Invalid or missing webhook URL\n');
    return;
  }
  
  console.log('✅ Valid webhook URL format\n');
  console.log('Sending test notification...\n');
  
  try {
    const response = await axios.post('http://localhost:3000/api/discord/notify', {
      sessionId: 'test-' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Corp',
      painScore: 85,
      estimatedValue: 15000,
      topOpportunity: 'Lead Scoring Automation'
    }, {
      headers: {
        'Origin': 'http://localhost:3000',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Check your Discord channel for the message!\n');
    
  } catch (error) {
    console.log('❌ FAILED');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

test();
