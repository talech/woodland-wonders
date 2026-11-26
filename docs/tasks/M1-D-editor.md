# M1-D — Puzzle editor & content tooling (lane D)

- Base: `b78c9ab` · Branch: `agent/m1/editor` · Worktree: `/Users/tammy/Documents/Projects/woodland-wonders.worktrees/m1-editor`
- Allowed writes: `apps/puzzle-editor/**` except `package.json` · `packages/puzzle-content/**` except `package.json`.
- **Compatibility:** keep the existing public exports of `@ww/puzzle-content` (`CATALOG`, `loadCatalog`, `Catalog`, `CatalogIssue`, `SPECIES_PRESENTATION`, `HABITAT_PRESENTATION` and their types) source-compatible; lane C consumes them. Additive changes only.
- References: ADR-0004, ADR-0005, ADR-0009, M0-REVIEW §6.1–6.3, GDD §8 (Puzzle Editor) and §9.

## Objective
A developer puzzle editor (Vite + React DOM, dev-only) plus content-pipeline tooling, so curated puzzles can be authored, validated and added to the catalog without app code changes. Solver integration (solution count, deduction trace) is a **follow-up task** after lane B lands. Design a clean seam for it, but do not implement against unpublished APIs.

## Requirements
- **Pure editor model (`apps/puzzle-editor/src/model/`), fully unit-tested with Vitest:**
  - The editable document is a solution grid. Dimensions are 3–10 each and rectangular. Cells hold grass, a habitat type, or a species (the intended solution).
  - Operations: resize (preserving in-bounds content), paint tool (habitat type / species / erase), clear.
  - Derive `PuzzleDefinition` (clues + population from painted animals) with editable id, revision and difficulty tier.
  - Validate the derived definition with core (`parsePuzzleDefinition`, `createPuzzle`) and check the painted solution with core `isSolved` / `evaluateBoard` (`complete` mode), surfacing violations per cell.
  - Undo/redo for edits.
  - Import a `PuzzleDefinition` JSON. Animals are unknown on import because definitions carry no solution; the document shows habitats + clues and lets you repaint animals.
  - Export the definition JSON (never including the solution).
- **UI (`apps/puzzle-editor/src/`):**
  - Grid with clickable cells; row/column clue display.
  - Palette for habitats/species/erase.
  - Metadata form (id, revision, tier), validation panel listing issues and violations.
  - Import (paste JSON or pick from current `CATALOG`) and export (copy-to-clipboard textarea; avoid file-download APIs).
  - Plain CSS, minimal and functional. Keep it accessible (buttons, labels).
- **Content tooling (`packages/puzzle-content/scripts/`):** a CLI `node scripts/add-puzzle.ts <file.json> [--replace]` that:
  - validates the definition and adds it to `src/data/puzzles.json`;
  - refuses duplicate ids unless `--replace`;
  - with `--replace`, requires `revision` to increase when gameplay-relevant fields change;
  - keeps stable, deterministic ordering (by tier order tutorial→advanced, then id) and 2-space JSON formatting;
  - prints a clear report.

  Put the logic in a pure, tested module and keep the CLI a thin wrapper. Do not modify `validate.ts` semantics, except you may refactor it to share code (behaviour must stay identical, including the explicit PENDING line).
- **Tests:** Vitest for the editor model (paint/resize/derive/validate/import/export round-trip/undo) and the content add/replace logic (dup id, revision bump rule, ordering, invalid input rejected).

## Out of scope
Solver panel implementation, generator, bulk content creation, styling polish.
