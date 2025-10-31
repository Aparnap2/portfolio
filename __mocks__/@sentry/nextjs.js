const mockCaptureException = jest.fn();
const mockSetContext = jest.fn();
const mockSetUser = jest.fn();
const mockAddBreadcrumb = jest.fn();
const mockWithScope = jest.fn();
const mockConfigureScope = jest.fn();
const mockGetCurrentHub = jest.fn(() => ({
  getClient: jest.fn(() => ({
    getOptions: jest.fn(() => ({})),
  })),
  getScope: jest.fn(() => ({
    setUser: mockSetUser,
    setContext: mockSetContext,
    addBreadcrumb: mockAddBreadcrumb,
  })),
}));

module.exports = {
  captureException: mockCaptureException,
  setContext: mockSetContext,
  setUser: mockSetUser,
  addBreadcrumb: mockAddBreadcrumb,
  withScope: mockWithScope,
  configureScope: mockConfigureScope,
  getCurrentHub: mockGetCurrentHub,
  // Additional commonly used Sentry functions
  captureMessage: jest.fn(),
  captureEvent: jest.fn(),
  lastEventId: jest.fn(() => 'mock-event-id'),
  showReportDialog: jest.fn(),
  close: jest.fn(() => Promise.resolve()),
  flush: jest.fn(() => Promise.resolve(true)),
  getHubFromCarrier: jest.fn(),
  getCurrentScope: jest.fn(() => ({
    setUser: mockSetUser,
    setContext: mockSetContext,
    addBreadcrumb: mockAddBreadcrumb,
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setFingerprint: jest.fn(),
    setLevel: jest.fn(),
    clear: jest.fn(),
  })),
  // Browser-specific functions
  init: jest.fn(),
  onLoad: jest.fn(),
  // React-specific functions
  withProfiler: jest.fn((component) => component),
  withErrorBoundary: jest.fn((component) => component),
  // Performance monitoring
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
    setTag: jest.fn(),
    setData: jest.fn(),
    setStatus: jest.fn(),
  })),
  startSpan: jest.fn((callback) => {
    if (typeof callback === 'function') {
      return callback();
    }
    return {
      finish: jest.fn(),
      setTag: jest.fn(),
      setData: jest.fn(),
      setStatus: jest.fn(),
    };
  }),
  // Metrics
  metrics: {
    increment: jest.fn(),
    distribution: jest.fn(),
    gauge: jest.fn(),
    timing: jest.fn(),
    setGlobalContext: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
  },
  // Replay
  replayIntegration: jest.fn(() => ({
    name: 'Replay',
  })),
  // Session Replay
  sessionReplayIntegration: jest.fn(() => ({
    name: 'SessionReplay',
  })),
};
