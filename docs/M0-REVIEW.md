# M0 Architecture & Decision Review

- Status: **Awaiting human approval**
- Date: 2026-11-26
- Author: director
- Scope: everything that must be decided before contracts freeze and parallel lanes start.

Approve by replying with "approve all", or list the decision IDs you want changed (e.g. "P1: block placements; T3: ESLint"). Each recommended default becomes an Accepted ADR on approval.

---

## 0. Decisions requested (summary)

| ID | Decision | Recommendation | Main alternative |
|---|---|---|---|
| **T0** | Install a Node runtime on this machine | `brew install node@24` (Node 24 LTS) | `fnm`-managed Node; or you install it |
| **T1** | Stack versions | Expo SDK 58 · RN 0.88 · React 19.3 · TypeScript 6.0 (Expo-pinned) · Node 24 LTS | Node 26 LTS; TypeScript 7 |
| **T2** | Package manager | pnpm workspaces, version pinned via `packageManager` | npm workspaces |
| **T3** | Lint + format | Biome (one tool) | ESLint + Prettier (+ eslint-config-expo) |
| **T4** | Test runners | Vitest (packages, editor) · jest-expo + RN Testing Library (app) · Playwright web smoke from M1 | Vitest only, with no component tests |
| **T5** | Runtime validation | zod 4 | Valibot; hand-written validators |
| **T6** | Package build model | Internal packages consumed as TS source; `exports` maps enforce public API | Build each package with tsup |
| **T7** | Puzzle editor tech | Vite + React DOM, dev-only web app | Second Expo app reusing game-ui |
| **T8** | App libraries | expo-router · RN Views for board · react-native-svg for art · built-in `Animated` · AsyncStorage behind adapter | Skia board; Reanimated from day one |
| **T9** | `main` branch protection | Accept the GitHub Free limitation (see §1); enforce via CI + director policy | Upgrade to GitHub Pro (cost); public repo |
| **P1** | Placement legality | Allow any animal on any grass cell; show rule violations gently | Block placements that break local rules |
| **P2** | Completion condition | Placed animals satisfy all constraints; unmarked cells count as empty | Require every cell resolved |
| **P3** | Feedback tiers | Local contradictions shown live; global unsatisfiability only on hint request | Live global check after every move |
| **P4** | Hint UX | Next deduction step, two-stage reveal (where + strategy → full explanation); player applies it | Auto-apply hints |
| **P5** | Pre-placed animals ("givens") | None in v1 | Allow givens to tune difficulty |
| **P6** | Habitat occupancy | Keep GDD rules (habitats need not host an animal) | "Every habitat hosts ≥1" as M4 experiment |
| **P7** | Where depth comes from | Generator targets overlap and strategy depth; difficulty = hardest strategy required | Board size / animal count |
| **P8** | Ruleset ownership | Canonical `woodland-v1` rule data in core; content owns names, art and colour | Ruleset data in content, injected everywhere |
| **P9** | Content target | 40 puzzles: Tutorial 4 · Beginner 8 · Easy 8 · Intermediate 12 · Advanced 8 | 30 (minimum) |
| **P10** | Placeholder art | Self-authored SVG silhouettes + shape/letter glyphs (CC0, provenance in `assets/`) | Platform emoji |

---

## 1. Environment findings (verified 2026-11-26)

| Item | Finding | Impact |
|---|---|---|
| Git | 2.50.1, identity configured | ok |
| GitHub CLI | 2.106.0, authenticated (`repo`, `workflow` scopes) | Private remote created (see STATUS.md) |
| **Node / npm / pnpm** | **Not installed** (no nvm/fnm/volta); Homebrew present | **Blocks scaffolding → T0** |
| Xcode | Command Line Tools only (no `simctl`) | No local iOS simulator |
| Android | SDK present, **no Java runtime** | No local Android build/emulator |
| Expo SDK 58 | Stable since Oct 2026; template pins RN 0.88.1, React 19.3.0, TS ~6.0.3 | Basis for T1 |
| GitHub plan | Private repo on a personal account | Branch protection/rulesets on private repos generally require Pro → T9 |
| GDD filename | Was `docs/gdd.md`; every reference says `docs/GDD.md` | Renamed (case-only, content unchanged) so Linux CI resolves it |

