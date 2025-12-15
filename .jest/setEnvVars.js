process.env.HOSTNAME = 'http://localhost:3001';
process.env.DB_TYPE = 'postgres';
process.env.UPLOAD_KEY = 'abc123def456';

global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
