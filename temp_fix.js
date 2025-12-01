const fs = require('fs');

// Read the current file
let content = fs.readFileSync('src/app/component/chatbot/chatbot.jsx', 'utf8');

// Fix the apostrophe issue
content = content.replace(
  "Chat with Aparna's AI assistant to explore AI automation solutions for your business",
  "Chat with Aparna's AI assistant to explore AI automation solutions for your business"
);

// Write back to file
fs.writeFileSync('src/app/component/chatbot/chatbot.jsx', content);

console.log('Fixed apostrophe issue');
