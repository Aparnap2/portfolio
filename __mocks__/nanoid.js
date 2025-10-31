// Mock nanoid for testing
const mockNanoid = jest.fn(() => 'test-id-123456789');

module.exports = {
  nanoid: mockNanoid,
  default: mockNanoid,
  // Additional nanoid functions
  customAlphabet: jest.fn(() => mockNanoid),
  urlAlphabet: 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLGQZBFghjklqvwyzrict',
  random: jest.fn(() => Math.random()),
};