import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'puzzle-content', include: ['test/**/*.test.ts'] },
});
