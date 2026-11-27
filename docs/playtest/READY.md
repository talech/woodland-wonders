# M4 human playtest readiness

M0–M3 are complete. Test existing rules and the 40-puzzle catalog. No rule or implementation changes are part of this documentation migration. No human results exist yet.

## Hosted playtest (easiest)

Open https://talech.github.io/woodland-wonders/ in Safari or Chrome after the first successful deployment. No Expo Go or laptop is needed. Progress stays in that browser on that device; use a fresh private session per participant. Record the deployed SHA from the successful GitHub Actions run, rather than assuming your local HEAD matches. CI publishes `main` only after all gates pass. Native touch/OS checks remain separate.

## Get the game onto a phone

From the repository root:

```sh
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
pnpm install --frozen-lockfile
pnpm --filter @ww/game start --lan
```

Use a phone and computer on the same trusted Wi-Fi. Open the QR link with Expo Go (iOS Camera or Android Expo Go). The project pins Expo SDK 58; the installed Expo Go must support that SDK. If it rejects the SDK, record the message and use the browser fallback rather than upgrading dependencies during playtesting.

Browser fallback on this computer: `pnpm playtest:web`, then open http://127.0.0.1:4173. For phone browser testing, stop Metro, run `pnpm --filter @ww/game start --web --lan`, and open the Network web URL printed by Expo on the phone. This is a development-server fallback; record it as such. The static `playtest:web` server is loopback-only. Do not use a tunnel or change hosting for this test.

## Before inviting participants

- Record `git rev-parse HEAD`, `git status --short`, device/OS, browser or Expo Go version and run mode. Initial hosted build is `cb4a73e`; gameplay rules remain at the existing `77058e0` baseline.
- Complete one real-phone smoke check: tutorial, placement/removal, empty mark, undo/redo, two-stage hint and Apply, completion, level selection, and save/restore after closing/reopening. Record defects rather than fixing the participant’s board.
- Check a small portrait screen with normal and OS large text; check reduced motion. Confirm clues, species tray, controls and hint text remain readable and reachable. Automated viewport checks do not certify these device checks.
- Verify a fresh first-launch state before each participant. Use a fresh private browser session, or a verified clean native profile; reopening Expo Go alone is not a reset. Do not erase personal progress without consent.
- Recruit 5–8 participants using the mix in [PROTOCOL.md](PROTOCOL.md), book 30–40 minutes each, and copy [SESSION-TEMPLATE.md](SESSION-TEMPLATE.md) to `results/YYYY-MM-DD-P<n>.md`. Use participant IDs, not names; obtain consent for notes/quotes.

## Run and decide

Follow the existing [session script](PROTOCOL.md#3-session-script-facilitator). Observe unaided rule understanding, guesses, voluntary continuation, perceived tier differences and hint usefulness. Log interventions and exact puzzle IDs even though the player sees friendly names.

After all sessions, create `SUMMARY.md` with participant count, build/device coverage, observed counts and quotes, contradictory evidence, limitations and prioritized findings. Assess each GDD §14 criterion as supported, unsupported or inconclusive; do not invent numerical success thresholds after seeing results. Keep device defects separate from puzzle-depth findings. Propose P6/local-clue experiments only if evidence warrants; obtain an approved ADR before changing rules.

Landing the documentation branch requires human approval. Human device checks and participant sessions remain outstanding.
