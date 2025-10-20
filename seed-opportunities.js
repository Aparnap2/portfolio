// Seed script to add opportunity templates to the database
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

const opportunityTemplates = [
  {
    name: "Automated Lead Scoring",
    slug: "automated-lead-scoring",
    category: "lead_gen",
    difficulty: "medium",
    shortDescription: "AI-powered lead qualification and scoring system",
    fullDescription: "Automatically score and qualify leads based on behavior, demographics, and engagement patterns using machine learning algorithms.",
    problemItSolves: "Manual lead qualification takes hours and is inconsistent across team members",
    avgDevCostMin: 6000,
    avgDevCostMax: 10000,
    avgTimeSavedHrsMonth: 40,
    avgErrorReduction: 25,
    avgImplementationWeeks: 4,
    complexity: "moderate",
    matchingRules: {
      keywords: ["lead", "qualify", "sales", "prospect", "scoring"],
      systems: ["hubspot", "salesforce", "pipedrive"],
      painTypes: ["manual_qualification", "inconsistent_scoring", "lead_bottleneck"]
    },
    techStack: ["LangGraph", "HubSpot API", "Machine Learning", "Redis"],
    integrationsRequired: ["hubspot", "email"],
    exampleWorkflow: "Lead submits form → AI analyzes data → Scores lead → Routes to appropriate sales rep → Updates CRM",
    realWorldExample: "E-commerce company reduced lead qualification time from 2 hours to 5 minutes per lead"
  },
  {
    name: "Inventory Sync Automation",
    slug: "inventory-sync-automation", 
    category: "ops_automation",
    difficulty: "low",
    shortDescription: "Real-time inventory synchronization across platforms",
    fullDescription: "Automatically sync inventory levels between your e-commerce platform, warehouse management system, and accounting software.",
    problemItSolves: "Manual inventory updates lead to overselling and stock discrepancies",
    avgDevCostMin: 4000,
    avgDevCostMax: 7000,
    avgTimeSavedHrsMonth: 30,
    avgErrorReduction: 90,
    avgImplementationWeeks: 3,
    complexity: "simple",
    matchingRules: {
      keywords: ["inventory", "stock", "sync", "warehouse", "overselling"],
      systems: ["shopify", "woocommerce", "quickbooks", "netsuite"],
      painTypes: ["manual_updates", "stock_discrepancies", "overselling"]
    },
    techStack: ["API Integrations", "Webhooks", "Database Triggers"],
    integrationsRequired: ["shopify", "quickbooks", "warehouse_system"],
    exampleWorkflow: "Sale occurs → Inventory decremented → All systems updated → Low stock alerts sent",
    realWorldExample: "Retail company eliminated 95% of overselling incidents and saved 30 hours/month"
  },
  {
    name: "Customer Support Chatbot",
    slug: "customer-support-chatbot",
    category: "support", 
    difficulty: "medium",
    shortDescription: "AI chatbot for first-line customer support",
    fullDescription: "Intelligent chatbot that handles common customer inquiries, escalates complex issues, and integrates with your help desk system.",
    problemItSolves: "Support team overwhelmed with repetitive questions and slow response times",
    avgDevCostMin: 8000,
    avgDevCostMax: 12000,
    avgTimeSavedHrsMonth: 50,
    avgErrorReduction: 15,
    avgImplementationWeeks: 5,
    complexity: "moderate",
    matchingRules: {
      keywords: ["support", "customer", "tickets", "response", "chatbot"],
      systems: ["zendesk", "intercom", "freshdesk", "helpscout"],
      painTypes: ["slow_response", "repetitive_questions", "support_overload"]
    },
    techStack: ["LangChain", "OpenAI", "Zendesk API", "WebSocket"],
    integrationsRequired: ["zendesk", "website", "knowledge_base"],
    exampleWorkflow: "Customer asks question → AI analyzes intent → Provides answer or escalates → Updates ticket system",
    realWorldExample: "SaaS company reduced first response time from 4 hours to 30 seconds"
  },
  {
    name: "Automated Reporting Dashboard",
    slug: "automated-reporting-dashboard",
    category: "analytics",
    difficulty: "medium", 
    shortDescription: "Real-time business intelligence dashboard",
    fullDescription: "Automated dashboard that pulls data from multiple sources and generates executive reports with insights and recommendations.",
    problemItSolves: "Manual report creation takes days and data is often outdated",
    avgDevCostMin: 7000,
    avgDevCostMax: 11000,
    avgTimeSavedHrsMonth: 35,
    avgErrorReduction: 80,
    avgImplementationWeeks: 4,
    complexity: "moderate",
    matchingRules: {
      keywords: ["reporting", "dashboard", "analytics", "kpi", "metrics"],
      systems: ["google_analytics", "hubspot", "quickbooks", "shopify"],
      painTypes: ["manual_reporting", "outdated_data", "scattered_metrics"]
    },
    techStack: ["React", "D3.js", "API Integrations", "PostgreSQL"],
    integrationsRequired: ["google_analytics", "hubspot", "quickbooks"],
    exampleWorkflow: "Data collected → Processed and analyzed → Dashboard updated → Alerts sent for anomalies",
    realWorldExample: "Marketing agency reduced report creation time from 8 hours to 5 minutes"
  },
  {
    name: "Multi-Platform Integration Hub",
    slug: "multi-platform-integration-hub",
    category: "integration",
    difficulty: "high",
    shortDescription: "Central hub connecting all business systems",
    fullDescription: "Comprehensive integration platform that connects CRM, accounting, e-commerce, and marketing tools with intelligent data flow management.",
    problemItSolves: "Data silos and manual data entry between disconnected systems",
    avgDevCostMin: 12000,
    avgDevCostMax: 18000,
    avgTimeSavedHrsMonth: 60,
    avgErrorReduction: 95,
    avgImplementationWeeks: 8,
    complexity: "complex",
    matchingRules: {
      keywords: ["integration", "sync", "connect", "silos", "platforms"],
      systems: ["hubspot", "quickbooks", "shopify", "mailchimp", "slack"],
      painTypes: ["data_silos", "manual_sync", "disconnected_systems"]
    },
    techStack: ["Node.js", "GraphQL", "Message Queues", "API Gateway"],
    integrationsRequired: ["hubspot", "quickbooks", "shopify", "mailchimp"],
    exampleWorkflow: "Data changes in any system → Hub processes → Updates all connected systems → Logs transactions",
    realWorldExample: "E-commerce business eliminated 90% of manual data entry and improved data accuracy by 95%"
  }
];

async function seedOpportunities() {
  console.log('🌱 Seeding opportunity templates...');
  
  try {
    // Clear existing templates
    await db.opportunityTemplate.deleteMany({});
    console.log('   Cleared existing templates');
    
    // Insert new templates
    for (const template of opportunityTemplates) {
      await db.opportunityTemplate.create({
        data: template
      });
      console.log(`   ✅ Created: ${template.name}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${opportunityTemplates.length} opportunity templates!`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await db.$disconnect();
  }
}

seedOpportunities();