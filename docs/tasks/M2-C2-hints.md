# M2-C2 — In-game hints (lane C)

- Base: see dispatch message · Branch: `agent/m2/hints` · Worktree: `/Users/tammy/Documents/Projects/woodland-wonders.worktrees/m2-hints`
- Allowed writes: `apps/game/**` except `package.json`/`app.json` · `packages/game-ui/**` except `package.json` · `assets/**`.
- References: ADR-0008 P3/P4 (binding), ADR-0004 (the game may import only the `@ww/puzzle-solver` main entry, never `/search`), solver API in `packages/puzzle-solver/src/index.ts` and `src/types.ts` (`nextHint`, `Hint`, `DeductionStep`, `Explanation` keys `solver.<strategy>`).

## Objective
Replace the disabled hint slot with the deduction-based hint system. Hints must feel like a patient friend explaining a step, never like an answer key.

## Requirements
- **Hint flow** (ADR-0008 P4), using `nextHint(puzzle, marks)` on the current board:
  - **Stage 1:** highlight the relevant region (premise cells plus conclusion cell) and name the strategy in plain words, e.g. "Look at row 3".
  - **Stage 2** ("Show me"): show the full explanation of each step in the chain and the concluded cell/value, with an **Apply** button that dispatches the conclusion as a normal undoable action.
  - Unlimited, no penalty, never auto-applied. Dismissible at any time. Any board change clears the hint.
- **Contradiction** (`kind: 'contradiction'`):
  - Explain gently that the board can't be completed from here, highlighting the conflict cells/constraints.
  - Offer **"Undo to last workable board"**: step back through history until `nextHint` is no longer a contradiction, show how many steps that is, and apply it only when the player confirms. Undo remains redo-able.
  - With `origin: 'marks'`, the immediate violations are already shown; reference them.
- `stuck` (rare; should not happen on published puzzles): an honest message, no invented move. `solved`: congratulate.
- **Explanation text:** an English template for every `solver.<strategy>` key and its params, in `apps/game/src/game/labels.ts` or a sibling module. Add a unit test that **every** strategy id in `STRATEGIES` (exported by the solver) has a template, so new strategies can't ship unexplained. Use row/column numbers 1-based, species/habitat names from presentation.
- **Accessibility:** hint panel announced to screen readers; highlighted cells get an accessibility hint ("part of the current hint"); colour-independent highlight (outline + icon).
- Keep the fixed toolbar and current label prefixes (`^Row N, column M:`, `^Fox, `, `^Undo`, `^Mark empty`) stable; Playwright depends on them. The hint button's accessible label should start with `Hint`.
- **Performance:** `nextHint` runs synchronously on tap. It is fast (sub-ms on 6×6), but guard against blocking: if it takes over 50 ms on any fixture, report it.

## Tests (jest-expo + RNTL; `await render`)
- Hint stage 1 → stage 2 → apply places the right mark and is undoable.
- Hint on a board with a wrong-but-legal placement yields the contradiction UI and "undo to last workable" restores a consistent board.
- Template coverage for all strategies.
- Hint cleared on board change.
- Following hints repeatedly from blank solves a fixture (`@ww/puzzle-core/testing`).
- Boundary: no import of `@ww/puzzle-solver/search` (enforced by `pnpm check:boundaries`).

## Out of scope
Persistence, onboarding (M3), generator, editor.
