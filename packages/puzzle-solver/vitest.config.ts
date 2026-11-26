import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'puzzle-solver', include: ['test/**/*.test.ts'] },
});
