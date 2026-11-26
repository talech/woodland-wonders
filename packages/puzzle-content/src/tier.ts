import type { DifficultyTier } from '@ww/puzzle-core';

/** Tiers from easiest to hardest; the canonical catalog ordering. */
export const TIER_ORDER: readonly DifficultyTier[] = [
  'tutorial',
  'beginner',
  'easy',
  'intermediate',
  'advanced',
];

/** Tier assumed for a definition without `difficulty` (catalog sorting, editor import/export). */
export const DEFAULT_TIER: DifficultyTier = 'tutorial';
