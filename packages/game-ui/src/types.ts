/** Presentation-only view models. The app derives these from core state; game-ui never reads app state. */
import type { CountStatus } from '@ww/puzzle-core';

/** Display data for a species or habitat (from content presentation config). */
export interface ArtSpec {
  readonly artKey: string;
  readonly color: string;
  /** Short non-colour identifier, always rendered. */
  readonly glyph: string;
  readonly name: string;
}

export type CellContent =
  | { readonly kind: 'habitat'; readonly art: ArtSpec }
  | { readonly kind: 'animal'; readonly art: ArtSpec }
  | { readonly kind: 'empty' }
  | { readonly kind: 'unmarked' };

/** Part of the current hint: `region` = cells to look at, `focus` = the cell the hint concludes about. */
export type CellHintMark = 'region' | 'focus' | null;

export interface CellModel {
  readonly content: CellContent;
  readonly hint: CellHintMark;
  /** Screen-reader hint, e.g. "Part of the current hint". */
  readonly accessibilityHint: string | null;
  /** Habitat accepted by the selected species (shown with a sparkle + ring). */
  readonly highlighted: boolean;
  /** Part of an immediate local contradiction (shown with an alert badge + dashed ring). */
  readonly flagged: boolean;
  readonly accessibilityLabel: string;
}

export interface ClueModel {
  readonly count: CountStatus;
  /** Constraint is part of the current hint (dotted ring + tinted ground). */
  readonly hinted: boolean;
  readonly accessibilityHint: string | null;
  readonly accessibilityLabel: string;
}

export interface SpeciesToolModel {
  readonly id: string;
  readonly art: ArtSpec;
  readonly habitatHint: string;
  readonly habitats: readonly ArtSpec[];
  readonly count: CountStatus;
  /** Short words for a count problem (e.g. "too many"), shown next to an alert shape; null when fine. */
  readonly statusText: string | null;
  readonly accessibilityLabel: string;
}
