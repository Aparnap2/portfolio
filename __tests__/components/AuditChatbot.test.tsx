import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditChatbot } from '@/components/audit/AuditChatbot';
import { useAuditStore, useMessages, useCurrentPhase, useIsLoading, useError } from '@/stores/audit-store';
import { useEmailCapture } from '@/hooks/useEmailCapture';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  setContext: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock ErrorBoundary
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

// Mock child components
jest.mock('@/components/audit/ChatHeader', () => ({
  ChatHeader: () => <div data-testid="chat-header">Chat Header</div>,
}));

jest.mock('@/components/audit/ProgressBar', () => ({
  ProgressBar: () => <div data-testid="progress-bar">Progress Bar</div>,
}));

jest.mock('@/components/audit/MessageList', () => ({
  MessageList: () => <div data-testid="message-list">Message List</div>,
}));

jest.mock('@/components/audit/ChatInput', () => ({
  ChatInput: () => <div data-testid="chat-input">Chat Input</div>,
}));

jest.mock('@/components/audit/EmailCaptureScreen', () => ({
  EmailCaptureScreen: ({ onCapture }: any) => (
    <div data-testid="email-capture-screen">
      <h1>AI Opportunity Assessment</h1>
      <input placeholder="Enter your email address" />
      <button>Start Assessment</button>
    </div>
  ),
}));

jest.mock('@/components/audit/CompletionScreen', () => ({
  CompletionScreen: () => (
    <div data-testid="completion-screen">
      <h1>Assessment Complete!</h1>
      <button>Send Report to Email</button>
    </div>
  ),
}));

// Mock useEmailCapture hook - default behavior
jest.mock('@/hooks/useEmailCapture', () => ({
  useEmailCapture: jest.fn(() => ({
    captured: false,
    emailValue: '',
    setEmailValue: jest.fn(),
    isSending: false,
    error: null,
    emailSent: false,
    captureEmail: jest.fn(),
    sendReport: jest.fn(),
  }))
}));

// Mock the store and its selectors
jest.mock('@/stores/audit-store', () => ({
  useAuditStore: jest.fn(() => ({
    messages: [],
    isLoading: false,
    error: null,
    currentPhase: 'discovery',
    sessionId: null,
    submitMessage: jest.fn(),
    resetAudit: jest.fn(),
    setError: jest.fn(),
  })),
  useMessages: jest.fn(() => []),
  useCurrentPhase: jest.fn(() => 'discovery'),
  useIsLoading: jest.fn(() => false),
  useError: jest.fn(() => null),
}));


