import axios from "axios";
import * as Sentry from "@sentry/nextjs";

const HUBSPOT_API_BASE = "https://api.hubapi.com";

interface HubSpotEmailData {
  sessionId: string;
  name: string;
  email: string;
  company?: string;
  painScore: number;
  estimatedValue: number;
  opportunities: Array<{
    name: string;
    monthlySavings: number;
    implementationWeeks: number;
    roi12Months: number;
  }>;
  roadmap: {
    totalDuration: string;
    phases: Array<{
      name: string;
      duration: string;
    }>;
  };
  slackChannelUrl?: string;
}

/**
 * Send audit report email via HubSpot (Free Tier)
 * Uses HubSpot's transactional email API
 */
export async function sendAuditReportEmail(data: HubSpotEmailData) {
  try {
    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!apiKey) {
      console.warn("[HubSpot Email] Access token not configured");
      return { success: false, error: "Access token not configured" };
    }

    // First, ensure contact exists in HubSpot
    const contactResult = await createOrUpdateContact({
      email: data.email,
      firstname: data.name,
      company: data.company,
    });

    if (!contactResult.success) {
      throw new Error("Failed to create/update contact");
    }

    // Create email content
    const emailContent = generateEmailHTML(data);
    
    // Send email using HubSpot's single send API
    const emailData = {
      emailId: process.env.HUBSPOT_EMAIL_TEMPLATE_ID || "audit-report-template",
      message: {
        to: data.email,
        from: process.env.HUBSPOT_FROM_EMAIL || "aparna@aparnapradhan.com",
        subject: `Your AI Opportunity Assessment Results - ${data.estimatedValue ? `$${data.estimatedValue.toLocaleString()}` : ''} potential savings`,
        html: emailContent,
      },
      contactProperties: [
        {
          name: "audit_session_id",
          value: data.sessionId
        },
        {
          name: "pain_score",
          value: data.painScore.toString()
        },
        {
          name: "estimated_value",
          value: data.estimatedValue.toString()
        }
      ]
    };

    const response = await axios.post(
      `${HUBSPOT_API_BASE}/marketing/v3/transactional/single-email/send`,
      emailData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[HubSpot Email] Audit report sent to ${data.email}`);

    // Schedule follow-up email sequence
    await scheduleFollowUpSequence({
      contactId: contactResult.contactId,
      painScore: data.painScore,
      estimatedValue: data.estimatedValue,
      sessionId: data.sessionId,
    });

    return {
      success: true,
      messageId: response.data.id,
    };

  } catch (error) {
    console.error("[HubSpot Email] Failed to send audit report:", error.response?.data || error.message);
    
    Sentry.captureException(error, {
      tags: { integration: "hubspot_email", operation: "send_audit_report" },
      extra: { emailData: data }
    });

    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Create or update HubSpot contact
 */
async function createOrUpdateContact(data: {
  email: string;
  firstname: string;
  company?: string;
}) {
  try {
    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!apiKey) {
      return { success: false, error: "API key not configured" };
    }

    const [firstname, ...lastnameArr] = data.firstname.split(" ");
    const lastname = lastnameArr.join(" ") || "";

    // Check if contact exists
    const searchResponse = await axios.get(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${data.email}?idProperty=email`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        validateStatus: (status) => status === 200 || status === 404
      }
    );

    const contactExists = searchResponse.status === 200;
    const contactId = contactExists ? searchResponse.data.id : null;

    const contactData = {
      properties: {
        email: data.email,
        firstname: firstname,
        lastname: lastname,
        company: data.company || "",
        lifecyclestage: "lead",
        lead_status: "NEW",
        hs_lead_status: "NEW"
      }
    };

    let response;

    if (contactExists) {
      // Update existing contact
      response = await axios.patch(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`,
        contactData,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      
      console.log(`[HubSpot] Updated contact ${contactId}`);
    } else {
      // Create new contact
      response = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
        contactData,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      
      console.log(`[HubSpot] Created contact ${response.data.id}`);
    }

    return {
      success: true,
      contactId: response.data.id,
      isNew: !contactExists,
    };

  } catch (error) {
    console.error("[HubSpot] Contact creation failed:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Schedule follow-up email sequence based on pain score
 */
async function scheduleFollowUpSequence({
  contactId,
  painScore,
  estimatedValue,
  sessionId,
}: {
  contactId: string;
  painScore: number;
  estimatedValue: number;
  sessionId: string;
}) {
  try {
    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!apiKey) return { success: false };

    // Determine follow-up strategy based on pain score
    let followUpDelay: number;
    let followUpTemplate: string;
    let priority: "HIGH" | "MEDIUM" | "LOW";

    if (painScore >= 80) {
      followUpDelay = 2 * 60 * 60 * 1000; // 2 hours
      followUpTemplate = "high-intent-followup";
      priority = "HIGH";
    } else if (painScore >= 60) {
      followUpDelay = 24 * 60 * 60 * 1000; // 24 hours
      followUpTemplate = "medium-intent-followup";
      priority = "MEDIUM";
    } else {
      followUpDelay = 7 * 24 * 60 * 60 * 1000; // 7 days
      followUpTemplate = "nurture-followup";
      priority = "LOW";
    }

    // Create follow-up task
    const taskData = {
      properties: {
        hs_task_subject: `Follow up: ${priority} intent lead - $${estimatedValue.toLocaleString()} opportunity`,
        hs_task_body: `AI Audit completed with ${painScore}/100 pain score.\n\nEstimated Value: $${estimatedValue.toLocaleString()}\nReport: ${process.env.NEXT_PUBLIC_APP_URL}/audit/report/${sessionId}\n\nNext Steps:\n- Review full audit report\n- Schedule discovery call\n- Send personalized proposal\n\nSlack: ${process.env.SLACK_CHANNEL_URL || '#leads'}`,
        hs_task_status: "NOT_STARTED",
        hs_task_priority: priority,
        hs_task_type: "TODO",
        hs_timestamp: new Date(Date.now() + followUpDelay).getTime().toString(),
      },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 204 }] // Contact to Task
        }
      ]
    };

    const taskResponse = await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/tasks`,
      taskData,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    console.log(`[HubSpot] Created ${priority} priority follow-up task for contact ${contactId}`);

    // Add note with audit details
    await addAuditNote({
      contactId,
      sessionId,
      painScore,
      estimatedValue,
    });

    return {
      success: true,
      taskId: taskResponse.data.id,
      priority,
    };

  } catch (error) {
    console.error("[HubSpot] Follow-up scheduling failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add detailed audit note to contact
 */
async function addAuditNote({
  contactId,
  sessionId,
  painScore,
  estimatedValue,
}: {
  contactId: string;
  sessionId: string;
  painScore: number;
  estimatedValue: number;
}) {
  try {
    const apiKey = process.env.HUBSPOT_ACCESS_TOKEN;
    
    if (!apiKey) return { success: false };

    const noteData = {
      properties: {
        hs_note_body: `🤖 AI Audit Completed\n\n📊 Pain Score: ${painScore}/100\n💰 Estimated Value: $${estimatedValue.toLocaleString()}\n🔗 Full Report: ${process.env.NEXT_PUBLIC_APP_URL}/audit/report/${sessionId}\n\n${painScore >= 80 ? '🔥 HIGH PRIORITY - Follow up within 2 hours' : painScore >= 60 ? '⭐ QUALIFIED LEAD - Follow up within 24 hours' : '✅ NURTURE LEAD - Add to drip sequence'}\n\nSlack Discussion: ${process.env.SLACK_CHANNEL_URL || '#leads'}`,
        hs_timestamp: Date.now().toString(),
      },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] // Contact to Note
        }
      ]
    };

    await axios.post(
      `${HUBSPOT_API_BASE}/crm/v3/objects/notes`,
      noteData,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    console.log(`[HubSpot] Added audit note to contact ${contactId}`);
    return { success: true };

  } catch (error) {
    console.error("[HubSpot] Note creation failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML email content for audit report
 */
function generateEmailHTML(data: HubSpotEmailData): string {
  const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/audit/report/${data.sessionId}`;
  const slackUrl = data.slackChannelUrl || process.env.SLACK_CHANNEL_URL || 'https://slack.com';
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your AI Opportunity Assessment</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .opportunity { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .metric { display: inline-block; margin: 10px 15px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
        .slack-button { background: #4A154B; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Your AI Opportunity Assessment</h1>
            <p>Hi ${data.name}, here's your personalized automation roadmap</p>
        </div>
        
        <div class="content">
            <div style="text-align: center; margin: 20px 0;">
                <div class="metric">
                    <div class="metric-value">${data.painScore}/100</div>
                    <div class="metric-label">Pain Score</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$${data.estimatedValue.toLocaleString()}</div>
                    <div class="metric-label">Potential Savings</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${data.opportunities.length}</div>
                    <div class="metric-label">Opportunities</div>
                </div>
            </div>

            <h2>🚀 Top Automation Opportunities</h2>
            ${data.opportunities.slice(0, 3).map((opp, index) => `
                <div class="opportunity ${data.painScore >= 80 ? 'priority-high' : data.painScore >= 60 ? 'priority-medium' : 'priority-low'}">
                    <h3>${index + 1}. ${opp.name}</h3>
                    <p><strong>Monthly Savings:</strong> $${opp.monthlySavings.toLocaleString()}</p>
                    <p><strong>Implementation:</strong> ${opp.implementationWeeks} weeks</p>
                    <p><strong>12-Month ROI:</strong> ${opp.roi12Months}%</p>
                </div>
            `).join('')}

            <h2>📅 Implementation Roadmap</h2>
            <p><strong>Total Duration:</strong> ${data.roadmap.totalDuration}</p>
            <ul>
                ${data.roadmap.phases.slice(0, 3).map(phase => `
                    <li><strong>${phase.name}</strong> - ${phase.duration}</li>
                `).join('')}
            </ul>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${reportUrl}" class="cta-button">📊 View Full Report</a>
                <a href="${slackUrl}" class="cta-button slack-button">💬 Discuss on Slack</a>
            </div>

            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>🎯 Next Steps</h3>
                <ol>
                    <li><strong>Review your full report</strong> - Detailed analysis and technical specifications</li>
                    <li><strong>Join our Slack</strong> - Ask questions and see real implementations</li>
                    <li><strong>Book a strategy call</strong> - Let's discuss your specific needs</li>
                </ol>
            </div>

            ${data.painScore >= 80 ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <strong>🔥 High Priority Lead:</strong> Based on your pain score (${data.painScore}/100), you're an excellent candidate for AI automation. I'll follow up within 2 hours to discuss implementation.
                </div>
            ` : data.painScore >= 60 ? `
                <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <strong>⭐ Qualified Opportunity:</strong> Your assessment shows strong automation potential. I'll reach out within 24 hours to explore next steps.
                </div>
            ` : `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <strong>✅ Automation Potential:</strong> There are good opportunities for your business. I'll add you to our nurture sequence with helpful automation tips.
                </div>
            `}
        </div>
        
        <div class="footer">
            <p>Questions? Reply to this email or join our Slack community.</p>
            <p><small>Aparna Pradhan - Technical Partner for AI Agencies</small></p>
            <p><small><a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${data.email}">Unsubscribe</a></small></p>
        </div>
    </div>
</body>
</html>
  `;
}

export default {
  sendAuditReportEmail,
  scheduleFollowUpSequence,
  addAuditNote,
};