# ADR-0009: Content, difficulty and art policy

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) P6–P10, §2

## Decision

- **P6** GDD rules stay unchanged; habitats need not host animals. "Every habitat hosts ≥1" and local clues are M4 experiments.
- **P7** Difficulty = hardest strategy tier required, plus deduction count and chain depth (provisional until playtested). The generator selects for species overlap and minimum strategy tier per band, and rejects trivially line-solved boards above Beginner.
- **P8** Canonical rule data (`woodland-v1`) lives in core. Presentation config (names, art keys, colours, tutorial text) lives in content.
- **P9** 40 curated puzzles: Tutorial 4 · Beginner 8 · Easy 8 · Intermediate 12 · Advanced 8.
- **P10** Self-authored SVG placeholder art with distinct glyphs/shapes per species and habitat, recorded in `assets/PROVENANCE.md`.
- **T9** `main` branch protection is unavailable on the current plan. It is enforced by CI + director policy.
