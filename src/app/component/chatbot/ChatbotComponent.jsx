'use client'
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Send, Bot, X, Loader2, ChevronDown, Wrench } from "lucide-react";

const ChatbotComponent = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I&apos;m Aparna&apos;s AI assistant. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [agentStatusMessage, setAgentStatusMessage] = useState('');
  const [visibleSources, setVisibleSources] = useState(null);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const controller = useRef(null);
  const loadingTimeoutRef = useRef(null);

  const cleanResponse = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/\\n/g, '\n')
      .replace(/\\r\\n|\\r/g, '\n')
      .replace(/["""]/g, '"')
      .replace(/\s*"\s*/g, '"')
      .replace(/```(\w*)\s*([\s\S]*?)\s*```/g, '```$1\n$2\n```')
      .replace(/(\n\s*)(\*|\-|\d+\.)\s+/g, '$1$2 ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handlePromptSubmit = async (promptText) => {
    if (!promptText.trim() || isLoading) return;

    const userMsg = {
      role: 'user',
      content: promptText.replace(/\n/g, '\\n'),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg, {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }]);

    setIsLoading(true);
    setIsStreaming(true);

    let reader;
    try {
      controller.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          messages: [...messages, { ...userMsg, content: promptText }]
        }),
        signal: controller.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

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
            const event = JSON.parse(data);
            switch (event.type) {
              case 'text':
                setAgentStatusMessage('');
                responseText += event.content.replace(/\n/g, '\\n');
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], content: responseText };
                  return newMessages;
                });
                break;
              case 'tool_start':
                setAgentStatusMessage(`Using tool: ${event.tool_name}...`);
                break;
              case 'tool_end':
                setAgentStatusMessage('');
                setMessages(prev => [...prev, {
                  role: 'tool_result',
                  content: `Tool Used: ${event.tool_name}\nOutput: ${event.output}`,
                  toolName: event.tool_name,
                  toolOutput: event.output,
                  timestamp: new Date().toISOString()
                }]);
                break;
              case 'sources':
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    newMessages[newMessages.length - 1] = { ...lastMessage, sources: event.sources };
                  }
                  return newMessages;
                });
                break;
              case 'error':
                throw new Error(event.details || event.error);
            }
          } catch (e) {
            console.warn('Error parsing chunk:', e, 'Raw data:', data);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === '') {
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: `⚠️ An error occurred: ${err.message}`,
              timestamp: new Date().toISOString()
            };
            return newMessages;
          }
          return [...prev, {
            role: 'assistant',
            content: `⚠️ An error occurred: ${err.message}`,
            timestamp: new Date().toISOString()
          }];
        });
      }
    } finally {
      if (reader) await reader.cancel();
      loadingTimeoutRef.current = setTimeout(resetLoadingStates, 500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handlePromptSubmit(input);
    setInput('');
  };

  const MarkdownRenderer = ({ message, onSuggestionClick }) => {
    const [textPart, suggestion] = React.useMemo(() => {
      const content = message.content || '';
      const suggestionRegex = /{\s*"suggestion":\s*{[\s\S]*?}\s*}/;
      const match = content.match(suggestionRegex);

      if (match) {
        try {
          const parsedSuggestion = JSON.parse(match[0]);
          const text = content.replace(suggestionRegex, '').trim();
          return [text, parsedSuggestion.suggestion];
        } catch (e) {
          return [content, null];
        }
      }
      return [content, null];
    }, [message.content]);

    const cleanedContent = React.useMemo(() => cleanResponse(textPart), [textPart]);

    return (
      <>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <pre className="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto">
                  <code className={className} {...props}>{String(children).replace(/\n$/, '')}</code>
                </pre>
              ) : (
                <code className="bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 text-sm" {...props}>{children}</code>
              );
            },
            a: ({ node, ...props }) => <a className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-2" {...props} />,
            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500 pl-4 italic my-4 text-gray-600 dark:text-gray-300" {...props} />,
          }}
        >
          {cleanedContent}
        </ReactMarkdown>
        {suggestion && (
          <div className="mt-4">
            <button
              onClick={() => onSuggestionClick(suggestion)}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {suggestion.tool_name === 'create_hubspot_ticket' ? 'Create Ticket?' : `Use ${suggestion.tool_name}?`}
            </button>
          </div>
        )}
      </>
    );
  };

  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  const resetLoadingStates = useCallback(() => {
    clearTimeout(loadingTimeoutRef.current);
    setIsLoading(false);
    setIsStreaming(false);
    setAgentStatusMessage('');
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => scrollToBottom(), [messages, scrollToBottom]);
  useEffect(() => {
    return () => {
      controller.current?.abort();
      clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className={`relative w-full max-w-4xl h-[80vh] max-h-[800px] bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'h-[90vh]' : ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-orange-400 to-purple-500">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-orange-300 to-purple-300 bg-clip-text text-transparent">AI Assistant</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/50" aria-label={isExpanded ? 'Minimize' : 'Expand'}>
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/50" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div ref={chatRef} className="h-[calc(100%-120px)] p-4 space-y-4 overflow-y-auto custom-scrollbar">
          {messages.map((message, index) => {
            if (message.role === 'tool_result') {
              return (
                <div key={index} className="flex items-center justify-center my-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-400 p-2 rounded-lg bg-gray-800/50 border border-gray-700/30">
                    <Wrench className="w-4 h-4 text-purple-400" />
                    <span>Tool <strong>{message.toolName}</strong> used.</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${message.role === 'user' ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-none' : 'bg-gray-800/70 border border-gray-700/50 rounded-bl-none text-gray-100'}`}>
                  <MarkdownRenderer
                    message={message}
                    onSuggestionClick={(suggestion) => {
                      const prompt = `Yes, please use the ${suggestion.tool_name} tool with these arguments: ${JSON.stringify(suggestion.arguments)}`;
                      handlePromptSubmit(prompt);
                    }}
                  />
                  {message.sources && (
                    <div className="mt-3 border-t border-gray-700/50 pt-2">
                      <button onClick={() => setVisibleSources(visibleSources === index ? null : index)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1">
                        <span>Sources ({message.sources.length})</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${visibleSources === index ? 'rotate-180' : ''}`} />
                      </button>
                      {visibleSources === index && (
                        <div className="mt-2 space-y-2 text-xs">
                          {message.sources.map((source, i) => (
                            <div key={i} className="p-2 rounded-md bg-gray-700/50">
                              <p className="font-bold text-gray-300">Source: {source.metadata.source}</p>
                              <p className="text-gray-400 italic mt-1">"{source.pageContent}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-2 text-xs opacity-50 text-right">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-center justify-start space-x-2 p-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-purple-500 p-1.5 shrink-0">
                <Bot className="w-full h-full text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[1, 2, 3].map((dot) => (
                    <div key={dot} className="w-2 h-2 bg-gradient-to-r from-orange-300 to-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${dot * 0.2}s`, animationDuration: '1.4s', animationIterationCount: 'infinite' }} />
                  ))}
                </div>
                {agentStatusMessage && (
                  <p className="text-sm text-gray-400 animate-pulse">{agentStatusMessage}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900/90 to-transparent">
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-gray-800/70 border border-gray-700/50 text-white rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 resize-none"
                rows="1"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button type="submit" disabled={!input.trim() || isLoading} className={`absolute right-2 bottom-2 p-1.5 rounded-lg ${input.trim() && !isLoading ? 'bg-gradient-to-r from-orange-400 to-purple-500 text-white hover:opacity-90' : 'text-gray-500'} transition-all`}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-400">AI assistant powered by Aparna&apos;s portfolio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotComponent;