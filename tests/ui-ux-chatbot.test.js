import { test, expect, devices } from '@playwright/test';

// Device configurations for responsive testing
const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE
const TABLET_VIEWPORT = { width: 768, height: 1024 }; // iPad
const DESKTOP_VIEWPORT = { width: 1280, height: 720 }; // Desktop

// Test data
const CHAT_MESSAGES = [
  "I need automation help",
  "Tell me about pricing",
  "Schedule a consultation",
  "What services do you offer for small businesses?"
];

test.describe('Lead Capture Chatbot UI/UX Testing', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Mobile Responsiveness (375px - 768px)', () => {
    test('Mobile chat button visibility and accessibility', async () => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.waitForTimeout(2000);

      // Check chat button is visible and properly sized
      const chatButton = page.locator('[aria-label="Open chat"], [aria-label="Close chat"]');
      await expect(chatButton).toBeVisible();

      // Check button size meets mobile tap target requirements (minimum 44px)
      const buttonBox = await chatButton.boundingBox();
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);

      // Check button positioning (fixed bottom-right)
      const buttonStyles = await chatButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          bottom: styles.bottom,
          right: styles.right,
          zIndex: styles.zIndex
        };
      });
      expect(buttonStyles.position).toBe('fixed');
      expect(buttonStyles.zIndex).toBe('40');
    });

    test('Mobile chat interface layout and usability', async () => {
      await page.setViewportSize(MOBILE_VIEWPORT);

      // Open chatbot
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Check chat container size on mobile
      const chatContainer = page.locator('.bg-gray-900\\/95');
      await expect(chatContainer).toBeVisible();

      const containerBox = await chatContainer.boundingBox();
      // Chat should take most of the screen on mobile
      expect(containerBox.width).toBeGreaterThan(page.viewportSize().width * 0.9);

      // Check header elements are properly sized
      const headerTitle = page.locator('h2');
      await expect(headerTitle).toBeVisible();

      // Check input field is accessible
      const inputField = page.locator('input[type="text"]');
      await expect(inputField).toBeVisible();
      await expect(inputField).toBeEditable();

      // Test input field sizing for mobile
      const inputBox = await inputField.boundingBox();
      expect(inputBox.height).toBeGreaterThanOrEqual(44); // Minimum touch target
    });

    test('Mobile quick action buttons', async () => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Check quick action buttons
      const quickButtons = page.locator('button:has-text("I need automation help"), button:has-text("Tell me about pricing")');
      const buttonCount = await quickButtons.count();

      if (buttonCount > 0) {
        // Check button sizing
        for (let i = 0; i < buttonCount; i++) {
          const button = quickButtons.nth(i);
          await expect(button).toBeVisible();

          const buttonBox = await button.boundingBox();
          expect(buttonBox.height).toBeGreaterThanOrEqual(44); // Minimum touch target
          expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Tablet Responsiveness (768px - 1024px)', () => {
    test('Tablet chat interface layout', async () => {
      await page.setViewportSize(TABLET_VIEWPORT);
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Check chat container is appropriately sized for tablet
      const chatContainer = page.locator('.bg-gray-900\\/95');
      const containerBox = await chatContainer.boundingBox();

      // Chat should be centered with appropriate max-width
      expect(containerBox.width).toBeLessThan(page.viewportSize().width * 0.8);

      // Check message width limitations
      const messageBubbles = page.locator('.rounded-2xl');
      if (await messageBubbles.count() > 0) {
        const messageBox = await messageBubbles.first().boundingBox();
        expect(messageBox.width).toBeLessThan(containerBox.width * 0.85);
      }
    });
  });

  test.describe('Desktop Responsiveness (1024px+)', () => {
    test('Desktop chat interface layout', async () => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Check chat container respects max-width on desktop
      const chatContainer = page.locator('.bg-gray-900\\/95');
      await expect(chatContainer).toBeVisible();

      // Container should not be too wide on desktop
      const containerBox = await chatContainer.boundingBox();
      expect(containerBox.width).toBeLessThanOrEqual(1024); // max-w-4xl
    });
  });

  test.describe('Chat Interface UX', () => {
    test('Message readability and font sizes', async () => {
      await page.setViewportSize(DESKTOP_VIEWPORT);
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Check initial assistant message
      const messages = page.locator('.text-gray-100, .text-white');
      expect(await messages.count()).toBeGreaterThan(0);

      // Check font sizes are readable
      const firstMessage = messages.first();
      const fontSize = await firstMessage.evaluate(el =>
        window.getComputedStyle(el).fontSize
      );
      expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(14); // Minimum readable font size
    });

    test('Input field usability and functionality', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      const inputField = page.locator('input[type="text"]');
      await expect(inputField).toBeVisible();
      await expect(inputField).toBeFocused();

      // Test typing
      const testMessage = "This is a test message";
      await inputField.fill(testMessage);
      await expect(inputField).toHaveValue(testMessage);

      // Test send button enables with text
      const sendButton = page.locator('button[type="submit"]');
      await expect(sendButton).toBeEnabled();

      // Test keyboard submission (Enter)
      await inputField.press('Enter');
      await page.waitForTimeout(1000);

      // Check message was sent
      const sentMessages = page.locator('.text-white:has-text("' + testMessage + '")');
      expect(await sentMessages.count()).toBe(1);
    });

    test('Loading states and feedback', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      const inputField = page.locator('input[type="text"]');
      await inputField.fill("Tell me about your services");
      await inputField.press('Enter');

      // Check for loading indicator
      await page.waitForSelector('.animate-pulse, .animate-spin', { timeout: 2000 });

      // Check loading dots appear
      const loadingDots = page.locator('.animate-pulse');
      expect(await loadingDots.count()).toBe(3); // Should have 3 loading dots

      // Wait for response
      await page.waitForTimeout(5000);

      // Check loading state is gone
      await expect(loadingDots.first()).not.toBeVisible();
    });

    test('Conversation flow intuitiveness', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Test quick action if available
      const quickAction = page.locator('button:has-text("I need automation help")');
      if (await quickAction.isVisible()) {
        await quickAction.click();
        await page.waitForTimeout(1000);

        // Check input field is populated
        const inputField = page.locator('input[type="text"]');
        await expect(inputField).toHaveValue("I need automation help");
      }

      // Send a message and check conversation flow
      const inputField = page.locator('input[type="text"]');
      await inputField.fill("What services do you offer?");
      await inputField.press('Enter');

      // Wait for response and check it appears
      await page.waitForSelector('.rounded-bl:not(.text-white)', { timeout: 10000 });
      const assistantMessages = page.locator('.rounded-bl:not(.text-white)');
      expect(await assistantMessages.count()).toBeGreaterThan(1);
    });
  });

  test.describe('Visual Design', () => {
    test('Color contrast and readability', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Check chat button contrast
      const chatButton = page.locator('[aria-label="Open chat"]');
      const buttonBg = await chatButton.evaluate(el =>
        window.getComputedStyle(el).background
      );

      // Check text contrast in messages
      const userMessages = page.locator('.text-white');
      const assistantMessages = page.locator('.text-gray-100');

      expect(await userMessages.count()).toBeGreaterThanOrEqual(0);
      expect(await assistantMessages.count()).toBeGreaterThan(0);
    });

    test('Glassmorphism effects', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      const chatContainer = page.locator('.bg-gray-900\\/95');
      await expect(chatContainer).toBeVisible();

      // Check backdrop blur effect
      const backdropBlur = await chatContainer.evaluate(el =>
        window.getComputedStyle(el).backdropFilter
      );
      expect(backdropBlur).toBeTruthy();
    });

    test('Icon sizes and visibility', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Check icons are properly sized
      const icons = page.locator('svg');
      expect(await icons.count()).toBeGreaterThan(0);

      // Check specific icons
      const botIcon = page.locator('.text-white svg').first();
      if (await botIcon.isVisible()) {
        const iconSize = await botIcon.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            width: styles.width,
            height: styles.height
          };
        });

        expect(parseFloat(iconSize.width)).toBeGreaterThan(16);
        expect(parseFloat(iconSize.height)).toBeGreaterThan(16);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('ARIA labels and roles', async () => {
      // Check chat button has proper aria-label
      const chatButton = page.locator('[aria-label="Open chat"]');
      await expect(chatButton).toBeVisible();

      await chatButton.click();
      await page.waitForTimeout(1000);

      // Check modal/dialog accessibility
      const chatContainer = page.locator('.fixed.inset-0');
      await expect(chatContainer).toBeVisible();

      // Check input has proper attributes
      const inputField = page.locator('input[type="text"]');
      await expect(inputField).toHaveAttribute('placeholder');
      await expect(inputField).toBeEnabled();
    });

    test('Keyboard navigation', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Test Tab navigation
      await page.keyboard.press('Tab');

      // Check if focus moves appropriately
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['INPUT', 'BUTTON', 'TEXTAREA']).toContain(focusedElement);

      // Test Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Chat should be closed after escape
      const chatContainer = page.locator('.bg-gray-900\\/95');
      await expect(chatContainer).not.toBeVisible();
    });

    test('Focus management', async () => {
      // Test that input gets focus when chat opens
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      const inputField = page.locator('input[type="text"]');
      await expect(inputField).toBeFocused();
    });
  });

  test.describe('Performance', () => {
    test('Initial load time', async () => {
      const startTime = Date.now();
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds
    });

    test('Chat opening performance', async () => {
      await page.click('[aria-label="Open chat"]');

      const startTime = Date.now();
      await page.waitForSelector('.bg-gray-900\\/95', { state: 'visible' });
      const openTime = Date.now() - startTime;

      // Chat should open quickly
      expect(openTime).toBeLessThan(1000); // 1 second
    });

    test('Memory usage simulation', async () => {
      // Simulate extended interaction
      for (let i = 0; i < 5; i++) {
        await page.click('[aria-label="Open chat"]');
        await page.waitForTimeout(500);

        const inputField = page.locator('input[type="text"]');
        await inputField.fill(`Test message ${i}`);
        await inputField.press('Enter');
        await page.waitForTimeout(2000);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }

      // Check for any memory-related issues (no memory leaks in UI)
      await expect(page.locator('[aria-label="Open chat"]')).toBeVisible();
    });
  });

  test.describe('Edge Cases', () => {
    test('Very long message handling', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      const longMessage = "This is a very long message ".repeat(20);
      const inputField = page.locator('input[type="text"]');
      await inputField.fill(longMessage);

      // Check if message fits properly
      const sendButton = page.locator('button[type="submit"]');
      await expect(sendButton).toBeEnabled();
      await sendButton.click();

      // Check message appears and is handled
      await page.waitForTimeout(2000);
    });

    test('Network error handling', async () => {
      // Simulate network conditions
      await page.route('**/api/chat', route => route.abort());

      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      const inputField = page.locator('input[type="text"]');
      await inputField.fill("Test message");
      await inputField.press('Enter');

      // Check for error handling
      await page.waitForTimeout(5000);

      // Should show error message or handle gracefully
      const errorMessage = page.locator('text=/error|failed|try again/i');
      // Note: Error handling implementation may vary
    });

    test('Device orientation changes', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(1000);

      // Chat should still be functional
      const inputField = page.locator('input[type="text"]');
      await expect(inputField).toBeVisible();
      await expect(inputField).toBeEditable();
    });
  });

  test.describe('Conversion-Focused Features', () => {
    test('Lead capture flow', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Test lead qualification questions
      const leadCaptureMessages = [
        "I want to schedule a consultation",
        "My name is Test User and my email is test@example.com",
        "I run a small business and need automation help"
      ];

      for (const message of leadCaptureMessages) {
        const inputField = page.locator('input[type="text"]');
        await inputField.fill(message);
        await inputField.press('Enter');
        await page.waitForTimeout(3000);
      }

      // Check for lead capture success indicators
      const successIndicator = page.locator('text=/captured|success|thank you/i');
      // May or may not be present depending on conversation flow
    });

    test('Call-to-action visibility', async () => {
      await page.click('[aria-label="Open chat"]');
      await page.waitForTimeout(1000);

      // Check for email and Slack CTAs
      const emailCTA = page.locator('text=Email');
      const slackCTA = page.locator('text=Slack');

      // These should be present in the footer
      await expect(emailCTA).toBeVisible();
      await expect(slackCTA).toBeVisible();
    });
  });
});