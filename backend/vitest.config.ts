import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Many property-based tests here spin up disposable SQLite databases and
    // run real Prisma transactions. Running test FILES in parallel (vitest's
    // default) causes heavy CPU/disk contention on constrained machines,
    // surfacing as spurious transaction timeouts unrelated to the code under
    // test. Serializing files trades wall-clock time for reliability.
    fileParallelism: false,
    testTimeout: 60_000,
  },
});
