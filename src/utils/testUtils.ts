import { Logger } from 'winston';

/**
 * Create a mock logger for testing
 */
export function createMockLogger(): jest.Mocked<Logger> {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    log: jest.fn(),
    profile: jest.fn(),
    httpRequest: jest.fn(),
    errorWithStack: jest.fn()
  } as unknown as jest.Mocked<Logger>;
}

/**
 * Create a silent logger for testing
 * This logger will not output anything
 */
export function createSilentLogger(): Logger {
  return {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    verbose: () => {},
    silly: () => {},
    log: () => {},
    profile: () => {},
    httpRequest: () => {},
    errorWithStack: () => {}
  } as unknown as Logger;
}