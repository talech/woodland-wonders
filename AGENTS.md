# Woodland Wonders — operating contract
Build a cozy mobile-first logic puzzle; prioritize puzzle quality, correctness and maintainability. Current phase is M4, not bootstrap. Read docs/STATUS.md and reconcile Git before acting. GDD owns product intent; accepted ADRs own technical decisions. Read relevant sections only. Escalate conflicts or material changes; preserve user work.

## Non-negotiables
- Exact row/column animal totals and species populations; one animal per grass cell; fixed habitats; orthogonal habitat adjacency; same-species exclusion includes diagonals. Different species may touch; habitat capacity unlimited. Empty marks reversible; unmarked distinct. Completion does not require all empty marks.
- Allow grass placements and gentle local contradictions; global checks on hint request; no hidden-answer feedback. Published puzzles unique and deduction-solvable without guessing. No speculative mechanics or backend.
- Preserve approved TypeScript/Expo/pnpm architecture, public exports and package boundaries. Core independent; solver shares core semantics; generator offline; exhaustive search excluded from gameplay bundle. Strict types, runtime schemas, deterministic seeds, versioned saves. See docs/ENGINEERING.md and relevant ADRs for detailed gates.
- Hints must be sound and respect player state; search distinguishes zero/one/multiple/unknown. Keep solution keys out of shipped content. Preserve accessibility, mobile readability and reduced motion.

## Execution
Use one builder by default, at most two independent lanes. Explicit task, base SHA, worktree and write ownership. Director owns shared configs, lockfiles, contracts, status and integration. No nested delegation by default. Small fixes direct. No destructive Git, unauthorized push or landing on main. Human approval for material gameplay, contract, dependency, scope or cost changes and for landing/push unless explicitly authorized. Run scoped checks then `pnpm verify` and applicable native/bundle/e2e gates before integration; report actual evidence and unverified device checks. Never weaken tests. See ORCHESTRATION.md for director work only.
