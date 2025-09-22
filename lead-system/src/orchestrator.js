const { StateGraph, END } = require('@langchain/langgraph');
const { EnrichmentAgent } = require('./agents/enrichment');
const { ScoringAgent } = require('./agents/scoring');
const { RoutingAgent } = require('./agents/routing');
const { DatabaseManager } = require('./database');

class LeadOrchestrator {
  constructor() {
    this.db = new DatabaseManager();
    this.enrichmentAgent = new EnrichmentAgent();
    this.scoringAgent = new ScoringAgent();
    this.routingAgent = new RoutingAgent();
    this.graph = this.buildGraph();
  }

  buildGraph() {
    const workflow = new StateGraph({
      channels: {
        lead: { value: null },
        enrichedData: { value: null },
        score: { value: null },
        assignment: { value: null },
        status: { value: 'processing' }
      }
    });

    workflow.addNode('enrich', this.enrichmentAgent.process.bind(this.enrichmentAgent));
    workflow.addNode('scoring', this.scoringAgent.process.bind(this.scoringAgent));
    workflow.addNode('route', this.routingAgent.process.bind(this.routingAgent));

    workflow.addEdge('enrich', 'scoring');
    workflow.addEdge('scoring', 'route');
    workflow.addEdge('route', END);

    workflow.setEntryPoint('enrich');
    return workflow.compile();
  }

  async processLead(leadData) {
    const leadId = await this.db.createLead(leadData);
    
    const initialState = {
      lead: { ...leadData, id: leadId },
      status: 'processing'
    };

    const result = await this.graph.invoke(initialState);
    
    await this.db.updateLead(leadId, {
      enrichedData: result.enrichedData,
      score: result.score,
      assignment: result.assignment,
      status: 'completed'
    });

    return { leadId, status: 'completed' };
  }

  async getLeadStatus(leadId) {
    return await this.db.getLead(leadId);
  }

  async getDashboardStats() {
    return await this.db.getStats();
  }
}

module.exports = { LeadOrchestrator };
