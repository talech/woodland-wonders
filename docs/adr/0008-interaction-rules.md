# ADR-0008: Player interaction rules

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) P1–P5

## Decision

- **P1** Any puzzle species may be placed on any grass cell. Rule violations are flagged gently with icon + text (never colour alone) and never blocked or auto-corrected.
- **P2** Solved = placed animals satisfy every constraint with unmarked treated as empty. No answer keys ship in the app.
- **P3** Live feedback covers local contradictions only (same species touching, missing habitat, over count, unreachable line count) plus satisfied-line confirmation. Global unsatisfiability is shown only on hint request.
- **P4** A hint is the next sound deduction from the current board, respecting empty marks. Stage 1 shows region + strategy; stage 2 shows the explanation and an apply button. Hints are unlimited, never auto-applied and carry no penalty. On contradiction the hint explains the conflict and offers undo to the last consistent state.
- **P5** No pre-placed animals (givens) in schema v1.
