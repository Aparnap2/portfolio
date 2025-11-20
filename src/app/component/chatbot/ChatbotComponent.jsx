'use client'
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Send, Bot, X, Loader2, ChevronDown, MessageCircle, Briefcase, Calendar, DollarSign, Users, CheckCircle, AlertCircle, Phone } from "lucide-react";

const ChatbotComponent = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m Aparna\'s AI assistant. I help businesses explore AI automation solutions. What kind of business are you working with?',
      timestamp: new Date().toISOString(),
      confidence: null,
      intent: null,
      topics: ['lead_qualification']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Understanding your needs...');
  const [sessionId, setSessionId] = useState(null);
  const [conversationStage, setConversationStage] = useState('initial');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const controller = useRef(null);
  const loadingTimeoutRef = useRef(null);

  const cleanResponse = (text) => {
    if (!text) return '';
    
    return String(text)
      // Handle escaped newlines and line breaks
      .replace(/\\n/g, '\n')
      .replace(/\\r\\n|\\r/g, '\n')
      // Normalize different types of quotes
      .replace(/["""]/g, '"')
      .replace(/\s*"\s*/g, '"')
      // Clean up markdown code blocks
      .replace(/```(\w*)\s*([\s\S]*?)\s*```/g, '```$1\n$2\n```')
      // Fix markdown lists
      .replace(/(\n\s*)(\*|\-|\d+\.)\s+/g, '$1$2 ')
      // Limit consecutive newlines to 2
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  };

  const MarkdownRenderer = ({ children }) => {
    const cleanedContent = React.useMemo(() => cleanResponse(children), [children]);
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          p: ({ node, ...props }) => (
            <p className="mb-4 last:mb-0" {...normalizeProps(props)} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <pre className="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto">
                <code className={className} {...props}>
                  {String(children).replace(/\n$/, '')}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 text-sm" {...props}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a 
              className="text-purple-600 dark:text-purple-400 hover:underline" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 my-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 my-2" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-purple-500 pl-4 italic my-4 text-gray-600 dark:text-gray-300"
              {...props}
            />
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    );
  };

  // Helper functions
  function normalizeProps(props) {
    // Handle cases where children might contain problematic strings
    if (props.children) {
      return {
        ...props,
        children: Array.isArray(props.children) 
          ? props.children.map(processChild)
          : processChild(props.children)
      };
    }
    return props;
  }
  
  function processChild(child) {
    if (typeof child === 'string') {
      // Handle multiple newlines and triple quotes
      return child
        .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines to 2
        .replace(/"{3,}/g, '"""');    // Handle excessive quotes
    }
    return child;
  }
  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  const resetLoadingStates = useCallback(() => {
    clearTimeout(loadingTimeoutRef.current);
    setIsLoading(false);
    setIsStreaming(false);
    setLoadingProgress(0);
    setLoadingMessage('');
  }, []);

  // Quick action buttons for lead qualification
  const QuickActions = () => {
    if (!showQuickActions || isLoading || messages.length > 3) return null;

    const actions = [
      { text: "I need automation help", icon: <Bot className="w-4 h-4" />, intent: "automation" },
      { text: "Tell me about pricing", icon: <DollarSign className="w-4 h-4" />, intent: "pricing" },
      { text: "Schedule a consultation", icon: <Calendar className="w-4 h-4" />, intent: "demo" },
      { text: "Chat with Aparna directly", icon: <MessageCircle className="w-4 h-4" />, intent: "contact" }
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              setInput(action.text);
              setShowQuickActions(false);
            }}
            className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50 rounded-lg text-xs sm:text-sm transition-all duration-200 min-h-[44px]"
          >
            {action.icon}
            <span className="text-center">{action.text}</span>
          </button>
        ))}
      </div>
    );
  };

  // Handle quick action responses
  const handleQuickActionResponse = (text) => {
    if (text.toLowerCase().includes('pricing')) {
      return 'I can help you understand our pricing structure. To provide you with the most accurate information, could you tell me about your business size and what specific automation challenges you\'re trying to solve?';
    } else if (text.toLowerCase().includes('consultation') || text.toLowerCase().includes('schedule')) {
      return 'I\'d be happy to help you schedule a consultation with Aparna! To get started, could you share your name and email address? I\'ll also need to know a bit about your business so I can make sure it\'s a productive conversation.';
    } else if (text.toLowerCase().includes('directly') || text.toLowerCase().includes('chat with')) {
      return 'Aparna is happy to connect directly with interested businesses! For the fastest response, please share your email and I\'ll make sure you get his personal attention. You can also click the Slack message button below for instant messaging.';
    } else if (text.toLowerCase().includes('automation')) {
      return 'AI automation can transform how businesses operate! What specific tasks or processes are taking up most of your team\'s time? Understanding your current challenges will help me suggest the best automation opportunities for your business.';
    }
    return null;
  };

  // Lead capture success component
  const LeadCaptureSuccess = () => {
    if (!leadCaptured) return null;

    return (
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 mb-4">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <div>
            <h4 className="text-green-400 font-semibold">Information Captured!</h4>
            <p className="text-gray-300 text-sm mt-1">
              Aparna will follow up within 24 hours with personalized recommendations.
            </p>
          </div>
        </div>
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => {
              const email = 'your-email@example.com'; // Replace with actual email
              window.open(`mailto:${email}?subject=AI Automation Consultation Request`, '_blank');
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Email Aparna</span>
          </button>
          <button
            onClick={() => {
              window.open('https://join.slack.com/t/softservicesinc/shared_invite/zt-3j2toc5wg-2BuI1MhYKEXdSi4UoxQG3A', '_blank');
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Join on Slack</span>
          </button>
        </div>
      </div>
    );
  };

  // Conversation stage indicator
  const ConversationIndicator = () => {
    const stages = {
      initial: { icon: <Users className="w-4 h-4" />, text: 'Getting to know you', color: 'blue' },
      business_understanding: { icon: <Briefcase className="w-4 h-4" />, text: 'Understanding your business', color: 'purple' },
      solution_exploration: { icon: <Bot className="w-4 h-4" />, text: 'Exploring solutions', color: 'green' },
      lead_capture: { icon: <CheckCircle className="w-4 h-4" />, text: 'Connecting you with Aparna', color: 'orange' }
    };

    const currentStage = stages[conversationStage] || stages.initial;

    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800/30 rounded-lg mb-4">
        <div className={`text-${currentStage.color}-400`}>
          {currentStage.icon}
        </div>
        <span className="text-sm text-gray-400">{currentStage.text}</span>
      </div>
    );
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check for quick action responses first
    const quickResponse = handleQuickActionResponse(input);
    if (quickResponse && messages.length <= 3) {
      const userMsg = {
        role: 'user',
        content: input.replace(/\n/g, '\\n'),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);

      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: quickResponse,
          timestamp: new Date().toISOString(),
          confidence: 0.9,
          intent: input.toLowerCase().includes('pricing') ? 'pricing' : 'information',
          topics: ['lead_qualification']
        }]);

        // Update conversation stage based on intent
        if (input.toLowerCase().includes('consultation') || input.toLowerCase().includes('schedule')) {
          setConversationStage('lead_capture');
        } else if (input.toLowerCase().includes('pricing')) {
          setConversationStage('solution_exploration');
        }
      }, 500);

      setInput('');
      setShowQuickActions(false);
      return;
    }

    const userMsg = {
      role: 'user',
      content: input.replace(/\n/g, '\\n'),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    setInput('');
    setShowQuickActions(false);

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      confidence: null,
      intent: null,
      topics: []
    }]);

    setIsLoading(true);
    setIsStreaming(true);

    let reader;
    try {
      controller.current = new AbortController();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      };
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          messages: [...messages, {
            ...userMsg,
            content: input // Send unescaped version to API
          }]
        }),
        signal: controller.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const newSessionId = res.headers.get('x-session-id');
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
      }

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();

        for (const chunk of chunks) {
          if (!chunk.startsWith('data:')) continue;

          const data = chunk.replace(/^data:\s*/, '').trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);

            if (parsed.metadata) {
              // This is a metadata message
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.confidence = parsed.metadata.confidence;
                  lastMessage.intent = parsed.metadata.intent;
                  lastMessage.topics = parsed.metadata.topics;
                  lastMessage.proactive = parsed.metadata.proactive || false;
                }
                return newMessages;
              });

              // Update conversation stage based on intent
              if (parsed.metadata.intent) {
                if (parsed.metadata.intent === 'lead_capture') {
                  setConversationStage('lead_capture');
                } else if (parsed.metadata.intent === 'information_gathering') {
                  setConversationStage('business_understanding');
                } else if (parsed.metadata.intent === 'pricing') {
                  setConversationStage('solution_exploration');
                }
              }
            } else if (parsed.content) {
              // This is a content message
              const content = parsed.content;
              const isToolCall = parsed.tool_call || false;
              const isLeadCaptured = parsed.lead_captured || false;

              if (isToolCall) {
                // Tool call result - add as separate message
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: content,
                  timestamp: new Date().toISOString(),
                  isToolResult: true,
                  confidence: null // Tool results don't have confidence
                }]);

                // Update lead capture state
                if (isLeadCaptured) {
                  setLeadCaptured(true);
                  setConversationStage('lead_capture');
                }
              } else {
                // Regular streaming content
                responseText += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage) {
                    lastMessage.content = responseText;
                  }
                  return newMessages;
                });
              }
            }
          } catch (e) {
            console.warn('Error parsing chunk:', data, e);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ An error occurred while generating the response.',
          timestamp: new Date().toISOString()
        }]);
      }
    } finally {
      if (reader) await reader.cancel();
      setLoadingProgress(100);
      setLoadingMessage('Response complete');
      loadingTimeoutRef.current = setTimeout(resetLoadingStates, 500);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    let interval;
    if (isStreaming) {
      let progress = loadingProgress;
      const messages = [
        'Understanding your business needs',
        'Analyzing your requirements',
        'Preparing personalized response',
        'Getting ready to connect you'
      ];

      interval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 10, 95);
        setLoadingProgress(progress);
        setLoadingMessage(messages[Math.floor(progress / 25)]);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isStreaming, loadingProgress]);

  useEffect(() => scrollToBottom(), [messages, scrollToBottom]);
  useEffect(() => {
    return () => {
      controller.current?.abort();
      clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className={`relative w-full h-[95vh] sm:h-[85vh] md:h-[80vh] max-w-4xl max-h-[800px] bg-gray-900/95 backdrop-blur rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden transition-all duration-300 ${
          isExpanded ? 'h-[98vh]' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                AI Business Assistant
              </h2>
              <p className="text-xs text-gray-400">Helping you explore AI automation solutions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/50"
              aria-label={isExpanded ? 'Minimize' : 'Expand'}
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatRef}
          className="h-[calc(100%-120px)] p-4 space-y-4 overflow-y-auto custom-scrollbar"
        >
          {/* Conversation Stage Indicator */}
          <ConversationIndicator />

          {/* Lead Capture Success */}
          <LeadCaptureSuccess />

          {/* Quick Actions */}
          <QuickActions />

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] md:max-w-[75%] rounded-2xl p-3 sm:p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-none'
                    : 'bg-gray-800/70 border border-gray-700/50 rounded-bl-none text-gray-100'
                }`}
              >
                <MarkdownRenderer>
                  {message.content ? message.content.replace(/\[(CONFIDENCE|INTENT|TOPICS):[^\]]+\]/g, "").trim() : ''}
                </MarkdownRenderer>
                <div className="mt-2 text-xs opacity-50 text-right">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-start space-x-2 p-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1.5">
                <Bot className="w-full h-full text-white" />
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className="w-2 h-2 bg-gradient-to-r from-blue-300 to-purple-400 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${dot * 0.3}s`,
                      animationDuration: '1.5s',
                      animationIterationCount: 'infinite'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900/90 to-transparent">
          <form
            onSubmit={handleSubmit}
            className="flex items-end space-x-2"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me about your business and automation needs..."
                className="w-full bg-gray-800/70 border border-gray-700/50 text-white rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 resize-none"
                rows="1"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 bottom-2 p-1.5 rounded-lg ${
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-r from-orange-400 to-purple-500 text-white hover:opacity-90'
                    : 'text-gray-500'
                } transition-all`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-gray-400 text-center sm:text-left">
              💬 Personalized AI assistance for your business
            </p>
            <div className="flex items-center justify-center space-x-3">
              <a
                href="mailto:contact@example.com"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                title="Email Aparna"
              >
                <Send className="w-3 h-3" />
                <span className="hidden sm:inline">Email</span>
              </a>
              <a
                href="https://join.slack.com/t/softservicesinc/shared_invite/zt-3j2toc5wg-2BuI1MhYKEXdSi4UoxQG3A"
                target="_blank"
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                title="Join Slack Workspace"
              >
                <MessageCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Slack</span>
              </a>
            </div>
          </div>
        </div>
        

      </div>
    </div>
  );
};

export default ChatbotComponent;