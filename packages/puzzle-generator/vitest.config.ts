import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'puzzle-generator', include: ['test/**/*.test.ts'] },
});
