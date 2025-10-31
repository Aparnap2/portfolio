import { AuditState } from "./audit-workflow";

export interface SwimlaneStep {
  id: string;
  name: string;
  swimlane: "Customer" | "Operations" | "Sales" | "Support";
  systems: string[];
  metrics?: {
    volume: number;
    avgTime: number;
    errorRate: number;
  };
}

export interface ProcessBottleneck {
  id: string;
  type: "approval" | "handoff" | "wait" | "data-entry" | "manual";
  description: string;
  location: string; // Which step it's in
  impact: number; // 1-10 scale
  baseline: {
    timeCost: number; // hours saved per month
    errorCost: number;
    volume: number;
  };
}

/**
 * Node 2: Process Mapping
 * Create visual process maps and identify bottlenecks from extracted data
 */
export async function mapProcessFromAnswers(state: AuditState): Promise<Partial<AuditState>> {
  console.log(`[Process Mapping] Building swimlane diagram for session: ${state.sessionId}`);

  const { extracted_data } = state;

  try {
    const processMap = buildSwimlaneDiagram(extracted_data);
    const bottlenecks = identifyBottlenecks(processMap, extracted_data);
    const baselines = calculateBaselines(extracted_data);

    console.log(`[Process Mapping] Created ${processMap.length} swimlane steps`);
    console.log(`[Process Mapping] Identified ${bottlenecks.length} bottlenecks`);

    return {
      processes: {
        map: processMap,
        bottlenecks,
        baselines
      }
    };
  } catch (error) {
    console.error("[Process Mapping] Error:", error);
    // Return default empty state on error
    return {
      processes: {
        map: [],
        bottlenecks: [],
        baselines: { volumes: 0, cycleTime: 0, errors: 0 }
      }
    };
  }
}

// Convert discovery and pain_points answers into structured swimlane diagram
function buildSwimlaneDiagram(data: AuditState['extracted_data']): SwimlaneStep[] {
  const steps: SwimlaneStep[] = [];

  if (!data.discovery || !data.pain_points) {
    return steps;
  }

  const { discovery, pain_points } = data;

  // Customer swimlane
  steps.push({
    id: "customer-discover",
    name: "Lead Discovery",
    swimlane: "Customer",
    systems: ["Marketing Channels", "Website"],
    metrics: { volume: 100, avgTime: 2, errorRate: 0.1 } // placeholder
  });

  steps.push({
    id: "customer-acquire",
    name: "Customer Acquisition",
    swimlane: "Customer",
    systems: parseSystemsFromAnswer(discovery.acquisitionFlow),
    metrics: { volume: 50, avgTime: 8, errorRate: 0.05 }
  });

  steps.push({
    id: "customer-deliver",
    name: "Service Delivery",
    swimlane: "Customer",
    systems: parseSystemsFromAnswer(discovery.deliveryFlow),
    metrics: { volume: 45, avgTime: 24, errorRate: 0.03 }
  });

  // Operations swimlane from pain points
  if (pain_points.manualTasks) {
    steps.push({
      id: "ops-manual",
      name: "Manual Tasks",
      swimlane: "Operations",
      systems: extractSystemsFromText(pain_points.manualTasks),
      metrics: { volume: 200, avgTime: 15, errorRate: 0.2 }
    });
  }

  if (pain_points.bottlenecks) {
    steps.push({
      id: "ops-bottlenecks",
      name: "Process Bottlenecks",
      swimlane: "Operations",
      systems: extractSystemsFromText(pain_points.bottlenecks),
      metrics: { volume: 75, avgTime: 40, errorRate: 0.15 }
    });
  }

  if (pain_points.dataSilos) {
    steps.push({
      id: "ops-silos",
      name: "Data Silos",
      swimlane: "Operations",
      systems: extractSystemsFromText(pain_points.dataSilos),
      metrics: { volume: 300, avgTime: 5, errorRate: 0.1 }
    });
  }

  return steps;
}

// Extract system names from natural language answers
function parseSystemsFromAnswer(answer: string): string[] {
  if (!answer) return [];

  // Simple extraction - in production would use NLP
  const systemPatterns = [
    /salesforce/gi,
    /hubspot/gi,
    /slack/gi,
    /gmail/gi,
    /spreadsheet/gi,
    /excel/gi,
    /crm/gi,
    /erp/gi,
    /website/gi,
    /email/gi,
    /phone/gi,
    /manual/gi,
    /paper/gi
  ];

  const systems = systemPatterns
    .map(pattern => {
      const match = answer.match(pattern);
      return match ? match[0] : null;
    })
    .filter(Boolean)
    .map(s => s!.charAt(0).toUpperCase() + s!.slice(1).toLowerCase());

  // Fallback if no specific systems found
  if (systems.length === 0) {
    return ["Manual Process"];
  }

  return [...new Set(systems)]; // Remove duplicates
}

