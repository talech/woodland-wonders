# Woodland Wonders
### Game Design Document & Technical Prototype Brief
Version 0.1 | Working title

## 1. Game Overview

Woodland Wonders is a cozy, mobile-first logic puzzle game in which players discover where adorable woodland creatures belong within a small ecosystem.

The gameplay combines Nonogram-inspired row and column deduction, habitat-based placement restrictions and spatial relationships between animals.

Each completed puzzle becomes a charming little woodland scene.

**Genre:** Casual logic puzzle  
**Platform:** iOS and Android; browser-playable prototype  
**Orientation:** Portrait  
**Session length:** 2–10 minutes  
**Audience:** Casual puzzle players, logic puzzle enthusiasts and cozy game audiences

### Design pillars

- **Simple rules, emergent depth:** Complexity comes from interacting constraints rather than numerous mechanics.
- **Logic, not luck:** Every puzzle must be solvable through deduction.
- **Cozy, not punishing:** No lives, timers, irreversible mistakes or failure states.
- **Mechanics reinforce fantasy:** Animal personalities and habitats communicate puzzle rules.
- **Built to scale:** Establish a production-quality technical foundation from the first prototype.

## 2. Core Gameplay

Players are presented with a grid representing a woodland clearing containing predetermined environmental features.

The objective is to correctly place a specified population of animals while satisfying all puzzle constraints.

### Foundational rules

1. Row and column clues indicate the exact number of animals required in each line.
2. Each animal must occupy a valid cell adjacent to its preferred habitat.
3. Animals of the same species cannot touch, including diagonally.
4. Each cell can contain a maximum of one animal.
5. All animals in the specified population must be placed.

Row and column clues represent total animal counts, not consecutive groups as in traditional Nonograms.

### Spatial definitions

- Habitat adjacency: four orthogonal neighboring cells.
- Animal adjacency: eight neighboring cells, including diagonals.
- Habitat features occupy fixed cells and cannot be moved or occupied by animals.
- Empty grass cells are valid placement candidates unless restricted by another rule.

These definitions must remain consistent throughout the initial prototype.

## 3. Animals & Habitats

The initial prototype supports three species.

| Animal | Required habitat | Placement rule |
|---|---|---|
| Fox | Tree | Adjacent to a tree |
| Mouse | Mushroom | Adjacent to a mushroom |
| Rabbit | Burrow | Adjacent to a burrow |

All three species follow the same foundational adjacency restriction.

A habitat can support multiple animals unless a future rule explicitly limits its capacity.

### Future expansion candidates

These are not required for the initial prototype.

| Animal | Potential mechanic |
|---|---|
| Duck | Occupies water terrain |
| Hedgehog | Cannot touch any animal |
| Beaver | Requires both water and tree adjacency |
| Otter | Requires proximity to another otter |
| Owl | Requires line of sight to a tree |

Species-specific rules must be extensible without rewriting the foundational puzzle engine.

## 4. Player Interaction

### Primary interaction

- Select an animal species from the available population tray.
- Tap a grid cell to place that animal.
- Tap a placed animal to remove it.
- Switch to an empty-cell marking tool to eliminate cells.
- Undo and redo previous actions.

Dragging animals onto the board may be supported later, but tap-based interaction is the primary mobile interaction model.

### Feedback

- Remaining animal counts update immediately.
- Satisfied row and column clues receive subtle visual confirmation.
- Contradictions receive gentle, non-punitive feedback.
- Selecting an animal highlights its associated habitat type.
- Incorrect placements never consume lives or reset progress.

The game must distinguish between a locally valid placement and a placement that matches the final solution. It must not automatically reveal the correct answer through ordinary placement feedback.

### Puzzle completion

A puzzle is completed when all constraints are satisfied.

The board transitions from a functional puzzle grid into a charming woodland scene, with small animal animations and celebratory feedback.

Players can proceed to the next puzzle or revisit their completed scene.

## 5. Difficulty & Progression

Difficulty should primarily come from the interaction of constraints, rather than board size.

| Tier | Board | Complexity |
|---|---|---|
| Tutorial | 4×4 | One species, obvious deductions |
| Beginner | 5×5 | One or two species |
| Easy | 5×5 | Two species, overlapping habitat options |
| Intermediate | 6×6 | Three species, interacting constraints |
| Advanced | 6×6–8×8 | Longer deduction chains |
| Expert | TBD | Additional rule types |

Difficulty must eventually be classified by the reasoning required to solve a puzzle, not simply grid dimensions or animal count.

### Experimental mechanic: Local clues

