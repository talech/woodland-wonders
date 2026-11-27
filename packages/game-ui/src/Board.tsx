import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Cell, type CellScene } from './Cell.tsx';
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
  /**
   * Completion scene: grid lines and ground fade, habitats and animals remain, animals idle-hop (staggered).
   * Cells stay interactive, so the player is never locked out.
   */
  readonly scene?: boolean;
  /** No movement: the scene is a short crossfade and animals stay still. */
  readonly reducedMotion?: boolean;
}

const HOP_STAGGER_MS = 160;
/** Padding of the cream backing around the clues and grid (pt, per side; plus a 2 pt border). */
const BACKING = 4;

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
  scene = false,
  reducedMotion = false,
}: BoardProps) {
  const progress = useRef(new Animated.Value(scene ? 1 : 0)).current;
  useEffect(() => {
    if (!scene) {
      progress.setValue(0);
      return;
    }
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? 200 : 700,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [scene, reducedMotion, progress]);
  const cellScene: CellScene | null = useMemo(
    () => (scene ? { progress, hop: !reducedMotion } : null),
    [scene, reducedMotion, progress],
  );
  const clueOpacity = useMemo(
    () => (scene ? progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) : 1),
    [scene, progress],
  );
  const fadeClue = (node: ReactNode, key: string | number) => (
    <Animated.View key={key} style={{ opacity: clueOpacity }}>
      {node}
    </Animated.View>
  );
  const hopDelays = useMemo(() => {
    const delays: number[] = [];
    let k = 0;
    for (const model of cells) delays.push(model.content.kind === 'animal' ? (k++ % 6) * HOP_STAGGER_MS : 0);
    return delays;
  }, [cells]);
  const rowIndices = Array.from({ length: rows }, (_, r) => r);
  const colIndices = Array.from({ length: columns }, (_, c) => c);
  return (
    <View style={[styles.wrap, scene && styles.wrapScene]} testID="board">
      {scene && <View testID="board-scene" />}
      <View style={styles.line}>
        <View style={{ width: clueSize, height: clueSize }} />
        {colIndices.map((c) => {
          const clue = columnClues[c];
          return clue
            ? fadeClue(
                <ClueLabel
                  testID={`clue-column-${c}`}
                  model={clue}
                  axis="column"
                  cellSize={cellSize}
                  clueSize={clueSize}
                />,
                c,
              )
            : null;
        })}
      </View>
      {rowIndices.map((r) => {
        const clue = rowClues[r];
        return (
          <View key={r} style={styles.line}>
            {clue &&
              fadeClue(
                <ClueLabel
                  testID={`clue-row-${r}`}
                  model={clue}
                  axis="row"
                  cellSize={cellSize}
                  clueSize={clueSize}
                />,
                'clue',
              )}
            <View style={[styles.line, styles.field]}>
              {colIndices.map((c) => {
                const index = r * columns + c;
                const model = cells[index];
                return model ? (
                  <Cell
                    key={index}
                    model={model}
                    index={index}
                    size={cellSize}
                    onPress={onCellPress}
                    scene={cellScene}
                    hopDelay={hopDelays[index] ?? 0}
                  />
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
  // Cream backing card so the grid reads as one object on the meadow.
  wrap: {
    alignSelf: 'center',
    padding: BACKING,
    borderRadius: 20,
    backgroundColor: palette.card,
    borderWidth: 2,
    borderColor: palette.grassEdge,
  },
  wrapScene: { backgroundColor: 'transparent', borderColor: 'transparent' },
  line: { flexDirection: 'row' },
  field: { backgroundColor: palette.grass, borderRadius: 14, overflow: 'hidden' },
});
