/** Maps core species/habitat ids to display data from content config, with a safe fallback for unknown ids. */

import type { ArtSpec } from '@ww/game-ui';
import { HABITAT_PRESENTATION, SPECIES_PRESENTATION, type SpeciesPresentation } from '@ww/puzzle-content';
import type { HabitatId, SpeciesId } from '@ww/puzzle-core';

const FALLBACK_COLOR = '#9c8b74';

function titleCase(id: string): string {
  return id.length === 0 ? id : `${id[0]?.toUpperCase() ?? ''}${id.slice(1)}`;
}

export function speciesInfo(id: SpeciesId): SpeciesPresentation {
  if (Object.hasOwn(SPECIES_PRESENTATION, id)) {
    const p = SPECIES_PRESENTATION[id];
    if (p) return p;
  }
  return {
    name: titleCase(id),
    plural: `${titleCase(id)}s`,
    glyph: titleCase(id).slice(0, 1),
    artKey: `species/${id}`,
    color: FALLBACK_COLOR,
    habitatHint: '',
  };
}

export function speciesArt(id: SpeciesId): ArtSpec {
  const p = speciesInfo(id);
  return { artKey: p.artKey, color: p.color, glyph: p.glyph, name: p.name };
}

export function habitatArt(id: HabitatId): ArtSpec {
  if (Object.hasOwn(HABITAT_PRESENTATION, id)) {
    const p = HABITAT_PRESENTATION[id];
    if (p) return { artKey: p.artKey, color: p.color, glyph: p.glyph, name: p.name };
  }
  return { artKey: `habitat/${id}`, color: FALLBACK_COLOR, glyph: '◆', name: titleCase(id) };
}
