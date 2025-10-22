/**
 * HubSpot Integration Test with Real API
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

async function testHubSpot() {
    console.log('\n' + '='.repeat(60));
    console.log('🔗 HubSpot Integration Test');
    console.log('='.repeat(60) + '\n');
    
    // Check credentials
    console.log('Checking credentials...');
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
    const apiKey = process.env.HUBSPOT_API_KEY;
    
    if (accessToken) {
        console.log('✅ HUBSPOT_ACCESS_TOKEN found:', accessToken.substring(0, 20) + '...');
    } else {
        console.log('❌ HUBSPOT_ACCESS_TOKEN not found');
    }
    
    if (apiKey) {
        console.log('✅ HUBSPOT_API_KEY found');
    }
    
    if (!accessToken && !apiKey) {
        console.log('\n❌ No HubSpot credentials found!\n');
        return;
    }
    
    console.log('\n' + '-'.repeat(60));
    console.log('Testing HubSpot Contact Search API');
    console.log('-'.repeat(60) + '\n');
    
    try {
        const searchUrl = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
        
        const searchPayload = {
            filterGroups: [{
                filters: [{
                    propertyName: 'email',
                    operator: 'EQ',
                    value: 'test-integration@example.com'
                }]
            }],
            limit: 1
        };
        
        console.log('Making API call to HubSpot...');
        console.log('URL:', searchUrl);
        
        const response = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken || apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchPayload)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ API Error:', response.status, response.statusText);
            console.log('Error details:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('✅ API call successful!');
        console.log('Response:', JSON.stringify(data, null, 2));
        
        console.log('\n' + '-'.repeat(60));
        console.log('Testing Contact Creation');
        console.log('-'.repeat(60) + '\n');
        
        const createUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
        const contactData = {
            properties: {
                email: 'integration-test-' + Date.now() + '@example.com',
                firstname: 'Integration',
                lastname: 'Test',
                company: 'Test Corp',
                lifecyclestage: 'lead'
            }
        };
        
        console.log('Creating test contact...');
        const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken || apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData)
        });
        
        console.log('Create response status:', createResponse.status);
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.log('⚠️  Create failed:', createResponse.status, createResponse.statusText);
            console.log('Error details:', errorText);
        } else {
            const createData = await createResponse.json();
            console.log('✅ Contact created successfully!');
            console.log('Contact ID:', createData.id);
            console.log('Contact data:', JSON.stringify(createData, null, 2));
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ HubSpot Integration Test Complete!');
        console.log('='.repeat(60));
        console.log('\nSummary:');
        console.log('  • API Authentication: ✅ Working');
        console.log('  • Contact Search: ✅ Working');
        console.log('  • Contact Creation: ' + (createResponse.ok ? '✅ Working' : '⚠️  Check permissions'));
        console.log('\n🎉 HubSpot integration is functional!\n');
        
    } catch (error) {
        console.log('\n❌ Test failed with error:');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

testHubSpot();
