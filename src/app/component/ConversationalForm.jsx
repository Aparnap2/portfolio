'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ConversationalForm = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm here to help you explore AI automation for your business. What type of business do you run?",
      quickReplies: [
        "E-commerce/Online Store",
        "Service Business", 
        "SaaS/Tech Company",
        "Other"
      ]
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadData, setLeadData] = useState({});
  const [currentStep, setCurrentStep] = useState('business_type');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const conversationFlow = {
    business_type: {
      next: 'pain_point',
      question: "Great! What's your biggest challenge right now?",
      quickReplies: [
        "Too many manual tasks",
        "Poor lead management",
        "Customer service overload",
        "Data entry nightmare"
      ]
    },
    pain_point: {
      next: 'budget',
      question: "I can definitely help with that! What's your budget range for automation?",
      quickReplies: [
        "$500-1,000",
        "$1,000-2,500",
        "$2,500-5,000",
        "$5,000+"
      ]
    },
    budget: {
      next: 'timeline',
      question: "Perfect! When would you like to get started?",
      quickReplies: [
        "ASAP",
        "Within 2 weeks",
        "Within a month",
        "Just exploring"
      ]
    },
    timeline: {
      next: 'contact',
      question: "Excellent! I'd love to show you exactly how I can solve this. What's the best email to send you a personalized demo?",
      quickReplies: []
    },
    contact: {
      next: 'complete',
      question: "And your name so I can personalize everything?",
      quickReplies: []
    }
  };

  const calculateLeadScore = (data) => {
    let score = 0;
    
    // Budget scoring
    if (data.budget?.includes('5,000+')) score += 4;
    else if (data.budget?.includes('2,500-5,000')) score += 3;
    else if (data.budget?.includes('1,000-2,500')) score += 2;
    else score += 1;
    
    // Timeline scoring
    if (data.timeline === 'ASAP') score += 3;
    else if (data.timeline === 'Within 2 weeks') score += 2;
    else if (data.timeline === 'Within a month') score += 1;
    
    // Business type scoring
    if (data.business_type === 'SaaS/Tech Company') score += 2;
    else if (data.business_type === 'E-commerce/Online Store') score += 2;
    
    return score;
  };

  const syncToHubSpot = async (finalData) => {
    try {
      const leadScore = calculateLeadScore(finalData);
      
      const hubspotData = {
        properties: {
          email: finalData.email,
          firstname: finalData.name,
          lead_source: "AI Chatbot",
          business_type: finalData.business_type,
          pain_point: finalData.pain_point,
          budget_range: finalData.budget,
          timeline: finalData.timeline,
          qualification_score: leadScore.toString(),
          notes: `Chatbot conversation lead - Score: ${leadScore}/10`
        }
      };

      // This would be your actual HubSpot API call
      console.log('Syncing to HubSpot:', hubspotData);
      
      // For now, we'll simulate the API call
      return { success: true, leadScore };
    } catch (error) {
      console.error('HubSpot sync failed:', error);
      return { success: false, error };
    }
  };

  const addMessage = (type, content, quickReplies = []) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      quickReplies,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleQuickReply = async (reply) => {
    // Add user message
    addMessage('user', reply);
    
    // Update lead data
    const updatedLeadData = { ...leadData, [currentStep]: reply };
    setLeadData(updatedLeadData);
    
    setIsTyping(true);
    
    // Simulate typing delay
    setTimeout(async () => {
      setIsTyping(false);
      
      const nextStep = conversationFlow[currentStep]?.next;
      
      if (nextStep === 'complete') {
        // Final step - sync to HubSpot
        const syncResult = await syncToHubSpot(updatedLeadData);
        
        if (syncResult.success) {
          const finalMessage = syncResult.leadScore >= 7 
            ? "🎉 Perfect! You're exactly the type of client I love working with. I'm sending you a personalized demo and will reach out within 24 hours to schedule a call. Check your email in the next few minutes!"
            : "Thanks for your interest! I'm sending you some relevant case studies and will follow up with next steps. Check your email shortly!";
          
          addMessage('bot', finalMessage);
        } else {
          addMessage('bot', "Thanks for your interest! I'll be in touch soon with next steps.");
        }
      } else if (conversationFlow[nextStep]) {
        setCurrentStep(nextStep);
        addMessage('bot', conversationFlow[nextStep].question, conversationFlow[nextStep].quickReplies);
      }
    }, 1000);
  };

  const handleTextInput = async (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;
    
    const input = currentInput.trim();
    setCurrentInput('');
    
    // Add user message
    addMessage('user', input);
    
    // Handle email and name inputs
    if (currentStep === 'contact') {
      if (input.includes('@')) {
        const updatedLeadData = { ...leadData, email: input };
        setLeadData(updatedLeadData);
        setCurrentStep('name');
        
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('bot', "And your name so I can personalize everything?");
        }, 1000);
      }
    } else if (currentStep === 'name') {
      const finalLeadData = { ...leadData, name: input };
      setLeadData(finalLeadData);
      
      setIsTyping(true);
      setTimeout(async () => {
        setIsTyping(false);
        
        const syncResult = await syncToHubSpot(finalLeadData);
        
        if (syncResult.success) {
          const finalMessage = syncResult.leadScore >= 7 
            ? `🎉 Perfect, ${input}! You're exactly the type of client I love working with. I'm sending you a personalized demo and will reach out within 24 hours to schedule a call. Check your email in the next few minutes!`
            : `Thanks ${input}! I'm sending you some relevant case studies and will follow up with next steps. Check your email shortly!`;
          
          addMessage('bot', finalMessage);
        } else {
          addMessage('bot', `Thanks ${input}! I'll be in touch soon with next steps.`);
        }
      }, 1000);
    }
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold">AP</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Aparna&apos;s AI Assistant</h3>
            <p className="text-white/80 text-sm">Usually replies instantly</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-zinc-700 text-gray-100'
              }`}>
                <p className="text-sm">{message.content}</p>
                
                {/* Quick Replies */}
                {message.quickReplies && message.quickReplies.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="block w-full text-left px-3 py-2 bg-zinc-600 hover:bg-zinc-500 rounded text-sm transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-zinc-700 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {(currentStep === 'contact' || currentStep === 'name') && (
        <form onSubmit={handleTextInput} className="p-4 border-t border-zinc-700">
          <div className="flex space-x-2">
            <input
              type={currentStep === 'contact' ? 'email' : 'text'}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder={currentStep === 'contact' ? 'your@email.com' : 'Your name...'}
              className="flex-1 bg-zinc-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      )}
      
      {/* Fallback Form Link */}
      <div className="p-4 border-t border-zinc-700 text-center">
        <button 
          onClick={() => window.open('https://share.hsforms.com/1your-form-id', '_blank')}
          className="text-sm text-gray-400 hover:text-gray-300 underline"
        >
          Prefer a traditional form instead?
        </button>
      </div>
    </div>
  );
};