**Native verification plan given the environment:** CI runs `expo export` for `ios` and `android` (Metro bundling smoke test, which catches native-incompatible imports). Real-device checks happen manually via Expo Go on your phone. Simulator/emulator checks are reported as **unverified** unless Xcode or a JDK is installed later.

---

## 2. Feasibility spike: are the GDD rules a good puzzle?

I measured the risk before proposing contracts. Throwaway Python, random boards, an exact solution counter plus five simple strategies: line saturation, line forcing, species saturation, species forcing, same-species neighbour elimination.

| Board | Species | Habitat density | Unique solution | Unique **and** solved by simple strategies | Median propagation rounds (max) |
|---|---|---|---|---|---|
| 4×4 | F | 20% | 96% | 96% | — |
| 5×5 | F M | 20% | 88% | 87% | 2 (8) |
| 6×6 | F M R | 15% | 95% | 95% | 2 (6) |
| 6×6 | F M R | 25% | — | 70% | 4 (10) |
| 7×7 | F M R | 20% | 90% | 87% | 4 (11) |

Only **5–13% of grass cells** can host more than one species at these densities.

**What this means:**
1. **The rules are viable.** Uniqueness yield is high and almost no unique puzzle requires guessing. No rule change is needed to proceed.
2. **The real risk is shallowness, not yield.** Random puzzles are mostly solved in 2–4 shallow rounds, and species rarely interact. That undercuts the "simple rules, emergent depth" pillar.
3. **Depth is reachable but must be engineered.** Harder instances exist (8–11 rounds) and appear more often with higher habitat density. The generator must *select for* depth: species-overlap ratio, minimum strategy tier, chain length. It must not merely accept unique puzzles. This shapes P7 and the M2 acceptance criteria.
4. The "every habitat hosts ≥1 animal" variant (Tents-like) adds a strong deduction type with little yield cost. It is a **rule change**, so I recommend keeping it as an M4 experiment (P6) rather than adopting it now.

Caveat: the spike uses my own generator and a simplified strategy set. Treat it as directional evidence, not a content guarantee.

---

## 3. Product decisions (GDD ambiguities)

**P1 — Placement legality.** The GDD requires gentle contradiction feedback and forbids silent correction, but doesn't say whether rule-breaking placements are allowed.
*Recommend:* any species may be placed on any grass cell. Violations (no matching habitat orthogonally adjacent, same species touching, line or species over count) are flagged immediately with icon + text, never colour alone. Blocking would itself leak information and would stop players from sketching hypotheses.
*Alternative:* soft-block habitat-adjacency violations only (gentle shake). It is more guided but less "your board, your reasoning".

**P2 — Completion.** *Recommend:* solved when placed animals satisfy every constraint, with unmarked cells treated as empty. Players need not mark every empty cell. Because puzzles are unique, this is equivalent to matching the solution without shipping one (no answer keys in the bundle).

**P3 — Feedback tiers.**
- *Immediate (live, local):* same-species touching; animal without its habitat; row, column or species over its count; a line that can no longer reach its count given remaining non-empty cells; satisfied-line confirmation.
- *Global (on hint request only):* propagation from the current board reaches a contradiction. The hint then says "your board can't be completed from here", shows the conflicting chain, and offers undo back to the last consistent state.
- *Never:* "this animal is wrong" by comparison with the solution.

**P4 — Hints.** Each hint is the next sound deduction from the *current* board, respecting the player's empty marks.
- Stage 1 highlights the region and names the strategy.
- Stage 2 shows the full explanation and the affected cells, with an "apply" button.
- Hints are never auto-applied, and are unlimited with no penalty.

**P5 — No givens.** A puzzle is habitats + row/column clues + species populations only. Givens could be added later via a schema version bump if generator tuning needs them.

