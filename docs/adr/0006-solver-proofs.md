# ADR-0006: Solver proofs, search and oracle

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) §6.4

## Decision

- Domains are per-cell value sets over `empty | SpeciesId`.
- Deduction steps are structured as in M0-REVIEW §6.4 (strategy, tier, eliminations, premises, localizable explanation key).
- `search` stops at two solutions and returns `none | unique | multiple | unknown(budget)`. `unknown` is never publishable.
- Soundness is established against a brute-force oracle built **only** on core `evaluate`.
- Every published puzzle's deduction trace from the empty board must reach the unique search solution.
