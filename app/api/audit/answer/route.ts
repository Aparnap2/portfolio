import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { validateWorkflowData, validateAndSanitize, apiSchemas } from "@/lib/validation";

// Static workflow validation without LLM
function processWorkflowStep(message: string, currentStep: string, currentInfo: any) {
  const msg = message.toLowerCase();
  const info = { ...currentInfo };
  
  switch (currentStep) {
    case "discovery":
      // Extract industry and company size
      const industries = ['saas', 'software', 'marketing', 'consulting', 'ecommerce', 'retail', 'healthcare', 'finance', 'real estate', 'manufacturing', 'agency', 'startup'];
      const sizePatterns = [/\d+\s*employees?/, /\d+\s*people/, /team of \d+/, /\d+-\d+/, /small|medium|large/];
      
      if (!info.discovery) {
        info.discovery = {};
      }
      
      // Extract industry
      if (!info.discovery.industry) {
        for (const industry of industries) {
          if (msg.includes(industry)) {
            info.discovery.industry = industry;
            break;
          }
        }
        // Fallback - if message seems like industry, store it
        if (!info.discovery.industry && (msg.includes('company') || msg.length < 50)) {
          info.discovery.industry = message;
        }
      }
      
      // Extract company size
      if (!info.discovery.companySize) {
        for (const pattern of sizePatterns) {
          const match = msg.match(pattern);
          if (match) {
            info.discovery.companySize = match[0];
            break;
          }
        }
        // Fallback - if message contains numbers, likely size
        if (!info.discovery.companySize && /\d+/.test(msg)) {
          info.discovery.companySize = message;
        }
      }
      
      // Store acquisition and delivery flow descriptions
      if (!info.discovery.acquisitionFlow && (msg.includes('customer') || msg.includes('marketing') || msg.includes('acquire') || msg.includes('find'))) {
        info.discovery.acquisitionFlow = message;
      }
      if (!info.discovery.deliveryFlow && (msg.includes('deliver') || msg.includes('service') || msg.includes('product') || msg.includes('platform'))) {
        info.discovery.deliveryFlow = message;
      }
      break;
      
    case "pain_points":
      if (!info.pain_points) {
        info.pain_points = {};
      }
      
      const painKeywords = ['manual', 'time consuming', 'bottleneck', 'slow', 'inefficient', 'problem', 'challenge', 'difficult'];
      const budgetPattern = /\$[\d,]+|\d+k|budget|spend/;
      const timeKeywords = ['month', 'week', 'asap', 'urgent', 'soon', 'timeline'];
      
      // Extract manual tasks
      if (painKeywords.some(keyword => msg.includes(keyword))) {
        info.pain_points.manualTasks = message;
      }
      
      // Extract bottlenecks
      if (msg.includes('approval') || msg.includes('decision') || msg.includes('bottleneck')) {
        info.pain_points.bottlenecks = message;
      }
      
      // Extract data silos
      if (msg.includes('data') || msg.includes('system') || msg.includes('silo')) {
        info.pain_points.dataSilos = message;
      }
      
      // Extract budget
      if (budgetPattern.test(msg)) {
        info.pain_points.budget = message;
      }
      
      // Extract timeline
      if (timeKeywords.some(keyword => msg.includes(keyword))) {
        info.pain_points.timeline = message;
      }
      
      // Extract role
      if (msg.includes('owner') || msg.includes('manager') || msg.includes('director') || msg.includes('ceo')) {
        info.pain_points.userRole = message;
      }
      break;
      
    case "contact_info":
      if (!info.contact_info) {
        info.contact_info = {};
      }
      
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const emailMatch = message.match(emailPattern);
      
      if (emailMatch && !info.contact_info.email) {
        info.contact_info.email = emailMatch[0];
      }
      
      // Extract name (improved extraction)
      if (!info.contact_info.name) {
        if (msg.includes('name is') || msg.includes('my name')) {
          const nameMatch = message.match(/(?:name is|my name is?)\s+([A-Za-z\s]+)/i);
          if (nameMatch) {
            info.contact_info.name = nameMatch[1].trim();
          } else {
            info.contact_info.name = message;
          }
        } else if (msg.includes('i am') && !msg.includes('ceo') && !msg.includes('manager') && !msg.includes('director')) {
          const nameMatch = message.match(/i am\s+([A-Za-z\s]+)/i);
          if (nameMatch && nameMatch[1].trim().split(' ').length <= 3) {
            info.contact_info.name = nameMatch[1].trim();
          }
        } else if (/^[A-Za-z\s]{2,30}$/.test(message.trim())) {
          // If message looks like a name (only letters and spaces, reasonable length)
          info.contact_info.name = message.trim();
        }
      }
      
      // Extract company (improved extraction)
      if (msg.includes('company is') || msg.includes('work at') || msg.includes('from')) {
        const companyMatch = message.match(/(?:company is|work at|from)\s+([A-Za-z\s&.,]+)/i);
        if (companyMatch) {
          info.contact_info.company = companyMatch[1].trim();
        } else {
          info.contact_info.company = message;
        }
      }
      break;
  }
  
  return info;
}

