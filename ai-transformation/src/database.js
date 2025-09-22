const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class DatabaseManager {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ai_transformation'
    });
    this.init();
  }

  async init() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY,
          name VARCHAR(255) UNIQUE,
          industry VARCHAR(100),
          size VARCHAR(50),
          tech_level VARCHAR(50),
          current_challenges TEXT,
          ai_experience TEXT,
          phase1_results JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS interviews (
          id UUID PRIMARY KEY,
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          role VARCHAR(100),
          responses JSONB,
          analysis JSONB,
          process_map JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(company_id, role)
        )
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS roadmaps (
          id UUID PRIMARY KEY,
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          roadmap_data JSONB,
          version INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for performance
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
        CREATE INDEX IF NOT EXISTS idx_interviews_company ON interviews(company_id);
        CREATE INDEX IF NOT EXISTS idx_roadmaps_company ON roadmaps(company_id);
      `);
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.warn('⚠️ Database initialization failed, running in demo mode:', error.message);
      // Don't throw error - allow system to run without database for demo
    }
  }

  async findCompanyByName(name) {
    try {
      const result = await this.pool.query(
        'SELECT id FROM companies WHERE LOWER(name) = LOWER($1)',
        [name]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error finding company:', error);
      throw error;
    }
  }

  async createCompany(companyInfo) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const id = uuidv4();
      await client.query(
        `INSERT INTO companies (id, name, industry, size, tech_level, current_challenges, ai_experience) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id, 
          companyInfo.name, 
          companyInfo.industry, 
          companyInfo.size, 
          companyInfo.techLevel,
          companyInfo.currentChallenges || '',
          companyInfo.aiExperience || ''
        ]
      );
      
      await client.query('COMMIT');
      return id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async savePhase1Results(companyId, results) {
    try {
      await this.pool.query(
        'UPDATE companies SET phase1_results = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(results), companyId]
      );
    } catch (error) {
      console.error('Error saving Phase 1 results:', error);
      throw error;
    }
  }

  async getInterviewByRole(companyId, role) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM interviews WHERE company_id = $1 AND role = $2',
        [companyId, role]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting interview by role:', error);
      throw error;
    }
  }

  async saveInterview(companyId, interviewData) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const id = uuidv4();
      await client.query(
        `INSERT INTO interviews (id, company_id, role, responses, analysis, process_map) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (company_id, role) 
         DO UPDATE SET 
           responses = EXCLUDED.responses,
           analysis = EXCLUDED.analysis,
           process_map = EXCLUDED.process_map`,
        [
          id, 
          companyId, 
          interviewData.role, 
          JSON.stringify(interviewData.responses || {}),
          JSON.stringify(interviewData.processedInterview || {}), 
          JSON.stringify(interviewData.processMap || {})
        ]
      );
      
      await client.query('COMMIT');
      return id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getCompanyData(companyId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM companies WHERE id = $1', 
        [companyId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting company data:', error);
      throw error;
    }
  }

  async getInterviews(companyId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM interviews WHERE company_id = $1 ORDER BY created_at ASC', 
        [companyId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting interviews:', error);
      throw error;
    }
  }

  async saveRoadmap(companyId, roadmap) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get current version
      const versionResult = await client.query(
        'SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM roadmaps WHERE company_id = $1',
        [companyId]
      );
      const version = versionResult.rows[0].next_version;
      
      const id = uuidv4();
      await client.query(
        'INSERT INTO roadmaps (id, company_id, roadmap_data, version) VALUES ($1, $2, $3, $4)',
        [id, companyId, JSON.stringify(roadmap), version]
      );
      
      await client.query('COMMIT');
      return { id, version };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getRoadmap(companyId, version = null) {
    try {
      let query, params;
      
      if (version) {
        query = 'SELECT * FROM roadmaps WHERE company_id = $1 AND version = $2';
        params = [companyId, version];
      } else {
        query = 'SELECT * FROM roadmaps WHERE company_id = $1 ORDER BY version DESC LIMIT 1';
        params = [companyId];
      }
      
      const result = await this.pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting roadmap:', error);
      throw error;
    }
  }

  async getCompanyStats() {
    try {
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_companies,
          COUNT(CASE WHEN phase1_results IS NOT NULL THEN 1 END) as phase1_completed,
          (SELECT COUNT(*) FROM interviews) as total_interviews,
          (SELECT COUNT(*) FROM roadmaps) as total_roadmaps
        FROM companies
      `);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      await this.pool.end();
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

module.exports = { DatabaseManager };
