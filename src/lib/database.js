// src/lib/database.js
// Neon PostgreSQL connection with connection pooling and retry logic

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

let pool = null;

const CONFIG = {
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DATABASE_POOL_MIN) || 2,
  max: parseInt(process.env.DATABASE_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

/**
 * Initialize database connection pool
 */
export function initializeDatabase() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    pool = new Pool(CONFIG);
    
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
    
    pool.on('connect', () => {
      console.log('Database connected successfully');
    });
  }
  
  return pool;
}

/**
 * Get database connection with retry logic
 */
export async function getConnection(retries = 3) {
  const dbPool = initializeDatabase();
  
  for (let i = 0; i < retries; i++) {
    try {
      const client = await dbPool.connect();
      return client;
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

/**
 * Execute query with automatic connection management
 */
export async function query(text, params = []) {
  const client = await getConnection();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Execute transaction
 */
export async function transaction(callback) {
  const client = await getConnection();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check for database
 */
export async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as current_time');
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      pool_total: pool?.totalCount || 0,
      pool_idle: pool?.idleCount || 0,
      pool_waiting: pool?.waitingCount || 0
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Close database connections
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connections closed');
  }
}

// Lead Management Functions

/**
 * Create a new lead
 */
export async function createLead(leadData) {
  const {
    email,
    name,
    company,
    phone,
    project_type,
    budget,
    timeline,
    notes,
    source = 'web',
    session_id = null
  } = leadData;

  const leadId = uuidv4();
  const query_text = `
    INSERT INTO leads (
      id, email, name, company, phone, project_type, 
      budget, timeline, notes, source, session_id, 
      status, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *
  `;

  const values = [
    leadId,
    email,
    name,
    company,
    phone,
    project_type,
    budget,
    timeline,
    notes,
    source,
    session_id,
    'new',
    new Date(),
    new Date()
  ];

  const result = await query(query_text, values);
  return result.rows[0];
}

/**
 * Update lead information
 */
export async function updateLead(leadId, updates) {
  const allowedFields = [
    'name', 'company', 'phone', 'project_type', 'budget', 
    'timeline', 'notes', 'status', 'hubspot_id', 'hubspot_synced_at'
  ];
  
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    }
  });

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  updateFields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  values.push(leadId);

  const query_text = `
    UPDATE leads 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex + 1}
    RETURNING *
  `;

  const result = await query(query_text, values);
  return result.rows[0];
}

/**
 * Get lead by ID
 */
export async function getLeadById(leadId) {
  const result = await query('SELECT * FROM leads WHERE id = $1', [leadId]);
  return result.rows[0] || null;
}

/**
 * Get lead by email
 */
export async function getLeadByEmail(email) {
  const result = await query('SELECT * FROM leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [email]);
  return result.rows[0] || null;
}

/**
 * Get leads pending HubSpot sync
 */
export async function getLeadsPendingSync(limit = 50) {
  const query_text = `
    SELECT * FROM leads 
    WHERE hubspot_synced_at IS NULL 
    ORDER BY created_at ASC 
    LIMIT $1
  `;
  const result = await query(query_text, [limit]);
  return result.rows;
}

/**
 * Create session
 */
export async function createSession(sessionData) {
  const {
    id = uuidv4(),
    user_agent = null,
    ip_address = null,
    source = 'web',
    metadata = {}
  } = sessionData;

  const query_text = `
    INSERT INTO sessions (
      id, user_agent, ip_address, source, metadata, 
      created_at, updated_at, expires_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8
    ) RETURNING *
  `;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

  const values = [
    id,
    user_agent,
    ip_address,
    source,
    JSON.stringify(metadata),
    new Date(),
    new Date(),
    expiresAt
  ];

  const result = await query(query_text, values);
  return result.rows[0];
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId) {
  const result = await query('SELECT * FROM sessions WHERE id = $1 AND expires_at > NOW()', [sessionId]);
  const session = result.rows[0];
  if (session && session.metadata) {
    session.metadata = JSON.parse(session.metadata);
  }
  return session || null;
}

/**
 * Update session
 */
export async function updateSession(sessionId, updates) {
  const allowedFields = ['user_agent', 'ip_address', 'metadata', 'last_activity'];
  
  const updateFields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(key === 'metadata' ? JSON.stringify(updates[key]) : updates[key]);
      paramIndex++;
    }
  });

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  updateFields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  values.push(sessionId);

  const query_text = `
    UPDATE sessions 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex + 1}
    RETURNING *
  `;

  const result = await query(query_text, values);
  const session = result.rows[0];
  if (session && session.metadata) {
    session.metadata = JSON.parse(session.metadata);
  }
  return session;
}

/**
 * Log lead capture event
 */
export async function logLeadEvent(leadId, eventType, eventData = {}) {
  const query_text = `
    INSERT INTO lead_events (
      id, lead_id, event_type, event_data, created_at
    ) VALUES (
      $1, $2, $3, $4, $5
    ) RETURNING *
  `;

  const values = [
    uuidv4(),
    leadId,
    eventType,
    JSON.stringify(eventData),
    new Date()
  ];

  const result = await query(query_text, values);
  return result.rows[0];
}

/**
 * Get lead events
 */
export async function getLeadEvents(leadId, limit = 50) {
  const query_text = `
    SELECT * FROM lead_events 
    WHERE lead_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2
  `;
  const result = await query(query_text, [leadId, limit]);
  return result.rows.map(row => ({
    ...row,
    event_data: JSON.parse(row.event_data)
  }));
}

export default {
  initializeDatabase,
  getConnection,
  query,
  transaction,
  healthCheck,
  closeDatabase,
  createLead,
  updateLead,
  getLeadById,
  getLeadByEmail,
  getLeadsPendingSync,
  createSession,
  getSessionById,
  updateSession,
  logLeadEvent,
  getLeadEvents
};