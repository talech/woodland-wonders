import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'puzzle-editor', include: ['test/**/*.test.ts'] },
});
