// Jest setup file for test environment configuration
import { testHooks } from './setup';

// Global test timeout
jest.setTimeout(30000);

// Global setup and teardown hooks
beforeAll(async () => {
  await testHooks.beforeAll();
});

afterAll(async () => {
  await testHooks.afterAll();
});