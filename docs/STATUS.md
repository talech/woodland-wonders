# Project Status

_Director-maintained. On resume: re-read this file, then reconcile with `git log`, `git worktree list` and CI._

## Current milestone
**M1 — Playable (in progress).** M0 and M0b are complete. The architecture is approved (ADR-0002…0009); the foundation is green locally and in CI at `b78c9ab`. Lanes B, C and D are dispatched in parallel from that base.

| Field | Value |
|---|---|
| Integration branch | `main` |
| Lane base SHA | `b78c9ab` |
| Remote | `github.com/talech/woodland-wonders` (private) |
| CI | `hygiene` + `verify` (frozen install → `pnpm verify` → `pnpm smoke:native`) |

## Task registry

| ID | Task | Status | Owner | Write scope | Base | Branch / worktree | Depends on |
|---|---|---|---|---|---|---|---|
| M0-1 | Git init, hygiene, CI baseline, remote | done | director | root | — | main | — |
| M0-2 | Architecture & decision review | **approved** 2026-11-26 | human | docs | — | — | M0-1 |
| M0-3 | Install Node 24 LTS (Homebrew `node@24`, keg-only) | done | director | machine | — | — | M0-2 |
| M0b-1 | Workspace scaffold, tooling, CI verify | done (`b78c9ab`) | director | root, apps, package stubs | — | main | M0-2 |
| M0b-2 | puzzle-core: contracts, ruleset, constraints, actions, history, tests | done (`18af3ff`) | director | packages/puzzle-core | — | main | M0b-1 |
| M0b-3 | Fixtures, seed catalog, presentation config, boundary check | done (`b78c9ab`) | director | core/testing, puzzle-content, scripts | — | main | M0b-2 |
| M1-B | Solver: deduction, hints, search, oracle ([packet](tasks/M1-B-solver.md)) | **in progress** | agent (lane B) | packages/puzzle-solver | `b78c9ab` | `agent/m1/solver` · `../woodland-wonders.worktrees/m1-solver` | core |
| M1-C | Playable game UI ([packet](tasks/M1-C-player.md)) | **in progress** | agent (lane C) | apps/game, packages/game-ui, assets | `b78c9ab` | `agent/m1/player` · `../woodland-wonders.worktrees/m1-player` | core, content |
| M1-D | Puzzle editor + content add tooling ([packet](tasks/M1-D-editor.md)) | **integrated** `934bf49` | agent (lane D) | apps/puzzle-editor, packages/puzzle-content | `b78c9ab` | `agent/m1/editor` · `../woodland-wonders.worktrees/m1-editor` | core |
| M1-I | Integrate B/C/D, Playwright web smoke, M1 review gates | pending | director | root | — | main | M1-B, M1-C, M1-D |
| M2-B2 | Seeded generator + CLI, depth objectives | pending | lane B | packages/puzzle-generator | — | — | M1-B |
| M2-D2 | Editor solver panel; content:validate uniqueness + replay | pending | lane D / director | editor, content | — | — | M1-B, M1-D |
| M2-C2 | In-game hints | pending | lane C | apps/game, game-ui | — | — | M1-B, M1-C |
| M2-content | 40 curated puzzles | pending | director + lane D | puzzle-content data | — | — | M2-B2, M2-D2 |

Integration order for M1: B (no consumers yet) → D (content API additive) → C (consumes content), then Playwright smoke.

## Active worktrees
| Path | Branch | Base | Status |
|---|---|---|---|
| `../woodland-wonders.worktrees/m1-solver` | `agent/m1/solver` | `b78c9ab` | lane B working |
| `../woodland-wonders.worktrees/m1-player` | `agent/m1/player` | `b78c9ab` | lane C working |

## Decisions
- Accepted: [ADR-0001](adr/0001-repository-workflow.md) … [ADR-0009](adr/0009-content-policy.md).
- Expo held at 58.0.25 / expo-router 58.0.31 under the release-age policy. Re-align after 2026-12-10 (ADR-0002 notes).
- `docs/gdd.md` renamed to `docs/GDD.md` (case only).
- Biome excludes Markdown so human-authored docs are never reformatted.

## Blockers / limitations
1. **Branch protection** unavailable on the current GitHub plan (T9 accepted). Enforced by CI + director policy.
2. **Native toolchains absent locally** (no Xcode simulator, no JDK). Native coverage = CI Metro bundle export for iOS/Android + manual Expo Go. Device runs are **unverified**.
3. Node is keg-only: add `/opt/homebrew/opt/node@24/bin` to your shell `PATH` to run commands yourself.
4. `content:validate` does not yet check uniqueness or deduction replay (explicit PENDING until M1-B integrates). The seed catalog's uniqueness was verified only by the M0 throwaway spike.

## Verification evidence
| Date | SHA | Check | Result |
|---|---|---|---|
| 2026-11-26 | `0b7a8df` | CI hygiene | pass ([run](https://github.com/talech/woodland-wonders/actions/runs/45892820637)) |
| 2026-11-26 | — | Branch protection API | HTTP 403 (plan limitation) |
| 2026-11-26 | — | Worktree isolation dry-run | pass |
| 2026-11-26 | `b78c9ab` | local `pnpm verify` (lint, format, typecheck ×7, boundaries, 68 Vitest + 1 Jest, content 4/4, web export) | pass |
| 2026-11-26 | `b78c9ab` | local `pnpm smoke:native`, editor `vite build`, frozen install | pass |
| 2026-11-26 | `b78c9ab` | `check:boundaries` negative test (5 planted violations detected) | pass |
| 2026-11-26 | `b78c9ab` | CI hygiene + verify (fresh Linux clone) | pass ([run](https://github.com/talech/woodland-wonders/actions/runs/45895320650)) |

| 2026-11-26 | `934bf49` | After merging lane D: `pnpm verify` (93 Vitest + 1 Jest), editor build, Playwright 2/2 | pass |

Deferred findings (lane D): no DOM component tests for the editor UI (model is unit-tested); a missing difficulty tier exports as `beginner` but sorts as `tutorial` in `add-puzzle`. Align in M2-D2.

## Next actions
1. Lanes B/C/D report back; director reviews diffs against write scopes, integrates B → D → C, runs `pnpm verify` + `smoke:native` after each merge.
2. Director adds the Playwright web smoke (phone viewports, large text) and runs the M1 logic/engineering/product review passes.
3. Dispatch M2 tasks (generator, solver panel, hints, content).