describe('AuditChatbot', () => {
  beforeEach(() => {
    // Set up default mock return values
    (useMessages as jest.Mock).mockReturnValue([]);
    (useCurrentPhase as jest.Mock).mockReturnValue('discovery');
    (useIsLoading as jest.Mock).mockReturnValue(false);
    (useError as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders email capture screen initially when email not captured', () => {
    render(<AuditChatbot />);

    expect(screen.getByTestId('email-capture-screen')).toBeInTheDocument();
    expect(screen.getByText('AI Opportunity Assessment')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Start Assessment')).toBeInTheDocument();
  });

  it('shows completion screen when phase is completed', () => {
    (useCurrentPhase as jest.Mock).mockReturnValue('completed');

    // Mock email as captured to show completion screen
    const useEmailCaptureMock = require('@/hooks/useEmailCapture').useEmailCapture;
    useEmailCaptureMock.mockReturnValue({
      captured: true,
      emailValue: 'test@example.com',
      setEmailValue: jest.fn(),
      isSending: false,
      error: null,
      emailSent: false,
      captureEmail: jest.fn(),
      sendReport: jest.fn(),
    });

    render(<AuditChatbot />);

    expect(screen.getByTestId('completion-screen')).toBeInTheDocument();
    expect(screen.getByText('Assessment Complete!')).toBeInTheDocument();
    expect(screen.getByText('Send Report to Email')).toBeInTheDocument();
  });

  it('displays chat interface when email is captured and not completed', () => {
    // Mock email captured to show chat interface
    const useEmailCaptureMock = require('@/hooks/useEmailCapture').useEmailCapture;
    useEmailCaptureMock.mockReturnValue({
      captured: true,
      emailValue: 'test@example.com',
      setEmailValue: jest.fn(),
      isSending: false,
      error: null,
      emailSent: false,
      captureEmail: jest.fn(),
      sendReport: jest.fn(),
    });

    render(<AuditChatbot />);

    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();

    // Should not show email capture or completion screens
    expect(screen.queryByTestId('email-capture-screen')).not.toBeInTheDocument();
    expect(screen.queryByTestId('completion-screen')).not.toBeInTheDocument();
  });

  it('handles different phase transitions correctly', () => {
    const useEmailCaptureMock = require('@/hooks/useEmailCapture').useEmailCapture;

    // Test discovery phase
    (useCurrentPhase as jest.Mock).mockReturnValue('discovery');
    useEmailCaptureMock.mockReturnValue({
      captured: true,
      emailValue: 'test@example.com',
      setEmailValue: jest.fn(),
      isSending: false,
      error: null,
      emailSent: false,
      captureEmail: jest.fn(),
      sendReport: jest.fn(),
    });

    const { rerender } = render(<AuditChatbot />);
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();

    // Test pain_points phase
    (useCurrentPhase as jest.Mock).mockReturnValue('pain_points');
    rerender(<AuditChatbot />);
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();

    // Test qualification phase
    (useCurrentPhase as jest.Mock).mockReturnValue('qualification');
    rerender(<AuditChatbot />);
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();

    // Test finish phase
    (useCurrentPhase as jest.Mock).mockReturnValue('finish');
    rerender(<AuditChatbot />);
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
  });

  it('renders with proper styling and layout', () => {
    render(<AuditChatbot />);

    const container = screen.getByTestId('email-capture-screen').parentElement;
    expect(container).toHaveClass('w-full', 'max-w-5xl', 'mx-auto');
    expect(container).toHaveClass('bg-neutral-950', 'border', 'border-neutral-800');
    expect(container).toHaveClass('rounded-xl', 'sm:rounded-2xl', 'overflow-hidden');
  });

  it('handles email capture state changes', () => {
    const useEmailCaptureMock = require('@/hooks/useEmailCapture').useEmailCapture;

    // Initially not captured
    useEmailCaptureMock.mockReturnValue({
      captured: false,
      emailValue: '',
      setEmailValue: jest.fn(),
      isSending: false,
      error: null,
      emailSent: false,
      captureEmail: jest.fn(),
      sendReport: jest.fn(),
    });

    const { rerender } = render(<AuditChatbot />);
    expect(screen.getByTestId('email-capture-screen')).toBeInTheDocument();

    // After capture
    useEmailCaptureMock.mockReturnValue({
      captured: true,
      emailValue: 'test@example.com',
      setEmailValue: jest.fn(),
      isSending: false,
      error: null,
      emailSent: false,
      captureEmail: jest.fn(),
      sendReport: jest.fn(),
    });

    rerender(<AuditChatbot />);
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.queryByTestId('email-capture-screen')).not.toBeInTheDocument();
  });

  it('integrates with ErrorBoundary', () => {
    render(<AuditChatbot />);

    // The component should be wrapped in ErrorBoundary
    const errorBoundary = screen.getByTestId('email-capture-screen').parentElement?.parentElement;
    expect(errorBoundary).toBeInTheDocument();
  });

  it('handles animation transitions', () => {
    const { rerender } = render(<AuditChatbot />);

    // Initial render should show email capture
    expect(screen.getByTestId('email-capture-screen')).toBeInTheDocument();

    // Change to chat mode
    const useEmailCaptureMock = require('@/hooks/useEmailCapture').useEmailCapture;
    useEmailCaptureMock.mockReturnValue({
      captured: true,
      emailValue: 'test@example.com',
      setEmailValue: jest.fn(),
      isSending: false,
      error: null,
      emailSent: false,
      captureEmail: jest.fn(),
      sendReport: jest.fn(),
    });

    rerender(<AuditChatbot />);

    // Should transition to chat interface
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.queryByTestId('email-capture-screen')).not.toBeInTheDocument();
  });
});