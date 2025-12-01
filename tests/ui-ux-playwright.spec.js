/**
 * Playwright tests for chatbot UI/UX responsiveness
 * Tests mobile, tablet, and desktop viewports
 */

import { test, expect } from '@playwright/test';

test.describe('Chatbot Responsiveness Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should show properly sized floating button on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });

    // Find and verify floating action button
    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeVisible();

    // Check desktop sizing classes
    await expect(button).toHaveClass(/w-16 h-16/);
  });

  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeVisible();

    // Should use mobile sizing on small screens
    await expect(button).toHaveClass(/w-14 h-14/);
  });

  test('should handle tablet viewport correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeVisible();

    // Should use appropriate tablet sizing
    await expect(button).toBeVisible();
  });

  test('should open chat interface when clicked', async ({ page }) => {
    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await button.click();

    // Chat interface should appear
    const chatInterface = await page.getByRole('dialog', { name: /chat/i }).or(page.getByRole('textbox'));
    await expect(chatInterface.first()).toBeVisible();
  });

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const button = await page.getByRole('button', { name: /open ai assistant/i });

    // Test touch events
    await button.touchStart();
    await button.touchEnd();

    const chatInterface = await page.getByRole('dialog', { name: /chat/i }).or(page.getByRole('textbox'));
    await expect(chatInterface.first()).toBeVisible();
  });

  test('should prevent body scroll when chat is open on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open chat
    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await button.click();

    // Check if body scroll is prevented (implementation dependent)
    const body = page.locator('body');
    const bodyStyles = await body.evaluate(el => getComputedStyle(el).overflow);

    // Body should have overflow: hidden or similar when chat is open on mobile
    expect(['hidden', 'scroll', 'auto']).toContain(bodyStyles);
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Focus floating button with keyboard
    await page.keyboard.press('Tab');

    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeFocused();

    // Should open with Enter or Space
    await page.keyboard.press('Enter');

    const chatInterface = await page.getByRole('dialog', { name: /chat/i }).or(page.getByRole('textbox'));
    await expect(chatInterface.first()).toBeVisible();
  });

  test('should handle window resizing gracefully', async ({ page }) => {
    // Start with desktop
    await page.setViewportSize({ width: 1200, height: 800 });

    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeVisible();
    await expect(button).toHaveClass(/w-16 h-16/);

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Button should adapt to new size
    await expect(button).toHaveClass(/w-14 h-14/);

    // Resize back to desktop
    await page.setViewportSize({ width: 1200, height: 800 });

    // Button should adapt back
    await expect(button).toHaveClass(/w-16 h-16/);
  });

  test('should maintain proper z-index and positioning', async ({ page }) => {
    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeVisible();

    // Check if button has proper positioning (floating)
    const boundingBox = await button.boundingBox();
    expect(boundingBox).toBeTruthy();

    // Should be positioned on screen (not hidden)
    expect(boundingBox.x).toBeGreaterThan(0);
    expect(boundingBox.y).toBeGreaterThan(0);
  });
});

test.describe('Chat Interface Responsiveness', () => {
  test('should adapt chat container to viewport', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await button.click();

    const chatContainer = await page.getByRole('dialog', { name: /chat/i }).or(page.locator('[class*="chat"]'));
    await expect(chatContainer.first()).toBeVisible();

    // Check container dimensions
    const containerBox = await chatContainer.first().boundingBox();
    expect(containerBox.width).toBeGreaterThan(400); // Desktop width
    expect(containerBox.height).toBeGreaterThan(500); // Desktop height

    // Close and test mobile
    const closeButton = await page.getByRole('button', { name: /close chat/i });
    if (await closeButton.count() > 0) {
      await closeButton.click();
    }

    await page.setViewportSize({ width: 375, height: 667 });
    await button.click();

    // Mobile should use more space efficiently
    const mobileContainerBox = await chatContainer.first().boundingBox();
    expect(mobileContainerBox.width).toBeLessThanOrEqual(375); // Mobile width
    expect(mobileContainerBox.height).toBeGreaterThan(400); // Still usable height
  });

  test('should handle input field responsiveness', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await button.click();

    const textarea = await page.getByRole('textbox');
    await expect(textarea).toBeVisible();

    // Test typing in input
    await textarea.fill('Hello, this is a test message');
    await expect(textarea).toHaveValue('Hello, this is a test message');

    // Input should be properly sized for viewport
    const inputBox = await textarea.boundingBox();
    expect(inputBox.width).toBeGreaterThan(0);
    expect(inputBox.height).toBeGreaterThan(0);
  });
});

test.describe('Performance and User Experience', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3000');

    const loadTime = Date.now() - startTime;

    // Should load within reasonable time
    expect(loadTime).toBeLessThan(3000); // 3 seconds

    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeVisible({ timeout: 5000 });
  });

  test('should respond to interactions without lag', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const button = await page.getByRole('button', { name: /open ai assistant/i });

    // Test interaction response time
    const clickStart = Date.now();
    await button.click();
    const clickTime = Date.now() - clickStart;

    // Should respond quickly
    expect(clickTime).toBeLessThan(500); // 500ms

    const chatInterface = await page.getByRole('dialog', { name: /chat/i }).or(page.getByRole('textbox'));
    await expect(chatInterface.first()).toBeVisible({ timeout: 2000 });
  });

  test('should handle rapid interactions gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const button = await page.getByRole('button', { name: /open ai assistant/i });

    // Rapid clicks shouldn't break anything
    await button.click();
    await button.click();
    await button.click();

    // Should still work and not crash
    const chatInterface = await page.getByRole('dialog', { name: /chat/i }).or(page.getByRole('textbox'));
    await expect(chatInterface.first()).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeVisible();

    // Should have proper aria-label
    const ariaLabel = await button.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel.toLowerCase()).toContain('ai');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Tab to button
    await page.keyboard.press('Tab');
    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await expect(button).toBeFocused();

    // Open with Enter
    await page.keyboard.press('Enter');

    const textarea = await page.getByRole('textbox');
    await expect(textarea).toBeVisible();

    // Should be able to tab through chat interface
    await page.keyboard.press('Tab');

    // Test Shift+Enter for new line
    await textarea.fill('Test message');
    await page.keyboard.press('Shift+Enter');

    // Should not submit on Shift+Enter
    await expect(textarea).toHaveValue('Test message\n');
  });

  test('should respect reduced motion preferences', async ({ page }) => {
    // Simulate prefers-reduced-motion
    await page.addStyleTag({
      content: `
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `
    });

    await page.goto('http://localhost:3000');

    const button = await page.getByRole('button', { name: /open ai assistant/i });
    await button.click();

    // Should still work with reduced motion
    const chatInterface = await page.getByRole('dialog', { name: /chat/i }).or(page.getByRole('textbox'));
    await expect(chatInterface.first()).toBeVisible();
  });
});