Selected habitat tiles may display a number indicating exactly how many animals occupy their eight neighboring cells.

Future variants may specify a particular species.

This is a Minesweeper-inspired deduction mechanic, not a hidden hazard system.

Implement only after validating the foundational puzzle. The rule architecture should accommodate it from the beginning.

## 6. UX & Art Direction

The visual identity is a miniature, cozy woodland populated by expressive, rounded, collectible creatures.

### Main puzzle screen

- Top: level identifier and navigation.
- Animal tray: available species, habitat associations and remaining counts.
- Center: puzzle board with prominent row and column clues.
- Bottom: placement tools, empty marking, undo, redo and hints.

### Visual principles

- Warm, soft woodland colors.
- Highly recognizable animal silhouettes.
- Clear differentiation between habitats, animals and empty cells.
- Subtle animations that do not interrupt deduction.
- Minimal interface chrome.
- Large, accessible touch targets.
- Information must not rely exclusively on color.

Use replaceable placeholder assets during the prototype. Do not tightly couple gameplay code to visual assets.

## 7. Prototype Scope

### Required

- Complete playable puzzle loop.
- Three animal species and three habitat types.
- Support for variable rectangular grid dimensions.
- 30–50 validated puzzles across multiple difficulty tiers.
- Interactive onboarding.
- Puzzle selection and progression.
- Undo, redo and empty-cell marking.
- Basic deduction-based hint system.
- Local progress persistence.
- Responsive portrait layout.
- Basic completion animation.
- Developer puzzle editor and debugging tools.
- Automated puzzle solver, validator and generator.

### Explicitly out of scope

- Merge and crafting mechanics.
- Energy, lives and timers.
- Resource economies.
- Village management.
- Monetization.
- Multiplayer and social features.
- Backend services and accounts.
- Live operations.

These systems must not be implemented speculatively.

## 8. Technical Architecture

### Recommended implementation

Use a TypeScript monorepo with a React Native and Expo application targeting iOS, Android and web.

Use a pure TypeScript puzzle engine independent of React, rendering, platform APIs and persistence.

The browser build should support rapid iteration while the native builds establish mobile compatibility from the beginning.

### Repository structure

```text
/
  apps/
    game/
    puzzle-editor/
  packages/
    puzzle-core/
    puzzle-solver/
    puzzle-generator/
    puzzle-content/
    game-ui/
  assets/
  docs/
  tests/
  AGENTS.md
  CLAUDE.md
```

### Architectural responsibilities

**Puzzle Core**

- Board and cell data models.
- Animal and habitat definitions.
- Constraint evaluation.
- Legal action processing.
- Puzzle completion validation.
- Deterministic state transitions.
- Undo and redo support.

**Puzzle Solver**

- Candidate generation and elimination.
- Constraint propagation.
- Solution enumeration.
- Uniqueness verification.
- Human-style deduction strategies.
- Explainable hint generation.

**Puzzle Generator**

- Seeded, reproducible generation.
- Valid habitat and animal distributions.
- Automatic clue generation.
- Uniqueness validation.
- Difficulty evaluation.
- Batch content generation.

**Puzzle Content**

- Versioned, data-driven puzzle definitions.
- Species and habitat configurations.
- Tutorial definitions.
- Difficulty metadata.
- Content validation schemas.

**Game Application**

- Rendering and animation.
- Input handling.
- Navigation.
- Progression.
- Persistence.
- Accessibility.
- Platform-specific integrations.

**Puzzle Editor**

- Visual puzzle creation.
- Habitat and animal placement.
- Automatic clue calculation.
- Solver visualization.
- Solution count and difficulty inspection.
- Import and export of puzzle definitions.

Dependencies must flow toward the puzzle engine. The engine must never depend on presentation, storage or platform-specific services.

## 9. Data Model

Puzzle definitions should be serializable, versioned and independent of runtime player state.

Illustrative structure:

```typescript
interface PuzzleDefinition {
  schemaVersion: number;
  id: string;
  seed?: number;

  rows: number;
  columns: number;

  rowClues: number[];
  columnClues: number[];

  habitats: HabitatPlacement[];
  population: Record<SpeciesId, number>;

  rulesetId: string;
  localClues?: LocalClue[];

  difficulty: DifficultyMetadata;
}
```

Maintain separate models for:

- Immutable puzzle definitions.
- Species and habitat configuration.
- Active player board state.
- Action history.
- Solver candidate state.
- Player progression and save data.

A cell must distinguish between unmarked, explicitly empty, habitat and animal-occupied states.

Use stable content identifiers and versioned save schemas to support future content updates and migrations.

