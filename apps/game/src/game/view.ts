/**
 * Derives presentation models for game-ui from a session. Rule truth comes only from core `evaluateBoard`
 * (partial mode) and `isSolved`; nothing here re-implements a rule or compares against a solution.
 */
import type { CellModel, ClueModel, SpeciesToolModel } from '@ww/game-ui';
import {
  type BoardEvaluation,
  type CellIndex,
  cellView,
  evaluateBoard,
  isSolved,
  type Puzzle,
} from '@ww/puzzle-core';
import { describeHint, HINT_A11Y, type HintDescription } from './hintText.ts';
import { type CellIssue, cellLabel, clueLabel, countProblem, speciesToolLabel } from './labels.ts';
import { habitatArt, speciesArt, speciesInfo } from './presentation.ts';
import type { Session } from './session.ts';

export interface PuzzleView {
  readonly evaluation: BoardEvaluation;
  readonly cells: readonly CellModel[];
  readonly rowClues: readonly ClueModel[];
  readonly columnClues: readonly ClueModel[];
  readonly tools: readonly SpeciesToolModel[];
  readonly solved: boolean;
  /** Text and highlights for the current hint, or null when no hint is shown. */
  readonly hint: HintDescription | null;
}

const speciesName = (id: string) => speciesInfo(id).name;
const habitatName = (id: string) => habitatArt(id).name;

/** Cell-level issues from immediate local contradictions (line/species counts are shown on clues and tools). */
export function cellIssues(evaluation: BoardEvaluation): Map<CellIndex, CellIssue[]> {
  const out = new Map<CellIndex, CellIssue[]>();
  const add = (cell: CellIndex, issue: CellIssue) => {
    const list = out.get(cell) ?? [];
    if (!list.some((i) => i.kind === issue.kind)) list.push(issue);
    out.set(cell, list);
  };
  for (const v of evaluation.violations) {
    if (v.kind === 'same-species-touching') {
      const species = typeof v.data.species === 'string' ? v.data.species : '';
      for (const cell of v.cells) add(cell, { kind: 'touching', speciesName: speciesName(species) });
    } else if (v.kind === 'missing-habitat') {
      const habitats = typeof v.data.habitats === 'string' ? v.data.habitats.split(',') : [];
      for (const cell of v.cells)
        add(cell, { kind: 'missing-habitat', habitatNames: habitats.map(habitatName) });
    }
  }
  return out;
}

/** Habitats accepted by a species, from the puzzle's canonical ruleset data. */
export function acceptedHabitats(puzzle: Puzzle, species: string): readonly string[] {
  return puzzle.ruleset.species.find((s) => s.id === species)?.habitats ?? [];
}

export function derivePuzzleView(session: Session): PuzzleView {
  const { puzzle, tool } = session;
  const { marks } = session.game.board;
  const evaluation = evaluateBoard(puzzle, marks, 'partial');
  const issues = cellIssues(evaluation);
  const highlight = new Set(tool.kind === 'species' ? acceptedHabitats(puzzle, tool.species) : []);
  const names = { species: speciesName, habitat: habitatName };
  const hint = session.hint ? describeHint(session.hint, puzzle) : null;
  const hintMark = (cell: CellIndex) =>
    hint === null ? null : hint.focus === cell ? 'focus' : hint.region.has(cell) ? 'region' : null;
  const clueHinted = (id: string) => hint?.constraints.has(id) ?? false;

  const cells: CellModel[] = [];
  for (let i = 0; i < puzzle.cellCount; i++) {
    const view = cellView(puzzle, marks, i);
    const row = Math.floor(i / puzzle.columns);
    const col = i % puzzle.columns;
    const cellIssueList = issues.get(i) ?? [];
    const mark = hintMark(i);
    cells.push({
      hint: mark,
      accessibilityHint: mark === null ? null : HINT_A11Y[mark],
      content:
        view.kind === 'habitat'
          ? { kind: 'habitat', art: habitatArt(view.habitat) }
          : view.kind === 'animal'
            ? { kind: 'animal', art: speciesArt(view.species) }
            : { kind: view.kind },
      highlighted: view.kind === 'habitat' && highlight.has(view.habitat),
      flagged: cellIssueList.length > 0,
      accessibilityLabel: cellLabel(row, col, view, names, cellIssueList),
    });
  }

  const tools: SpeciesToolModel[] = puzzle.species.flatMap((id) => {
    const count = evaluation.species[id];
    if (!count) return [];
    const info = speciesInfo(id);
    return [
      {
        id,
        art: speciesArt(id),
        habitatHint: info.habitatHint,
        habitats: acceptedHabitats(puzzle, id).map(habitatArt),
        count,
        statusText: countProblem(count),
        accessibilityLabel: speciesToolLabel(info.name, info.habitatHint, count),
      },
    ];
  });

  return {
    evaluation,
    cells,
    rowClues: evaluation.rows.map((count, r) => ({
      count,
      hinted: clueHinted(`row:${r}`),
      accessibilityHint: clueHinted(`row:${r}`) ? HINT_A11Y.region : null,
      accessibilityLabel: clueLabel('row', r, count),
    })),
    columnClues: evaluation.columns.map((count, c) => ({
      count,
      hinted: clueHinted(`column:${c}`),
      accessibilityHint: clueHinted(`column:${c}`) ? HINT_A11Y.region : null,
      accessibilityLabel: clueLabel('column', c, count),
    })),
    tools,
    solved: isSolved(puzzle, marks),
    hint,
  };
}
