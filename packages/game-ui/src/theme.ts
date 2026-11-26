/**
 * Cozy woodland palette and shape tokens. Colours are never the only carrier of state: every state that uses a
 * colour here also has a shape/icon/text cue in the component that renders it.
 */
export const palette = {
  /** Screen background — warm parchment. */
  paper: '#f6f0e1',
  /** Raised surfaces (cards, tray tools). */
  card: '#fffaf0',
  /** Undecided grass cells. */
  grass: '#e3ebcd',
  grassEdge: '#c3d0a4',
  /** Primary text and outlines — dark bark brown (≥ 7:1 on paper). */
  bark: '#4a3a2c',
  /** Secondary text (≥ 4.5:1 on paper and card). */
  barkSoft: '#6e5b49',
  /** Satisfied / confirmation. */
  moss: '#3f6b2e',
  mossSoft: '#dde9cf',
  /** Gentle contradiction marker (terracotta, not alarm red). */
  berry: '#a8462f',
  berrySoft: '#f6e0d6',
  /** Selection and habitat highlight. */
  honey: '#c98a1b',
  honeySoft: '#fbeccb',
  /** Explicit "empty" mark. */
  pebble: '#8c7d6a',
  pebbleSoft: '#ece4d6',
  /** Habitat cell ground. */
  soil: '#efe3cc',
} as const;

export const radii = { cell: 8, card: 16, pill: 999 } as const;

/** Minimum comfortable touch target (pt) for controls outside the board. */
export const MIN_TOUCH = 48;
