#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { OPPORTUNITY_TEMPLATES } from '../lib/data/opportunity-templates';

const prisma = new PrismaClient();

async function seedOpportunityTemplates() {
  console.log('🌱 Seeding opportunity templates...');
  
  try {
    // Check if templates already exist
    const existingCount = await prisma.opportunityTemplate.count();
    
    if (existingCount > 0) {
      console.log(`✅ Found ${existingCount} existing templates. Skipping seed.`);
      return;
    }
    
    // Create templates
    for (const template of OPPORTUNITY_TEMPLATES) {
      await prisma.opportunityTemplate.create({
        data: {
          name: template.name,
          slug: template.slug,
          category: template.category,
          difficulty: template.difficulty,
          shortDescription: template.shortDescription,
          fullDescription: template.fullDescription,
          problemItSolves: template.problemItSolves,
          avgDevCostMin: template.avgDevCostMin,
          avgDevCostMax: template.avgDevCostMax,
          avgTimeSavedHrsMonth: template.avgTimeSavedHrsMonth,
          avgErrorReduction: template.avgErrorReduction,
          avgImplementationWeeks: template.avgImplementationWeeks,
          complexity: template.complexity,
          matchingRules: template.matchingRules,
          techStack: template.techStack,
          integrationsRequired: template.integrationsRequired,
          exampleWorkflow: template.exampleWorkflow,
          realWorldExample: template.realWorldExample,
          timesMatched: template.timesMatched,
          avgClientSatisfaction: template.avgClientSatisfaction,
        }
      });
      
      console.log(`✅ Created template: ${template.name}`);
    }
    
    console.log(`🎉 Successfully seeded ${OPPORTUNITY_TEMPLATES.length} opportunity templates!`);
    
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedOpportunityTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedOpportunityTemplates };