# M3-C3 — Vertical slice: persistence, progression, onboarding, completion scene (lane C)

- Base: see dispatch message · Branch: `agent/m3/slice` · Worktree: `/Users/tammy/Documents/Projects/woodland-wonders.worktrees/m3-slice`
- Allowed writes: `apps/game/**` except `package.json`/`app.json` · `packages/game-ui/**` except `package.json` · `assets/**`.
- References: ADR-0007 (persistence, binding), ADR-0008, ADR-0009, M0-REVIEW §6.5, GDD §4 (completion), §6, §7 (onboarding, progression, persistence), AGENTS.md "Mobile quality".
- Available dependency: `@react-native-async-storage/async-storage` 2.2.0 (installed in apps/game; works in Expo Go and on web). No new dependencies.

Work in this order and commit after each part. Keep `pnpm verify` green at every commit.

## 1. Persistence (ADR-0007)
- **`StorageAdapter`:** `{ get(key): Promise<string|null>; set(key, value): Promise<void>; remove(key): Promise<void> }` with an AsyncStorage implementation and an in-memory one for tests. No other module touches AsyncStorage.
- **`SaveDataV1`:** exactly as in M0-REVIEW §6.5. Define the zod schema in the app; zod is available transitively through core, but import the schemas core exports (`gameStateSchema`/`parseGameState`) for active boards rather than adding zod usage of your own if that suffices. If you need zod directly, report it as a change request.
- **Behaviour:**
  - Versioned key (e.g. `ww.save`).
  - An ordered migration chain (v1 only for now, but structured for `vN→vN+1`).
  - Each active board is validated with core `parseGameState`; invalid entries are dropped individually.
  - Revision mismatch discards that active board but keeps completion.
  - Corrupt or unparseable save: copy the raw value to `ww.save.backup.<timestamp-free counter or hash>`, start from defaults, never crash, and surface nothing alarming to the player.
  - Debounced writes on board change (and flush on app background via `AppState`).
- **Restore** the active board and history when reopening a puzzle. Record completion (`completedRevision`, `completedAt` as ISO string) when solved.

## 2. Progression and level select
- **Level list grouped by tier:**
  - Show completed state (icon + text) and a clear "Continue" / next-unsolved suggestion.
  - **No hard locks** (cozy, non-punitive). Use gentle guidance instead: highlight the suggested next puzzle.
  - Accessible labels such as "Level 5, beginner, completed".
- After completion, "Next puzzle" goes to the next unsolved puzzle in catalog order.
- **Reset puzzle** action on the puzzle screen, with a confirmation built into the UI (no `Alert`-only flows on web). It is undoable or clearly confirmed.

## 3. Onboarding (interactive)
- **First launch** (settings `onboardingDone` false) starts an interactive tutorial on `tutorial-01` (fox) with short coach steps that the player performs on the real board:
  - clues count animals in each row/column;
  - a fox must be next to a tree (orthogonally);
  - foxes never touch, even diagonally;
  - mark empty cells;
  - undo;
  - use a hint.

  Each step advances on the player's action, never on a timer. It is skippable, re-openable from a "How to play" entry on the level list, and uses no answer keys; base steps on core evaluation and solver hints.
- When the first mouse and rabbit puzzles (`tutorial-03`, `tutorial-04`) are opened for the first time, show a one-line species intro card (mouse ↔ mushroom, rabbit ↔ burrow).
- **"How to play" reference screen:** the five rules in plain words with small illustrations (reuse game-ui art).

## 4. Completion scene (GDD §4)
- When solved, the board transitions into a small **woodland scene**:
  - grid lines fade;
  - habitats and animals remain;
  - animals do a small staggered idle animation (hop/wiggle);
  - a celebratory message.

  Then "Next puzzle", "Back to levels" and "Replay".
- Built-in `Animated` only.
- **Reduced motion:** no movement, just a crossfade or instant change.
- **Interruptible:** buttons work immediately.
- The player can revisit the completed scene from the level list (opening a completed puzzle shows the scene, with a "Play again" option that resets the board).

## 5. Accessibility and large-text pass
- Verify that every interactive element has a role and label, that state is announced, and that touch targets are ≥ 44 pt where layout allows.
- Clamp board text only as already designed; scale all other text.
- Add jest tests for labels on new screens.

## Tests
- **Storage:** round-trip, migration chain, corrupt-save recovery with backup, revision-mismatch handling, invalid active board dropped, debounce/flush.
- **Progression:** next-unsolved logic, completed labels.
- **Onboarding:** step advancement by real actions, skip, re-open, `onboardingDone` persisted.
- **Completion:** scene shown, reduced-motion path, revisit from the list.
- **Flows (RNTL):** play → leave → return restores board and undo history; complete → list shows completed.
- Keep the e2e label prefixes stable: `^Row N, column M:`, `^Fox, `, `^Undo`, `^Mark empty`, `^Hint`, the `hint-panel` / `hint-action-apply` test IDs, and the "Scene complete!" text. If you must change the completion text, say so in your report. **First-launch onboarding must not block the e2e:** visiting `/puzzle/<id>` directly by URL must not force the tutorial overlay. Only the level-list first launch starts it, or provide a clearly documented test ID to skip it.

## Verification
- `CI=1 pnpm verify`, `pnpm smoke:native` and `pnpm test:e2e`. The e2e specs are in `tests/e2e/`; they are director-owned, so run them but don't edit them.
- Report screenshots you took with scratch Playwright, if any.

## Out of scope
Sound, settings beyond reduced motion/onboarding, cloud save, analytics, local clues, new species.
