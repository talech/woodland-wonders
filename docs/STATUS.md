# Project status
Director-maintained. Reconcile with Git and CI on resume; historical evidence is archived below.

## Current milestone
**M4 — Design validation: ready for human playtests.** M0–M3 are complete (CI green at `77058e0` ([run](https://github.com/talech/woodland-wonders/actions/runs/46020970750))). The playtest build and protocol are in [playtest/PROTOCOL.md](playtest/PROTOCOL.md). No playtest has been run yet, and no outcomes are claimed.

**M3 gate evidence:**
- **Persistence:** SaveDataV1 with a migration chain, corrupt-save backup, revision handling, a pagehide flush on web and immediate milestone writes. Restore across a real browser reload is tested in e2e.
- **Progression:** levels grouped by tier, no locks, Continue / next-up guidance, no raw ids shown.
- **Onboarding:** an interactive 6-step tutorial driven by real actions, species intros, How to play.
- **Completion:** the scene is now the hero (whole board on a meadow, compact banner) and reduced motion is honoured. Re-verified in screenshots at 360×640 (M3-C3.1).
- **Accessibility:** an audit test across all screens.
- **Checks:** 191 Vitest + 189 Jest; `check:bundle` web + native; Playwright 12/12 and **60/60 across 5 repeats** (after fixing a race in the director-owned spec).
- **Unverified:** device/simulator runs; real OS large-text rendering.

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
| Migration base SHA | `77058e0` |
| Documentation branch | `chore/docs-v2-m4-playtest` (single director, current checkout) |
| Remote | `github.com/talech/woodland-wonders` (private) |
| CI | `hygiene` + `verify` (frozen install → verify → native export/inspection → Playwright) |

## Blockers / limitations
1. **Branch protection** unavailable on the current GitHub plan (T9 accepted). Enforced by CI + director policy.
2. **Native toolchains absent locally** (no Xcode simulator, no JDK). Native coverage = CI Metro bundle export for iOS/Android + manual Expo Go. Device runs are **unverified**.
3. Node is keg-only: add `/opt/homebrew/opt/node@24/bin` to your shell `PATH` to run commands yourself.
4. Depth is scarce: about 90% of valid generated puzzles need only tier 1. The catalog is depth-selected (8 tier-2 intermediates, 8 tier-3 advanced), but difficulty is provisional until playtested (M4).

## Documentation migration — 2026-11-27
- Applied v2 concise operating documents and retained detailed engineering reference. M0–M3 remain complete.
- Preserved GDD, M0 review, all accepted ADRs, implementation, content, tooling and lockfile. GDD kit difference is only a final newline.
- Latest implementation includes `77058e0`, the decorative SVG accessibility warning fix; historical M3 evidence above remains attributed to its original checks.
- CI inspected live: hygiene and verify succeeded at `77058e0`. This docs branch is not pushed; landing requires approval.
- [M4 readiness checklist](playtest/READY.md) and [blank session sheet](playtest/SESSION-TEMPLATE.md) prepare human testing; no participant outcomes recorded.
- Local verification: `pnpm verify` passed (191 Vitest + 189 Jest, 40-puzzle content validation, web export and bundle inspection); `pnpm smoke:native` + `pnpm check:bundle:native` passed; Playwright 12/12 passed. Initial sandbox server bind was denied; rerun with approval passed. Hygiene, whitespace and local documentation links passed. Device/simulator and real OS large-text checks remain unverified.

## Next actions
1. **Human:** run playtests per [playtest/PROTOCOL.md](playtest/PROTOCOL.md) (5–8 participants) and record results in `docs/playtest/results/`.
2. **Human:** a device check via Expo Go (`pnpm --filter @ww/game start`), including OS large text on a small phone.
3. **Director, after results:** aggregate into `docs/playtest/SUMMARY.md`; if depth feels shallow, prepare a decision memo on the P6 / local-clues experiments (new ADR + approval before any rule change).
4. **Deferred engineering backlog:**
   - species-capacity premise narrowing (review #4);
   - editor stale metrics after edits (review #5b);
   - editor import noise;
   - an Expo re-alignment after 2026-12-10 (ADR-0002);
   - replacing the template app icon/splash.

Historical task registry, decisions, review findings and verification evidence: [STATUS-2026-11-26.md](history/STATUS-2026-11-26.md). Git inspection on 2026-11-27 found only the primary checkout; no worker worktrees. Untracked `docs/design/` and the source migration kit are preserved and excluded from this change.
