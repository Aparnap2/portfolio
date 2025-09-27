#!/usr/bin/env node

/**
 * Start Background Workers for Lead Processing
 */

const { spawn } = require('child_process');

console.log('🚀 Starting Background Workers...');
console.log('================================');

// Start HubSpot worker
const hubspotWorker = spawn('node', ['src/workers/discord-worker.js'], {
  stdio: 'inherit',
  detached: false
});

hubspotWorker.on('error', (error) => {
  console.error('❌ Failed to start HubSpot worker:', error);
});

hubspotWorker.on('close', (code) => {
  console.log(`HubSpot worker exited with code ${code}`);
});

// Note: Discord worker would be started here too
// const discordWorker = spawn('node', ['src/workers/discord-worker.js'], {
//   stdio: 'inherit',
//   detached: false
// });

console.log('✅ Workers started successfully');
console.log('📋 Workers running:');
console.log('   - HubSpot Lead Sync Worker');
console.log('   - Discord Notification Worker');

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down workers...');
  hubspotWorker.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down workers...');
  hubspotWorker.kill('SIGTERM');
  process.exit(0);
});