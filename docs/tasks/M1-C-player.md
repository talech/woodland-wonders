# M1-C — Playable game (lane C)

- Base: `b78c9ab` · Branch: `agent/m1/player` · Worktree: `/Users/tammy/Documents/Projects/woodland-wonders.worktrees/m1-player`
- Allowed writes: `apps/game/**` except `package.json` and `app.json` · `packages/game-ui/**` except `package.json` · `assets/**` (new).
- References: ADR-0004, ADR-0005, ADR-0008, ADR-0009 (P10), M0-REVIEW §6.2/§6.3, GDD §4 and §6, AGENTS.md "Mobile quality". `apps/game/AGENTS.md` has Expo SDK 58 guidance: when unsure, use versioned docs at https://docs.expo.dev/versions/v58.0.0/ rather than memory.

## Objective
M1 "Playable puzzle": the seed catalog (`CATALOG` from `@ww/puzzle-content`) is fully playable on web, iOS and Android with mobile-first, accessible UI. No hints, persistence or onboarding yet (later milestones). Do not import `@ww/puzzle-solver`.

## Requirements
- **Screens (expo-router, `apps/game/src/app/`):** a level list built from `CATALOG.puzzles` (id, size, tier), and a puzzle screen at `/puzzle/[id]` with an unknown-id fallback.
- **Puzzle screen layout (portrait):**
  - Header with level name and back.
  - Animal tray: one tool per puzzle species showing glyph/art, name, `placed/target` remaining count and habitat hint. Selecting a species highlights cells of its accepted habitat type(s).
  - Board with row clues and column clues.
  - Toolbar: species tools, empty-mark tool, undo, redo. A hint slot may be shown disabled with a "coming soon" label, or omitted.
- **Interaction** (`ADR-0008`, M0-REVIEW §6.2):
  - Tap with a species tool on an unmarked/empty/other-species cell sets that species; tapping the same species clears it.
  - The empty tool toggles empty/unmarked.
  - Habitat cells are inert.
  - All transitions go through core `dispatch`/`undo`/`redo` (pure). Keep screen state in a reducer in a pure, unit-testable module.
- **Feedback** (ADR-0008 P1/P3):
  - Use core `evaluateBoard` (partial) for live local contradictions.
  - Show gentle, non-punitive markers on offending cells, and on clues that are over or unreachable.
  - Mark satisfied rows/columns/species with a subtle confirmation using an icon/shape plus colour, never colour alone.
  - Never compare against a solution; never block or auto-correct.
- **Completion:** when `isSolved`, show a celebratory but simple "scene complete" state (placeholder animation honouring reduced motion via `AccessibilityInfo.isReduceMotionEnabled` / `useReducedMotion` equivalent). Offer next puzzle and back to list.
- **Presentation:** use `SPECIES_PRESENTATION` / `HABITAT_PRESENTATION` from `@ww/puzzle-content`. Create self-authored simple SVG placeholder art (react-native-svg) in `packages/game-ui` and document provenance in `assets/PROVENANCE.md` (self-authored, CC0). Always render the glyph so state never depends on colour.
- **`@ww/game-ui`:** presentational, prop-driven components (Board, Cell, ClueLabel, SpeciesTray, Toolbar, art). Depend only on core types and react-native/svg, never on app state.
- **Accessibility:** every cell has an `accessibilityLabel` like "Row 2, column 3: fox" / "empty" / "unmarked" / "tree (habitat)" plus a role and selected state; clues get labels like "Row 2: 1 of 2 animals"; tools need labels and selected state. Large-text friendly; no text truncation in the tray.
- **Responsive:** board scales to fit a 360×640 viewport up to 10×10 using `useWindowDimensions` and safe-area insets. Cells aim for ≥44 pt and must never fall below 32 pt on supported sizes (document the trade-off).
- No new dependencies. Available: expo-router, react-native-svg, react-native-safe-area-context, react-native-screens, expo-status-bar. Async-storage exists but persistence is out of scope.

## Required tests (jest-expo + @testing-library/react-native, under `apps/game/test/`; note RNTL 14 `render` is async: `await render(...)`)
- Pure reducer tests: tool selection, tap semantics, undo/redo.
- Flow tests on the puzzle screen:
  - place → count updates;
  - same-species touching → violation indicator shown and tap still allowed;
  - empty mark toggle;
  - undo/redo restore board;
  - playing a full fixture solution (`@ww/puzzle-core/testing`, allowed in tests) shows the completion state.
- Accessibility label tests for a cell and a clue.
- Level list renders all catalog puzzles.

## Out of scope
Hints, persistence, onboarding, level progression/locking, sound, Playwright (director adds at integration).
