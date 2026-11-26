import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/puzzle-core',
      'packages/puzzle-solver',
      'packages/puzzle-generator',
      'packages/puzzle-content',
      'apps/puzzle-editor',
    ],
  },
});
