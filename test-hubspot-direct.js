/**
 * Direct HubSpot Integration Test
 * Tests HubSpot with actual API credentials
 */

// Load .env first
require('dotenv').config();

async function testHubSpot() {
    console.log('\n🔗 Testing HubSpot Integration\n');
    
    // Check environment
    console.log('Environment Check:');
    console.log('  HUBSPOT_API_KEY:', process.env.HUBSPOT_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('  HUBSPOT_ACCESS_TOKEN:', process.env.HUBSPOT_ACCESS_TOKEN ? '✅ Set' : '❌ Not set');
    
    if (!process.env.HUBSPOT_API_KEY && !process.env.HUBSPOT_ACCESS_TOKEN) {
        console.log('\n❌ No HubSpot credentials found!\n');
        return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Testing HubSpot Contact API');
    console.log('='.repeat(60) + '\n');
    
    try {
        // Import HubSpot integration
        const { createOrUpdateHubSpotContact } = require('./lib/integrations/hubspot');
        
        const testContact = {
            email: 'integration-test@example.com',
            firstname: 'Integration',
            lastname: 'Test',
            company: 'Test Corporation',
            lifecyclestage: 'lead',
            hs_lead_status: 'NEW'
        };
        
        console.log('Sending test contact to HubSpot...');
        console.log('Contact data:', JSON.stringify(testContact, null, 2));
        
        const result = await createOrUpdateHubSpotContact(testContact);
        
        console.log('\n' + '='.repeat(60));
        console.log('Result:');
        console.log('='.repeat(60));
        
        if (result.success) {
            console.log('✅ SUCCESS!');
            console.log('   Contact ID:', result.contactId);
            console.log('   Action:', result.action || 'created/updated');
            console.log('\n🎉 HubSpot integration is working!');
        } else {
            console.log('❌ FAILED');
            console.log('   Error:', result.error);
            console.log('\n⚠️  Check your HubSpot API credentials');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('Test Complete');
        console.log('='.repeat(60) + '\n');
        
    } catch (error) {
        console.log('\n❌ Test Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

testHubSpot();
