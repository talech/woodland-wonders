# ADR-0001: Repository workflow, branching and worktree isolation

- Status: Accepted (director authority: routine, reversible infrastructure)
- Date: 2026-11-26

## Context
AGENTS.md and ORCHESTRATION.md require trunk-based development, isolated parallel lanes, single-writer ownership and director-owned integration.

## Decision
**Trunk.** `main` is the only long-lived branch. It must always be green and playable at milestone boundaries.

**Branch names.** `feat/<scope>`, `fix/<scope>`, `refactor/<scope>`, `chore/<scope>`, and temporary `agent/<run-id>/<lane>` for agent lanes (e.g. `agent/m1/solver`).

**Worktrees.** Lanes run in sibling worktrees outside the primary checkout:
`../woodland-wonders.worktrees/<run-id>-<lane>` created via
`git worktree add -b agent/<run-id>/<lane> ../woodland-wonders.worktrees/<run-id>-<lane> <base-sha>`.
Every lane starts from an explicit base SHA recorded in docs/STATUS.md. The director creates, registers and removes worktrees. A worktree is removed only after its branch is integrated and verified, and never while it holds uncommitted or unmerged work.

**Ownership.** One writer per path. Root configs, `pnpm-lock.yaml`, `package.json` files' dependency sections, shared contracts (`packages/puzzle-core/src/contracts/**`), CI, docs/STATUS.md and docs/adr/** are director-owned. Lanes needing a dependency or contract change submit a change request.

**Integration.** Lanes commit focused increments on their branch and never merge, rebase onto, or push to `main`. The director reviews the diff against the assigned write scope, merges in dependency order (`git merge --no-ff` for lane branches so lane history stays auditable), resolves conflicts, runs the full `pnpm verify`, updates STATUS.md and pushes. Small director-only chores may be committed directly to `main` after local verification.

**Protection.** No force-push, history rewriting on shared branches, `git reset --hard`/`git clean` on user work, or bypassing failing checks. Remote branch protection is applied where the hosting plan allows (see STATUS.md for the actual state).

**Commits.** Imperative subject ≤72 chars, optional scope prefix (`core:`, `solver:`, `app:`, `content:`, `chore:`). Agent commits carry a `Co-Authored-By` trailer.

## Alternatives considered
- GitFlow / long-lived develop branch: unnecessary for a single integrator; slows feedback.
- PR-per-lane on GitHub with required human review: adds human gates the brief explicitly avoids. PRs remain available for human-authored changes.
- Worktrees inside the repo (`.claude/worktrees`): risks tool confusion (nested checkouts, watchers, Metro). Rejected in favour of sibling directory.

## Consequences
Integration is centralized and auditable; parallelism is bounded by disjoint write scopes. The director is a serialization point by design.
