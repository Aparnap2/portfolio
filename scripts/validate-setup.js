#!/usr/bin/env node

/**
 * Validation script for HubSpot + Discord integration
 * Checks all required environment variables and services
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SetupValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  async validate() {
    console.log('🔍 Validating HubSpot + Discord Integration Setup...\n');

    this.checkEnvironmentFile();
    this.checkEnvironmentVariables();
    this.checkDependencies();
    this.checkWorkerFiles();
    this.checkChatbotComponent();
    this.checkRedisConnection();
    this.checkRabbitMQConnection();

    this.printResults();
    this.generateReport();
  }

  checkEnvironmentFile() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      this.success.push('.env.local file exists');
    } else {
      this.errors.push('.env.local file missing - copy from .env.example');
    }
  }

  checkEnvironmentVariables() {
    const required = [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'GEMINI_API_KEY',
      'HUBSPOT_ACCESS_TOKEN',
      'DISCORD_WEBHOOK_URL',
      'DISCORD_INVITE_URL',
      'CLOUDAMQP_URL'
    ];

    required.forEach(key => {
      if (process.env[key]) {
        this.success.push(`${key} is configured`);
      } else {
        this.errors.push(`${key} is missing in environment`);
      }
    });
  }

  checkDependencies() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const required = ['amqplib', '@upstash/redis', 'discord.js', 'dotenv'];

    required.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        this.success.push(`${dep} dependency installed`);
      } else {
        this.errors.push(`${dep} dependency missing`);
      }
    });
  }

  checkWorkerFiles() {
    const workerPath = path.join(process.cwd(), 'src', 'workers', 'discord-worker.js');
    if (fs.existsSync(workerPath)) {
      this.success.push('Discord worker file exists');
    } else {
      this.errors.push('Discord worker file missing');
    }
  }

  checkChatbotComponent() {
    const componentPath = path.join(process.cwd(), 'src', 'app', 'component', 'chatbot', 'ChatbotComponent.jsx');
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      if (content.includes('MessageCircle') && content.includes('DISCORD_INVITE_URL')) {
        this.success.push('Discord button integrated in chatbot');
      } else {
        this.warnings.push('Discord button might not be properly configured');
      }
    } else {
      this.errors.push('Chatbot component file missing');
    }
  }

  checkRedisConnection() {
    try {
      const Redis = require('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      // Quick test - this will throw if connection fails
      redis.ping();
      this.success.push('Redis connection configured');
    } catch (error) {
      this.warnings.push('Redis connection test failed - check credentials');
    }
  }

  checkRabbitMQConnection() {
    try {
      const url = process.env.CLOUDAMQP_URL;
      if (url && url.startsWith('amqps://')) {
        this.success.push('RabbitMQ URL format looks correct');
      } else {
        this.warnings.push('RabbitMQ URL might be incorrect format');
      }
    } catch (error) {
      this.errors.push('RabbitMQ configuration error');
    }
  }

  printResults() {
    console.log('📊 Validation Results:\n');

    if (this.success.length > 0) {
      console.log('✅ Success:');
      this.success.forEach(item => console.log(`   ${item}`));
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(item => console.log(`   ${item}`));
      console.log();
    }

    if (this.errors.length > 0) {
      console.log('❌ Errors:');
      this.errors.forEach(item => console.log(`   ${item}`));
      console.log();
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      success: this.success,
      warnings: this.warnings,
      errors: this.errors,
      status: this.errors.length === 0 ? 'PASS' : 'FAIL'
    };

    fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved to validation-report.json');
  }
}

// Run validation
if (require.main === module) {
  require('dotenv').config();
  const validator = new SetupValidator();
  validator.validate().catch(console.error);
}

module.exports = SetupValidator;