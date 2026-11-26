/** @ww/puzzle-core public API. Anything not exported here is private. */

export {
  applyAction,
  canRedo,
  canUndo,
  cellView,
  createBoard,
  createGame,
  dispatch,
  EMPTY_HISTORY,
  isValidMark,
  parseGameState,
  redo,
  undo,
} from './actions.ts';
export { countStatus, isAnimal } from './constraints/count.ts';
export {
  type ConstraintRegistry,
  DEFAULT_REGISTRY,
  extendRegistry,
  type GlobalConstraintFactory,
  type PuzzleShape,
  type SpeciesConstraintFactory,
} from './constraints/registry.ts';
export * from './contracts/index.ts';
export { evaluateBoard, isSolved } from './evaluate.ts';
export {
  type Coord,
  columnCells,
  inBounds,
  kingNeighbours,
  orthogonalNeighbours,
  rowCells,
  toCoord,
  toIndex,
} from './geometry.ts';
export { type CreatePuzzleOptions, createPuzzle, createPuzzleOrThrow } from './puzzle.ts';
export { getRuleset, RULESETS, WOODLAND_V1 } from './ruleset.ts';
export {
  boardStateSchema,
  checkDefinition,
  gameStateSchema,
  historySchema,
  parsePuzzleDefinition,
  puzzleDefinitionSchema,
  type Result,
} from './schema.ts';
