# Project Status

_Director-maintained. On resume: re-read this file, then reconcile with `git log`, `git worktree list` and CI._

## Current milestone
**M0 — Foundation.** Repository infrastructure is complete. **Waiting for human approval of [docs/M0-REVIEW.md](M0-REVIEW.md)** before contracts freeze and scaffolding begins (M0b).

| Field | Value |
|---|---|
| Integration branch | `main` |
| Baseline SHA | `0b7a8df` (chore: initialize repository) |
| Remote | `github.com/talech/woodland-wonders` (private) |
| CI | `hygiene` job (tracked-file hygiene + gitleaks). `verify` job pending scaffold |

## Task registry

| ID | Task | Status | Owner | Scope | Base | Branch / worktree | Depends on |
|---|---|---|---|---|---|---|---|
| M0-1 | Git init, hygiene, CI baseline, remote | done | director | root, .github, scripts | — | main | — |
| M0-2 | Architecture & decision review | **awaiting approval** | human | docs/M0-REVIEW.md | — | — | M0-1 |
| M0-3 | Install Node 24 LTS (T0) | blocked on approval | director | machine | — | — | M0-2 |
| M0b-1 | Workspace scaffold + tooling + `verify` CI | not started | director | root | — | main | M0-2, M0-3 |
| M0b-2 | Core contracts, ruleset, constraints, actions, history + tests | not started | director | packages/puzzle-core | — | main | M0b-1 |
| M0b-3 | Fixture puzzles + lane dispatch dry-run | not started | director | packages/puzzle-content/fixtures | — | main | M0b-2 |

## Active worktrees
None. Worktree isolation verified 2026-11-26: `agent/m0/dryrun` at `../woodland-wonders.worktrees/m0-dryrun` from `0b7a8df`; lane commit `a513ab9` stayed isolated, `main` unchanged; worktree and branch removed. Policy: [ADR-0001](adr/0001-repository-workflow.md).

## Decisions
- Accepted: [ADR-0001](adr/0001-repository-workflow.md) repository workflow, branching and worktrees.
- Pending human review: T0–T9, P1–P10 in [M0-REVIEW.md](M0-REVIEW.md).
- Housekeeping: `docs/gdd.md` renamed to `docs/GDD.md` (case only) to match all references on case-sensitive filesystems.

## Blockers
1. **Node.js not installed locally** (T0). No JS tooling can run until resolved.
2. **Branch protection** unavailable for private repos on the current GitHub plan (T9). Documented; enforced by policy + CI.
3. **Native toolchains absent** (no Xcode simulator, no JDK). Native checks are limited to CI bundle smoke + manual Expo Go.

## Verification evidence
| Date | Check | Result |
|---|---|---|
| 2026-11-26 | `bash scripts/check-hygiene.sh` (local) | pass |
| 2026-11-26 | CI `hygiene` on `0b7a8df` | pass: https://github.com/talech/woodland-wonders/actions/runs/45892820637 |
| 2026-11-26 | Branch protection API on `main` | HTTP 403 "Upgrade to GitHub Pro or make this repository public" |
| 2026-11-26 | Worktree isolation dry-run | pass |
| 2026-11-26 | Rule feasibility spike (throwaway, not in repo) | results in M0-REVIEW.md §2 |

## Next actions
1. Human: review and approve or amend docs/M0-REVIEW.md.
2. Director: on approval, record ADR-0002…0009, install Node (T0), scaffold workspace (M0b-1), implement core (M0b-2), go green, then dispatch lanes B/C/D.