**P6 — Habitat occupancy.** GDD rules unchanged for M1–M3. The ≥1-occupant rule is listed as an M4 experiment alongside local clues.

**P7 — Depth & difficulty.** Difficulty is classified by the *hardest strategy required* plus deduction count and chain depth. It is not classified by board size. Tier targets are provisional until playtested. Generator objectives: species-overlap ratio, minimum strategy tier per difficulty band, rejection of trivially line-solved boards above Beginner, and layout diversity checks.

**P8 — Ruleset ownership.** Rule semantics (species → habitat, adjacency kinds, exclusion neighbourhood) are canonical data in `puzzle-core` as ruleset `woodland-v1`, so solver, generator and game share one definition. `puzzle-content` owns presentation config (display names, art keys, colours, tutorial text). Adding a species = adding ruleset data. A new *behaviour* (e.g. hedgehog "touch no animal") = registering a new constraint kind without modifying existing ones.

**P9 — Content.** 40 curated puzzles across five tiers, generated offline, validated in CI, hand-reviewed for variety.

**P10 — Art.** Self-authored, replaceable SVG placeholders. Every species and habitat also has a distinct glyph or shape so state never depends on colour alone. Provenance is recorded in `assets/PROVENANCE.md`.

---

## 4. Stack

- **T1** Expo SDK 58 / React Native 0.88 / React 19.3 / TypeScript ~6.0 (exactly what the Expo 58 template pins; TS 7 waits until Expo adopts it) / Node 24 LTS (most conservative LTS for Metro and Expo tooling).
  - All versions pinned; lockfile committed; `engines` and `.nvmrc` set.
