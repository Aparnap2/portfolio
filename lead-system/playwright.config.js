module.exports = {
  testDir: './tests',
  testMatch: /e2e.test.js/,
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm start',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd .. && npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    }
  ],
};