function getNextWorkflowResponse(currentStep: string, info: any) {
  const discovery = info.discovery || {};
  const painPoints = info.pain_points || {};
  const contactInfo = info.contact_info || {};
  
  // Check completion for each step
  const discoveryComplete = discovery.industry && discovery.companySize && discovery.acquisitionFlow && discovery.deliveryFlow;
  const painPointsComplete = painPoints.manualTasks && painPoints.bottlenecks && painPoints.dataSilos && painPoints.budget && painPoints.timeline && painPoints.userRole;
  const contactComplete = contactInfo.name && contactInfo.email;
  
  switch (currentStep) {
    case "discovery":
      if (discoveryComplete) {
        return {
          message: "Great! Now let's move to **Step 2: Pain Points & Qualification**\n\nWhat are the most time-consuming manual tasks that slow your team down?",
          step: "pain_points",
          needs_email: false
        };
      }
      
      if (!discovery.industry) return { message: "What industry is your business in?", step: "discovery", needs_email: false };
      if (!discovery.companySize) return { message: "How many employees does your company have?", step: "discovery", needs_email: false };
      if (!discovery.acquisitionFlow) return { message: "How do you find new customers?", step: "discovery", needs_email: false };
      return { message: "How do you deliver your service after a sale?", step: "discovery", needs_email: false };
      
    case "pain_points":
      if (painPointsComplete) {
        return {
          message: "Perfect! Now for **Step 3: Contact Information**\n\nWhat's your name?",
          step: "contact_info",
          needs_email: false
        };
      }
      
      if (!painPoints.manualTasks) return { message: "What manual tasks take most of your time?", step: "pain_points", needs_email: false };
      if (!painPoints.bottlenecks) return { message: "What creates bottlenecks in your processes?", step: "pain_points", needs_email: false };
      if (!painPoints.dataSilos) return { message: "Where does information get lost between systems?", step: "pain_points", needs_email: false };
      if (!painPoints.budget) return { message: "What's your budget for automation?", step: "pain_points", needs_email: false };
      if (!painPoints.timeline) return { message: "What's your timeline for implementation?", step: "pain_points", needs_email: false };
      return { message: "What's your role in this project?", step: "pain_points", needs_email: false };
      
    case "contact_info":
      if (contactComplete) {
        return {
          message: "Excellent! I have all the information needed.",
          step: "ready_for_generation",
          needs_email: true
        };
      }
      
      if (!contactInfo.name) return { message: "What's your full name?", step: "contact_info", needs_email: false };
      return { message: "What's your email address?", step: "contact_info", needs_email: false };
      
    default:
      return { message: "What industry are you in?", step: "discovery", needs_email: false };
  }
}

function checkWorkflowCompleteness(info: any): boolean {
  const discovery = info.discovery || {};
  const painPoints = info.pain_points || {};
  const contactInfo = info.contact_info || {};
  
  return !!(discovery.industry && discovery.companySize && discovery.acquisitionFlow && discovery.deliveryFlow &&
           painPoints.manualTasks && painPoints.bottlenecks && painPoints.dataSilos && painPoints.budget && painPoints.timeline && painPoints.userRole &&
           contactInfo.name && contactInfo.email);
}



