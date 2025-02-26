// components/chatbot/ChatbotComponent.jsx
'use client';
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Bot, X, Loader2, ChevronDown } from "lucide-react";
import QuantumBackground from './QuantumBackground';

const ChatbotComponent = ({ onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const chatRef = useRef(null);
    const inputRef = useRef(null);
    const controller = useRef(null);

    const scrollToBottom = useCallback(() => {
        chatRef.current?.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newMessages = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setIsStreaming(true);

        try {
            controller.current = new AbortController();
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages }),
                signal: controller.current.signal,
            });

            const reader = response.body?.getReader();
            if (!reader) return;

            let responseText = '';
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                responseText += decoder.decode(value);
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    { role: 'assistant', content: responseText }
                ]);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: '⚠️ Error processing request. Please try again.'
                }]);
            }
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 pointer-events-none">
            <QuantumBackground active={true} />

            <div
                ref={chatRef}
                className="relative flex flex-col w-full max-w-2xl bg-gradient-to-br from-background/95 via-background/90 to-background/80 backdrop-blur-2xl rounded-xl border border-accent1/30 shadow-2xl pointer-events-auto transition-all duration-300"
                style={{
                    height: isExpanded ? 'calc(100vh - 2rem)' : 'clamp(300px, 70vh, 600px)',
                    boxShadow: '0 8px 32px rgba(18, 18, 23, 0.5)'
                }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-accent1/20 bg-gradient-to-r from-accent1/5 to-accent2/5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-accent1 to-accent2 rounded-lg shadow-lg">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="font-semibold text-xl bg-gradient-to-r from-accent1 to-accent2 bg-clip-text text-transparent">
                            Quantum Assistant
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="md:hidden p-2 hover:text-accent1 transition-colors hover:bg-accent1/10 rounded-lg"
                        >
                            <ChevronDown className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:text-accent2 transition-colors hover:bg-accent2/10 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-accent1/30 scrollbar-track-background/50">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-4 rounded-xl transition-all duration-200 ${msg.role === 'user'
                                    ? 'bg-accent1/10 border border-accent1/20 hover:border-accent1/30'
                                    : 'bg-secondary/10 border border-accent2/20 hover:border-accent2/30'
                                }`}>
                                <ReactMarkdown
                                    components={{
                                        // Custom Markdown styling
                                        h1: ({ node, ...props }) => (
                                            <h1 className="text-2xl font-bold mb-4 text-accent1" {...props} />
                                        ),
                                        h2: ({ node, ...props }) => (
                                            <h2 className="text-xl font-semibold mb-3 text-accent2" {...props} />
                                        ),
                                        h3: ({ node, ...props }) => (
                                            <h3 className="text-lg font-medium mb-2 text-accent1" {...props} />
                                        ),
                                        p: ({ node, ...props }) => (
                                            <p className="mb-4 leading-relaxed text-text" {...props} />
                                        ),
                                        ul: ({ node, ...props }) => (
                                            <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />
                                        ),
                                        ol: ({ node, ...props }) => (
                                            <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />
                                        ),
                                        li: ({ node, ...props }) => (
                                            <li className="mb-1 text-text/90" {...props} />
                                        ),
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote className="border-l-4 border-accent2 pl-4 my-4 text-text/80 italic" {...props} />
                                        ),
                                        code: ({ inline, className, ...props }) => (
                                            <code
                                                className={`${inline ? 'px-2 py-1' : 'p-4 my-2'} bg-primary/10 rounded-lg border border-accent1/20 text-accent1 font-mono text-sm block overflow-x-auto`}
                                                {...props}
                                            />
                                        ),
                                        a: (props) => (
                                            <a
                                                className="text-accent2 hover:text-accent1 underline transition-colors decoration-accent2/50 hover:decoration-accent1"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                {...props}
                                            />
                                        ),
                                        img: ({ node, ...props }) => (
                                            <img
                                                className="rounded-xl my-4 border border-accent1/20 max-w-full h-auto"
                                                {...props}
                                            />
                                        ),
                                    }}
                                    className="prose-invert prose-sm max-w-none"
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <form
                    onSubmit={handleSubmit}
                    className="p-4 border-t border-accent1/20 bg-gradient-to-t from-background/50 to-transparent"
                >
                    <div className="flex gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            rows={1}
                            className="flex-1 p-3 bg-background/20 border border-accent1/30 rounded-lg resize-none placeholder:text-text/50 focus:outline-none focus:ring-2 focus:ring-accent2/50 focus:border-transparent transition-all duration-200"
                            onInput={(e) => {
                                const target = e.target;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-3 bg-accent1 text-primary rounded-lg hover:bg-accent2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-accent2/20"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5 transition-transform hover:translate-x-0.5" />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatbotComponent;