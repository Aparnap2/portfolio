const { LeadOrchestrator } = require('../src/orchestrator');

async function testSystem() {
  console.log('Testing Lead Enrichment System...');
  
  const orchestrator = new LeadOrchestrator();
  
  // Test lead data
  const testLead = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@techcorp.com',
    company: 'TechCorp Inc'
  };
  
  try {
    console.log('Processing test lead...');
    const result = await orchestrator.processLead(testLead);
    console.log('Result:', result);
    
    console.log('Fetching lead status...');
    const status = await orchestrator.getLeadStatus(result.leadId);
    console.log('Status:', status);
    
    console.log('Getting dashboard stats...');
    const stats = await orchestrator.getDashboardStats();
    console.log('Stats:', stats);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSystem();
