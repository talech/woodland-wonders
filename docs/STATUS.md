# Project Status

_Director-maintained. On resume: re-read this file, then reconcile with `git log`, `git worktree list` and CI._

## Current milestone
**M2 — Puzzle intelligence: COMPLETE** (CI green at `0786a17`). Next: **M3 — Vertical slice** (onboarding, progression, local persistence, completion scene, accessibility pass, web build; native smoke).

**M2 gate evidence:**
- **Solver:** zero/one/multiple/unknown, matching the oracle on 600 random boards. 10 strategies in tiers 1–3, each with a soundness test.
- **Hints:** two stages, Apply is undoable, the contradiction path explains the conflict and rewinds only on confirmation. Following hints solves all 40 catalog puzzles (jest). e2e screenshots were reviewed by the director.
- **Generator:** seeded and deterministic; reports yield and rejection reasons; bands select on required tier and substantive chain.
- **Editor:** solver panel with verdict, trace, solution diff and difficulty (checked in a browser by the director).
- **Content:** **40 curated puzzles** (4/8/8/12/8). All pass uniqueness, deduction-only solve, replay and the no-answer-key check. See [content/CURATION.md](content/CURATION.md) for yields and depth distribution.
- **Checks:** `pnpm verify` gives 191 Vitest + 130 Jest; native bundles build; Playwright 10/10 at 360×640 and 390×844.

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
| M1-B | Solver: deduction, hints, search, oracle ([packet](tasks/M1-B-solver.md)) | **integrated** `4981ae5` | agent (lane B) | packages/puzzle-solver | `b78c9ab` | `agent/m1/solver` · `../woodland-wonders.worktrees/m1-solver` | core |
| M1-C | Playable game UI ([packet](tasks/M1-C-player.md)) | **integrated** incl. review fixes M1-C.1 (`b1f3b98`); product findings resolved, screenshot-verified | agent (lane C) | apps/game, packages/game-ui, assets | `b78c9ab` | `agent/m1/player` · `../woodland-wonders.worktrees/m1-player` | core, content |
| M1-D | Puzzle editor + content add tooling ([packet](tasks/M1-D-editor.md)) | **integrated** `934bf49` | agent (lane D) | apps/puzzle-editor, packages/puzzle-content | `b78c9ab` | `agent/m1/editor` · `../woodland-wonders.worktrees/m1-editor` | core |
| M1-I | Integrate B/C/D, Playwright web smoke, M1 review gates, real content gates | **done** `09bf98d` | director | root | — | main | M1-B, M1-C, M1-D |
| M2-B2 | Seeded generator + CLI, depth objectives ([packet](tasks/M2-B2-generator.md)) | **integrated** (`bedca13`) | agent (lane B) | packages/puzzle-generator | f8e9e30 | — | M1-B |
| M2-D2 | Editor solver panel ([packet](tasks/M2-D2-editor-solver.md)); content:validate gates done by director in M1-I | **integrated** (merge of `66450f7`) | agent (lane D) | apps/puzzle-editor | f8e9e30 | — | M1-B, M1-D |
| M2-C2 | In-game hints ([packet](tasks/M2-C2-hints.md)) | **integrated** (`2934f8e`) | agent (lane C) | apps/game, game-ui | f8e9e30 | — | M1-B, M1-C |
| M2-content | 40 curated puzzles | **done** `0845bb3` | director | puzzle-content data, scripts/curate.py | — | main | M2-B2, M2-D2 |

Integration order for M1: B (no consumers yet) → D (content API additive) → C (consumes content), then Playwright smoke.

## Active worktrees
None (all M2 lanes integrated and removed).

| Path | Branch | Base | Status |
|---|---|---|---|

