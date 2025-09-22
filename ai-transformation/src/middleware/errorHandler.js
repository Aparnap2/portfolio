class ErrorHandler {
  static handleAPIError(error, request, reply) {
    console.error('API Error:', error);
    
    // Validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.validation,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Database errors
    if (error.code === '23505') { // Duplicate key
      return reply.code(409).send({
        error: 'Company already exists',
        code: 'DUPLICATE_COMPANY'
      });
    }
    
    if (error.code === '28P01') { // Auth failed
      return reply.code(500).send({
        error: 'Database connection failed',
        code: 'DB_CONNECTION_ERROR'
      });
    }
    
    // AI/LLM errors
    if (error.message.includes('API key')) {
      return reply.code(500).send({
        error: 'AI service configuration error',
        code: 'AI_CONFIG_ERROR'
      });
    }
    
    if (error.message.includes('rate limit')) {
      return reply.code(429).send({
        error: 'AI service rate limit exceeded',
        code: 'RATE_LIMIT_ERROR',
        retryAfter: 60
      });
    }
    
    // Generic server error
    return reply.code(500).send({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
  
  static validateCompanyInfo(companyInfo) {
    const required = ['name', 'industry', 'size', 'techLevel'];
    const missing = required.filter(field => !companyInfo[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (companyInfo.name.length < 2) {
      throw new Error('Company name must be at least 2 characters');
    }
    
    const validIndustries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other'];
    if (!validIndustries.includes(companyInfo.industry)) {
      throw new Error('Invalid industry selection');
    }
    
    return true;
  }
  
  static validateInterviewData(interviewData) {
    const { role, answers } = interviewData;
    
    if (!role || role.length < 3) {
      throw new Error('Valid role is required');
    }
    
    const requiredAnswers = ['dailyTasks', 'painPoints', 'manualProcesses', 'timeBreakdown'];
    const missing = requiredAnswers.filter(field => !answers[field] || answers[field].length < 10);
    
    if (missing.length > 0) {
      throw new Error(`Insufficient detail in: ${missing.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = { ErrorHandler };
