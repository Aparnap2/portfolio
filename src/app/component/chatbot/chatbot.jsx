'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { Send, Bot, X, ChevronDown, MessageCircle, Briefcase, Calendar, DollarSign, Users, CheckCircle, AlertCircle, Phone, Minimize2, Maximize2, RotateCcw, Loader2 } from "lucide-react";
import { useDebounce } from '../../../hooks/useDebounce';
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import './chatbot.css';

const ChatbotComponent = ({
  onClose,
  onMinimize,
  isMinimized = false,
  isMobile = false,
  isTablet = false,
  isDesktop = false,
  isTouch = false,
  prefersReducedMotion = false,
  windowSize = { width: 0, height: 0 },
  performanceHooks = {}
}) => {
  const { trackEngagement, trackError, getMetrics } = performanceHooks;
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
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Debounce input for better performance
  const debouncedInput = useDebounce(input, 300);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Understanding your needs...');
  const [sessionId, setSessionId] = useState(null);
  const [conversationStage, setConversationStage] = useState('initial');
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [error, setError] = useState(null);
  const [canRetry, setCanRetry] = useState(false);

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const controller = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const responseBufferRef = useRef("");
  const flushTimerRef = useRef(null);
  const lastErrorRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      // Use requestAnimationFrame for smoother scrolling and better performance
      requestAnimationFrame(() => {
        chatRef.current?.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, []);

  // Optimized scroll handler with intersection observer
  const setupScrollObserver = useCallback(() => {
    if (!chatRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Message is visible, can optimize rendering
            entry.target.setAttribute('data-visible', 'true');
          }
        });
      },
      {
        root: chatRef.current,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    // Observe all message elements
    const messages = chatRef.current.querySelectorAll('[data-message]');
    messages.forEach((msg) => observer.observe(msg));

    return () => observer.disconnect();
  }, []);

  // Enhanced auto-resize for textarea
  const autoResizeTextarea = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const newHeight = Math.min(inputRef.current.scrollHeight, 120); // Max 120px
      inputRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  const flushBufferedResponse = useCallback(() => {
    if (!responseBufferRef.current) return;
    const delta = responseBufferRef.current;
    responseBufferRef.current = "";
    setMessages(prev => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last) last.content = (last.content || "") + delta;
      return next;
    });
  }, []);

  const startFlusher = useCallback(() => {
    if (flushTimerRef.current) return;
    // Use requestAnimationFrame for better performance and smoother updates
    const flush = () => {
      flushBufferedResponse();
      if (flushTimerRef.current && isStreaming) {
        flushTimerRef.current = requestAnimationFrame(flush);
      }
    };
    flushTimerRef.current = requestAnimationFrame(flush);
  }, [flushBufferedResponse, isStreaming]);

  const stopFlusher = useCallback(() => {
    if (flushTimerRef.current) {
      cancelAnimationFrame(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    flushBufferedResponse();
  }, [flushBufferedResponse]);

  // Memory optimization - cleanup old messages
  const cleanupOldMessages = useCallback(() => {
    const MAX_MESSAGES = 100; // Limit message history
    setMessages(prev => {
      if (prev.length > MAX_MESSAGES) {
        return prev.slice(-MAX_MESSAGES);
      }
      return prev;
    });
  }, []);

  const resetLoadingStates = useCallback(() => {
    clearTimeout(loadingTimeoutRef.current);
    stopFlusher();
    setIsLoading(false);
    setIsStreaming(false);
    setLoadingProgress(0);
    setLoadingMessage('');
    setError(null);
    setCanRetry(false);
  }, [stopFlusher]);

  // Retry functionality
  const handleRetry = useCallback(() => {
    if (lastErrorRef.current) {
      const lastInput = lastErrorRef.current;
      setError(null);
      setCanRetry(false);
      setInput(lastInput);
      setTimeout(() => {
        // Trigger form submission with the last input
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }, 100);
    }
  }, []);

  // Enhanced quick action buttons with premium styling
  const QuickActions = useMemo(() => {
    if (!showQuickActions || isLoading || messages.length > 3) return null;

    const actions = [
      { text: "🤖 I need automation help", icon: <Bot className="w-4 h-4" />, intent: "automation", color: "from-blue-500 to-purple-500" },
      { text: "💰 Tell me about pricing", icon: <DollarSign className="w-4 h-4" />, intent: "pricing", color: "from-green-500 to-emerald-500" },
      { text: "📅 Schedule a consultation", icon: <Calendar className="w-4 h-4" />, intent: "demo", color: "from-orange-500 to-red-500" },
      { text: "💬 Chat with Aparna directly", icon: <MessageCircle className="w-4 h-4" />, intent: "contact", color: "from-purple-500 to-pink-500" }
    ];

    return (
      <div className={`grid gap-3 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        }`}>
        {actions.map((action, index) => (
          <button
            key={`${action.intent}-${index}`}
            onClick={() => {
              setInput(action.text);
              setShowQuickActions(false);
            }}
            className={`group flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r ${action.color} bg-opacity-15 hover:bg-opacity-25 text-slate-200 hover:text-white border border-slate-600/40 hover:border-slate-500/60 rounded-xl text-sm font-medium transition-all duration-200 min-h-[52px] backdrop-blur-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900/50`}
            disabled={isLoading}
          >
            <span className="group-hover:scale-110 transition-transform duration-200">
              {action.icon}
            </span>
            <span className="text-center">{action.text}</span>
          </button>
        ))}
      </div>
    );
  }, [showQuickActions, isLoading, messages.length, isMobile]);

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

  // Premium lead capture success component
  const LeadCaptureSuccess = useMemo(() => {
    if (!leadCaptured) return null;

    return (
      <div className="bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 border border-emerald-500/40 rounded-xl p-5 mb-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-emerald-400 font-bold mb-2 text-lg">🎉 Information Captured!</h4>
            <p className="text-slate-200 text-sm leading-relaxed mb-4">
              Aparna will follow up within 24 hours with personalized recommendations.
            </p>
          </div>
        </div>
        <div className={`flex mt-4 gap-3 ${isMobile ? 'flex-col' : 'flex-row'
          }`}>
          <button
            onClick={() => {
              const email = 'softservicesinc.portfolio@gmail.com';
              window.open(`mailto:${email}?subject=AI Automation Consultation Request`, '_blank');
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/70"
          >
            <Send className="w-4 h-4" />
            <span>📧 Email Aparna</span>
          </button>
          <button
            onClick={() => {
              window.open('https://join.slack.com/t/softservicesinc/shared_invite/zt-3j2toc5wg-2BuI1MhYKEXdSi4UoxQG3A', '_blank');
            }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-400/70"
          >
            <MessageCircle className="w-4 h-4" />
            <span>💬 Join on Slack</span>
          </button>
        </div>
      </div>
    );
  }, [leadCaptured, isMobile]);

  // Premium conversation stage indicator
  const ConversationIndicator = useMemo(() => {
    const stages = {
      initial: { icon: <Users className="w-4 h-4" />, text: '👋 Getting to know you', color: 'blue', bgColor: 'from-blue-500/20 to-blue-600/20', borderColor: 'border-blue-500/40', textColor: 'text-blue-300' },
      business_understanding: { icon: <Briefcase className="w-4 h-4" />, text: '💼 Understanding your business', color: 'purple', bgColor: 'from-purple-500/20 to-purple-600/20', borderColor: 'border-purple-500/40', textColor: 'text-purple-300' },
      solution_exploration: { icon: <Bot className="w-4 h-4" />, text: '🤖 Exploring solutions', color: 'green', bgColor: 'from-green-500/20 to-green-600/20', borderColor: 'border-green-500/40', textColor: 'text-green-300' },
      lead_capture: { icon: <CheckCircle className="w-4 h-4" />, text: '🎯 Connecting you with Aparna', color: 'orange', bgColor: 'from-orange-500/20 to-orange-600/20', borderColor: 'border-orange-500/40', textColor: 'text-orange-300' }
    };

    const currentStage = stages[conversationStage] || stages.initial;

    return (
      <div className={`flex items-center space-x-4 px-5 py-4 bg-gradient-to-r ${currentStage.bgColor} border ${currentStage.borderColor} rounded-xl mb-6 backdrop-blur-sm shadow-lg`}>
        <div className={`flex-shrink-0 w-10 h-10 bg-${currentStage.color}-500/20 rounded-full flex items-center justify-center shadow-md`}>
          <span className={currentStage.textColor}>
            {currentStage.icon}
          </span>
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-slate-200">{currentStage.text}</span>
          <div className={`w-full bg-slate-700/50 rounded-full h-2 mt-2 overflow-hidden`}>
            <div className={`bg-gradient-to-r ${currentStage.bgColor.replace('/20', '/60')} h-2 rounded-full transition-all duration-500 shadow-sm`}
              style={{ width: `${Object.keys(stages).indexOf(conversationStage) * 25 + 25}%` }}></div>
          </div>
        </div>
      </div>
    );
  }, [conversationStage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Track message submission
    trackEngagement?.('message_sent', {
      messageLength: input.trim().length,
      messageCount: messages.length + 1,
      device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    });

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
    setError(null);

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
    startFlusher();

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

      const requestBody = {
        messages: [...messages, {
          ...userMsg,
          content: input.trim() // Send clean version to API
        }]
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: controller.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const newSessionId = res.headers.get('x-session-id');
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
      }

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      responseBufferRef.current = "";

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

            if (parsed.error) {
              // Handle server-side errors
              setError(parsed.message || 'An error occurred');
              setCanRetry(true);
              lastErrorRef.current = input.trim();
              break;
            }

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
                // Regular streaming content (buffered)
                responseBufferRef.current += content;
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
        const errorMessage = err.message || 'An error occurred while generating the response.';

        // Track error with performance hook
        trackError?.(err, 'message_streaming');

        setError(errorMessage);
        setCanRetry(true);
        lastErrorRef.current = input.trim();

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ ${errorMessage}`,
          timestamp: new Date().toISOString()
        }]);
      }
    } finally {
      if (reader) await reader.cancel();
      stopFlusher();
      setLoadingProgress(100);
      setLoadingMessage('Response complete');
      loadingTimeoutRef.current = setTimeout(resetLoadingStates, 500);
    }
  };

  // Auto-resize textarea with performance optimization
  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  // Handle typing indicator
  useEffect(() => {
    if (debouncedInput && debouncedInput !== input) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [debouncedInput, input]);

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
  // Fixed loading progress effect without infinite loop
  useEffect(() => {
    let interval;
    if (isStreaming) {
      let progress = 0; // Initialize progress locally
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
  }, [isStreaming]); // Remove loadingProgress from dependency to prevent infinite loop

  // Optimized effects with better performance
  useLayoutEffect(() => {
    scrollToBottom();
    // Setup scroll observer for performance optimization
    const cleanup = setupScrollObserver();
    return cleanup;
  }, [messages, scrollToBottom, setupScrollObserver]);

  useEffect(() => {
    // Cleanup function with proper resource management
    return () => {
      controller.current?.abort();
      clearTimeout(loadingTimeoutRef.current);
      stopFlusher();
      // Cleanup memory
      responseBufferRef.current = "";
      lastErrorRef.current = null;
    };
  }, [stopFlusher]);

  // Memory cleanup effect
  useEffect(() => {
    const interval = setInterval(cleanupOldMessages, 30000); // Cleanup every 30 seconds
    return () => clearInterval(interval);
  }, [cleanupOldMessages]);

  // Calculate optimal dimensions based on screen size and device type
  const containerDimensions = useMemo(() => {
    if (isMinimized) {
      return {
        width: isMobile ? '100vw' : '400px',
        height: '60px',
        maxWidth: isMobile ? '100vw' : '400px'
      };
    }

    if (isMobile) {
      return {
        width: '100vw',
        height: '100vh',
        height: '100dvh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        maxHeight: '100dvh',
        borderRadius: '0'
      };
    }

    if (isTablet) {
      return {
        width: isExpanded ? '95vw' : '85vw',
        height: isExpanded ? '90vh' : '80vh',
        maxWidth: isExpanded ? '1000px' : '700px',
        maxHeight: isExpanded ? '800px' : '600px'
      };
    }

    if (isExpanded) {
      return {
        width: '95vw',
        height: '95vh',
        maxWidth: '1200px',
        maxHeight: '900px'
      };
    }

    return {
      width: '380px',
      height: '600px',
      maxWidth: '380px',
      maxHeight: '600px'
    };
  }, [isMobile, isTablet, isExpanded, isMinimized]);

  return (
    <div className={`${isMobile ? 'fixed inset-0' : 'relative'} ${isMinimized ? '' : ''}`} role="dialog" aria-modal="true" aria-label="AI Business Assistant Chat">
      <div
        className={`relative bg-gray-900/95 backdrop-blur-xl border border-gray-600/70 shadow-2xl overflow-hidden transition-all duration-300 ${isMobile ? 'rounded-none w-full h-full' : 'rounded-2xl'
          } ${isMinimized ? 'cursor-pointer hover:bg-gray-800/95' : ''}`}
        style={containerDimensions}
        onClick={isMinimized ? onMinimize : undefined}
        role="complementary"
        aria-label={isMinimized ? "Minimized chat window" : "AI Business Assistant Chat Window"}
      >
        {/* Enhanced Header with premium styling */}
        <header className={`flex items-center justify-between border-b border-slate-700/50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl ${isMinimized ? 'p-3' : 'p-4'
          }`}>
          <div className="flex items-center space-x-3">
            <div className={`rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg ${isMinimized ? 'p-1.5' : 'p-2'
              }`} aria-hidden="true">
              <Bot className={`text-white ${isMinimized ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>
            {!isMinimized && (
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🤖 AI Business Assistant
                </h2>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-slate-300 font-medium" id="chatbot-status">Helping you explore AI automation solutions</p>
                  {connectionStatus !== 'connected' && (
                    <div className={`flex items-center space-x-1 text-xs ${connectionStatus === 'connecting' ? 'text-amber-400' : 'text-red-400'
                      }`} role="status" aria-live="polite" aria-atomic="true">
                      <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                        }`} aria-hidden="true" />
                      <span className="font-medium">{connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isMinimized && (
            <nav className="flex items-center space-x-1" role="navigation" aria-label="Chat controls">
              {/* Enhanced retry button for errors */}
              {error && canRetry && (
                <button
                  onClick={() => {
                    trackEngagement?.('retry_clicked');
                    handleRetry();
                  }}
                  className={`p-2 text-slate-300 hover:text-blue-400 rounded-full hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:ring-offset-1 focus:ring-offset-slate-900/50 ${prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md'
                    }`}
                  aria-label="Retry last message"
                  title="Retry last message"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
              )}

              {/* Enhanced expand/minimize button - desktop only */}
              {!isMobile && (
                <button
                  onClick={() => {
                    trackEngagement?.(isExpanded ? 'window_restored' : 'window_expanded');
                    setIsExpanded(!isExpanded);
                  }}
                  className={`p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-400/70 focus:ring-offset-1 focus:ring-offset-slate-900/50 ${prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md'
                    }`}
                  aria-label={isExpanded ? 'Restore chat window size' : 'Expand chat window'}
                  title={isExpanded ? 'Restore chat window size' : 'Expand chat window'}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Maximize2 className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              )}

              {/* Enhanced minimize button - desktop only */}
              {!isMobile && onMinimize && (
                <button
                  onClick={(e) => {
                    trackEngagement?.('window_minimized');
                    if (onMinimize && typeof onMinimize === 'function') {
                      onMinimize(e);
                    }
                  }}
                  className={`p-2 text-slate-300 hover:text-amber-400 rounded-full hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:ring-offset-1 focus:ring-offset-slate-900/50 ${prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md'
                    }`}
                  aria-label="Minimize chat window"
                  title="Minimize chat window"
                >
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </button>
              )}

              {/* Enhanced close button */}
              <button
                onClick={() => {
                  trackEngagement?.('close_button_clicked');
                  if (onClose && typeof onClose === 'function') {
                    onClose();
                  }
                }}
                className={`p-2 text-slate-300 hover:text-red-400 rounded-full hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-400/70 focus:ring-offset-1 focus:ring-offset-slate-900/50 ${prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md'
                  }`}
                aria-label="Close chat window"
                title="Close chat window"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </header>

        {/* Chat Messages - only show when not minimized */}
        {!isMinimized && (
          <main
            ref={chatRef}
            className={`overflow-y-auto custom-scrollbar scroll-smooth space-y-4 ${isMobile
                ? 'flex-1 p-3'
                : 'h-[calc(100%-140px)] p-4'
              }`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #1F2937',
              overflowY: 'auto'
            }}
            role="log"
            aria-label="Chat conversation"
            aria-live="polite"
            aria-atomic="false"
            tabIndex="0"
          >
            {/* Conversation Stage Indicator */}
            {ConversationIndicator}

            {/* Lead Capture Success */}
            {LeadCaptureSuccess}

            {/* Quick Actions */}
            {QuickActions}

            {/* Enhanced error display with premium styling */}
            {error && (
              <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-500/60 rounded-xl p-4 mb-4 backdrop-blur-sm shadow-lg" role="alert" aria-live="assertive">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <h4 className="text-red-400 font-semibold mb-2">⚠️ Something went wrong</h4>
                    <p className="text-slate-200 text-sm leading-relaxed">{error}</p>
                    {canRetry && (
                      <button
                        onClick={handleRetry}
                        className="mt-3 text-sm text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-400/70 rounded font-medium"
                      >
                        🔄 Try again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Messages with performance optimization */}
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.timestamp}`}
                data-message="true"
                data-visible="false"
                className="message-container"
              >
                <ChatMessage
                  message={message}
                  isStreaming={isStreaming && index === messages.length - 1}
                  isMobile={isMobile}
                />
              </div>
            ))}

            {/* Premium loading indicator */}
            {isLoading && (
              <div className="flex items-center justify-start space-x-4 p-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-2 flex-shrink-0 shadow-lg animate-pulse">
                  <Bot className="w-full h-full text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <TypingIndicator />
                    <span className="text-sm text-slate-300 font-medium">🧠 AI is thinking...</span>
                  </div>
                  {loadingMessage && (
                    <div className="text-xs text-slate-400">
                      {loadingMessage}
                      {loadingProgress > 0 && (
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300 shadow-sm"
                            style={{ width: `${loadingProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        )}

        {/* Enhanced Input Area - only show when not minimized */}
        {!isMinimized && (
          <footer className={`bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 ${isMobile ? 'p-3' : 'p-4'
            }`} role="contentinfo" aria-label="Message input area" style={{ flexShrink: 0 }}>
            <form
              onSubmit={handleSubmit}
              className="flex items-end space-x-2"
            >
              <div className="flex-1 relative chatbot-input-wrapper">
                <label htmlFor="chatbot-input" className="sr-only">
                  Type your message to the AI assistant
                </label>
                <textarea
                  ref={inputRef}
                  id="chatbot-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isMobile
                    ? "💬 Ask about AI automation..."
                    : "🚀 Tell me about your business and automation needs..."
                  }
                  className={`w-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-slate-600/70 text-slate-100 rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-400/70 focus:border-blue-400/70 focus:bg-gradient-to-br focus:from-slate-800/95 focus:to-slate-900/95 transition-all duration-200 resize-none overflow-y-auto backdrop-blur-sm shadow-lg hover:shadow-xl hover:border-slate-500/70 placeholder-slate-400 caret-blue-400 ${isMobile ? 'min-h-[44px] max-h-24 text-[16px]' : 'min-h-[48px] max-h-32'
                    }`}
                  rows="1"
                  disabled={isLoading}
                  inputMode={isMobile ? "text" : undefined}
                  autoComplete="off"
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  spellCheck={isMobile}
                  aria-label="Type your message to the AI assistant"
                  aria-describedby="input-help"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  onFocus={() => {
                    // Ensure input is visible when focused
                    if (inputRef.current) {
                      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                  onTouchStart={() => {
                    // Focus handling for mobile
                    if (inputRef.current && isMobile) {
                      setTimeout(() => {
                        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }
                  }}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#64748b #1e293b',
                    fontSize: isMobile ? '16px' : '15px',
                    transform: 'translateZ(0)',
                    WebkitTapHighlightColor: 'transparent',
                    lineHeight: '1.4',
                    minHeight: isMobile ? '44px' : '48px'
                  }}
                />
                <span id="input-help" className="sr-only">
                  Press Enter to send your message, Shift+Enter for new line
                </span>

                {/* Send/Stop button */}
                {/* Optimized send/stop button with better performance */}
                {!isLoading ? (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className={`absolute right-2 bottom-2 p-2.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-900/50 ${input.trim()
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:scale-105 shadow-lg focus:ring-blue-400/70 active:scale-95 backdrop-blur-sm'
                        : 'text-slate-400 cursor-not-allowed bg-slate-700/50 hover:bg-slate-700/60'
                      }`}
                    title={input.trim() ? 'Send message (Enter)' : 'Type a message to send'}
                    aria-label={input.trim() ? 'Send message' : 'Type a message to send'}
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      controller.current?.abort();
                      resetLoadingStates();
                    }}
                    className="absolute right-2 bottom-2 p-2.5 rounded-xl bg-gradient-to-r from-red-600/90 to-red-500/90 hover:from-red-600 hover:to-red-600 text-white transition-all duration-200 hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400/70 focus:ring-offset-1 focus:ring-offset-slate-900/50 active:scale-95 backdrop-blur-sm"
                    aria-label="Stop generating response"
                    title="Stop generating response"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}

                {/* Enhanced typing indicator */}
                {isTyping && !isLoading && (
                  <div className="absolute left-3 bottom-full mb-2 text-xs text-slate-400 flex items-center space-x-2 bg-slate-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-slate-700/50 shadow-sm">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                    <span className="text-slate-300">Typing...</span>
                  </div>
                )}
              </div>
            </form>

            {/* Enhanced footer with contact links */}
            <div className={`mt-4 flex gap-3 ${isMobile ? 'flex-col items-center' : 'flex-row items-center justify-between'
              }`}>
              <p className="text-xs text-slate-300 text-center font-medium">
                🤖 Personalized AI assistance for your business
              </p>
              <div className="flex items-center space-x-3" role="navigation" aria-label="Contact options">
                <a
                  href="mailto:softservicesinc.portfolio@gmail.com"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-all duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400/70 rounded px-2 py-1 hover:bg-blue-500/10"
                  title="Email Aparna"
                >
                  <Send className="w-3 h-3" aria-hidden="true" />
                  <span>Email</span>
                </a>
                <a
                  href="https://join.slack.com/t/softservicesinc/shared_invite/zt-3j2toc5wg-2BuI1MhYKEXdSi4UoxQG3A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1 transition-all duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-purple-400/70 rounded px-2 py-1 hover:bg-purple-500/10"
                  title="Join Slack Workspace"
                >
                  <MessageCircle className="w-3 h-3" aria-hidden="true" />
                  <span>Slack</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/aparna-pradhan-06b882215/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-all duration-200 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400/70 rounded px-2 py-1 hover:bg-blue-500/10"
                  title="Connect on LinkedIn"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4.98 3.5C4.98 2.12 6.1 1 7.5 1s2.52 1.12 2.52 2.5S8.9 6 7.5 6 4.98 4.88 4.98 3.5zM3 8.5h4v12H3v-12zM10.5 8.5h3.3v1.78h.04c.46-.87 1.57-1.78 3.23-1.78 3.45 0 4.1 2.26 4.1 5.2v6h-4v-5.33c0-1.27-.03-2.9-1.77-2.9-1.77 0-2.04 1.39-2.04 2.82V20.5h-4v-12z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default ChatbotComponent;