## Decisions
- Accepted: [ADR-0001](adr/0001-repository-workflow.md) … [ADR-0009](adr/0009-content-policy.md).
- Expo held at 58.0.25 / expo-router 58.0.31 under the release-age policy. Re-align after 2026-12-10 (ADR-0002 notes).
- `docs/gdd.md` renamed to `docs/GDD.md` (case only).
- Biome excludes Markdown so human-authored docs are never reformatted.

## Blockers / limitations
1. **Branch protection** unavailable on the current GitHub plan (T9 accepted). Enforced by CI + director policy.
2. **Native toolchains absent locally** (no Xcode simulator, no JDK). Native coverage = CI Metro bundle export for iOS/Android + manual Expo Go. Device runs are **unverified**.
3. Node is keg-only: add `/opt/homebrew/opt/node@24/bin` to your shell `PATH` to run commands yourself.
4. Depth is scarce: about 90% of valid generated puzzles need only tier 1. The catalog is depth-selected (8 tier-2 intermediates, 8 tier-3 advanced), but difficulty is provisional until playtested (M4).

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

| 2026-11-26 | `09bf98d` | After lane B: `pnpm verify` (161 Vitest + 52 Jest), `content:validate` 4/4 unique + deduced + replayed, negative probe (multi-solution) fails as expected, smoke:native, Playwright 6/6, CI | pass ([run](https://github.com/talech/woodland-wonders/actions/runs/45898272537)) |
| 2026-11-26 | `934bf49` | After merging lane D: `pnpm verify` (93 Vitest + 1 Jest), editor build, Playwright 2/2 | pass |

| 2026-11-26 | merge of lane C | `pnpm verify` (93 Vitest + 41 Jest), `smoke:native`, Playwright 6/6 (boot, full play-through of meadow-001 with violation + undo, 6×6 fit) at 360×640 and 390×844 | pass |

**M1 product review (director, Playwright screenshots at 360×640): RESOLVED in M1-C.1, re-verified by screenshot + e2e `toBeInViewport` regression.**
1. The species tray breaks words mid-word with 3 species ("Mous/e"), and the hint text makes the cards tall.
2. The toolbar (Mark empty / Undo / Redo) sits below the fold with the 6×6 board.

Non-blocking: the app icon/splash are Expo template defaults; the completion is a panel plus hop rather than the GDD scene transition (M3); glyph ◒ may be missing on some Android fonts (SVG art still distinguishes).

| 2026-11-26 | merge of D2 | `pnpm verify` (169 Vitest + 52 Jest), editor build, browser check of solver panel on meadow-004 (publishable, 1 solution, 40-step trace, step highlighting) | pass |

| 2026-11-26 | `0786a17` | Catalog v1 (40) + hints merged: verify (191 Vitest + 130 Jest), content 40/40, smoke:native, Playwright 10/10, CI | pass ([run](https://github.com/talech/woodland-wonders/actions/runs/45900411266)) |

Deferred product findings (M2): on a fresh board the first hint is usually a trivial `no-habitat` step (sound, but possibly low-value for experienced players; evaluate in M4). The hint panel shows about 3 lines at 360×640 and scrolls inside for long chains. The tutorial species and generator ids are covered by curation renaming (`<band>-NN`).

Deferred findings (lane D2): importing a catalog puzzle flags every cell, because the painted-solution check runs against an empty painting (definitions carry no solution); the solver panel has no DOM tests; search runs on the main thread. Difficulty insight: 26/40 steps of meadow-004 are trivial `no-habitat` eliminations, so the generator must measure substantive steps (sent to B2).

Deferred findings (lane D): no DOM component tests for the editor UI (model is unit-tested); a missing difficulty tier exports as `beginner` but sorts as `tutorial` in `add-puzzle`. Align in M2-D2.

## Next actions
1. Plan and dispatch M3 lanes: progression + persistence (SaveDataV1, ADR-0007), onboarding (interactive tutorial over tutorial-01..04), completion scene, accessibility/large-text pass.
2. Keep the M2 deferred findings on the M4 playtest checklist.
