#!/usr/bin/env node
// scripts/migrate.js
// Database migration script

import dotenv from 'dotenv';
import { initializeDatabase, createTables, closeDatabase } from '../src/lib/database.js';

dotenv.config();

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not configured');
      process.exit(1);
    }

    console.log('📡 Connecting to database...');
    initializeDatabase();

    console.log('📋 Creating tables...');
    await createTables();

    console.log('✅ Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

runMigrations();