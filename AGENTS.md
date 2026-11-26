# Woodland Wonders — Agent Operating Contract

## Mission and authority
Build a mobile-first, cozy animal-placement logic puzzle with a production-ready foundation. Optimize for a compelling puzzle, correctness, maintainability and rapid iteration, in that order. This is a vertical slice, not throwaway code or a full commercial launch.

Read `docs/GDD.md` before changing gameplay. The GDD owns product intent; this file owns engineering and execution policy. Approved ADRs own technical decisions. If these conflict, stop the affected work and escalate; do not silently resolve product ambiguity. Inspect existing code and git status before acting. Preserve unrelated user changes.

## Game invariants
- Row/column clues count occupied animal cells, not runs or habitat cells.
- Each cell holds at most one animal. Fixed habitats cannot be occupied or moved.
- Fox/tree, mouse/mushroom, rabbit/burrow: habitat adjacency is orthogonal; same-species exclusion includes diagonals. Habitats have unlimited capacity initially.
- Exact species population, row and column counts must all hold at completion. Different species may touch.
- Unmarked and explicitly empty cells are distinct player states. Empty marking is reversible and constrains solver assumptions, not the underlying puzzle definition.
- No lives, timers, merge, economy, backend or speculative meta systems. Local adjacency clues and special species behaviors are deferred.
- Ordinary feedback must not compare placements against a hidden answer. Distinguish immediate contradictions from global unsatisfiability; never silently correct a player's board.
- Published puzzles must have exactly one solution and a complete human-interpretable deduction trace without guessing. Search may certify uniqueness but may not masquerade as a hint.

## Architecture
Default stack: TypeScript workspace, React Native/Expo for iOS, Android and web. Confirm tooling choices at M0; pin versions and commit lockfiles. Prefer straightforward modules over frameworks built for hypothetical needs.

```
apps/game
apps/puzzle-editor
packages/puzzle-core
packages/puzzle-solver
packages/puzzle-generator
packages/puzzle-content
packages/game-ui
assets/
docs/adr/
docs/GDD.md
```
Dependency direction: core has no app/platform dependencies; solver depends on core; generator depends on core and solver; content depends on core schemas; apps consume public package APIs. UI may consume core types, never generator internals. Keep generation and exhaustive search out of the gameplay bundle. Editor and generator are development tools. No circular imports or cross-package private imports.

Core owns immutable puzzle definitions, serializable player state, actions, deterministic transitions, adjacency, constraint semantics and completion. Solver owns domains, propagation, proof traces, bounded search and difficulty analysis. Generator owns seeded creation, filtering and export. Content owns validated, versioned data and stable IDs. App owns input, rendering, navigation and persistence. Share rule semantics; do not implement divergent validators in UI and solver.

## Contracts and correctness
- Use strict TypeScript; no unjustified `any`, unsafe casts or hidden global state.
- Define stable coordinate conventions, cell IDs, species IDs, schema versions and action/result types at M0. Validate external content and saves at runtime.
- Keep puzzle definitions separate from solutions, player state, history and candidate domains. Do not ship answer keys unless a reviewed feature requires them.
- Constraints expose partial evaluation, complete evaluation and structured deduction reasons where applicable. Use configuration for species/habitat mappings; add constraint implementations only when needed.
- Model candidate domains as empty or species IDs. Deduction steps must identify affected cells, eliminated/forced values and supporting constraints. Hints respect current marks and placements; on contradiction, explain the conflict or offer undo rather than invent a move.
- Uniqueness search stops after two solutions; distinguish zero, one, multiple and unknown (budget exhausted). Never publish unknown results. Deterministic ordering and explicit seeds; no ambient randomness in engine/generator.
- Difficulty is provisional until playtested. Record strategy mix, deduction count and chain depth where measurable. Reject unsupported guesses, not merely difficult puzzles.
- Generate content offline; cap runtime and attempts, report rejection reasons, preserve seed and generator version. Curate generated levels for diversity.
- Version saves and content; define migration behavior and safe recovery. Persist progress and active board locally; keep storage behind a small adapter.

## Mobile quality
Portrait-first, readable clues and species counts, accessible labels, non-color-only states, responsive layout and safe areas. Tap placement, removal, empty marking, undo/redo. Avoid tiny targets; test small screens and large text. Keep animation interruptible and honor reduced motion. Use replaceable assets with documented provenance; no unlicensed assets. Avoid unnecessary dependencies and platform-specific assumptions.

## Verification
At M0 establish root commands for install, lint, format check, typecheck, test, content validation and web build; document exact commands in README. Add native smoke checks when supported. CI runs the same reproducible commands. Never claim a check passed without running it; report unavailable native/device checks explicitly.

Required tests: each constraint, edges/rectangular boards, contradictory definitions, zero/one/multiple solutions, search budget exhaustion, deterministic seeds, sound deduction traces, undo/redo, save/restore and completion. Cross-check solver against brute-force enumeration on tiny boards. Verify every published puzzle with uniqueness and deduction replay. Test user flows and mobile layout. Add regressions for fixed bugs. No skipped tests or weakened assertions to obtain green builds.

## Collaboration and ownership
The director assigns scoped tasks, branch/worktree, allowed paths, dependencies, acceptance criteria and verification commands. One writer per path, including shared configs and lockfiles. Workers must not edit outside their assigned paths, merge branches, change shared contracts, or spawn further workers without permission. Request a contract change through the director. Read-only inspection outside scope is allowed.

Use isolated git worktrees where supported; never reset, clean, force-push or overwrite user work. Commit focused changes on assigned branches. Report commit SHA, files, tests, limitations and integration notes. Director owns integration and shared files. If worktree/sub-agent support is unavailable, use sequential execution with the same boundaries.

## Decision policy
Autonomous: local implementation details, tests, bug fixes within approved contracts, reversible UI polish. Document meaningful choices.
Escalate: gameplay changes, stack changes, public contract/schema changes after freeze, new major dependencies, scope expansion, external services, costs, destructive operations, or unresolved tradeoffs affecting the product. Continue independent work while blocked. Never invent approval.

## Definition of done
Acceptance criteria met; scoped changes reviewed; relevant checks executed; no unexplained regressions; documentation updated; risks and unverified checks reported. Keep the main integration branch playable at milestone boundaries. Do not equate generated content, passing tests or a unique solution with validated fun.
