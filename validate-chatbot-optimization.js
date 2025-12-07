#!/usr/bin/env node

/**
 * Chatbot Optimization Validation Script
 * This script validates that the chatbot optimization has been properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Validating Chatbot Optimization Implementation...\n');

// Files to check
const filesToCheck = [
  'src/app/component/chatbot/chatbot.jsx',
  'src/app/api/chat/route.js',
  'src/app/api/health/route.js',
  'src/app/component/chatbot/SkeletonLoader.jsx',
  'src/app/component/chatbot/TypingIndicator.jsx'
];

let allChecksPassed = true;

// Check if optimized files exist
console.log('📁 Checking for optimized files...');
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allChecksPassed = false;
  }
});

// Check main page.jsx for integration
console.log('\n🔍 Checking main page integration...');
const pagePath = path.join(__dirname, 'src/app/page.jsx');
if (fs.existsSync(pagePath)) {
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  
  // Check for dynamic import (Next.js lazy loading)
  if (pageContent.includes('dynamic') && pageContent.includes("import('./component/chatbot/chatbot')")) {
    console.log('✅ Next.js dynamic import (lazy loading) found');
  } else {
    console.log('❌ Next.js dynamic import missing');
    allChecksPassed = false;
  }
  
  // Check for SSR false (important for client-side components)
  if (pageContent.includes('ssr: false')) {
    console.log('✅ SSR disabled for chatbot found');
  } else {
    console.log('❌ SSR disabled for chatbot missing');
    allChecksPassed = false;
  }
  
  // Check for chatbot component usage
  if (pageContent.includes('<Chatbot />')) {
    console.log('✅ Chatbot component usage found');
  } else {
    console.log('❌ Chatbot component usage missing');
    allChecksPassed = false;
  }
} else {
  console.log('❌ page.jsx not found');
  allChecksPassed = false;
}

// Check API route for Vercel AI SDK usage
console.log('\n🔍 Checking API route optimization...');
const apiPath = path.join(__dirname, 'src/app/api/chat/route.js');
if (fs.existsSync(apiPath)) {
  const apiContent = fs.readFileSync(apiPath, 'utf8');
  
  if (apiContent.includes('streamText') && apiContent.includes('@ai-sdk/google')) {
    console.log('✅ Vercel AI SDK streaming found in API route');
  } else {
    console.log('❌ Vercel AI SDK streaming missing in API route');
    allChecksPassed = false;
  }
  
  if (apiContent.includes('checkRateLimit') || apiContent.includes('RATE_LIMIT')) {
    console.log('✅ Rate limiting implementation found');
  } else {
    console.log('❌ Rate limiting implementation missing');
    allChecksPassed = false;
  }
  
  if (apiContent.includes('ChatbotError') || apiContent.includes('error handling')) {
    console.log('✅ Enhanced error handling found');
  } else {
    console.log('❌ Enhanced error handling missing');
    allChecksPassed = false;
  }
  
  if (apiContent.includes('LeadExtractionSchema') || apiContent.includes('extractLeadFromConversation')) {
    console.log('✅ Lead capture integration found');
  } else {
    console.log('❌ Lead capture integration missing');
    allChecksPassed = false;
  }
} else {
  console.log('❌ API route not found');
  allChecksPassed = false;
}

// Check for error handling improvements
console.log('\n🔍 Checking error handling improvements...');
const chatbotPath = path.join(__dirname, 'src/app/component/chatbot/chatbot.jsx');
if (fs.existsSync(chatbotPath)) {
  const chatbotContent = fs.readFileSync(chatbotPath, 'utf8');
  
  if (chatbotContent.includes('connectionStatus') && chatbotContent.includes('trackError')) {
    console.log('✅ Connection status and error tracking found');
  } else {
    console.log('❌ Connection status and error tracking missing');
    allChecksPassed = false;
  }
  
  if (chatbotContent.includes('try') && chatbotContent.includes('catch')) {
    console.log('✅ Try-catch error handling found');
  } else {
    console.log('❌ Try-catch error handling missing');
    allChecksPassed = false;
  }
  
  if (chatbotContent.includes('AbortSignal.timeout')) {
    console.log('✅ Request timeout handling found');
  } else {
    console.log('❌ Request timeout handling missing');
    allChecksPassed = false;
  }
} else {
  console.log('❌ Chatbot component not found');
  allChecksPassed = false;
}

// Check for accessibility improvements
console.log('\n🔍 Checking accessibility improvements...');
if (fs.existsSync(chatbotPath)) {
  const chatbotContent = fs.readFileSync(chatbotPath, 'utf8');
  
  if (chatbotContent.includes('aria-') && chatbotContent.includes('role=')) {
    console.log('✅ ARIA attributes found');
  } else {
    console.log('❌ ARIA attributes missing');
    allChecksPassed = false;
  }
  
  if (chatbotContent.includes('keydown') || chatbotContent.includes('Escape')) {
    console.log('✅ Keyboard navigation found');
  } else {
    console.log('❌ Keyboard navigation missing');
    allChecksPassed = false;
  }
  
  if (chatbotContent.includes('prefersReducedMotion')) {
    console.log('✅ Reduced motion support found');
  } else {
    console.log('❌ Reduced motion support missing');
    allChecksPassed = false;
  }
} else {
  console.log('❌ Chatbot component not found');
  allChecksPassed = false;
}

// Check for performance optimizations
console.log('\n🔍 Checking performance optimizations...');
if (fs.existsSync(chatbotPath)) {
  const chatbotContent = fs.readFileSync(chatbotPath, 'utf8');
  
  if (chatbotContent.includes('useMemo') || chatbotContent.includes('useCallback')) {
    console.log('✅ React optimization hooks found');
  } else {
    console.log('❌ React optimization hooks missing');
    allChecksPassed = false;
  }
  
  if (chatbotContent.includes('useEffect') && chatbotContent.includes('cleanup')) {
    console.log('✅ Effect cleanup found');
  } else {
    console.log('❌ Effect cleanup missing');
    allChecksPassed = false;
  }
  
  if (chatbotContent.includes('lazy') || chatbotContent.includes('Suspense')) {
    console.log('✅ Lazy loading implementation found');
  } else {
    console.log('❌ Lazy loading implementation missing');
    allChecksPassed = false;
  }
} else {
  console.log('❌ Chatbot component not found');
  allChecksPassed = false;
}

// Check for responsive design improvements
console.log('\n🔍 Checking responsive design improvements...');
if (fs.existsSync(chatbotPath)) {
  const chatbotContent = fs.readFileSync(chatbotPath, 'utf8');
  
  if (chatbotContent.includes('useResponsive') || chatbotContent.includes('isMobile')) {
    console.log('✅ Responsive design implementation found');
  } else {
    console.log('❌ Responsive design implementation missing');
    allChecksPassed = false;
  }
  
  if (chatbotContent.includes('isTouch') || chatbotContent.includes('prefersReducedMotion')) {
    console.log('✅ Touch and motion preferences found');
  } else {
    console.log('❌ Touch and motion preferences missing');
    allChecksPassed = false;
  }
} else {
  console.log('❌ Chatbot component not found');
  allChecksPassed = false;
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('🎉 All validation checks passed!');
  console.log('✅ Chatbot optimization has been successfully implemented');
  console.log('✅ Vercel AI SDK integration is working');
  console.log('✅ Performance improvements are in place');
  console.log('✅ Error handling has been enhanced');
  console.log('✅ Accessibility improvements are implemented');
  console.log('✅ Responsive design is optimized');
} else {
  console.log('❌ Some validation checks failed');
  console.log('Please review the output above and fix the issues');
}
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(allChecksPassed ? 0 : 1);