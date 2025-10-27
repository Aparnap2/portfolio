import { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useMessages, useIsLoading } from '@/stores/audit-store';
import { BaseMessage } from '@langchain/core/messages';

interface MessageListProps {
  className?: string;
}

const getMessageRole = (message: BaseMessage): "user" | "assistant" => {
  return message._getType() === "human" ? "user" : "assistant";
};

const Message = memo<{ message: BaseMessage; index: number }>(({ message, index }) => {
  const role = getMessageRole(message);
  
  return (
    <motion.div
      key={index}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex gap-2 sm:gap-3 items-start", role === "user" ? "justify-end" : "justify-start")}
    >
      {role === "assistant" && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot size={14} className="text-purple-400 sm:w-4 sm:h-4" />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] sm:max-w-[80%] md:max-w-[75%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base",
        role === "user" 
          ? "bg-purple-600 text-white ml-auto" 
          : "bg-neutral-900 text-neutral-200 border border-neutral-800"
      )}>
        <div className={cn(
          "leading-relaxed max-w-none",
          role === "user" 
            ? "prose prose-sm prose-invert prose-purple" 
            : "prose prose-sm prose-invert prose-neutral"
        )}>
          <ReactMarkdown 
            components={{
              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
              ul: ({children}) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
              li: ({children}) => <li className="text-sm">{children}</li>,
              h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
              h2: ({children}) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
              h3: ({children}) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
            }}
          >
            {message.content as string}
          </ReactMarkdown>
        </div>
      </div>
      {role === "user" && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 mt-1">
          <User size={14} className="text-neutral-300 sm:w-4 sm:h-4" />
        </div>
      )}
    </motion.div>
  );
});

Message.displayName = 'Message';

const LoadingIndicator = memo(() => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    className="flex gap-2 sm:gap-3 justify-start"
  >
    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
      <Bot size={12} className="text-purple-400 sm:size-16" />
    </div>
    <div className="bg-neutral-900 border border-neutral-800 px-2 sm:px-3 py-2 sm:py-3 rounded-lg sm:rounded-xl">
      <div className="flex gap-1">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </motion.div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

export const MessageList = memo<MessageListProps>(({ className }) => {
  const messages = useMessages();
  const isLoading = useIsLoading();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent", className)}>
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <Message key={`${index}-${(message.content as string).slice(0, 20)}`} message={message} index={index} />
        ))}
      </AnimatePresence>
      {isLoading && <LoadingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';
