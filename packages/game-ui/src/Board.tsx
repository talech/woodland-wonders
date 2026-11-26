import { StyleSheet, View } from 'react-native';
import { Cell } from './Cell.tsx';
import { ClueLabel } from './ClueLabel.tsx';
import { palette } from './theme.ts';
import type { CellModel, ClueModel } from './types.ts';

export interface BoardProps {
  readonly rows: number;
  readonly columns: number;
  /** Row-major, length rows × columns. */
  readonly cells: readonly CellModel[];
  readonly rowClues: readonly ClueModel[];
  readonly columnClues: readonly ClueModel[];
  readonly cellSize: number;
  readonly clueSize: number;
  readonly onCellPress: (index: number) => void;
}

/** Puzzle grid with column clues above and row clues to the left. Purely prop-driven. */
export function Board({
  rows,
  columns,
  cells,
  rowClues,
  columnClues,
  cellSize,
  clueSize,
  onCellPress,
}: BoardProps) {
  const rowIndices = Array.from({ length: rows }, (_, r) => r);
  const colIndices = Array.from({ length: columns }, (_, c) => c);
  return (
    <View style={styles.wrap} testID="board">
      <View style={styles.line}>
        <View style={{ width: clueSize, height: clueSize }} />
        {colIndices.map((c) => {
          const clue = columnClues[c];
          return clue ? (
            <ClueLabel
              key={c}
              testID={`clue-column-${c}`}
              model={clue}
              axis="column"
              cellSize={cellSize}
              clueSize={clueSize}
            />
          ) : null;
        })}
      </View>
      {rowIndices.map((r) => {
        const clue = rowClues[r];
        return (
          <View key={r} style={styles.line}>
            {clue && (
              <ClueLabel
                testID={`clue-row-${r}`}
                model={clue}
                axis="row"
                cellSize={cellSize}
                clueSize={clueSize}
              />
            )}
            <View style={[styles.line, styles.field]}>
              {colIndices.map((c) => {
                const index = r * columns + c;
                const model = cells[index];
                return model ? (
                  <Cell key={index} model={model} index={index} size={cellSize} onPress={onCellPress} />
                ) : null;
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
  line: { flexDirection: 'row' },
  field: { backgroundColor: palette.mossSoft },
});
