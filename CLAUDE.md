# Claude Code — Woodland Wonders

@AGENTS.md

Follow the canonical operating contract above. If import expansion is unavailable, read AGENTS.md directly. Read docs/GDD.md before gameplay work. Do not duplicate product rules here.

## Working method
Start by inspecting repository state, relevant ADRs, docs/STATUS.md (if present), public contracts and tests. Identify the smallest coherent deliverable. For substantial work, propose a plan and identify approval gates before implementation. For small approved fixes, act directly.

## Context discipline
Keep the main conversation focused on decisions, contracts, integration and validation. Delegate bounded implementation or independent review when actual sub-agent support exists. Give each worker a compact task packet: objective, relevant file paths, contract references, allowed writes, dependencies, acceptance tests and return format. Workers should read only relevant context rather than ingesting the entire repository. Use lower-cost models for routine bounded work when available; use stronger reasoning for solver correctness, architecture and difficult debugging. Do not assume model or tool availability.

Persist durable state in docs/STATUS.md and approved ADRs, not only in conversation. Record active tasks, owners, branch/worktree, base SHA, dependencies, decisions, blockers and checks. After context compaction or restart, re-read status and inspect git before resuming; do not replay completed tasks blindly. Only the director updates shared status.

## Delegation and review
Use isolated worktrees for parallel writers when supported. Never delegate overlapping write scopes. Establish public interfaces and fixtures before parallel work. Prefer independent read-only review for constraint soundness, generator quality, mobile UX and integration risk. Workers report evidence, not merely confidence. If a worker needs an out-of-scope change, return a change request to the director.

## Execution discipline
Use ORCHESTRATION.md when explicitly asked to run as director. Otherwise operate within the current assigned task. Do not launch a multi-agent build for a simple question or fix. Use available permissions normally; do not bypass approval prompts, sandboxing or security controls. Do not deploy, publish, purchase or contact external services without authorization.

At the end of each task, report what changed, verification commands/results, remaining risks and next dependency. Keep summaries compact and link to durable repository files.
