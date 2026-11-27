# Playtest protocol — M4 design validation

Purpose: test whether the foundational rules make a compelling puzzle (GDD §14). The build is feature-complete for the vertical slice. **This protocol produces evidence; agents must not invent outcomes.** Results go in `docs/playtest/results/` (one file per session; template below).

## 1. Build under test
- Version: `main` at the commit you test (record the SHA). Catalog v1, 40 puzzles ([../content/CURATION.md](../content/CURATION.md)).
- **Browser (desktop or phone on the same Wi-Fi):** run `pnpm playtest:web`, then open http://127.0.0.1:4173 on this machine. For a phone on the LAN, see the note in §6.
- **Phone via Expo Go (recommended for touch feel):** run `pnpm --filter @ww/game start`, then scan the QR code with Expo Go (iOS/Android, same network).
- **Fresh state per participant:** the web build stores progress in browser localStorage, so use a private window or clear site data. On Expo Go, delete and reopen the project or use a fresh device profile.

## 2. Participants
Aim for 5–8 people, 30–40 minutes each, run individually. Mix:
- 2–3 casual puzzle players (match-3, word games);
- 2–3 logic-puzzle fans (Sudoku, Nonograms, Star Battle, Tents);
- 1–2 cozy-game players who rarely do logic puzzles.

Record each participant's prior experience with Nonograms or "Tents and Trees"-style puzzles. That genre is closest to these rules.

## 3. Session script (facilitator)
Think-aloud. Don't explain rules beyond what the game shows. Help only if someone has been stuck for more than 3 minutes, and note it as an intervention.

| Time | Task | Observe |
|---|---|---|
| 0–2 min | Intro, consent, ask them to think aloud | — |
| 2–10 | **First launch → tutorial** (don't touch anything for them) | Do they read the coach steps? Any step where they get stuck? Do they understand "directly beside" and "not even corner to corner"? |
| 10–18 | Levels 2–6 (tutorial-02 … beginner-02) | First unaided solves. Do they use Mark empty? Undo? |
| 18–30 | Free play: "play whatever you like next" | **Which level do they pick? Do they continue voluntarily?** Note any hint use and how far the stage-2 explanation helps |
| 30–35 | Ask them to try one intermediate and one advanced puzzle | Reasoning they verbalise; guessing; abandonment |
| 35–40 | Debrief questions (§5) | — |

## 4. Observation sheet (per puzzle attempted)
| Puzzle | Time | Solved? | Hints (stage 1 / stage 2 / applied) | "Something doesn't fit" seen? | Guessed (verbalised)? | Notes / quotes |
|---|---|---|---|---|---|---|

Also log moments where:
- a player misreads a rule (especially diagonal habitat adjacency, or thinking clues count runs or habitats);
- feedback confused or annoyed them;
- the completion scene got a reaction (smile, comment, skipping straight to Next).

## 5. Debrief questions → GDD §14 success criteria

| GDD §14 criterion | Evidence to collect |
|---|---|
| New players understand the rules within a few minutes | Ask them to explain the rules in their own words; note time to the first unaided solve; record misconceptions |
| Players can solve without guessing | Count verbalised guesses per tier; ask "did you ever have to guess?" |
| Small boards give varied deduction sequences | "Did puzzles feel different from each other or repetitive? Which felt the same?" |
| Difficulty rises without much bigger grids | Order the puzzles they played from easiest to hardest, then compare with catalog tiers |
| Players voluntarily continue | Did they pick another puzzle unprompted during free play? "Would you play again tomorrow?" (1–5) |
| Placement feels satisfying and thematic | "How did placing animals feel?" (1–5); reaction to the completion scene |

Also ask:
- Was any hint unhelpful or too long?
- Did "Something doesn't fit" feel helpful or like being told off?
- Anything you wanted to do but couldn't?

## 6. Known questions this playtest must answer (from build review)
1. **Depth:** about 90% of generated puzzles need only tier-1 reasoning. Do intermediate and advanced feel meaningfully harder, or "more of the same"? If the latter, evaluate the approved M4 experiments: **P6** (every habitat must host ≥1 animal) and **local clues** (GDD §5). Neither is implemented.
2. **First hint is often trivial** (a "no habitat nearby" step). Is it useful for beginners and patronising for others?
3. **Long hints from the 2×2-packing strategy** (`species-capacity`) highlight the whole board in advanced puzzles (review finding #4). Do players follow them?
4. **Difficulty calibration:** is the tier ordering, by required strategy tier then substantive steps, consistent with what players perceive?
5. **Habitat adjacency is orthogonal:** after the "directly beside (not diagonally)" wording, do players still assume diagonals count?
6. **Mark empty:** do players use it, and does the unmarked-versus-empty distinction make sense?
7. **Large text and small phones:** if possible, run one session with OS large text on a small phone. This is unverified on devices.

LAN note: `scripts/serve-static.ts` binds to 127.0.0.1 for safety. For a phone, prefer Expo Go. Exposing the web build on the LAN is a deliberate, local-only choice for the facilitator.

## 7. Results template (`docs/playtest/results/YYYY-MM-DD-P<n>.md`)
```
Participant: P<n> (experience: …)   Build SHA: …   Device: …   Facilitator: …
Tutorial: completed? stuck steps? time:
Puzzles: (observation sheet rows)
Rule understanding (own words):
Misconceptions:
Hints: useful / not, which, quotes:
Continued voluntarily? Y/N   Play again (1–5):   Satisfying placement (1–5):
Perceived difficulty order vs catalog:
Top 3 quotes:
Facilitator interventions:
```

## 8. After the sessions
The director aggregates the results into `docs/playtest/SUMMARY.md` with counts and quotes, never inferred conclusions. Rule changes (P6, local clues) require human approval as a new ADR before implementation.
