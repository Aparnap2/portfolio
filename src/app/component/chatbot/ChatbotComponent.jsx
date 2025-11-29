'use client'
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        chatRef.current?.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
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

  // Enhanced quick action buttons with better mobile support
  const QuickActions = useMemo(() => {
    if (!showQuickActions || isLoading || messages.length > 3) return null;

    const actions = [
      { text: "I need automation help", icon: <Bot className="w-4 h-4" />, intent: "automation", color: "from-blue-500 to-purple-500" },
      { text: "Tell me about pricing", icon: <DollarSign className="w-4 h-4" />, intent: "pricing", color: "from-green-500 to-emerald-500" },
      { text: "Schedule a consultation", icon: <Calendar className="w-4 h-4" />, intent: "demo", color: "from-orange-500 to-red-500" },
      { text: "Chat with Aparna directly", icon: <MessageCircle className="w-4 h-4" />, intent: "contact", color: "from-purple-500 to-pink-500" }
    ];

    return (
      <div className={`grid gap-2 mb-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        }`}>
        {actions.map((action, index) => (
          <button
            key={`${action.intent}-${index}`}
            onClick={() => {
              setInput(action.text);
              setShowQuickActions(false);
            }}
            className={`group flex items-center justify-center space-x-2 px-3 py-3 bg-gradient-to-r ${action.color} bg-opacity-10 hover:bg-opacity-20 text-gray-300 hover:text-white border border-gray-700/30 hover:border-gray-600/50 rounded-xl text-xs sm:text-sm transition-all duration-200 min-h-[48px] backdrop-blur-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
            disabled={isLoading}
          >
            <span className="group-hover:scale-110 transition-transform duration-200">
              {action.icon}
            </span>
            <span className="text-center font-medium">{action.text}</span>
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

  // Enhanced lead capture success component
  const LeadCaptureSuccess = useMemo(() => {
    if (!leadCaptured) return null;

    return (
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-green-400 font-semibold mb-1">Information Captured!</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              Aparna will follow up within 24 hours with personalized recommendations.
            </p>
          </div>
        </div>
        <div className={`flex mt-4 gap-2 ${isMobile ? 'flex-col' : 'flex-row'
          }`}>
          <button
            onClick={() => {
              const email = 'softservicesinc.portfolio@gmail.com';
              window.open(`mailto:${email}?subject=AI Automation Consultation Request`, '_blank');
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            <span>Email Aparna</span>
          </button>
          <button
            onClick={() => {
              window.open('https://join.slack.com/t/softservicesinc/shared_invite/zt-3j2toc5wg-2BuI1MhYKEXdSi4UoxQG3A', '_blank');
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2.5 rounded-lg text-sm flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Join on Slack</span>
          </button>
        </div>
      </div>
    );
  }, [leadCaptured, isMobile]);

  // Enhanced conversation stage indicator
  const ConversationIndicator = useMemo(() => {
    const stages = {
      initial: { icon: <Users className="w-4 h-4" />, text: 'Getting to know you', color: 'blue', bgColor: 'from-blue-500/20 to-blue-600/20', borderColor: 'border-blue-500/30' },
      business_understanding: { icon: <Briefcase className="w-4 h-4" />, text: 'Understanding your business', color: 'purple', bgColor: 'from-purple-500/20 to-purple-600/20', borderColor: 'border-purple-500/30' },
      solution_exploration: { icon: <Bot className="w-4 h-4" />, text: 'Exploring solutions', color: 'green', bgColor: 'from-green-500/20 to-green-600/20', borderColor: 'border-green-500/30' },
      lead_capture: { icon: <CheckCircle className="w-4 h-4" />, text: 'Connecting you with Aparna', color: 'orange', bgColor: 'from-orange-500/20 to-orange-600/20', borderColor: 'border-orange-500/30' }
    };

    const currentStage = stages[conversationStage] || stages.initial;

    return (
      <div className={`flex items-center space-x-3 px-4 py-3 bg-gradient-to-r ${currentStage.bgColor} border ${currentStage.borderColor} rounded-xl mb-4 backdrop-blur-sm`}>
        <div className={`flex-shrink-0 w-8 h-8 bg-${currentStage.color}-500/20 rounded-full flex items-center justify-center`}>
          <span className={`text-${currentStage.color}-400`}>
            {currentStage.icon}
          </span>
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-200">{currentStage.text}</span>
          <div className={`w-full bg-gray-700/50 rounded-full h-1.5 mt-1`}>
            <div className={`bg-gradient-to-r ${currentStage.bgColor.replace('/20', '/60')} h-1.5 rounded-full transition-all duration-500`}
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

  useEffect(() => scrollToBottom(), [messages, scrollToBottom]);
  useEffect(() => {
    return () => {
      controller.current?.abort();
      clearTimeout(loadingTimeoutRef.current);
      stopFlusher();
    };
  }, [stopFlusher]);

  // Calculate optimal dimensions based on screen size and device type
  const containerDimensions = useMemo(() => {
    if (isMinimized) {
      return {
        width: isMobile ? 'calc(100vw - 32px)' : '400px',
        height: '60px',
        maxWidth: isMobile ? 'calc(100vw - 32px)' : '400px'
      };
    }

    if (isMobile) {
      // Better mobile handling with safe area support
      const safeAreaTop = typeof window !== 'undefined' ?
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0') : 0;
      const safeAreaBottom = typeof window !== 'undefined' ?
        parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0') : 0;

      return {
        width: '100vw',
        height: `calc(100vh - ${safeAreaTop + safeAreaBottom}px)`,
        maxWidth: '100vw',
        borderRadius: '0',
        marginTop: `${safeAreaTop}px`,
        marginBottom: `${safeAreaBottom}px`
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
      width: '90vw',
      height: '85vh',
      maxWidth: '800px',
      maxHeight: '700px'
    };
  }, [isMobile, isTablet, isExpanded, isMinimized]);

  return (
    <div className={`fixed z-50 flex items-center justify-center ${isMobile ? 'inset-0' : 'inset-0 p-4'
      }`}>
      <div
        className={`relative bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-300 ${isMobile ? 'rounded-none' : 'rounded-2xl'
          } ${isMinimized ? 'cursor-pointer hover:bg-gray-800/95' : ''}`}
        style={containerDimensions}
        onClick={isMinimized ? onMinimize : undefined}
      >
        {/* Enhanced Header */}
        <div className={`flex items-center justify-between border-b border-gray-700/50 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm ${isMinimized ? 'p-3' : 'p-4'
          }`}>
          <div className="flex items-center space-x-3">
            <div className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${isMinimized ? 'p-1.5' : 'p-2'
              }`}>
              <Bot className={`text-white ${isMinimized ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>
            {!isMinimized && (
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  AI Business Assistant
                </h2>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-400">Helping you explore AI automation solutions</p>
                  {connectionStatus !== 'connected' && (
                    <div className={`flex items-center space-x-1 text-xs ${connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                        }`} />
                      <span>{connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isMinimized && (
            <div className="flex items-center space-x-1">
              {/* Retry button for errors */}
              {error && canRetry && (
                <button
                  onClick={() => {
                    trackEngagement?.('retry_clicked');
                    handleRetry();
                  }}
                  className={`p-2 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-600/20 ${prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-110'
                    }`}
                  aria-label="Retry last message"
                  title="Retry last message"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Expand/Minimize button - desktop only */}
              {!isMobile && (
                <button
                  onClick={() => {
                    trackEngagement?.(isExpanded ? 'window_restored' : 'window_expanded');
                    setIsExpanded(!isExpanded);
                  }}
                  className={`p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 ${prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-110'
                    }`}
                  aria-label={isExpanded ? 'Restore window' : 'Expand window'}
                  title={isExpanded ? 'Restore chat window' : 'Expand chat window'}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Minimize button - desktop only */}
              {!isMobile && onMinimize && (
                <button
                  onClick={(e) => {
                    trackEngagement?.('window_minimized');
                    onMinimize(e);
                  }}
                  className={`p-2 text-gray-400 hover:text-yellow-400 rounded-full hover:bg-yellow-600/20 ${prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-110'
                    }`}
                  aria-label="Minimize chat"
                  title="Minimize chat window"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}

              {/* Close button */}
              <button
                onClick={() => {
                  trackEngagement?.('close_button_clicked');
                  onClose();
                }}
                className={`p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 ${prefersReducedMotion ? '' : 'transition-all duration-200 hover:scale-110'
                  }`}
                aria-label="Close chat"
                title="Close chat window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Chat Messages - only show when not minimized */}
        {!isMinimized && (
          <div
            ref={chatRef}
            className={`overflow-y-auto custom-scrollbar scroll-smooth space-y-4 ${isMobile
                ? 'h-[calc(100vh-140px)] p-3'
                : 'h-[calc(100%-140px)] p-4'
              }`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4B5563 #1F2937'
            }}
          >
            {/* Conversation Stage Indicator */}
            {/* Conversation Stage Indicator */}
            {ConversationIndicator}

            {/* Lead Capture Success */}
            {LeadCaptureSuccess}

            {/* Quick Actions */}
            {QuickActions}

            {/* Error display */}
            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-red-400 font-medium mb-1">Something went wrong</h4>
                    <p className="text-gray-300 text-sm">{error}</p>
                    {canRetry && (
                      <button
                        onClick={handleRetry}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => (
              <ChatMessage
                key={`${index}-${message.timestamp}`}
                message={message}
                isStreaming={isStreaming && index === messages.length - 1}
                isMobile={isMobile}
              />
            ))}

            {/* Enhanced loading indicator */}
            {isLoading && (
              <div className="flex items-center justify-start space-x-3 p-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1.5 flex-shrink-0">
                  <Bot className="w-full h-full text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <TypingIndicator />
                    <span className="text-xs text-gray-400">AI is thinking...</span>
                  </div>
                  {loadingMessage && (
                    <div className="text-xs text-gray-500">
                      {loadingMessage}
                      {loadingProgress > 0 && (
                        <div className="w-full bg-gray-700/50 rounded-full h-1 mt-1">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${loadingProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Input Area - only show when not minimized */}
        {!isMinimized && (
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/95 to-transparent backdrop-blur-sm ${isMobile ? 'p-3' : 'p-4'
            }`}>
            <form
              onSubmit={handleSubmit}
              className="flex items-end space-x-2"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isMobile
                    ? "Ask about AI automation..."
                    : "Tell me about your business and automation needs..."
                  }
                  className={`w-full bg-gray-800/80 border border-gray-700/50 text-white rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none overflow-y-auto backdrop-blur-sm ${isMobile ? 'min-h-[44px] max-h-24 text-[16px]' : 'min-h-[48px] max-h-32'
                    }`}
                  rows="1"
                  disabled={isLoading}
                  inputMode={isMobile ? "text" : undefined}
                  autoComplete="off"
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  spellCheck={isMobile}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
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
                    scrollbarColor: '#4B5563 #1F2937',
                    fontSize: isMobile ? '16px' : undefined, // Prevent iOS zoom
                    transform: 'translateZ(0)', // Hardware acceleration
                    WebkitTapHighlightColor: 'transparent'
                  }}
                />

                {/* Send/Stop button */}
                {!isLoading ? (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${input.trim()
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 hover:scale-105 shadow-lg focus:ring-blue-500/50'
                        : 'text-gray-500 cursor-not-allowed bg-gray-700/50'
                      }`}
                    title={input.trim() ? 'Send message (Enter)' : 'Type a message to send'}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      controller.current?.abort();
                      resetLoadingStates();
                    }}
                    className="absolute right-2 bottom-2 p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-all duration-200 hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    aria-label="Stop generating"
                    title="Stop generating response"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Typing indicator */}
                {isTyping && !isLoading && (
                  <div className="absolute left-3 bottom-full mb-1 text-xs text-gray-400 flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Typing...</span>
                  </div>
                )}
              </div>
            </form>

            {/* Footer with contact links from footer */}
            <div className={`mt-3 flex gap-2 ${isMobile ? 'flex-col items-center' : 'flex-row items-center justify-between'
              }`}>
              <p className="text-xs text-gray-400 text-center">
                💬 Personalized AI assistance for your business
              </p>
              <div className="flex items-center space-x-4">
                <a
                  href="mailto:softservicesinc.portfolio@gmail.com"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-colors hover:underline"
                  title="Email Aparna"
                >
                  <Send className="w-3 h-3" />
                  <span>Email</span>
                </a>
                <a
                  href="https://join.slack.com/t/softservicesinc/shared_invite/zt-3j2toc5wg-2BuI1MhYKEXdSi4UoxQG3A"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1 transition-colors hover:underline"
                  title="Join Slack Workspace"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Slack</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/aparna-pradhan-06b882215/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-colors hover:underline"
                  title="Connect on LinkedIn"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.98 3.5C4.98 2.12 6.1 1 7.5 1s2.52 1.12 2.52 2.5S8.9 6 7.5 6 4.98 4.88 4.98 3.5zM3 8.5h4v12H3v-12zM10.5 8.5h3.3v1.78h.04c.46-.87 1.57-1.78 3.23-1.78 3.45 0 4.1 2.26 4.1 5.2v6h-4v-5.33c0-1.27-.03-2.9-1.77-2.9-1.77 0-2.04 1.39-2.04 2.82V20.5h-4v-12z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotComponent;