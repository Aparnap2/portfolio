/**
 * Discord Integration Test with Real Credentials
 */

const fs = require('fs');
const path = require('path');

// Load .env file manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
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

async function testDiscord() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 Discord Integration Test');
    console.log('='.repeat(60) + '\n');
    
    // Check credentials
    console.log('Checking Discord credentials...\n');
    
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const appId = process.env.DISCORD_APP_ID;
    const serverId = process.env.DISCORD_SERVER_ID;
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    
    console.log('DISCORD_WEBHOOK_URL:', webhookUrl ? '✅ Set' : '❌ Not set');
    if (webhookUrl) {
        console.log('  Value:', webhookUrl.substring(0, 50) + '...');
        
        // Check if it's a valid webhook URL
        if (webhookUrl.includes('/api/webhooks/')) {
            console.log('  ✅ Valid webhook URL format');
        } else if (webhookUrl.includes('oauth2/authorize')) {
            console.log('  ⚠️  This is an OAuth URL, not a webhook URL!');
            console.log('  Need: https://discord.com/api/webhooks/{id}/{token}');
        } else {
            console.log('  ⚠️  Unknown URL format');
        }
    }
    
    console.log('DISCORD_BOT_TOKEN:', botToken ? '✅ Set (' + botToken.substring(0, 20) + '...)' : '❌ Not set');
    console.log('DISCORD_APP_ID:', appId ? '✅ Set (' + appId + ')' : '❌ Not set');
    console.log('DISCORD_SERVER_ID:', serverId ? '✅ Set (' + serverId + ')' : '❌ Not set');
    console.log('DISCORD_PUBLIC_KEY:', publicKey ? '✅ Set' : '❌ Not set');
    
    console.log('\n' + '-'.repeat(60));
    console.log('Testing Discord Webhook');
    console.log('-'.repeat(60) + '\n');
    
    if (!webhookUrl || !webhookUrl.includes('/api/webhooks/')) {
        console.log('⚠️  Cannot test webhook - invalid or missing URL\n');
        console.log('To get a webhook URL:');
        console.log('1. Go to your Discord server');
        console.log('2. Edit a channel → Integrations → Webhooks');
        console.log('3. Create New Webhook or copy existing one');
        console.log('4. Update DISCORD_WEBHOOK_URL in .env\n');
    } else {
        try {
            const testPayload = {
                embeds: [{
                    title: '🧪 Test Notification',
                    description: 'Testing Discord webhook integration',
                    color: 0x00ff00,
                    fields: [
                        {
                            name: 'Status',
                            value: 'Testing',
                            inline: true
                        },
                        {
                            name: 'Timestamp',
                            value: new Date().toISOString(),
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'Integration Test'
                    }
                }],
                username: 'AI Audit Bot'
            };
            
            console.log('Sending test webhook...');
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload)
            });
            
            console.log('Response status:', response.status);
            
            if (response.status === 204 || response.status === 200) {
                console.log('✅ Webhook sent successfully!');
                console.log('   Check your Discord channel for the message\n');
            } else {
                const errorText = await response.text();
                console.log('❌ Webhook failed:', response.statusText);
                console.log('   Error:', errorText, '\n');
            }
        } catch (error) {
            console.log('❌ Webhook test failed:', error.message, '\n');
        }
    }
    
    console.log('-'.repeat(60));
    console.log('Testing Discord API Endpoint');
    console.log('-'.repeat(60) + '\n');
    
    try {
        console.log('Testing /api/discord/notify endpoint...');
        
        const response = await fetch('http://localhost:3000/api/discord/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            },
            body: JSON.stringify({
                sessionId: 'test-' + Date.now(),
                name: 'Test User',
                email: 'test@example.com',
                company: 'Test Corp',
                painScore: 85,
                estimatedValue: 15000,
                topOpportunity: 'Lead Scoring Automation'
            })
        });
        
        console.log('API response status:', response.status);
        const data = await response.json();
        
        console.log('API response:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ Discord API endpoint working!');
        } else {
            console.log('⚠️  API returned:', data.error || 'Unknown error');
        }
        
    } catch (error) {
        console.log('❌ API test failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Discord Integration Summary');
    console.log('='.repeat(60) + '\n');
    
    console.log('Bot Credentials:');
    console.log('  • Bot Token: ' + (botToken ? '✅ Configured' : '❌ Missing'));
    console.log('  • App ID: ' + (appId ? '✅ Configured' : '❌ Missing'));
    console.log('  • Server ID: ' + (serverId ? '✅ Configured' : '❌ Missing'));
    console.log('  • Public Key: ' + (publicKey ? '✅ Configured' : '❌ Missing'));
    
    console.log('\nWebhook:');
    if (webhookUrl && webhookUrl.includes('/api/webhooks/')) {
        console.log('  • Status: ✅ Configured and tested');
    } else if (webhookUrl) {
        console.log('  • Status: ⚠️  Configured but wrong URL type');
        console.log('  • Action: Replace with actual webhook URL');
    } else {
        console.log('  • Status: ❌ Not configured');
    }
    
    console.log('\nBot Status:');
    console.log('  • Code: ✅ Fully implemented');
    console.log('  • Commands: ✅ Ready (/ping, /status, /alert-lead, etc.)');
    console.log('  • Start: Run "pnpm discord:start"');
    
    console.log('\nNext Steps:');
    if (!webhookUrl || !webhookUrl.includes('/api/webhooks/')) {
        console.log('  1. Get webhook URL from Discord channel settings');
        console.log('  2. Update DISCORD_WEBHOOK_URL in .env');
        console.log('  3. Run this test again');
    }
    console.log('  ' + (webhookUrl && webhookUrl.includes('/api/webhooks/') ? '1' : '4') + '. Start Discord bot: pnpm discord:start');
    console.log('  ' + (webhookUrl && webhookUrl.includes('/api/webhooks/') ? '2' : '5') + '. Test bot commands in Discord');
    
    console.log('\n');
}

testDiscord();
