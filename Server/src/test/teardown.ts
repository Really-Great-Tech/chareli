// Global teardown for Jest tests
// This runs once after all test suites have completed

export default async (): Promise<void> => {
  // Force exit to prevent hanging processes
  // This is especially important when using mocked Redis or other persistent connections
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};
