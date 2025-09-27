const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class DatabaseManager {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/leads',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    this.init();
  }

  async init() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id UUID PRIMARY KEY,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          email VARCHAR(255) UNIQUE,
          company VARCHAR(255),
          enriched_data JSONB,
          score JSONB,
          assignment JSONB,
          status VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Lead database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing lead database:', error);
      throw error;
    }
  }

  async createLead(leadData) {
    const id = uuidv4();
    try {
      await this.pool.query(
        'INSERT INTO leads (id, first_name, last_name, email, company, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, leadData.firstName, leadData.lastName, leadData.email, leadData.company, 'processing']
      );
      return id;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async updateLead(id, data) {
    try {
      await this.pool.query(
        'UPDATE leads SET enriched_data = $1, score = $2, assignment = $3, status = $4, updated_at = NOW() WHERE id = $5',
        [JSON.stringify(data.enrichedData), JSON.stringify(data.score), JSON.stringify(data.assignment), data.status, id]
      );
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  async getLead(id) {
    try {
      const result = await this.pool.query('SELECT * FROM leads WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting lead:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const total = await this.pool.query('SELECT COUNT(*) FROM leads');
      const processed = await this.pool.query('SELECT COUNT(*) FROM leads WHERE status = $1', ['completed']);
      const avgScore = await this.pool.query('SELECT AVG((score->\'score\')::int) FROM leads WHERE score IS NOT NULL');

      return {
        totalLeads: parseInt(total.rows[0].count),
        processedLeads: parseInt(processed.rows[0].count),
        averageScore: parseFloat(avgScore.rows[0].avg) || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}

module.exports = { DatabaseManager };