- **T2** pnpm: strict dependency isolation catches undeclared cross-package imports, which reinforces the boundaries. Uses Expo's documented monorepo configuration. If Metro resolution misbehaves, fall back to `node-linker=hoisted` (recorded in an ADR).
- **T3** Biome 2: one fast tool for lint + format, no coupling to the TypeScript compiler API, and React hooks rules included. Trade-off: fewer community rules than ESLint, and no `eslint-config-expo`.
- **T4**
  - Vitest for all pure packages and the editor.
  - jest-expo + React Native Testing Library for app components and user flows (Expo's supported path).
  - Playwright against the web export at phone viewports (360×640, 390×844) with large-text emulation, for the M1/M3 mobile layout smoke checks.
- **T5** zod 4 for content and save validation. Schemas live in `puzzle-core` (content depends on core schemas).
- **T6** No per-package build step. Packages export TS source through `package.json#exports`, so deep imports are impossible. Exhaustive search is exposed only as `@ww/puzzle-solver/search`, and a boundary test fails if the game imports it or anything from `@ww/puzzle-generator`.
- **T7** Editor as a Vite + React DOM app. It is a dev tool, needs no native fidelity, and stays simple to build. It reads and writes puzzle JSON and calls solver + generator directly.
- **T8** expo-router (Expo default, deep-linkable web). The board uses plain RN `View`/`Pressable` cells, so every cell is an accessible element. Art uses react-native-svg. Completion animation uses built-in `Animated` with reduced-motion support; Reanimated is added only if needed. Storage is AsyncStorage behind a `StorageAdapter`.
- **T9** CI is required in practice: the director never integrates on red. If you upgrade to GitHub Pro, I'll enable force-push/deletion protection and required checks on `main`.

---

## 5. Package graph & bundle boundaries

```
puzzle-core  ◄── puzzle-solver ◄── puzzle-generator
    ▲   ▲            ▲   ▲               ▲
    │   └─ puzzle-content (schemas only)  │
    │            ▲   │                    │
 game-ui ◄── apps/game (core, solver[deduce only], content, game-ui)
             apps/puzzle-editor (core, solver[+search], generator, content)
```

| Package | Owns | Depends on |
|---|---|---|
| `@ww/puzzle-core` | Types, schemas, `woodland-v1` ruleset, geometry, constraints (evaluate/complete), actions, history, completion | zod |
| `@ww/puzzle-solver` | Domains, deduction strategies, proof steps, hints, difficulty metrics; `/search`: exhaustive counter with budget | core |
| `@ww/puzzle-generator` | Seeded PRNG, board synthesis, filtering, export CLI | core, solver |
| `@ww/puzzle-content` | Curated puzzle JSON, presentation config, tutorial data, `content:validate` | core (+ solver in validation script only) |
| `@ww/game-ui` | Presentational RN components: Board, Cell, Clue, Tray, Toolbar | core types, react-native |
| `apps/game` | Screens, input → actions, persistence, navigation, a11y | core, solver (deduce), content, game-ui |
| `apps/puzzle-editor` | Authoring & inspection | core, solver, generator, content |

---

## 6. Public contracts (frozen on approval, then changed only via ADR)

### 6.1 Coordinates & identifiers
- Grid is `rows × columns`, 3 ≤ each ≤ 10, rectangular. `(row, col)` is 0-based with the origin top-left.
- `CellIndex = row * columns + col` (branded number) for engine internals. Content and saves use `{row, col}` for readability.
- Orthogonal neighbours = 4 (habitat adjacency). King neighbours = 8 (same-species exclusion). No wrap-around.
- `SpeciesId`, `HabitatId`: lowercase slugs (`fox`, `mouse`, `rabbit`; `tree`, `mushroom`, `burrow`), defined by ruleset data, not TS unions. `empty` and `unmarked` are reserved.
- Puzzle IDs: stable slugs `^[a-z0-9]+(-[a-z0-9]+)*$` (e.g. `meadow-012`), never reused. `revision` bumps on any gameplay-affecting change.

### 6.2 Data
```ts
interface PuzzleDefinition {            // schemaVersion 1
  schemaVersion: 1;
  id: PuzzleId; revision: number;
  rulesetId: 'woodland-v1';
  rows: number; columns: number;
  habitats: { row: number; col: number; habitat: HabitatId }[];
  rowClues: number[]; columnClues: number[];
  population: Record<SpeciesId, number>;
  difficulty?: DifficultyMetadata;      // informational, never used for rules
  provenance?: { generatorVersion: string; seed: string; params: Record<string, unknown> };
}
// Structural validation also checks: clue lengths; Σrow = Σcol = Σpopulation; no duplicate habitats;
// every species in population is in the ruleset.

interface Ruleset { id: string; species: { id: SpeciesId; habitats: HabitatId[]; constraints: ConstraintKindRef[] }[]; habitats: HabitatId[] }

type CellMark = 'unmarked' | 'empty' | SpeciesId;          // player state; habitat cells are always 'unmarked'
type CellView = { kind: 'habitat'; habitat: HabitatId } | { kind: 'unmarked' } | { kind: 'empty' } | { kind: 'animal'; species: SpeciesId };

interface BoardState { puzzleId: PuzzleId; revision: number; marks: readonly CellMark[] }   // immutable
type Action = { type: 'setCell'; cell: CellIndex; mark: CellMark } | { type: 'clearAll' };
type ApplyResult = { ok: true; state: BoardState; change: Change } | { ok: false; reason: 'habitat-cell' | 'out-of-bounds' | 'unknown-species' | 'no-op' };
interface Change { cells: { cell: CellIndex; from: CellMark; to: CellMark }[] }
interface History { past: Change[]; future: Change[] }      // undo/redo are pure functions of (state, history)
```
The UI maps tools to actions: tap with a species tool places it, or removes it if the same species is already there; the empty tool toggles `empty`.

### 6.3 Constraints (core)
```ts
interface Constraint {
  id: ConstraintId;              // stable, e.g. 'row:3', 'species:fox', 'habitat:fox@r2c4', 'exclusion:fox'
  kind: ConstraintKind;          // 'line-count' | 'species-count' | 'habitat-adjacency' | 'species-exclusion'
  scope: readonly CellIndex[];
  evaluate(board: BoardView): ConstraintStatus;   // partial-board aware
}
type ConstraintStatus = { status: 'satisfied' | 'pending' } | { status: 'violated'; violation: Violation };
interface Violation { constraintId: ConstraintId; kind: ViolationKind; cells: CellIndex[]; data: Record<string, number | string> }  // structured, no prose
```
- `buildConstraints(def, ruleset)` uses a registry keyed by kind. New kinds (local clues, hedgehog) register without editing existing ones.
- `evaluateBoard()` returns violations, line/species statuses and `isComplete`.
- Cell occupancy is structural: one mark per cell.

### 6.4 Solver & proofs
```ts
type Value = 'empty' | SpeciesId;
type Domains = readonly ValueSet[];           // bitset per cell
interface DeductionStep {
  strategy: StrategyId;                       // 'line-saturated' | 'line-forced' | 'no-habitat' | 'species-exhausted' |
                                              // 'species-forced' | 'neighbour-exclusion' | 'single-candidate' | 'intersection' | ...
  tier: 1 | 2 | 3 | 4;
  eliminations: { cell: CellIndex; values: Value[] }[];
  premises: { constraints: ConstraintId[]; cells: CellIndex[] };
  explanation: { key: string; params: Record<string, number | string> };   // localizable template
}
type DeductionResult = { kind: 'solved' | 'stuck'; steps: DeductionStep[]; domains: Domains }
                     | { kind: 'contradiction'; steps: DeductionStep[]; conflict: Violation };
type SearchResult = { kind: 'none' } | { kind: 'unique'; solution: CellMark[] }
                  | { kind: 'multiple'; solutions: [CellMark[], CellMark[]] }
                  | { kind: 'unknown'; reason: 'budget'; nodes: number };
```
- `deduce(def, marks)` → trace; `nextHint(def, marks)` → first applicable step (or the conflict).
- `search(def, {nodeBudget})` stops at 2 solutions; `unknown` is never publishable.
- **Soundness strategy:** the brute-force oracle uses only core's `evaluate`, so there is one source of rule truth. On every enumerable tiny board, every elimination in every step must be absent from all oracle solutions. Search counts must equal oracle counts.
- **Proof replay:** a published puzzle's trace from the empty board must reach a fully determined board equal to `search`'s unique solution, with no search steps.

### 6.5 Persistence
```ts
interface SaveDataV1 {
  schemaVersion: 1;
  progress: Record<PuzzleId, { completedRevision?: number; completedAt?: string }>;
  active: Record<PuzzleId, { revision: number; marks: CellMark[]; history: History }>;
  settings: { reducedMotion: 'system' | 'on' | 'off'; onboardingDone: boolean };
}
```
- Migrations run as an ordered chain `vN → vN+1`.
- If an active board's revision ≠ the content revision, the board is discarded and completion is kept.
- Invalid or corrupt data: keep the raw blob under a backup key, start from defaults, never crash.
- Storage is reached only through `StorageAdapter { get; set; remove }`.

---

## 7. Verification commands (exact, run identically locally and in CI)

| Command | Does |
|---|---|
| `pnpm install --frozen-lockfile` | Reproducible install |
| `pnpm lint` / `pnpm format:check` | Biome |
| `pnpm typecheck` | `tsc --noEmit` per workspace |
| `pnpm test` | Vitest + jest-expo |
| `pnpm check:boundaries` | Dependency direction, no deep/private imports, no search/generator in game bundle |
| `pnpm content:validate` | Schema + uniqueness (search) + deduction replay for every shipped puzzle |
| `pnpm build:web` | `expo export -p web` |
| `pnpm smoke:native` | `expo export -p ios -p android` (bundle only) |
| `pnpm verify` | All of the above, in order |

CI runs `hygiene` (already live) + `verify` on Ubuntu with Node 24. Playwright smoke joins at M1.

---

## 8. Milestones, acceptance criteria, lanes

### M0b — Foundation (sequential, director; after approval)
Workspace scaffold, all §6 types and schemas, `woodland-v1`, geometry, the four constraints, evaluation, actions, history, completion, and 5 handcrafted fixture puzzles with known unique solutions (4×4, 5×5, 6×6, a rectangular 5×7, and one deliberately contradictory definition).

**Done when:**
- `pnpm verify` is green locally and in CI.
- Core covers: each constraint, edges and rectangles, undo/redo, completion, invalid definitions.
- Boundary check is active and a fresh clone reproduces the environment.
- Worktree-based lane dispatch has been dry-run.

Core is built here rather than in a lane, because every lane depends on it and it is small.

### M1 — Playable (parallel: lanes C ∥ B ∥ D-schema work)
**Done when:**
- Handcrafted puzzles are playable on web.
- Place, remove, empty-mark, undo/redo and live local feedback all work.
- Satisfied-line and remaining-count indicators work, plus a completion state.
- Playwright smoke at two phone viewports plus large text passes.
- Jest flow tests pass for: place, conflict shown, undo, complete.
- Native bundle smoke passes.

### M2 — Intelligence
**Done when:**
- `search` matches the oracle on ≥500 random tiny boards, including zero, one and multiple solutions; budget exhaustion returns `unknown`.
- Every strategy has soundness tests.
- Hints work in the app and the contradiction path works.
- The generator is deterministic per seed (golden tests) and reports yield and rejection reasons.
- The editor can create, auto-clue, count solutions, show the trace and import/export.
- **40 curated puzzles** pass `content:validate`, meet tier strategy targets, and the actual yield and depth distribution are reported.

### M3 — Vertical slice
**Done when:**
- Interactive onboarding (tutorial tier) works.
- Level select and progression work.
- Local save/restore round-trips, with migration and corruption tests.
- Completion scene animation honours reduced motion.
- Accessibility labels exist on every cell and control.
- The web build ships.
- Native: bundle smoke in CI; device check via Expo Go reported as done or unverified.

### M4 — Design validation
**Done when:**
- A playtest build and protocol (tasks, observation sheet, questions mapped to GDD §14) exist.
- A deduction-variety report exists.
- Findings are reported only from real human sessions.

### Lanes after M0b

| Lane | Write scope | Starts | Integrates |
|---|---|---|---|
| B — Intelligence | `packages/puzzle-solver`, `packages/puzzle-generator` | M0b SHA | Solver early in M2; generator after |
| C — Player | `apps/game`, `packages/game-ui`, `assets/` | M0b SHA | M1; hints after B's `deduce` lands |
| D — Content/Editor | `apps/puzzle-editor`, `packages/puzzle-content` | M0b SHA (validation script stubs search until B lands) | M2 |

- Director-owned: root configs, lockfile, CI, `packages/puzzle-core/src/contracts/**`, docs/STATUS.md, docs/adr/**.
- Dependency requests go to the director, who batches lockfile changes.
- Read-only review passes (logic, engineering, product) run before each milestone merge.

---

## 9. Top risks

| Risk | Mitigation |
|---|---|
| Shallow puzzles (spike §2) | Generator objectives + tier targets; M4 experiments (P6, local clues) ready to evaluate |
| Solver/core rule divergence | Oracle built only on core `evaluate`; property tests |
| Expo + pnpm monorepo resolution | Expo's documented setup; hoisted fallback ADR |
| No local native toolchain | CI bundle smoke; Expo Go manual check; flagged as unverified |
| Hint explanations that confuse | Structured explanation keys; product review pass at M2 |

## 10. ADRs to record on approval
0002 Stack & versions (T0–T2) · 0003 Tooling: lint/test/validation (T3–T5) · 0004 Package graph & bundle boundaries (T6, §5) · 0005 Core contracts (§6.1–6.3) · 0006 Solver proofs & oracle (§6.4) · 0007 Persistence (§6.5) · 0008 Product interaction rules (P1–P5) · 0009 Content & difficulty policy (P6–P10)
