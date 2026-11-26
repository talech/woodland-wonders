import { defineProject } from 'vitest/config';

export default defineProject({ test: { name: 'puzzle-core', include: ['test/**/*.test.ts'] } });
