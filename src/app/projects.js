// Updated project showcase format
export const projects = [
  {
    id: "chatbot-builder-saas",
    title: "Multi-Tenant Chatbot Builder SaaS",
    tagline: "Enterprise-Grade AI Chatbot Platform",
    problem: "Businesses struggle to build custom AI chatbots without deep technical expertise or expensive platforms.",
    solution: "Built a comprehensive SaaS platform with GraphQL APIs, multi-tenancy, RAG capabilities, and seamless integrations.",
    impact: "Reduced customer support load by 45%, increased user engagement by 25%, and enabled rapid chatbot deployment.",
    businessValue: "Saves businesses 15+ hours weekly on customer support while improving response quality",
    stack: ["Next.js", "NestJS", "GraphQL", "Prisma", "Qdrant", "OpenRouter"],
    metrics: [
      { value: "45%", label: "Support ticket reduction" },
      { value: "25%", label: "Engagement increase" },
      { value: "70%", label: "Faster deployment" }
    ],
    clientType: "SaaS companies, customer service teams",
    pricingTier: "₹40,000-₹1,10,000"
  },

  {
    id: "ai-virtual-office",
    title: "Multi-Agent Virtual Office",
    tagline: "AI Agents That Work Together",
    problem: "Complex business workflows require multiple manual steps and coordination between different tools and people.",
    solution: "Developed a platform where specialized AI agents communicate and collaborate to complete multi-step business processes autonomously.",
    impact: "Streamlined business operations by enabling autonomous task completion across different departments and tools.",
    businessValue: "Eliminates workflow bottlenecks and reduces manual coordination time by 60%",
    stack: ["Next.js", "Node.js", "Python", "LangChain", "Multi-Agent Systems"],
    clientType: "Growing startups, operations teams",
    pricingTier: "₹75,000-₹2,00,000"
  },

  {
    id: "knowledge-base-chatbot",
    title: "Privacy-First Knowledge Base Chatbot",
    tagline: "Secure, On-Premise AI Assistant",
    problem: "Organizations need secure, internal knowledge management without sending sensitive data to external AI services.",
    solution: "Built a self-hosted, on-premise chatbot that processes internal documents and provides instant knowledge access while maintaining complete data privacy.",
    impact: "Reduced information search time by 12 minutes per employee per day and cut internal queries by 45%.",
    businessValue: "Saves 8+ hours per employee monthly while keeping sensitive data secure",
    stack: ["Python", "React", "Vector DB", "LangChain", "Docker"],
    clientType: "Security-conscious businesses, internal teams",
    pricingTier: "₹30,000-₹75,000"
  },

  {
    id: "personal-assistant-app",
    title: "AI-Powered Personal Assistant",
    tagline: "Context-Aware Mobile Productivity",
    problem: "Busy professionals need personalized AI assistance that understands their unique context, preferences, and workflow patterns.",
    solution: "Created a React Native app with graph-based memory that learns user preferences and integrates with Notion and social platforms for intelligent content generation.",
    impact: "Enables context-aware content creation and intelligent daily planning based on individual work patterns.",
    businessValue: "Saves 10+ hours weekly on content creation and task management",
    stack: ["React Native", "Python", "LangChain", "Graph DB"],
    clientType: "Content creators, solopreneurs, consultants",
    pricingTier: "₹25,000-₹60,000"
  }
];
