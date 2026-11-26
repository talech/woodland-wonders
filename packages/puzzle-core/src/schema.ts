import { z } from 'zod';
import type { PuzzleDefinition, Ruleset } from './contracts/definition.ts';
import { MAX_DIMENSION, MIN_DIMENSION, RESERVED_IDS, SCHEMA_VERSION } from './contracts/definition.ts';
import { inBounds } from './geometry.ts';
import { getRuleset } from './ruleset.ts';

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly string[] };

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be a lowercase slug');
const count = z.number().int().nonnegative();

export const puzzleDefinitionSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: slug,
  revision: z.number().int().positive(),
  rulesetId: z.string().min(1),
  rows: z.number().int().min(MIN_DIMENSION).max(MAX_DIMENSION),
  columns: z.number().int().min(MIN_DIMENSION).max(MAX_DIMENSION),
  habitats: z.array(z.strictObject({ row: count, col: count, habitat: z.string().min(1) })),
  rowClues: z.array(count),
  columnClues: z.array(count),
  population: z.record(z.string().min(1), z.number().int().positive()),
  difficulty: z.optional(
    z.strictObject({
      tier: z.enum(['tutorial', 'beginner', 'easy', 'intermediate', 'advanced']),
      metrics: z.optional(z.record(z.string(), z.number())),
    }),
  ),
  provenance: z.optional(
    z.strictObject({
      generatorVersion: z.string().min(1),
      seed: z.string().min(1),
      params: z.optional(z.record(z.string(), z.unknown())),
    }),
  ),
});

/** Semantic checks beyond shape. Returns human-readable issues; empty means valid. */
export function checkDefinition(def: PuzzleDefinition, ruleset: Ruleset): string[] {
  const issues: string[] = [];
  if (def.rulesetId !== ruleset.id)
    issues.push(`rulesetId '${def.rulesetId}' does not match ruleset '${ruleset.id}'`);
  if (def.rowClues.length !== def.rows)
    issues.push(`rowClues has ${def.rowClues.length} entries, expected ${def.rows}`);
  if (def.columnClues.length !== def.columns)
    issues.push(`columnClues has ${def.columnClues.length} entries, expected ${def.columns}`);
  def.rowClues.forEach((c, i) => {
    if (c > def.columns) issues.push(`rowClues[${i}]=${c} exceeds row length ${def.columns}`);
  });
  def.columnClues.forEach((c, i) => {
    if (c > def.rows) issues.push(`columnClues[${i}]=${c} exceeds column length ${def.rows}`);
  });

  const seen = new Set<string>();
  for (const h of def.habitats) {
    const key = `${h.row},${h.col}`;
    if (!inBounds(def.rows, def.columns, h.row, h.col)) issues.push(`habitat at (${key}) is out of bounds`);
    if (seen.has(key)) issues.push(`duplicate habitat at (${key})`);
    seen.add(key);
    if (!ruleset.habitats.includes(h.habitat)) issues.push(`unknown habitat '${h.habitat}' at (${key})`);
  }

  const speciesIds = new Set(ruleset.species.map((s) => s.id));
  for (const id of Object.keys(def.population)) {
    if (RESERVED_IDS.includes(id)) issues.push(`species id '${id}' is reserved`);
    else if (!speciesIds.has(id)) issues.push(`unknown species '${id}' in population`);
  }
  if (Object.keys(def.population).length === 0) issues.push('population must list at least one species');

  const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
  const rowSum = sum(def.rowClues);
  const colSum = sum(def.columnClues);
  const popSum = sum(Object.values(def.population));
  if (rowSum !== colSum || rowSum !== popSum)
    issues.push(`clue totals disagree: rows=${rowSum}, columns=${colSum}, population=${popSum}`);
  return issues;
}

/** Parse and validate untrusted puzzle JSON (content files, editor imports). */
export function parsePuzzleDefinition(raw: unknown): Result<PuzzleDefinition> {
  const parsed = puzzleDefinitionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    };
  }
  const def: PuzzleDefinition = parsed.data as PuzzleDefinition;
  const ruleset = getRuleset(def.rulesetId);
  if (!ruleset) return { ok: false, issues: [`unknown rulesetId '${def.rulesetId}'`] };
  const issues = checkDefinition(def, ruleset);
  return issues.length > 0 ? { ok: false, issues } : { ok: true, value: def };
}

const cellChangeSchema = z.strictObject({ cell: count, from: z.string().min(1), to: z.string().min(1) });
const changeSchema = z.strictObject({ cells: z.array(cellChangeSchema).min(1) });

export const boardStateSchema = z.strictObject({
  puzzleId: slug,
  revision: z.number().int().positive(),
  marks: z.array(z.string().min(1)),
});

export const historySchema = z.strictObject({ past: z.array(changeSchema), future: z.array(changeSchema) });

export const gameStateSchema = z.strictObject({ board: boardStateSchema, history: historySchema });
