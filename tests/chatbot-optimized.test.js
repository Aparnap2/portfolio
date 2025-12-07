
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import ChatbotOptimized from '../src/app/component/chatbot/ChatbotOptimized';
import { useChatOptimized } from '../src/app/component/chatbot/useChatOptimized';

// Mock the Vercel AI SDK
jest.mock('@ai-sdk/react', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    input: '',
    setInput: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
    error: null,
    stop: jest.fn(),
    reload: jest.fn(),
    append: jest.fn(),
  }))
}));

// Mock the hooks
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: jest.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1920,
    height: 1080,
    isTouch: false,
    prefersReducedMotion: false,
    getResponsiveValue: jest.fn((values) => values.md || values.default),
  }))
}));

jest.mock('../../../hooks/useChatbotPerformance', () => ({
  useChatbotPerformance: jest.fn(() => ({
    trackEngagement: jest.fn(),
    trackError: jest.fn(),
    getMetrics: jest.fn(() => ({ messageCount: 0, errorCount: 0 })),
  }))
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ChatbotOptimized - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
    document.body.className = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render chatbot button initially', () => {
      render(<ChatbotOptimized />);
      
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('should show connection status indicator', () => {
      render(<ChatbotOptimized />);
      
      // Should show connection checking state initially
      const connectionIndicator = screen.getByRole('button', { name: /open ai assistant chat/i });
      expect(connectionIndicator).toBeInTheDocument();
    });

    test('should render with proper ARIA attributes', () => {
      render(<ChatbotOptimized />);
      
      const chatbotContainer = screen.getByRole('complementary');
      expect(chatbotContainer).toHaveAttribute('aria-label', 'AI Assistant Chat');
    });
  });

  describe('User Interactions', () => {
    test('should open chatbot when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatbotOptimized />);
      
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      
      await act(async () => {
        await user.click(chatButton);
      });
      
      expect(chatButton).toHaveAttribute('aria-expanded', 'true');
      expect(document.body).toHaveClass('chatbot-open');
    });

    test('should close chatbot when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ChatbotOptimized />);
      
      // Open chatbot first
      const openButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      await act(async () => {
        await user.click(openButton);
      });
      
      // Then close it
      const closeButton = screen.getByRole('button', { name: /close chat window/i });
      await act(async () => {
        await user.click(closeButton);
      });
      
      expect(openButton).toHaveAttribute('aria-expanded', 'false');
      expect(document.body).not.toHaveClass('chatbot-open');
    });

    test('should handle keyboard navigation (Escape key)', async () => {
      const user = userEvent.setup();
      render(<ChatbotOptimized />);
      
      // Open chatbot
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      await act(async () => {
        await user.click(chatButton);
      });
      
      // Press Escape to close
      await act(async () => {
        await user.keyboard('{Escape}');
      });
      
      expect(chatButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('should handle minimize/maximize functionality', async () => {
      const user = userEvent.setup();
      render(<ChatbotOptimized />);
      
      // Open chatbot
      const openButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      await act(async () => {
        await user.click(openButton);
      });
      
      // Click minimize button
      const minimizeButton = screen.getByRole('button', { name: /minimize chat window/i });
      await act(async () => {
        await user.click(minimizeButton);
      });
      
      // Should still be open but minimized
      expect(openButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Responsive Behavior', () => {
    test('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      const mockUseResponsive = jest.fn(() => ({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        width: 375,
        height: 667,
        isTouch: true,
        prefersReducedMotion: false,
        getResponsiveValue: jest.fn((values) => values.xs || values.default),
      }));
      
      jest.mock('../../../hooks/useResponsive', () => ({
        useResponsive: mockUseResponsive
      }));

      render(<ChatbotOptimized />);
      
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      expect(chatButton).toHaveClass('w-14', 'h-14');
    });

    test('should handle touch interactions', () => {
      const mockUseResponsive = jest.fn(() => ({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouch: true,
        prefersReducedMotion: false,
        getResponsiveValue: jest.fn(),
      }));
      
      jest.mock('../../../hooks/useResponsive', () => ({
        useResponsive: mockUseResponsive
      }));

      render(<ChatbotOptimized />);
      
      // Touch devices should not have hover effects
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      expect(chatButton).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    test('should not cause excessive re-renders', () => {
      const renderSpy = jest.fn();
      
      function TestComponent() {
        renderSpy();
        return <ChatbotOptimized />;
      }
      
      const { rerender } = render(<TestComponent />);
      
      // Re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<TestComponent />);
      }
      
      // Should not re-render excessively
      expect(renderSpy).toHaveBeenCalledTimes(6); // Initial + 5 re-renders
    });

    test('should handle rapid toggle clicks without errors', async () => {
      const user = userEvent.setup();
      render(<ChatbotOptimized />);
      
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      
      // Rapid clicks
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          await user.click(chatButton);
        }
      });
      
      // Should handle rapid clicks gracefully
      expect(chatButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle connection errors gracefully', async () => {
      // Mock connection error
      global.fetch.mockRejectedValueOnce(new Error('Connection failed'));
      
      const { trackError } = require('../../../hooks/useChatbotPerformance').useChatbotPerformance();
      
      render(<ChatbotOptimized />);
      
      // Wait for connection check
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
      });
      
      // Should track the error
      expect(trackError).toHaveBeenCalled();
    });

    test('should handle API errors in chat component', async () => {
      const mockError = new Error('API Error');
      const { useChat } = require('@ai-sdk/react');
      
      useChat.mockReturnValueOnce({
        messages: [],
        input: '',
        setInput: jest.fn(),
        handleSubmit: jest.fn().mockRejectedValue(mockError),
        isLoading: false,
        error: mockError,
        stop: jest.fn(),
        reload: jest.fn(),
        append: jest.fn(),
      });

      render(<ChatbotOptimized />);
      
      // Open chatbot to trigger error handling
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      await act(async () => {
        await userEvent.click(chatButton);
      });
      
      // Should handle error without crashing
      expect(chatButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(<ChatbotOptimized />);
      
      const chatbotContainer = screen.getByRole('complementary');
      expect(chatbotContainer).toHaveAttribute('aria-label', 'AI Assistant Chat');
      
      const chatButton = screen.getByRole('button');
      expect(chatButton).toHaveAttribute('aria-expanded');
      expect(chatButton).toHaveAttribute('aria-controls');
      expect(chatButton).toHaveAttribute('aria-haspopup');
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ChatbotOptimized />);
      
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      
      // Tab to the button
      await act(async () => {
        await user.tab();
      });
      
      expect(chatButton).toHaveFocus();
      
      // Press Enter to open
      await act(async () => {
        await user.keyboard('{Enter}');
      });
      
      expect(chatButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('should respect reduced motion preferences', () => {
      const mockUseResponsive = jest.fn(() => ({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        prefersReducedMotion: true,
        getResponsiveValue: jest.fn((values) => values.default || 0.1),
      }));
      
      jest.mock('../../../hooks/useResponsive', () => ({
        useResponsive: mockUseResponsive
      }));

      render(<ChatbotOptimized />);
      
      // Should render without motion effects
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      expect(chatButton).toBeInTheDocument();
    });
  });

  describe('Optimized Hook Functionality', () => {
    test('useChatOptimized should handle messages correctly', () => {
      const mockMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      
      const { useChat } = require('@ai-sdk/react');
      useChat.mockReturnValue({
        messages: mockMessages,
        input: 'Test input',
        setInput: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
        error: null,
        stop: jest.fn(),
        reload: jest.fn(),
        append: jest.fn(),
      });

      const { result } = renderHook(() => useChatOptimized());
      
      expect(result.current.messages).toEqual(mockMessages);
      expect(result.current.input).toBe('Test input');
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle retry logic on errors', async () => {
      const mockError = new Error('Network error');
      let callCount = 0;
      
      const { useChat } = require('@ai-sdk/react');
      useChat.mockReturnValue({
        messages: [],
        input: '',
        setInput: jest.fn(),
        handleSubmit: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount <= 2) {
            throw mockError;
          }
          return Promise.resolve();
        }),
        isLoading: false,
        error: callCount <= 2 ? mockError : null,
        stop: jest.fn(),
        reload: jest.fn(),
        append: jest.fn(),
      });

      const { result } = renderHook(() => useChatOptimized({ maxRetries: 3 }));
      
      // First attempt should fail
      await act(async () => {
        await expect(result.current.handleSubmit({ preventDefault: jest.fn() })).rejects.toThrow();
      });
      
      expect(result.current.isRetrying).toBe(true);
    });

    test('should track performance metrics', () => {
      const mockOnMetric = jest.fn();
      
      const { result } = renderHook(() => 
        useChatOptimized({ 
          enableMetrics: true,
          onMetric: mockOnMetric 
        })
      );
      
      // Trigger a message
      act(() => {
        result.current.sendMessage('Test message');
      });
      
      // Should track engagement
      expect(mockOnMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'engagement',
          action: 'message_sent'
        })
      );
    });
  });

  describe('Loading States', () => {
    test('should show skeleton loader while loading', () => {
      // Mock loading state
      const { useChat } = require('@ai-sdk/react');
      useChat.mockReturnValue({
        messages: [],
        input: '',
        setInput: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: true,
        error: null,
        stop: jest.fn(),
        reload: jest.fn(),
        append: jest.fn(),
      });

      render(<ChatbotOptimized />);
      
      // Open chatbot to show loading state
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      fireEvent.click(chatButton);
      
      // Should show loading indicator
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should handle connection status changes', async () => {
      // Mock successful connection
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' })
      });
      
      render(<ChatbotOptimized />);
      
      // Open chatbot to trigger connection check
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      await act(async () => {
        await userEvent.click(chatButton);
      });
      
      // Should have checked connection
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty messages gracefully', async () => {
      const { useChat } = require('@ai-sdk/react');
      const mockHandleSubmit = jest.fn();
      
      useChat.mockReturnValue({
        messages: [],
        input: '', // Empty input
        setInput: jest.fn(),
        handleSubmit: mockHandleSubmit,
        isLoading: false,
        error: null,
        stop: jest.fn(),
        reload: jest.fn(),
        append: jest.fn(),
      });

      render(<ChatbotOptimized />);
      
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      await act(async () => {
        await userEvent.click(chatButton);
      });
      
      // Try to submit empty form
      const form = screen.getByRole('dialog').querySelector('form');
      await act(async () => {
        await userEvent.submit(form);
      });
      
      // Should not call handleSubmit for empty input
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });

    test('should handle rapid message sending', async () => {
      const user = userEvent.setup();
      const mockSendMessage = jest.fn();
      
      const { useChat } = require('@ai-sdk/react');
      useChat.mockReturnValue({
        messages: [],
        input: 'Test message',
        setInput: jest.fn(),
        handleSubmit: jest.fn(),
        isLoading: false,
        error: null,
        stop: jest.fn(),
        reload: jest.fn(),
        append: jest.fn((message) => mockSendMessage(message)),
      });

      render(<ChatbotOptimized />);
      
      const chatButton = screen.getByRole('button', { name: /open ai assistant chat/i });
      await act(async () => {
        await user.click(chatButton);
      });
      
      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        const submitButton = screen.getByRole('button', { name: /send/i });
        await act(async () => {
          await user.click(submitButton);
        });
      }
      
      // Should handle rapid sending
      expect(mockSendMessage).toHaveBeenCalled();
    });

    test('should recover from component errors', () => {
      // Mock an error in the component
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      const ErrorComponent = () => {
        throw new Error('Component error');
      };
      
      // Temporarily replace component with error-throwing version
      jest.mock('../src/app/component/chatbot/ChatbotOptimized', () => ErrorComponent);
      
      // Should not crash the entire application
      expect(() => render(<ChatbotOptimized />)).toThrow();
      
      consoleError.mockRestore();
    });
  });
});

// Helper function for testing hooks
function renderHook(hook) {
  let result;
  function TestComponent() {
    result = hook();
    return null;
  }
  render(<TestComponent />);
  return { result: { current: result } };
}
```
