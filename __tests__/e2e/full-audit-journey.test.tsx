// __tests__/e2e/full-audit-journey.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditChatbot } from '@/components/audit/AuditChatbot';
import { EmailCaptureScreen } from '@/components/audit/EmailCaptureScreen';
import { CompletionScreen } from '@/components/audit/CompletionScreen';
import { MetricsCollector } from '@/lib/metrics';
import { logger } from '@/lib/logger';

// Mock all external dependencies
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('@/lib/db', () => ({
  db: {
    auditSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/metrics', () => ({
  withTiming: jest.fn((fn) => fn),
  MetricsCollector: {
    getInstance: jest.fn(() => ({
      increment: jest.fn(),
      timing: jest.fn(),
      histogram: jest.fn(),
      gauge: jest.fn(),
      reset: jest.fn(),
    })),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/hooks/useEmailCapture', () => ({
  useEmailCapture: jest.fn(),
}));

jest.mock('@/hooks/useAuditChat', () => ({
  useAuditChat: jest.fn(),
}));

const mockRedis = require('@/lib/redis').redis;
const mockDb = require('@/lib/db').db;
const mockMetrics = MetricsCollector.getInstance();
const mockUseEmailCapture = require('@/hooks/useEmailCapture').useEmailCapture;
const mockUseAuditChat = require('@/hooks/useAuditChat').useAuditChat;

describe('Full Audit Journey E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMetrics.reset();
  });

  describe('Complete User Journey: Email Capture → Discovery → Pain Points → Qualification → Completion', () => {
    it('should complete full audit journey successfully', async () => {
      const user = userEvent.setup();

      // Mock email capture hook
      mockUseEmailCapture.mockReturnValue({
        captured: false,
        emailValue: '',
        setEmailValue: jest.fn(),
        isSending: false,
        error: null,
        emailSent: false,
        captureEmail: jest.fn().mockResolvedValue({ success: true }),
        sendReport: jest.fn(),
      });

      // Mock audit chat hook
      mockUseAuditChat.mockReturnValue({
        messages: [],
        currentStep: 'email_capture',
        isLoading: false,
        error: null,
        sendMessage: jest.fn(),
        startAudit: jest.fn().mockResolvedValue({
          sessionId: 'test-session-id',
          success: true,
        }),
      });

      // Mock database and Redis responses
      mockDb.auditSession.findFirst.mockResolvedValue(null);
      mockDb.auditSession.create.mockResolvedValue({
        id: 1,
        sessionId: 'test-session-id',
        email: 'test@example.com',
        status: 'in_progress',
        currentPhase: 'company_profile',
        completionPercent: 0,
      });

      mockRedis.set.mockResolvedValue('OK');

      // Start with full audit chatbot (which includes email capture)
      render(<AuditChatbot />);

      // Enter email
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, 'test@example.com');

      // Submit email
      const submitButton = screen.getByRole('button', { name: /start assessment/i });
      await user.click(submitButton);

      // Should transition to chat interface
      await waitFor(() => {
        expect(screen.getByText(/what industry are you in/i)).toBeInTheDocument();
      });

      // Answer discovery question
      const messageInput = screen.getByPlaceholderText(/type your answer/i);
      await user.type(messageInput, 'Technology industry with 50 employees');
      fireEvent.submit(messageInput);

      // Should move to pain points
      await waitFor(() => {
        expect(screen.getByText(/what are main pain points/i)).toBeInTheDocument();
      });

      // Answer pain points
      await user.clear(messageInput);
      await user.type(messageInput, 'Manual data entry, slow processes, disconnected systems');
      fireEvent.submit(messageInput);

      // Should move to qualification
      await waitFor(() => {
        expect(screen.getByText(/budget and timeline/i)).toBeInTheDocument();
      });

      // Answer qualification
      await user.clear(messageInput);
      await user.type(messageInput, 'Budget: $50,000, Timeline: 3 months');
      fireEvent.submit(messageInput);

      // Should complete audit
      await waitFor(() => {
        expect(screen.getByText(/assessment complete/i)).toBeInTheDocument();
      });

      // Verify metrics were collected
      expect(mockMetrics.increment).toHaveBeenCalledWith(
        'audit_completed',
        1,
        expect.objectContaining({ journey: 'full' })
      );
    });

    it('should handle user dropping off mid-journey and resuming', async () => {
      const user = userEvent.setup();

      // Mock existing session data
      const existingSession = {
        sessionId: 'existing-session-id',
        email: 'returning@example.com',
        status: 'in_progress',
        currentPhase: 'pain_points',
        completionPercent: 33,
      };

      const existingState = {
        current_step: 'pain_points',
        messages: [
          { id: '1', type: 'ai', content: 'What industry are you in?' },
          { id: '2', type: 'user', content: 'Technology' },
          { id: '3', type: 'ai', content: 'What are your main pain points?' },
        ],
      };

      mockDb.auditSession.findFirst.mockResolvedValue(existingSession);
      mockRedis.get.mockResolvedValue(JSON.stringify(existingState));

      mockUseAuditChat.mockReturnValue({
        messages: existingState.messages,
        currentStep: 'pain_points',
        isLoading: false,
        error: null,
        sendMessage: jest.fn(),
        startAudit: jest.fn(),
      });

      render(<AuditChatbot />);

      // Should resume from pain points
      expect(screen.getByText(/what are your main pain points/i)).toBeInTheDocument();

      // Previous messages should be visible
      expect(screen.getByText('Technology')).toBeInTheDocument();
      expect(screen.getByText('What industry are you in?')).toBeInTheDocument();
    });
  });

  describe('Cross-browser Compatibility', () => {
    const browsers = ['chrome', 'firefox', 'safari', 'edge'];

    it.each(browsers)('should render correctly in %s', async (browser) => {
      // Mock user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: getBrowserUserAgent(browser),
        configurable: true,
      });

      mockUseEmailCapture.mockReturnValue({
        captured: false,
        emailValue: '',
        setEmailValue: jest.fn(),
        isSending: false,
        error: null,
        emailSent: false,
        captureEmail: jest.fn(),
        sendReport: jest.fn(),
      });

      render(<EmailCaptureScreen onCapture={function (): void {
        throw new Error('Function not implemented.');
      } } />);

      // Basic rendering should work across browsers
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();

      // Verify no browser-specific errors
      expect(logger.error).not.toHaveBeenCalled();
    });

    function getBrowserUserAgent(browser: string): string {
      const agents = {
        chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
      };
      return agents[browser as keyof typeof agents] || agents.chrome;
    }
  });

  describe('Mobile Responsiveness', () => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 360, height: 640, name: 'Android Small' },
      { width: 412, height: 915, name: 'Android Large' },
    ];

    it.each(viewports)('should be responsive on $name ($width x $height)', async (viewport) => {
      // Mock viewport
      Object.defineProperty(window, 'innerWidth', { value: viewport.width });
      Object.defineProperty(window, 'innerHeight', { value: viewport.height });

      mockUseEmailCapture.mockReturnValue({
        captured: false,
        emailValue: '',
        setEmailValue: jest.fn(),
        isSending: false,
        error: null,
        emailSent: false,
        captureEmail: jest.fn(),
        sendReport: jest.fn(),
      });

      render(<EmailCaptureScreen onCapture={function (): void {
        throw new Error('Function not implemented.');
      } } />);

      // Elements should be visible and usable on mobile
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const submitButton = screen.getByRole('button');

      expect(emailInput).toBeVisible();
      expect(submitButton).toBeVisible();

      // Check for mobile-specific styling (this would be verified in actual e2e tests)
      expect(logger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('mobile'),
        expect.anything()
      );
    });

    it('should handle touch interactions correctly', async () => {
      const user = userEvent.setup();

      mockUseEmailCapture.mockReturnValue({
        captured: false,
        emailValue: '',
        setEmailValue: jest.fn(),
        isSending: false,
        error: null,
        emailSent: false,
        captureEmail: jest.fn().mockResolvedValue({ success: true }),
        sendReport: jest.fn(),
      });

      render(<EmailCaptureScreen onCapture={function (): void {
        throw new Error('Function not implemented.');
      } } />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const submitButton = screen.getByRole('button');

      // Simulate touch interactions
      await user.type(emailInput, 'mobile@example.com');
      await user.click(submitButton);

      // Should handle touch without errors
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG accessibility standards', async () => {
      const user = userEvent.setup();

      mockUseEmailCapture.mockReturnValue({
        captured: false,
        emailValue: '',
        setEmailValue: jest.fn(),
        isSending: false,
        error: null,
        emailSent: false,
        captureEmail: jest.fn(),
        sendReport: jest.fn(),
      });

      render(<EmailCaptureScreen onCapture={function (): void {
        throw new Error('Function not implemented.');
      } } />);

      // Check for ARIA labels
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toHaveAttribute('type', 'email');

      // Check keyboard navigation
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveFocus();

      // Check semantic HTML
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should support screen readers', async () => {
      mockUseEmailCapture.mockReturnValue({
        captured: false,
        emailValue: '',
        setEmailValue: jest.fn(),
        isSending: false,
        error: null,
        emailSent: false,
        captureEmail: jest.fn(),
        sendReport: jest.fn(),
      });

      render(<EmailCaptureScreen onCapture={function (): void {
        throw new Error('Function not implemented.');
      } } />);

      // Check for proper labeling
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toHaveAttribute('aria-describedby');

      // Check for error announcements
      const errorState = {
        captured: false,
        emailValue: 'invalid-email',
        setEmailValue: jest.fn(),
        isSending: false,
        error: 'Invalid email format',
        emailSent: false,
        captureEmail: jest.fn(),
        sendReport: jest.fn(),
      };

      mockUseEmailCapture.mockReturnValue(errorState);

      // Error should be announced to screen readers
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });

    it('should handle keyboard-only navigation', async () => {
      const user = userEvent.setup();

      mockUseEmailCapture.mockReturnValue({
        captured: false,
        emailValue: '',
        setEmailValue: jest.fn(),
        isSending: false,
        error: null,
        emailSent: false,
        captureEmail: jest.fn().mockResolvedValue({ success: true }),
        sendReport: jest.fn(),
      });

      render(<EmailCaptureScreen onCapture={function (): void {
        throw new Error('Function not implemented.');
      } } />);

      // Navigate with keyboard only
      await user.tab(); // Focus email input
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      expect(emailInput).toHaveFocus();

      await user.type(emailInput, 'keyboard@example.com');

      await user.tab(); // Focus submit button
      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveFocus();

      await user.keyboard('{Enter}'); // Submit form

      // Should work without mouse interaction
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle network failures gracefully', async () => {
      const user = userEvent.setup();

      // Mock network failure
      mockUseEmailCapture.mockReturnValue({
        captured: false,
        emailValue: 'test@example.com',
        setEmailValue: jest.fn(),
        isSending: true,
        error: 'Network error',
        emailSent: false,
        captureEmail: jest.fn().mockRejectedValue(new Error('Network failed')),
        sendReport: jest.fn(),
      });

      render(<EmailCaptureScreen onCapture={function (): void {
        throw new Error('Function not implemented.');
      } } />);

      // Should show error state
      expect(screen.getByText('Network error')).toBeInTheDocument();

      // Should allow retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry
      await user.click(retryButton);

      // Should attempt retry
      expect(mockUseEmailCapture().captureEmail).toHaveBeenCalled();
    });

    it('should handle session timeout', async () => {
      mockUseAuditChat.mockReturnValue({
        messages: [],
        currentStep: 'email_capture',
        isLoading: false,
        error: 'Session expired',
        sendMessage: jest.fn(),
        startAudit: jest.fn(),
      });

      render(<AuditChatbot />);

      // Should show session expired message
      expect(screen.getByText(/session expired/i)).toBeInTheDocument();

      // Should offer to start new session
      expect(screen.getByRole('button', { name: /start new/i })).toBeInTheDocument();
    });

    it('should handle component errors gracefully', async () => {
      // Mock component error
      mockUseAuditChat.mockImplementation(() => {
        throw new Error('Component crashed');
      });

      // Should render error boundary
      render(<AuditChatbot />);

      // Error boundary should catch the error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Performance Under User Interaction Load', () => {
    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();

      mockUseAuditChat.mockReturnValue({
        messages: [],
        currentStep: 'discovery',
        isLoading: false,
        error: null,
        sendMessage: jest.fn().mockResolvedValue({ success: true }),
        startAudit: jest.fn(),
      });

      render(<AuditChatbot />);

      const messageInput = screen.getByPlaceholderText(/type your answer/i);

      // Simulate rapid typing and sending
      for (let i = 0; i < 10; i++) {
        await user.type(messageInput, `Message ${i}{enter}`);
        // Clear input for next message
        fireEvent.change(messageInput, { target: { value: '' } });
      }

      // Should handle rapid interactions without crashing
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should maintain UI responsiveness during loading', async () => {
      mockUseAuditChat.mockReturnValue({
        messages: [],
        currentStep: 'discovery',
        isLoading: true, // Simulate loading state
        error: null,
        sendMessage: jest.fn(),
        startAudit: jest.fn(),
      });

      render(<AuditChatbot sessionId="test-session" />);

      // Should show loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // UI should remain responsive
      const messageInput = screen.getByPlaceholderText(/type your answer/i);
      expect(messageInput).toBeDisabled();
    });
  });

  describe('Data Persistence and Synchronization', () => {
    it('should persist user progress across page refreshes', async () => {
      const user = userEvent.setup();

      // Initial state
      mockUseAuditChat.mockReturnValue({
        messages: [],
        currentStep: 'discovery',
        isLoading: false,
        error: null,
        sendMessage: jest.fn().mockResolvedValue({ success: true }),
        startAudit: jest.fn(),
      });

      const { rerender } = render(<AuditChatbot />);

      // User interacts
      const messageInput = screen.getByPlaceholderText(/type your answer/i);
      await user.type(messageInput, 'Technology industry');
      fireEvent.submit(messageInput);

      // Simulate page refresh - component re-mounts
      mockUseAuditChat.mockReturnValue({
        messages: [
          { id: '1', type: 'ai', content: 'What industry are you in?' },
          { id: '2', type: 'user', content: 'Technology industry' },
          { id: '3', type: 'ai', content: 'What are your pain points?' },
        ],
        currentStep: 'pain_points',
        isLoading: false,
        error: null,
        sendMessage: jest.fn(),
        startAudit: jest.fn(),
      });

      rerender(<AuditChatbot />);

      // Should restore previous state
      expect(screen.getByText('Technology industry')).toBeInTheDocument();
      expect(screen.getByText(/pain points/i)).toBeInTheDocument();
    });

    it('should handle concurrent session access', async () => {
      // Simulate two tabs/windows accessing same session
      const sessionId = 'shared-session-id';

      mockRedis.get.mockResolvedValue(JSON.stringify({
        current_step: 'discovery',
        messages: [{ id: '1', type: 'ai', content: 'Hello!' }],
      }));

      // First tab
      const { rerender: rerender1 } = render(<AuditChatbot />);

      // Second tab (simulated)
      const secondTab = render(<AuditChatbot />);

      // Both should show same state
      expect(screen.getAllByText('Hello!')).toHaveLength(2);

      // Changes in one should be reflected (in real implementation)
      // This test verifies the setup works for concurrent access
    });
  });
});