## 10. Constraint System

Implement puzzle rules as composable, independently testable constraints.

Each constraint should support:

- Evaluating a partial board.
- Identifying contradictions.
- Eliminating invalid candidates where applicable.
- Validating a completed board.
- Providing structured explanations for deductions.

Initial constraint types:

- Row population count.
- Column population count.
- Species population count.
- Habitat adjacency.
- Same-species exclusion.
- Cell occupancy.

Future constraint types should be registerable without modifying existing rule implementations.

Avoid hardcoding individual species into the solver.

## 11. Solver & Content Pipeline

The solver is a foundational product capability, not merely a development utility.

### Two solving modes

**Exhaustive solver**

Uses constraint propagation and search to establish whether a puzzle has zero, one or multiple solutions.

**Deduction solver**

Uses human-interpretable reasoning strategies to solve puzzles without guessing and produce explanatory hints.

A unique solution alone is insufficient to establish puzzle quality.

### Initial deduction strategies

- Completed row or column elimination.
- Forced occupancy from remaining line counts.
- Habitat-based candidate elimination.
- Species population exhaustion.
- Same-species adjacency elimination.
- Single remaining candidate.
- Intersecting row, column and species constraints.

### Content generation pipeline

1. Generate a valid completed board.
2. Derive row, column and population clues.
3. Remove animal placements to create the playable puzzle.
4. Verify exactly one solution.
5. Attempt to solve using human-style deduction.
6. Reject puzzles requiring unsupported guessing.
7. Calculate difficulty metadata.
8. Export the validated puzzle definition.

Generated content should also undergo human review for repetitive patterns, readability and enjoyable deduction sequences.

The generator must be capable of running independently from the game application.

## 12. Testing & Quality Standards

Automated testing is required from the first implementation phase.

### Core test coverage

- Every constraint independently.
- Orthogonal and diagonal adjacency.
- Grid boundaries and rectangular boards.
- Invalid and contradictory puzzle definitions.
- Zero, one and multiple-solution detection.
- Deterministic generation from seeds.
- Hint correctness.
- Undo and redo consistency.
- Save and restore consistency.
- Puzzle completion validation.

Maintain a curated regression suite of known puzzles.

All shipped puzzle definitions must pass automated validation through the content pipeline.

Establish formatting, linting, type checking and automated tests in CI.

## 13. Implementation Milestones

### M0 — Foundation

- Initialize repository and development tooling.
- Establish architecture and data contracts.
- Implement puzzle state and foundational constraints.
- Create unit tests.

### M1 — Playable Puzzle

- Render the puzzle board and animal tray.
- Implement placement, removal and empty marking.
- Implement feedback, undo and redo.
- Complete several handcrafted puzzles.

### M2 — Puzzle Intelligence

- Implement exhaustive and deduction solvers.
- Implement explainable hints.
- Build puzzle editor and seeded generator.
- Produce and validate 30–50 puzzles.

### M3 — Vertical Slice

- Implement onboarding and progression.
- Add local persistence.
- Improve mobile UX and visual presentation.
- Add completion animations.
- Verify browser, iOS and Android compatibility.

### M4 — Design Validation

- Playtest the foundational rules.
- Evaluate difficulty progression.
- Identify repetitive or uninteresting deduction patterns.
- Test whether additional constraints are necessary.
- Experiment with local clues only if justified.

## 14. Prototype Success Criteria

The prototype succeeds if:

- New players understand the foundational rules within a few minutes.
- Players can solve puzzles without guessing.
- Small boards generate meaningfully varied deduction sequences.
- Difficulty increases without requiring substantially larger grids.
- Players voluntarily continue to another puzzle.
- Animal placement feels satisfying and thematically coherent.
- New puzzles can be generated, validated and added without application code changes.
- The architecture supports additional species and constraints without major refactoring.

## 15. Instructions for the Implementing Agent

Before implementation:

1. Review this document and identify ambiguities or technical risks.
2. Propose the architecture, data contracts and implementation plan.
3. Document significant architectural decisions.
4. Establish milestone-specific acceptance criteria.
5. Request approval for material deviations from the GDD.

During implementation:

- Prioritize correctness, determinism and maintainability.
- Build vertical functionality incrementally.
- Keep modules independently testable.
- Do not introduce speculative features.
- Do not silently modify gameplay rules to simplify implementation.
- Maintain documentation alongside code.
- Run tests and type checks after each milestone.
- Keep the application playable throughout development.

The goal is not to implement the largest possible prototype. It is to establish the smallest compelling game with a foundation capable of becoming a full commercial mobile product.