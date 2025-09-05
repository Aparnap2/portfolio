#!/usr/bin/env node
// scripts/setup-database.js
// Database schema setup for lead capture system

import dotenv from 'dotenv';
import { query, initializeDatabase, closeDatabase } from '../src/lib/database.js';

dotenv.config();

const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  project_type VARCHAR(100),
  budget VARCHAR(100),
  timeline VARCHAR(100),
  notes TEXT,
  source VARCHAR(50) DEFAULT 'web',
  session_id UUID,
  status VARCHAR(50) DEFAULT 'new',
  hubspot_id VARCHAR(100),
  hubspot_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_email_per_day UNIQUE (email, DATE(created_at))
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_agent TEXT,
  ip_address INET,
  source VARCHAR(50) DEFAULT 'web',
  metadata JSONB DEFAULT '{}',
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Create lead_events table for audit trail
CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job_queue table for background jobs
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_name VARCHAR(100) NOT NULL,
  job_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_hubspot_sync ON leads(hubspot_synced_at) WHERE hubspot_synced_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled_at ON job_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_job_queue_queue_name ON job_queue(queue_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
  BEFORE UPDATE ON leads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_queue_updated_at ON job_queue;
CREATE TRIGGER update_job_queue_updated_at 
  BEFORE UPDATE ON job_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for old completed jobs
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM job_queue 
  WHERE status IN ('completed', 'failed') 
  AND completed_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
`;

async function setupDatabase() {
  console.log('🚀 Setting up database schema...');
  
  try {
    // Initialize database connection
    initializeDatabase();
    
    // Execute schema SQL
    await query(SCHEMA_SQL);
    
    console.log('✅ Database schema created successfully!');
    
    // Test the setup by creating a sample lead
    console.log('🧪 Testing database setup...');
    
    const testLead = await query(`
      INSERT INTO leads (email, name, company, notes, source) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, email, name, created_at
    `, [
      'test@example.com',
      'Test User',
      'Test Company',
      'Database setup test',
      'setup_script'
    ]);
    
    console.log('✅ Test lead created:', testLead.rows[0]);
    
    // Clean up test data
    await query('DELETE FROM leads WHERE email = $1', ['test@example.com']);
    console.log('🧹 Test data cleaned up');
    
    // Show table info
    const tableInfo = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('leads', 'sessions', 'lead_events', 'job_queue')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('📊 Database tables created:');
    const tables = {};
    tableInfo.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
    });
    
    Object.keys(tables).forEach(tableName => {
      console.log(`  📋 ${tableName}:`);
      tables[tableName].forEach(column => {
        console.log(`    - ${column}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase;