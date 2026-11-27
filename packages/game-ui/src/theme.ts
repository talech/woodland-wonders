/**
 * Cozy woodland palette and shape tokens. Colours are never the only carrier of state: every state that uses a
 * colour here also has a shape/icon/text cue in the component that renders it.
 */
export const palette = {
  /** Screen background — warm parchment. */
  paper: '#f6f1cf',
  /** Raised surfaces (cards, tray tools). */
  card: '#fffcec',
  /** Undecided grass cells. */
  grass: '#dcebc6',
  grassEdge: '#b6cf98',
  /** Primary text and outlines — dark bark brown (≥ 7:1 on paper). */
  bark: '#2b4426',
  /** Secondary text (≥ 4.5:1 on paper and card). */
  barkSoft: '#54694a',
  /** Satisfied / confirmation. */
  moss: '#2f6f28',
  mossSoft: '#d3e8bb',
  /** Gentle contradiction marker (terracotta, not alarm red). */
  berry: '#a8462f',
  berrySoft: '#f6e0d6',
  /** Selection and habitat highlight. */
  honey: '#c98a1b',
  honeySoft: '#fbeccb',
  /** Explicit "empty" mark. */
  pebble: '#8c7d6a',
  pebbleSoft: '#ece4d6',
  /** Hint region (dusk blue; always paired with the acorn icon and a dotted/solid ring). */
  sky: '#2c6a87',
  skySoft: '#dcebf2',
  /** Habitat cell ground. */
  soil: '#efe6c4',
  /** Selected segment / selected card outline (white text on it is ≥ 4.5:1). */
  leaf: '#3f7a24',
  leafSoft: '#e2f1cc',
  /** Warm yellow for the Hint button. */
  sun: '#f7d54a',
  sunSoft: '#fdf1b4',
  sunEdge: '#e0b52c',
} as const;

export const radii = { cell: 8, card: 16, pill: 999 } as const;

/** Minimum comfortable touch target (pt) for controls outside the board. */
export const MIN_TOUCH = 48;