// Extract systems mentioned in pain points text
function extractSystemsFromText(text: string): string[] {
  return parseSystemsFromAnswer(text);
}

// Identify bottlenecks from the process map and pain points
function identifyBottlenecks(processMap: SwimlaneStep[], data: AuditState['extracted_data']): ProcessBottleneck[] {
  const bottlenecks: ProcessBottleneck[] = [];

  if (!data.pain_points) {
    return bottlenecks;
  }

  const painPoints = data.pain_points;

  // Analyze manual tasks for automation opportunities
  if (painPoints.manualTasks) {
    if (painPoints.manualTasks.toLowerCase().includes('approval') ||
        painPoints.manualTasks.toLowerCase().includes('sign off')) {
      bottlenecks.push({
        id: "manual-approval",
        type: "approval",
        description: "Manual approval processes causing delays",
        location: "Process Flow",
        impact: 8,
        baseline: { timeCost: 60, errorCost: 500, volume: 200 }
      });
    }

    if (painPoints.manualTasks.toLowerCase().includes('data entry') ||
        painPoints.manualTasks.toLowerCase().includes('copy paste')) {
      bottlenecks.push({
        id: "manual-data-entry",
        type: "data-entry",
        description: "Repetitive manual data entry tasks",
        location: "Data Processing",
        impact: 7,
        baseline: { timeCost: 30, errorCost: 300, volume: 500 }
      });
    }
  }

  // Analyze bottlenecks text specifically
  if (painPoints.bottlenecks) {
    if (painPoints.bottlenecks.toLowerCase().includes('approval') ||
        painPoints.bottlenecks.toLowerCase().includes('decision')) {
      bottlenecks.push({
        id: "decision-bottleneck",
        type: "approval",
        description: "Decision bottlenecks in approval workflows",
        location: "Decision Points",
        impact: 9,
        baseline: { timeCost: 120, errorCost: 1000, volume: 50 }
      });
    }

    if (painPoints.bottlenecks.toLowerCase().includes('handoff') ||
        painPoints.bottlenecks.toLowerCase().includes('transition')) {
      bottlenecks.push({
        id: "handoff-delay",
        type: "handoff",
        description: "Inefficient handoffs between teams/processes",
        location: "Team Interfaces",
        impact: 6,
        baseline: { timeCost: 40, errorCost: 200, volume: 150 }
      });
    }
  }

  // Analyze data silos
  if (painPoints.dataSilos) {
    bottlenecks.push({
      id: "data-disconnection",
      type: "data-entry",
      description: "Disconnected data systems requiring manual sync",
      location: "System Integration",
      impact: 8,
      baseline: { timeCost: 25, errorCost: 600, volume: 300 }
    });
  }

  return bottlenecks;
}

// Calculate baseline metrics for ROI calculation
function calculateBaselines(data: AuditState['extracted_data']): { volumes: number; cycleTime: number; errors: number } {
  if (!data.pain_points) {
    return { volumes: 0, cycleTime: 0, errors: 0 };
  }

  // Extract numbers from pain points to calculate baselines
  const allText = `${data.pain_points.manualTasks} ${data.pain_points.bottlenecks} ${data.pain_points.dataSilos}`.toLowerCase();

  // Estimate monthly volumes (rough heuristics)
  let volumes = 100; // base assumption
  const volumeMatch = allText.match(/(\d+)\s*(?:per\s+)?(?:month|week|day)/i);
  if (volumeMatch) {
    const num = parseInt(volumeMatch[1]);
    if (allText.includes('week')) volumes = num * 4;
    else if (allText.includes('day')) volumes = num * 20;
    else volumes = num;
  }

  // Estimate cycle times in minutes per transaction
  let cycleTime = 10;
  if (allText.includes('hour')) cycleTime = 60;
  else if (allText.includes('minute')) cycleTime = 5;
  else if (allText.includes('manual') || allText.includes('approval')) cycleTime = 30;

  // Estimate error rates
  let errors = 0.05; // 5% base rate
  if (allText.includes('high error') || allText.includes('mistakes')) errors = 0.15;
  else if (allText.includes('accurate') || allText.includes('automated')) errors = 0.01;

  return {
    volumes: Math.max(volumes, 10), // minimum baseline
    cycleTime: Math.max(cycleTime, 1),
    errors
  };
}
