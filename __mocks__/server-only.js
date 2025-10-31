// Mock server-only module for testing
// This module is used to prevent server-only code from being imported in client-side code
// In tests, we just need to prevent it from throwing errors

module.exports = {};