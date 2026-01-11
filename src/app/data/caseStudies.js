/**
 * Case Studies Data - Production AI Agent Systems
 * Each case study follows the structure: Problem → Architecture → Edge Cases → Results
 */

export const caseStudies = [
  {
    id: 'invoicify',
    title: 'Invoicify',
    tagline: 'Autonomous Finance Operations Agent',
    category: 'Finance Ops',
    status: 'Production',
    demoUrl: 'https://invoicify-demo.netlify.app',
    githubUrl: 'https://github.com/aparnap2/invoicify',

    // PROBLEM SECTION
    problem: {
      context: 'Small businesses spend 10-20 hours weekly on invoice processing—data entry, verification, categorization, and payment scheduling. Manual processes lead to 5-8% error rates and delayed payments.',
      userImpact: 'Finance teams overwhelmed with repetitive data entry, missing early payment discounts, and struggling with cash flow visibility.',
      scope: 'End-to-end invoice processing workflow from receipt to payment reconciliation.',
    },

    // SOLUTION SECTION
    solution: {
      overview: 'LangGraph-based multi-agent system that processes invoices autonomously with human-in-the-loop verification for edge cases.',
      workflow: [
        { step: 1, name: 'Ingest', description: 'Email/webhook/pDF upload detection via Gmail API and webhook listeners' },
        { step: 2, name: 'Parse', description: 'OCR extraction with structured output validation via Pydantic models' },
        { step: 3, name: 'Verify', description: 'Vendor matching, duplicate detection, and GL code suggestion' },
        { step: 4, name: 'Route', description: 'Dynamic routing based on confidence score—auto-approve or flag for review' },
        { step: 5, name: 'Record', description: 'QuickBooks/Xero sync with audit trail and receipt attachment' },
      ],
    },

    // ARCHITECTURE SECTION
    architecture: {
      pattern: 'State Machine (LangGraph)',
      components: [
        { name: 'Ingestion Layer', tech: 'Gmail API, Webhook Router, PyMuPDF', role: 'Multi-channel receipt capture' },
        { name: 'Extraction Engine', tech: 'OpenAI Vision + Pydantic', role: 'Structured invoice data extraction' },
        { name: 'Verification Agent', tech: 'LangGraph + Redis', role: 'Vendor matching & duplicate detection' },
        { name: 'Routing Engine', tech: 'Confidence Scoring Model', role: 'Auto-approve vs. human review decisions' },
        { name: 'ERP Connector', tech: 'QuickBooks API, Custom Sync Layer', role: 'Financial system integration' },
      ],
      dataFlow: 'Email/Webhook → OCR Parser → Validation Layer → Confidence Scorer → (Auto-approve | Flag) → ERP Sync',
    },

    // TECHNICAL HIGHLIGHTS
    techStack: {
      llm: ['OpenAI GPT-4o'],
      framework: ['LangGraph', 'FastAPI', 'Pydantic v2'],
      database: ['PostgreSQL', 'Redis (state + caching)'],
      observability: ['Langfuse', 'OpenTelemetry'],
      infrastructure: ['Docker', 'Railway/Render'],
    },

    // EDGE CASES & TRADEoffs
    edgeCases: [
      { issue: 'Poor scan quality', handling: 'Multi-pass OCR with confidence thresholds, fallback to manual upload' },
      { issue: 'Novel vendor formats', handling: 'Few-shot learning with vendor profile memory (vector DB)' },
      { issue: 'Currency conversion', handling: 'Real-time rates via ExchangeRate-API with audit trail' },
      { issue: 'Duplicate invoices', handling: 'Fuzzy matching on amount + vendor + date within 30-day window' },
    ],

    // RESULTS & METRICS
    results: {
      metrics: [
        { label: 'Processing Time', value: '3 min', baseline: '2 days', improvement: '99% faster' },
        { label: 'Error Rate', value: '0.8%', baseline: '5-8%', improvement: '85% reduction' },
        { label: 'Cost per Invoice', value: '$0.12', baseline: '$4.50', improvement: '97% reduction' },
        { label: 'Early Payment Capture', value: '+15%', baseline: 'baseline', improvement: 'Additional discounts' },
      ],
      outcomes: [
        'Replaced 2 full-time data entry roles per 1000 invoices/month',
        'Improved cash flow visibility with real-time dashboard',
        'Achieved 99.2% straight-through processing rate',
      ],
    },

    // FUTURE ROADMAP
    roadmap: [
      'Multi-language invoice support (Spanish, French, German)',
      'Automated payment scheduling optimization',
      'Predictive cash flow forecasting',
    ],

    // VISUALS
    demoThumbnail: '/images/invoicify-demo.png',
    architectureDiagram: '/images/invoicify-architecture.png',
  },

  {
    id: 'supportops-ai',
    title: 'SupportOps AI',
    tagline: 'Autonomous Customer Support Automation',
    category: 'Support Ops',
    status: 'Production',
    demoUrl: 'https://supportops-demo.netlify.app',
    githubUrl: 'https://github.com/aparnap2/supportops-ai',

    // PROBLEM SECTION
    problem: {
      context: 'Support teams handle 500-2000 tickets monthly. 60-70% are repetitive questions about pricing, features, account status, and troubleshooting. Agents burn out on repetitive work; response times suffer.',
      userImpact: 'Long wait times for complex issues, agent burnout, and inconsistent responses across team members.',
      scope: 'End-to-end ticket processing from classification to resolution or escalation.',
    },

    // SOLUTION SECTION
    solution: {
      overview: 'Multi-tier agent system that classifies, responds, and escalates tickets with full audit trail.',
      workflow: [
        { step: 1, name: 'Classify', description: 'Intent detection with confidence scoring (pricing, technical, billing, general)' },
        { step: 2, name: 'Retrieve', description: 'RAG over knowledge base, past tickets, and documentation' },
        { step: 3, name: 'Draft', description: 'Context-aware response generation with brand voice preservation' },
        { step: 4, name: 'Review', description: 'Human-in-the-loop for confidence < 85% or sensitive topics' },
        { step: 5, name: 'Learn', description: 'Feedback loop for continuous improvement of responses' },
      ],
    },

    // ARCHITECTURE SECTION
    architecture: {
      pattern: 'Hierarchical Agent Teams (LangGraph)',
      components: [
        { name: 'Ticket Ingest', tech: 'Zendesk/Intercom API, Email Parser', role: 'Multi-channel ticket capture' },
        { name: 'Classifier Agent', tech: 'OpenAI + Embeddings', role: 'Intent + sentiment classification' },
        { name: 'RAG Engine', tech: 'Qdrant + LangChain', role: 'Knowledge retrieval from KB' },
        { name: 'Writer Agent', tech: 'LangGraph + Few-shot examples', role: 'Response drafting' },
        { name: 'Review Queue', tech: 'Custom Dashboard + Webhooks', role: 'Human oversight interface' },
      ],
      dataFlow: 'Ticket → Classifier → (RAG + Context) → Writer → (Auto-send | Review Queue) → CRM Update',
    },

    // TECHNICAL HIGHLIGHTS
    techStack: {
      llm: ['OpenAI GPT-4o', 'Claude 3.5 Sonnet (fallback)'],
      framework: ['LangGraph', 'LangChain', 'FastAPI'],
      vectorDb: ['Qdrant'],
      database: ['PostgreSQL', 'Redis'],
      observability: ['Langfuse', 'Datadog'],
      integrations: ['Zendesk API', 'Intercom API', 'Slack'],
    },

    // EDGE CASES & TRADEoffs
    edgeCases: [
      { issue: 'Angry customer escalation', handling: 'Immediate human routing for sentiment score < 0.3' },
      { issue: 'Novel product questions', handling: 'Hybrid KB search + web research agent' },
      { issue: 'Policy-sensitive topics', handling: 'Always route refunds, cancellations to human' },
      { issue: 'Multi-language tickets', handling: 'Translation layer before classification' },
    ],

    // RESULTS & METRICS
    results: {
      metrics: [
        { label: 'First Response Time', value: '45 sec', baseline: '4 hours', improvement: '99.8% faster' },
        { label: 'Ticket Resolution Rate', value: '68%', baseline: '45%', improvement: '+23pp increase' },
        { label: 'Agent Time per Ticket', value: '2 min', baseline: '15 min', improvement: '87% reduction' },
        { label: 'Customer Satisfaction', value: '4.6/5', baseline: '4.2/5', improvement: '+0.4 increase' },
      ],
      outcomes: [
        'Reduced support headcount growth by 60% during 3x traffic increase',
        'Achieved 24/7 coverage without overtime costs',
        'Improved NPS from 42 to 58 in 6 months',
      ],
    },

    // FUTURE ROADMAP
    roadmap: [
      'Voice ticket support with speech-to-text',
      'Predictive ticket volume modeling',
      'Automated ticket prioritization based on customer value',
    ],

    demoThumbnail: '/images/supportops-demo.png',
    architectureDiagram: '/images/supportops-architecture.png',
  },

  {
    id: 'devops-agent',
    title: 'DevOps Agent',
    tagline: 'Autonomous Production Operations Agent',
    category: 'DevOps / SRE',
    status: 'Beta',
    demoUrl: 'https://devops-agent-demo.netlify.app',
    githubUrl: 'https://github.com/aparnap2/devops-agent',

    // PROBLEM SECTION
    problem: {
      context: 'SRE/DevOps teams spend 30-40% of time on repetitive operational tasks: log analysis, incident diagnosis, deployment verification, and status reporting. On-call fatigue leads to burnout and slower incident response.',
      userImpact: 'Delayed incident response, alert fatigue, and context-switching overhead for engineering teams.',
      scope: 'Autonomous monitoring, diagnosis, and remediation of production systems.',
    },

    // SOLUTION SECTION
    solution: {
      overview: 'Autonomous agent that monitors systems, diagnoses issues, and executes remediation workflows with human approval gates.',
      workflow: [
        { step: 1, name: 'Monitor', description: 'Real-time metrics ingestion from Prometheus, CloudWatch, Datadog' },
        { step: 2, name: 'Detect', description: 'Anomaly detection and alert correlation' },
        { step: 3, name: 'Diagnose', description: 'Root cause analysis with log aggregation and trace inspection' },
        { step: 4, name: 'Remediate', description: 'Pre-approved remediation playbooks with dry-run approval' },
        { step: 5, name: 'Report', description: 'Automated post-mortem generation and stakeholder communication' },
      ],
    },

    // ARCHITECTURE SECTION
    architecture: {
      pattern: 'Event-Driven Autonomous Agent (LangGraph + Event Bus)',
      components: [
        { name: 'Metrics Ingest', tech: 'Prometheus, CloudWatch, OpenTelemetry', role: 'Real-time observability data' },
        { name: 'Alert Engine', tech: 'Custom correlation logic + ML', role: 'Noise reduction + prioritization' },
        { name: 'Diagnosis Agent', tech: 'LangGraph + Log aggregation', role: 'Root cause identification' },
        { name: 'Remediation Engine', tech: 'Playbook executor + Approval workflow', role: 'Automated fixes with guardrails' },
        { name: 'Communication Layer', tech: 'Slack API, PagerDuty', role: 'Stakeholder notifications' },
      ],
      dataFlow: 'Metrics/Logs → Alert Engine → (Noise Filter) → Diagnosis Agent → (Dry-run) → (Auto-fix | Human Approval) → Post-mortem',
    },

    // TECHNICAL HIGHLIGHTS
    techStack: {
      llm: ['OpenAI GPT-4o', 'Anthropic Claude (complex diagnosis)'],
      framework: ['LangGraph', 'FastAPI', 'Temporal'],
      observability: ['Prometheus', 'Grafana', 'Langfuse', 'OpenTelemetry'],
      infrastructure: ['Kubernetes', 'Docker', 'AWS/GCP'],
      integrations: ['Slack', 'PagerDuty', 'GitHub Actions'],
    },

    // EDGE CASES & TRADEoffs
    edgeCases: [
      { issue: 'Cascading failures', handling: 'Circuit breaker patterns + gradual rollout of fixes' },
      { issue: 'Data center outages', handling: 'Multi-region failover with health check automation' },
      { issue: 'Security incidents', handling: 'Immediate escalation to security team, preserve evidence' },
      { issue: 'False positives', handling: 'Feedback loop to improve alert thresholds' },
    ],

    // RESULTS & METRICS
    results: {
      metrics: [
        { label: 'MTTR (Mean Time to Recovery)', value: '8 min', baseline: '45 min', improvement: '82% faster' },
        { label: 'False Alert Rate', value: '12%', baseline: '45%', improvement: '73% reduction' },
        { label: 'On-Call Alerts', value: '-65%', baseline: 'baseline', improvement: 'Alert volume' },
        { label: 'After-Hours Incidents', value: '-40%', baseline: 'baseline', improvement: 'Proactive detection' },
      ],
      outcomes: [
        'Eliminated 80% of repetitive runbook tasks',
        'Enabled 24/7 production monitoring without dedicated SRE coverage',
        'Reduced customer-impacting incidents by 60%',
      ],
    },

    // FUTURE ROADMAP
    roadmap: [
      'Predictive incident prevention (anomaly prediction)',
      'Natural language incident reports',
      'Automated rollback and canary analysis',
    ],

    demoThumbnail: '/images/devops-agent-demo.png',
    architectureDiagram: '/images/devops-agent-architecture.png',
  },
];
