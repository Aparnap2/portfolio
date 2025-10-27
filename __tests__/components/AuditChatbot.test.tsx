import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditChatbot } from '@/components/audit/AuditChatbot';
import { useAuditStore } from '@/stores/audit-store';

// Mock the store
jest.mock('@/stores/audit-store');
const mockUseAuditStore = useAuditStore as jest.MockedFunction<typeof useAuditStore>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('AuditChatbot', () => {
  const mockStore = {
    sessionId: null,
    messages: [],
    currentPhase: 'discovery' as const,
    isLoading: false,
    error: null,
    initializeSession: jest.fn(),
    submitMessage: jest.fn(),
    refreshSession: jest.fn(),
  };

  beforeEach(() => {
    mockUseAuditStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders email capture screen initially', () => {
    render(<AuditChatbot />);
    
    expect(screen.getByText('AI Opportunity Assessment')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Start Assessment')).toBeInTheDocument();
  });

  it('shows completion screen when phase is completed', () => {
    mockUseAuditStore.mockReturnValue({
      ...mockStore,
      currentPhase: 'completed',
    });

    render(<AuditChatbot />);
    
    expect(screen.getByText('Assessment Complete!')).toBeInTheDocument();
    expect(screen.getByText('Send Report to Email')).toBeInTheDocument();
  });

  it('displays messages when in chat mode', () => {
    mockUseAuditStore.mockReturnValue({
      ...mockStore,
      messages: [
        { content: 'Hello, how can I help you?', id: ['test', 'ai', 'AIMessage'] },
        { content: 'I need help with automation', id: ['test', 'human', 'HumanMessage'] },
      ],
    });

    // Mock showEmailCapture to false to show chat
    const { rerender } = render(<AuditChatbot />);
    
    // Simulate email capture completion
    fireEvent.click(screen.getByText('Start Assessment'));
    
    rerender(<AuditChatbot />);
    
    expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
    expect(screen.getByText('I need help with automation')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    mockUseAuditStore.mockReturnValue({
      ...mockStore,
      isLoading: true,
    });

    render(<AuditChatbot />);
    
    // Should show loading dots
    expect(document.querySelector('.animate-bounce')).toBeInTheDocument();
  });

  it('displays error message when error exists', () => {
    mockUseAuditStore.mockReturnValue({
      ...mockStore,
      error: 'Something went wrong',
    });

    render(<AuditChatbot />);
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});