import type { HabitatId, SpeciesId } from '@ww/puzzle-core';

/**
 * Presentation config (ADR-0009 P8/P10). Rule semantics live in core's ruleset; this is display-only.
 * `glyph` is a short non-colour identifier shown alongside art so state never depends on colour alone.
 * `artKey` maps to replaceable assets in the app (assets/PROVENANCE.md).
 */
export interface SpeciesPresentation {
  readonly name: string;
  readonly plural: string;
  readonly glyph: string;
  readonly artKey: string;
  readonly color: string;
  readonly habitatHint: string;
}

export interface HabitatPresentation {
  readonly name: string;
  readonly glyph: string;
  readonly artKey: string;
  readonly color: string;
}

export const SPECIES_PRESENTATION: Readonly<Record<SpeciesId, SpeciesPresentation>> = {
  fox: {
    name: 'Fox',
    plural: 'Foxes',
    glyph: 'F',
    artKey: 'species/fox',
    color: '#d9772b',
    habitatHint: 'Lives next to a tree',
  },
  mouse: {
    name: 'Mouse',
    plural: 'Mice',
    glyph: 'M',
    artKey: 'species/mouse',
    color: '#8a8f99',
    habitatHint: 'Lives next to a mushroom',
  },
  rabbit: {
    name: 'Rabbit',
    plural: 'Rabbits',
    glyph: 'R',
    artKey: 'species/rabbit',
    color: '#b59a7a',
    habitatHint: 'Lives next to a burrow',
  },
};

export const HABITAT_PRESENTATION: Readonly<Record<HabitatId, HabitatPresentation>> = {
  tree: { name: 'Tree', glyph: '▲', artKey: 'habitat/tree', color: '#4f7a3a' },
  mushroom: { name: 'Mushroom', glyph: '●', artKey: 'habitat/mushroom', color: '#c0443b' },
  burrow: { name: 'Burrow', glyph: '◒', artKey: 'habitat/burrow', color: '#6b4f33' },
};
