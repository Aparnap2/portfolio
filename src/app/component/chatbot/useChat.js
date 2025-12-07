import { useState, useRef, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'chatbot_history_v1';
const SESSION_KEY = 'chatbot_session_id_v1';

export const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connected');

    // AbortController to cancel requests
    const abortControllerRef = useRef(null);

    // Initialize state from local storage on mount
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const storedHistory = localStorage.getItem(STORAGE_KEY);
                const storedSessionId = localStorage.getItem(SESSION_KEY);

                if (storedHistory) {
                    setMessages(JSON.parse(storedHistory));
                } else {
                    // Initial greeting if no history
                    setMessages([
                        {
                            role: 'assistant',
                            content: "Hi! I'm Aparna's AI assistant. I help businesses explore AI automation solutions. What kind of business are you working with?",
                            timestamp: new Date().toISOString(),
                            confidence: null,
                            intent: null,
                            topics: ['lead_qualification']
                        }
                    ]);
                }

                if (storedSessionId) {
                    setSessionId(storedSessionId);
                } else {
                    // Generate new session ID if none exists
                    const newSessionId = crypto.randomUUID();
                    setSessionId(newSessionId);
                    localStorage.setItem(SESSION_KEY, newSessionId);
                }
            }
        } catch (err) {
            console.error('Failed to load chat history:', err);
        }
    }, []);

    // Persist messages to local storage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    const addMessage = useCallback((message) => {
        setMessages(prev => [...prev, { ...message, timestamp: new Date().toISOString() }]);
    }, []);

    const sendMessage = async (content) => {
        if (!content.trim() || isLoading) return;

        // Reset error state
        setError(null);

        // Add user message immediately
        const userMessage = {
          role: 'user',
          content: content.trim(),
          timestamp: new Date().toISOString()
        };
        console.log('[DEBUG] User message:', userMessage);
        const currentMessages = [...messages, userMessage];
        console.log('[DEBUG] Current messages:', currentMessages);
        setMessages(currentMessages);

        setIsLoading(true);
        setIsStreaming(true);

        // Create new AbortController
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const requestBody = {
                messages: currentMessages
                    .filter(m => m.content && m.content.trim() !== '') // Filter out empty messages
                    .map(m => ({ role: m.role, content: m.content })),
                query: content // Use query field for direct messages
            };
            console.log('[DEBUG] API request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch('/api/chat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-session-id': sessionId
                            },
                            body: JSON.stringify(requestBody),
                            signal: abortControllerRef.current.signal
                        });
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            if (!response.body) throw new Error('No response body');

            // Initialize assistant message placeholder AFTER the API call
            const messageId = Date.now();
            let assistantResponse = '';
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '',
                isStreaming: true,
                id: messageId,
                timestamp: new Date().toISOString()
            }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                buffer += chunk;

                // Process complete SSE messages
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6); // Remove 'data: ' prefix
                        
                        if (dataStr === '[DONE]') {
                            // Stream completed
                            console.log('[DEBUG] Stream completed');
                            continue;
                        }
                        
                        try {
                            const data = JSON.parse(dataStr);
                            
                            if (data.type === 'text-delta' && data.textDelta) {
                                assistantResponse += data.textDelta;

                                // Update the streaming message with accumulated content
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const msgIndex = newMessages.findIndex(m => m.id === messageId);
                                    if (msgIndex !== -1) {
                                        newMessages[msgIndex] = {
                                            ...newMessages[msgIndex],
                                            content: assistantResponse
                                        };
                                    }
                                    return newMessages;
                                });
                            }
                        } catch (e) {
                            console.warn('[DEBUG] Failed to parse SSE data:', dataStr, e);
                        }
                    }
                }
            }

            // Final message cleanup after stream completes
            setMessages(prev => {
                const newMessages = [...prev];
                const msgIndex = newMessages.findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    const finalMessage = {
                        ...newMessages[msgIndex],
                        content: assistantResponse,
                        isStreaming: false
                    };
                    delete finalMessage.isStreaming;
                    newMessages[msgIndex] = finalMessage;
                }
                return newMessages;
            });

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Request aborted');
                // Remove user message on abort
                setMessages(prev => prev.slice(0, -1));
            } else {
                console.error('Chat error:', err);
                const errorMsg = err.message || 'Failed to send message';
                setError(errorMsg);
                // Replace loading message with error
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg?.role === 'assistant' && lastMsg.isStreaming) {
                        newMessages[newMessages.length - 1] = {
                            role: 'assistant',
                            content: `❌ ${errorMsg}. Please try again.`,
                            isError: true,
                            timestamp: new Date().toISOString()
                        };
                    }
                    return newMessages;
                });
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);

            // Cleanup streaming flag on last message
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant' && lastMsg.isStreaming) {
                    const { isStreaming, ...cleanMsg } = lastMsg;
                    newMessages[newMessages.length - 1] = cleanMsg;
                }
                return newMessages;
            });

            abortControllerRef.current = null;
        }
    };

    const clearHistory = useCallback(() => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
        // Optionally reset session ID
        // const newSessionId = crypto.randomUUID();
        // setSessionId(newSessionId);
        // localStorage.setItem(SESSION_KEY, newSessionId);
    }, []);

    return {
        messages,
        sendMessage,
        isLoading,
        isStreaming,
        error,
        connectionStatus,
        clearHistory
    };
};
