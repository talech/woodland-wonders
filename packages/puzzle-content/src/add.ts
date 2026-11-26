import {
  createPuzzle,
  type DifficultyTier,
  type PuzzleDefinition,
  parsePuzzleDefinition,
  type Result,
} from '@ww/puzzle-core';
import { loadCatalog } from './catalog.ts';

const TIER_ORDER: readonly DifficultyTier[] = ['tutorial', 'beginner', 'easy', 'intermediate', 'advanced'];

function tierRank(def: PuzzleDefinition): number {
  const i = TIER_ORDER.indexOf(def.difficulty?.tier ?? 'tutorial');
  return i < 0 ? TIER_ORDER.length : i;
}

/** Stable catalog order: tier (tutorial first), then id. */
export function sortPuzzles(puzzles: readonly PuzzleDefinition[]): PuzzleDefinition[] {
  return [...puzzles].sort((a, b) => tierRank(a) - tierRank(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Canonical string of the fields that affect gameplay (everything but revision, difficulty and
 * provenance). Habitats are sorted so that listing order is irrelevant.
 */
export function gameplayFingerprint(def: PuzzleDefinition): string {
  const habitats = [...def.habitats].sort((a, b) => a.row - b.row || a.col - b.col);
  const population = Object.entries(def.population).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify([
    def.schemaVersion,
    def.id,
    def.rulesetId,
    def.rows,
    def.columns,
    habitats.map((h) => [h.row, h.col, h.habitat]),
    def.rowClues,
    def.columnClues,
    population,
  ]);
}

export type AddOutcome =
  | { readonly action: 'added'; readonly puzzle: PuzzleDefinition }
  | {
      readonly action: 'replaced';
      readonly puzzle: PuzzleDefinition;
      readonly previous: PuzzleDefinition;
      readonly gameplayChanged: boolean;
    };

export interface AddSuccess {
  readonly ok: true;
  readonly catalog: readonly PuzzleDefinition[];
  readonly outcome: AddOutcome;
}

export type AddResult = AddSuccess | { readonly ok: false; readonly issues: readonly string[] };

export interface AddOptions {
  readonly replace?: boolean;
}

/**
 * Pure add/replace logic. `existingRaw` is the raw catalog JSON; `input` is the raw new definition.
 * Never mutates its arguments.
 */
export function addPuzzle(existingRaw: unknown, input: unknown, options: AddOptions = {}): AddResult {
  const loaded = loadCatalog(existingRaw);
  if (loaded.rejected.length > 0)
    return {
      ok: false,
      issues: loaded.rejected.map(
        (r) => `existing catalog entry #${r.index} ${r.id}: ${r.issues.join('; ')}`,
      ),
    };

  const parsed: Result<PuzzleDefinition> = parsePuzzleDefinition(input);
  if (!parsed.ok) return { ok: false, issues: parsed.issues.map((i) => `invalid definition: ${i}`) };
  const def = parsed.value;
  const compiled = createPuzzle(def);
  if (!compiled.ok) return { ok: false, issues: compiled.issues.map((i) => `invalid definition: ${i}`) };

  const previous = loaded.puzzles.find((p) => p.id === def.id);
  if (!previous)
    return {
      ok: true,
      catalog: sortPuzzles([...loaded.puzzles, def]),
      outcome: { action: 'added', puzzle: def },
    };

  if (!options.replace)
    return {
      ok: false,
      issues: [`puzzle id '${def.id}' already exists; pass --replace to update it`],
    };

  const gameplayChanged = gameplayFingerprint(previous) !== gameplayFingerprint(def);
  if (def.revision < previous.revision)
    return {
      ok: false,
      issues: [`revision ${def.revision} is lower than existing revision ${previous.revision}`],
    };
  if (gameplayChanged && def.revision <= previous.revision)
    return {
      ok: false,
      issues: [
        `gameplay-relevant fields changed; revision must increase above ${previous.revision} (got ${def.revision})`,
      ],
    };
  return {
    ok: true,
    catalog: sortPuzzles(loaded.puzzles.map((p) => (p.id === def.id ? def : p))),
    outcome: { action: 'replaced', puzzle: def, previous, gameplayChanged },
  };
}

function isNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'number');
}

function format(value: unknown, indent: string): string {
  if (isNumberArray(value)) return `[${value.join(', ')}]`;
  const inner = `${indent}  `;
  if (Array.isArray(value))
    return value.length === 0
      ? '[]'
      : `[\n${value.map((v) => `${inner}${format(v, inner)}`).join(',\n')}\n${indent}]`;
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    return entries.length === 0
      ? '{}'
      : `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${format(v, inner)}`).join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

/** Deterministic 2-space JSON; arrays of numbers stay on one line (matches the committed file style). */
export function formatCatalog(puzzles: readonly PuzzleDefinition[]): string {
  return `${format(puzzles, '')}\n`;
}

/** Human-readable report lines for a result. */
export function reportAdd(result: AddResult): string[] {
  if (!result.ok) return ['FAILED', ...result.issues.map((i) => `  - ${i}`)];
  const { outcome, catalog } = result;
  const p = outcome.puzzle;
  const head =
    outcome.action === 'added'
      ? `added     ${p.id}  rev ${p.revision}  ${p.rows}x${p.columns}`
      : `replaced  ${p.id}  rev ${outcome.previous.revision} -> ${p.revision}  ${p.rows}x${p.columns}  (${
          outcome.gameplayChanged ? 'gameplay changed' : 'metadata only'
        })`;
  return [head, `catalog now has ${catalog.length} puzzles; order: ${catalog.map((c) => c.id).join(', ')}`];
}
