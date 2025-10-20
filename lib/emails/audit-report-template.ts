/**
 * Generate HTML email template for HubSpot
 * This uses HubSpot's free email tools (no SendGrid/Resend needed)
 */
export function generateAuditReportEmailHTML({
  name,
  company,
  sessionId,
  opportunities,
  painScore,
  estimatedValue,
  reportUrl,
  slackConnectUrl,
}: {
  name: string;
  company?: string;
  sessionId: string;
  opportunities: Array<{
    name: string;
    devCostMid: number;
    monthlySavings: number;
    roi12Months: number;
  }>;
  painScore: number;
  estimatedValue: number;
  reportUrl: string;
  slackConnectUrl: string;
}): string {
  const totalDevCost = opportunities.reduce((sum, o) => sum + o.devCostMid, 0);
  const totalMonthlySavings = opportunities.reduce((sum, o) => sum + o.monthlySavings, 0);
  const breakevenMonths = (totalDevCost / totalMonthlySavings).toFixed(1);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AI Opportunity Assessment</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #0a0a0a;
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding-bottom: 40px;
      border-bottom: 1px solid #333;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #a855f7;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 14px;
      color: #999;
    }
    .greeting {
      font-size: 18px;
      margin: 30px 0 20px;
      color: #fff;
    }
    .intro {
      font-size: 16px;
      line-height: 1.6;
      color: #ccc;
      margin-bottom: 30px;
    }
    .metrics-grid {
      display: table;
      width: 100%;
      margin: 30px 0;
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
    }
    .metric-row {
      display: table-row;
    }
    .metric-cell {
      display: table-cell;
      padding: 20px;
      border-bottom: 1px solid #333;
    }
    .metric-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }
    .metric-value.highlight {
      color: #10b981;
    }
    .metric-value.warning {
      color: #f59e0b;
    }
    .opportunities {
      margin: 40px 0;
    }
    .opportunities-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #fff;
    }
    .opportunity-card {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 16px;
      border-left: 4px solid #a855f7;
    }
    .opportunity-title {
      font-size: 16px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 12px;
    }
    .opportunity-stats {
      display: flex;
      gap: 20px;
      font-size: 14px;
    }
    .stat {
      color: #999;
    }
    .stat-value {
      color: #10b981;
      font-weight: 600;
    }
    .roi-summary {
      background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%);
      border-radius: 12px;
      padding: 30px;
      margin: 40px 0;
      text-align: center;
    }
    .roi-title {
      font-size: 18px;
      margin-bottom: 20px;
      color: #fff;
    }
    .roi-grid {
      display: flex;
      justify-content: space-around;
      gap: 20px;
    }
    .roi-item {
      flex: 1;
    }
    .roi-label {
      font-size: 12px;
      color: #c7d2fe;
      margin-bottom: 5px;
    }
    .roi-value {
      font-size: 28px;
      font-weight: bold;
      color: #fff;
    }
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    .cta-button {
      display: inline-block;
      background: #a855f7;
      color: #fff;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 10px;
    }
    .cta-button.secondary {
      background: transparent;
      border: 2px solid #a855f7;
      color: #a855f7;
    }
    .slack-connect {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin: 30px 0;
      text-align: center;
    }
    .slack-title {
      font-size: 16px;
      font-weight: bold;
      color: #0a0a0a;
      margin-bottom: 10px;
    }
    .slack-description {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    .slack-button {
      display: inline-block;
      background: #611f69;
      color: #fff;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #333;
      font-size: 12px;
      color: #666;
    }
    .footer-note {
      margin-top: 15px;
      font-size: 14px;
      color: #999;
    }
    @media only screen and (max-width: 600px) {
      .metrics-grid {
        display: block;
      }
      .metric-row {
        display: block;
      }
      .metric-cell {
        display: block;
        border-bottom: 1px solid #333;
      }
      .roi-grid {
        flex-direction: column;
      }
      .opportunity-stats {
        flex-direction: column;
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">Aparna Pradhan</div>
      <div class="subtitle">Technical Execution Partner for AI Agencies</div>
    </div>

    <!-- Greeting -->
    <div class="greeting">
      Hi ${name}${company ? ` from ${company}` : ""},
    </div>
    
    <!-- Intro -->
    <div class="intro">
      Thanks for completing the AI Opportunity Assessment! Based on your responses, I've identified <strong>${opportunities.length} automation opportunities</strong> that could save significant time and cost.
    </div>
    
    <!-- Current State Metrics -->
    <div class="metrics-grid">
      <div class="metric-row">
        <div class="metric-cell">
          <div class="metric-label">Pain Score</div>
          <div class="metric-value ${painScore >= 80 ? "warning" : ""}">${painScore}/100</div>
        </div>
        <div class="metric-cell">
          <div class="metric-label">Estimated Value</div>
          <div class="metric-value">$${estimatedValue.toLocaleString()}</div>
        </div>
      </div>
    </div>
    
    <!-- Top 3 Opportunities -->
    <div class="opportunities">
      <div class="opportunities-title">🎯 Top ${opportunities.length} Quick Wins</div>
      
      ${opportunities.map((opp, i) => `
        <div class="opportunity-card">
          <div class="opportunity-title">${i + 1}. ${opp.name}</div>
          <div class="opportunity-stats">
            <div class="stat">
              Implementation: <span class="stat-value">$${opp.devCostMid.toLocaleString()}</span>
            </div>
            <div class="stat">
              Monthly Savings: <span class="stat-value">$${opp.monthlySavings.toLocaleString()}</span>
            </div>
            <div class="stat">
              12-Month ROI: <span class="stat-value">${opp.roi12Months}%</span>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
    
    <!-- ROI Summary -->
    <div class="roi-summary">
      <div class="roi-title">💰 Total Potential ROI</div>
      <div class="roi-grid">
        <div class="roi-item">
          <div class="roi-label">Implementation Cost</div>
          <div class="roi-value">$${totalDevCost.toLocaleString()}</div>
        </div>
        <div class="roi-item">
          <div class="roi-label">Monthly Savings</div>
          <div class="roi-value">$${totalMonthlySavings.toLocaleString()}</div>
        </div>
        <div class="roi-item">
          <div class="roi-label">Break-even</div>
          <div class="roi-value">${breakevenMonths} mo</div>
        </div>
      </div>
    </div>
    
    <!-- CTA Buttons -->
    <div class="cta-section">
      <a href="${reportUrl}" class="cta-button">
        📊 View Full Report
      </a>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/contact?session=${sessionId}" class="cta-button secondary">
        💬 Book Implementation Call
      </a>
    </div>
    
    <!-- Slack Connect Section -->
    <div class="slack-connect">
      <div class="slack-title">💬 Let's Discuss on Slack</div>
      <div class="slack-description">
        Connect with me directly on Slack to discuss your audit results and next steps. Faster than email!
      </div>
      <a href="${slackConnectUrl}" class="slack-button">
        Connect on Slack
      </a>
    </div>
    
    <!-- Footer Note -->
    <div class="footer-note">
      <strong>Next Steps:</strong><br>
      1. Review the full report (includes 90-day implementation roadmap)<br>
      2. Book a call to discuss which opportunity to tackle first<br>
      3. I'll build it for you—you own 100% of the code
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>You're receiving this because you completed an AI audit on aparnapradhanportfolio.com</p>
      <p>Aparna Pradhan | Technical Execution Partner for AI Agencies</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #a855f7;">Portfolio</a> · 
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/work" style="color: #a855f7;">Case Studies</a> · 
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/contact" style="color: #a855f7;">Contact</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text version (for HubSpot fallback)
 */
export function generateAuditReportEmailText({
  name,
  company,
  sessionId,
  opportunities,
  painScore,
  estimatedValue,
  reportUrl,
  slackConnectUrl,
}: {
  name: string;
  company?: string;
  sessionId: string;
  opportunities: Array<{
    name: string;
    devCostMid: number;
    monthlySavings: number;
    roi12Months: number;
  }>;
  painScore: number;
  estimatedValue: number;
  reportUrl: string;
  slackConnectUrl: string;
}): string {
  const totalDevCost = opportunities.reduce((sum, o) => sum + o.devCostMid, 0);
  const totalMonthlySavings = opportunities.reduce((sum, o) => sum + o.monthlySavings, 0);
  const breakevenMonths = (totalDevCost / totalMonthlySavings).toFixed(1);

  return `
Hi ${name}${company ? ` from ${company}` : ""},

Thanks for completing the AI Opportunity Assessment! Based on your responses, I've identified ${opportunities.length} automation opportunities that could save significant time and cost.

CURRENT STATE
-------------
Pain Score: ${painScore}/100
Estimated Value: $${estimatedValue.toLocaleString()}

TOP ${opportunities.length} QUICK WINS
${opportunities.map((opp, i) => `

${i + 1}. ${opp.name}
   Implementation: $${opp.devCostMid.toLocaleString()}
   Monthly Savings: $${opp.monthlySavings.toLocaleString()}/month
   12-Month ROI: ${opp.roi12Months}%
`).join("\n")}

TOTAL POTENTIAL ROI
-------------------
Implementation Cost: $${totalDevCost.toLocaleString()}
Monthly Savings: $${totalMonthlySavings.toLocaleString()}/month
Break-even: ${breakevenMonths} months

NEXT STEPS
----------
1. View Full Report: ${reportUrl}
2. Book Implementation Call: ${process.env.NEXT_PUBLIC_BASE_URL}/contact?session=${sessionId}
3. Connect on Slack: ${slackConnectUrl}

LET'S DISCUSS ON SLACK
-----------------------
Connect with me directly on Slack to discuss your audit results and next steps. It's faster than email!
${slackConnectUrl}

Best,
Aparna Pradhan
Technical Execution Partner for AI Agencies

---
You're receiving this because you completed an AI audit on aparnapradhanportfolio.com
  `.trim();
}