const { StateGraph, END } = require('@langchain/langgraph');
const { EducationAgent } = require('./agents/education');
const { InterviewAgent } = require('./agents/interview');
const { ProcessMappingAgent } = require('./agents/process-mapping');
const { OpportunityAgent } = require('./agents/opportunity');
const { DatabaseManager } = require('./database');
const { ErrorHandler } = require('./middleware/errorHandler');

class AITransformationOrchestrator {
  constructor() {
    this.db = new DatabaseManager();
    this.educationAgent = new EducationAgent();
    this.interviewAgent = new InterviewAgent();
    this.processMappingAgent = new ProcessMappingAgent();
    this.opportunityAgent = new OpportunityAgent();
  }

  // Phase 1: Education & Alignment
  async startPhase1(companyInfo) {
    try {
      // Validate input
      ErrorHandler.validateCompanyInfo(companyInfo);
      
      // Check if company already exists
      const existingCompany = await this.db.findCompanyByName(companyInfo.name);
      if (existingCompany) {
        throw new Error('Company already exists in system');
      }
      
      const companyId = await this.db.createCompany(companyInfo);
      
      // Generate education plan with retry logic
      let educationPlan, alignmentWorkshop;
      let retries = 3;
      
      while (retries > 0) {
        try {
          educationPlan = await this.educationAgent.createEducationPlan(companyInfo);
          alignmentWorkshop = await this.educationAgent.generateWorkshopContent(companyInfo);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        }
      }
      
      await this.db.savePhase1Results(companyId, { educationPlan, alignmentWorkshop });
      
      return {
        companyId,
        educationPlan,
        workshopContent: alignmentWorkshop,
        nextStep: 'Schedule leadership workshop',
        estimatedDuration: '2-3 hours',
        participantsNeeded: educationPlan.recommendedParticipants || ['CEO', 'CTO', 'COO']
      };
    } catch (error) {
      console.error('Phase 1 Error:', error);
      throw error;
    }
  }

  // Phase 2: Identification & Auditing
  async processInterview(responses) {
    try {
      // Validate input
      ErrorHandler.validateInterviewData(responses);
      
      const { companyId, role, answers } = responses;
      
      // Check if company exists
      const company = await this.db.getCompanyData(companyId);
      if (!company) {
        throw new Error('Company not found');
      }
      
      // Check for duplicate role interviews
      const existingInterview = await this.db.getInterviewByRole(companyId, role);
      if (existingInterview) {
        throw new Error(`Interview for ${role} already completed`);
      }
      
      // Process with retry logic
      let processedInterview, processMap;
      let retries = 3;
      
      while (retries > 0) {
        try {
          processedInterview = await this.interviewAgent.analyzeResponses(answers, role);
          processMap = await this.processMappingAgent.generateProcessMap(processedInterview);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      await this.db.saveInterview(companyId, { role, responses: answers, processedInterview, processMap });
      
      // Generate follow-up questions
      const followUpQuestions = await this.interviewAgent.generateFollowUp(processedInterview);
      
      return {
        processMap,
        identifiedProcesses: processedInterview.processes || [],
        painPoints: processedInterview.painPoints || [],
        automationOpportunities: processedInterview.automationOpportunities || [],
        nextInterviewQuestions: followUpQuestions,
        completionStatus: await this.getInterviewProgress(companyId)
      };
    } catch (error) {
      console.error('Phase 2 Error:', error);
      throw error;
    }
  }

  async generateRoadmap(companyId) {
    try {
      const companyData = await this.db.getCompanyData(companyId);
      if (!companyData) {
        throw new Error('Company not found');
      }
      
      const interviews = await this.db.getInterviews(companyId);
      if (interviews.length < 3) {
        throw new Error('Minimum 3 interviews required for roadmap generation');
      }
      
      // Generate roadmap with comprehensive error handling
      let opportunities, prioritizedOpportunities, roadmap;
      let retries = 3;
      
      while (retries > 0) {
        try {
          opportunities = await this.opportunityAgent.identifyOpportunities(interviews);
          prioritizedOpportunities = await this.opportunityAgent.gradeOpportunities(opportunities);
          roadmap = await this.opportunityAgent.generateRoadmap(companyData, prioritizedOpportunities);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Validate roadmap completeness
      if (!roadmap.executiveSummary || !roadmap.quickWins || !roadmap.timeline) {
        throw new Error('Incomplete roadmap generated - missing critical sections');
      }
      
      await this.db.saveRoadmap(companyId, roadmap);
      
      return {
        ...roadmap,
        generatedAt: new Date().toISOString(),
        interviewsAnalyzed: interviews.length,
        opportunitiesIdentified: opportunities.length,
        quickWinsCount: roadmap.quickWins?.length || 0,
        estimatedImplementationTime: roadmap.timeline?.length ? `${roadmap.timeline.length * 3} months` : '12-18 months'
      };
    } catch (error) {
      console.error('Roadmap Generation Error:', error);
      throw error;
    }
  }
  
  // Helper methods
  async getInterviewProgress(companyId) {
    const interviews = await this.db.getInterviews(companyId);
    const recommendedRoles = [
      'CEO/Executive', 'Operations Manager', 'Sales Manager', 
      'Customer Service', 'Finance/Accounting', 'IT Manager'
    ];
    
    const completed = interviews.map(i => i.role);
    const remaining = recommendedRoles.filter(role => !completed.includes(role));
    
    return {
      completed: completed.length,
      total: recommendedRoles.length,
      remaining,
      percentage: Math.round((completed.length / recommendedRoles.length) * 100),
      readyForRoadmap: completed.length >= 3
    };
  }
  
  async getSystemHealth() {
    try {
      await this.db.pool.query('SELECT 1');
      return {
        database: 'healthy',
        ai: process.env.GOOGLE_API_KEY ? 'configured' : 'missing_key',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        database: 'error',
        ai: 'unknown',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = { AITransformationOrchestrator };
