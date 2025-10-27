import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditChatbot } from '@/components/audit/AuditChatbot';
import { useAuditStore } from '@/stores/audit-store';

jest.mock('@sentry/nextjs');

// Mock the API route
global.fetch = jest.fn();

describe('Audit Chat E2E', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    useAuditStore.getState().resetAudit();
  });

  it('should go through the full audit workflow', async () => {
    // Initial call
    (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
            messages: [
                { type: 'ai', content: "Hi! I'm here to conduct a quick 3-step AI opportunity assessment for your business. Let's start with understanding your business. What industry are you in, and how many employees do you have?" },
            ],
            currentPhase: 'discovery',
        }),
    });

    render(<AuditChatbot />);

    // Wait for initial message
    await waitFor(() => {
        expect(screen.getByText(/Hi! I'm here to conduct a quick 3-step AI opportunity assessment/)).toBeInTheDocument();
    });

    // User provides discovery info
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), {
      target: { value: 'I am in the tech industry and I have 50 employees' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Mock response for discovery phase
    (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
            messages: [
                { type: 'human', content: 'I am in the tech industry and I have 50 employees' },
                { type: 'ai', content: "Thanks for sharing! Now, let's talk about your challenges. What are the main pain points in your business? (e.g., manual tasks, bottlenecks, data silos)" },
            ],
            currentPhase: 'pain_points',
        }),
    });

    // Wait for pain points question
    await waitFor(() => {
        expect(screen.getByText(/Thanks for sharing!/)).toBeInTheDocument();
    });

    // User provides pain points info
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), {
      target: { value: 'We do a lot of manual data entry, reporting takes a long time, and sales and marketing data are separate' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Mock response for pain points phase
    (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
            messages: [
                { type: 'human', content: 'I am in the tech industry and I have 50 employees' },
                { type: 'ai', content: "Thanks for sharing! Now, let's talk about your challenges. What are the main pain points in your business? (e.g., manual tasks, bottlenecks, data silos)" },
                { type: 'human', content: 'We do a lot of manual data entry, reporting takes a long time, and sales and marketing data are separate' },
                { type: 'ai', content: "Got it. Finally, let's talk about your budget and timeline for this project." },
            ],
            currentPhase: 'qualification',
        }),
    });

    // Wait for qualification question
    await waitFor(() => {
        expect(screen.getByText(/Got it. Finally, let's talk about your budget and timeline/)).toBeInTheDocument();
    });

    // User provides qualification info
    fireEvent.change(screen.getByPlaceholderText('Type your message...'), {
        target: { value: 'Our budget is $10,000 and we want to do this in 3 months' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    // Mock response for qualification phase
    (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
            messages: [
                // ... all messages
                { type: 'ai', content: "Here is a summary of your AI opportunity assessment:..." },
            ],
            currentPhase: 'finish',
        }),
    });

    // Wait for summary
    await waitFor(() => {
        expect(screen.getByText(/Here is a summary of your AI opportunity assessment/)).toBeInTheDocument();
    });
  });
});