export async function POST(req: NextRequest) {
    try {
        const { sessionId, message } = await req.json();

        if (!sessionId || !message) {
            return NextResponse.json(
                { success: false, error: "Missing required fields: sessionId, message" },
                { status: 400 }
            );
        }

        // Load current state from Redis
        const sessionData = await redis.get(`session:${sessionId}`);
        if (!sessionData) {
            return NextResponse.json(
                { success: false, error: "Session not found or expired" },
                { status: 404 }
            );
        }

        const currentState = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

        // Add user message to state
        const updatedState = {
            ...currentState,
            messages: [
                ...(currentState.messages || []),
                {
                    id: `user_${Date.now()}`,
                    type: "user",
                    content: message,
                    timestamp: new Date().toISOString(),
                }
            ]
        };

        // Process workflow step and determine next response
        let extractedInfo = processWorkflowStep(message, currentState.current_step, currentState.extracted_info || {
            discovery: null,
            pain_points: null,
            contact_info: null
        });
        const isComplete = checkWorkflowCompleteness(extractedInfo);

        let aiResponse = "";
        let nextStep = currentState.current_step;
        let needsEmail = false;

        // Handle continuation choice
        if (currentState.current_step === "continuation_choice") {
            const msg = message.toLowerCase();
            if (msg.includes("continue") || msg.includes("previous") || msg.includes("1")) {
                nextStep = "ready_for_generation";
                aiResponse = "Perfect! Your previous audit data is ready. Click 'Generate Report' to create your updated automation report.";
            } else {
                // Start fresh audit
                nextStep = "discovery";
                aiResponse = "Great! Let's start fresh. Tell me about your company - what industry are you in and what does your team do?";
                // Reset extracted info
                extractedInfo = {
                    discovery: null,
                    pain_points: null,
                    contact_info: null
                };
            }
        }
        // Handle email capture
        else if (currentState.current_step === "email_request") {
            const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            const emailMatch = message.match(emailPattern);
            
            if (emailMatch) {
                const email = emailMatch[0];
                
                // Store email and mark as ready for generation
                currentState.email = email;
                nextStep = "ready_for_generation";
                aiResponse = "Perfect! I have all the information I need. Click 'Generate Report' to create your personalized automation audit.";
            } else {
                aiResponse = "Please provide a valid email address to receive your report.";
            }
        } else if (isComplete && currentState.current_step !== "ready_for_generation" && currentState.current_step !== "continuation_choice") {
            nextStep = "ready_for_generation";
            aiResponse = "Perfect! I have all the information needed. Your personalized automation report is ready to generate.";
            needsEmail = true;
        } else if (currentState.current_step !== "continuation_choice") {
          // Use workflow response logic
          const nextResponse = getNextWorkflowResponse(currentState.current_step, extractedInfo);
          aiResponse = nextResponse.message;
          nextStep = nextResponse.step;
          needsEmail = nextResponse.needs_email;
        }
        
        // Add AI response to messages (prevent duplicates)
        const lastMessage = updatedState.messages[updatedState.messages.length - 1];
        const isDuplicate = lastMessage && lastMessage.content === aiResponse;
        
        const finalMessages = isDuplicate ? updatedState.messages : [
            ...updatedState.messages,
            {
                id: `ai_${Date.now()}`,
                type: "ai",
                content: aiResponse,
                timestamp: new Date().toISOString(),
            }
        ];
        
        // Validate extracted data
        const stepData = extractedInfo[nextStep === 'pain_points' ? 'pain_points' : nextStep === 'contact_info' ? 'contact_info' : 'discovery'];
        const validationResult = stepData ? validateWorkflowData(nextStep, stepData) : { valid: true };
        
        const response = {
          ...updatedState,
          messages: finalMessages,
          current_step: nextStep,
          extracted_info: extractedInfo,
          needs_email: needsEmail,
          conversation_complete: isComplete,
          validation_status: validationResult.valid ? 'valid' : 'invalid',
          validation_errors: validationResult.errors || null
        };

        // Store updated state in Redis
        await redis.set(
            `session:${sessionId}`,
            JSON.stringify({
                ...response,
                updatedAt: new Date().toISOString()
            }),
            { ex: 86400 } // 24 hour TTL
        );

        return NextResponse.json({
            success: true,
            response,
            current_step: nextStep,
            completed: nextStep === 'finished'
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        const errorStack = error instanceof Error ? error.stack : undefined;

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                details: process.env.NODE_ENV === "development" ? errorMessage : undefined
            },
            { status: 500 }
        );
    }
}
