/** @ww/puzzle-content — curated, versioned puzzle data and presentation config. Lane D. */

import { loadCatalog } from './catalog.ts';
import raw from './data/puzzles.json';

export { type Catalog, type CatalogIssue, loadCatalog } from './catalog.ts';
export {
  HABITAT_PRESENTATION,
  type HabitatPresentation,
  SPECIES_PRESENTATION,
  type SpeciesPresentation,
} from './presentation.ts';
export { DEFAULT_TIER, TIER_ORDER } from './tier.ts';

/** The shipped puzzle catalog, validated at load. */
export const CATALOG = loadCatalog(raw);
