"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: 'bg-green-900/90 border-green-800 text-green-300',
  error: 'bg-red-900/90 border-red-800 text-red-300',
  warning: 'bg-yellow-900/90 border-yellow-800 text-yellow-300',
  info: 'bg-blue-900/90 border-blue-800 text-blue-300',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]; 
  removeToast: (id: string) => void; 
}) {
  return (
    <div 
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast; 
  onRemove: (id: string) => void; 
}) {
  const Icon = toastIcons[toast.type];
  
  return (
    <div
      className={cn(
        "pointer-events-auto max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-out",
        "animate-in slide-in-from-right-5"
      )}
      role="alert"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-5 h-5",
          toastColors[toast.type]
        )}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white mb-1">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm text-neutral-400">
              {toast.message}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
          
          <button
            onClick={() => onRemove(toast.id)}
            className="text-neutral-500 hover:text-neutral-400 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Convenience functions for common toast types
export const toast = {
  success: (title: string, message?: string) => ({
    type: 'success' as const,
    title,
    message,
  }),
  error: (title: string, message?: string) => ({
    type: 'error' as const,
    title,
    message,
  }),
  warning: (title: string, message?: string) => ({
    type: 'warning' as const,
    title,
    message,
  }),
  info: (title: string, message?: string) => ({
    type: 'info' as const,
    title,
    message,
  }),
};