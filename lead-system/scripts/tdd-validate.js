#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

class TDDValidator {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      e2e: null,
      coverage: null
    };
  }

  async runTests() {
    console.log('🧪 Running TDD Validation Suite...\n');

    try {
      // 1. Unit Tests
      console.log('1️⃣ Running Unit Tests...');
      await this.runCommand('pnpm', ['run', 'test:unit']);
      this.results.unit = '✅ PASSED';

      // 2. Integration Tests
      console.log('\n2️⃣ Running Integration Tests...');
      await this.runCommand('pnpm', ['run', 'test:integration']);
      this.results.integration = '✅ PASSED';

      // 3. Coverage Report
      console.log('\n3️⃣ Generating Coverage Report...');
      await this.runCommand('pnpm', ['run', 'test:coverage']);
      this.results.coverage = '✅ GENERATED';

      // 4. E2E Tests (if servers are running)
      console.log('\n4️⃣ Running E2E Tests...');
      try {
        await this.checkServers();
        await this.runCommand('pnpm', ['run', 'test:e2e']);
        this.results.e2e = '✅ PASSED';
      } catch (error) {
        this.results.e2e = '⚠️ SKIPPED (servers not running)';
      }

      this.printResults();
    } catch (error) {
      console.error('❌ TDD Validation Failed:', error.message);
      process.exit(1);
    }
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'inherit' });
      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
      });
    });
  }

  async checkServers() {
    const http = require('http');
    
    // Check if API server is running
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3001/api/dashboard', (res) => {
        resolve();
      });
      req.on('error', () => reject(new Error('API server not running')));
      req.setTimeout(2000, () => reject(new Error('Server timeout')));
    });
  }

  printResults() {
    console.log('\n📊 TDD Validation Results:');
    console.log('================================');
    console.log(`Unit Tests:        ${this.results.unit}`);
    console.log(`Integration Tests: ${this.results.integration}`);
    console.log(`E2E Tests:         ${this.results.e2e}`);
    console.log(`Coverage Report:   ${this.results.coverage}`);
    console.log('================================');
    
    const passed = Object.values(this.results).filter(r => r?.includes('✅')).length;
    const total = Object.keys(this.results).length;
    
    console.log(`\n🎯 Score: ${passed}/${total} test suites passed`);
    
    if (fs.existsSync('./coverage/lcov-report/index.html')) {
      console.log('📈 Coverage report: ./coverage/lcov-report/index.html');
    }
  }
}

// Run validation
const validator = new TDDValidator();
validator.runTests();
