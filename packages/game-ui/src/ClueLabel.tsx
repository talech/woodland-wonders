import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertIcon, CheckIcon } from './icons.tsx';
import { palette } from './theme.ts';
import type { ClueModel } from './types.ts';

export interface ClueLabelProps {
  readonly model: ClueModel;
  readonly axis: 'row' | 'column';
  /** Size along the board (matches cell size). */
  readonly cellSize: number;
  /** Size of the clue gutter (across the board). */
  readonly clueSize: number;
  readonly testID?: string;
}

function ClueLabelImpl({ model, axis, cellSize, clueSize, testID }: ClueLabelProps) {
  const { status, target } = model.count;
  const short = Math.min(cellSize, clueSize);
  const fontSize = Math.max(12, Math.round(short * 0.5));
  const icon = Math.max(10, Math.round(short * 0.36));
  const color = status === 'satisfied' ? palette.moss : status === 'violated' ? palette.berry : palette.bark;
  const box =
    axis === 'row'
      ? { width: clueSize, height: cellSize, flexDirection: 'column' as const }
      : { width: cellSize, height: clueSize, flexDirection: 'row' as const };

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={model.accessibilityLabel}
      style={[styles.box, box, status === 'violated' && styles.violated]}
    >
      <Text style={[styles.value, { fontSize, color }]} maxFontSizeMultiplier={1.3}>
        {target}
      </Text>
      {status === 'satisfied' && <CheckIcon size={icon} />}
      {status === 'violated' && <AlertIcon size={icon} />}
    </View>
  );
}

/** Row/column clue: the target count plus a tick (satisfied) or alert (over / unreachable) shape. */
export const ClueLabel = memo(ClueLabelImpl);

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: 8 },
  violated: { backgroundColor: palette.berrySoft },
  value: { fontWeight: '800', fontVariant: ['tabular-nums'], includeFontPadding: false },
});
