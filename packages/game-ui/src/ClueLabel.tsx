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
  const fontSize = Math.max(12, Math.round(short * 0.46));
  const icon = Math.max(10, Math.round(short * 0.34));
  const color = status === 'satisfied' ? palette.moss : status === 'violated' ? palette.berry : palette.bark;
  // Row gutters are narrow: stack the tick under the number when a side-by-side pill would not fit.
  const stacked = axis === 'row' && clueSize < 38;
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
      {...(model.accessibilityHint ? { accessibilityHint: model.accessibilityHint } : {})}
      style={[styles.box, box, model.hinted && styles.hinted, status === 'violated' && styles.violated]}
    >
      <View
        style={[
          styles.pill,
          stacked && styles.pillStacked,
          status === 'satisfied' && styles.pillDone,
          status === 'violated' && styles.pillProblem,
        ]}
      >
        <Text style={[styles.value, { fontSize, color }]} maxFontSizeMultiplier={1.3}>
          {target}
        </Text>
        {status === 'satisfied' && <CheckIcon size={icon} />}
        {status === 'violated' && <AlertIcon size={icon} />}
      </View>
    </View>
  );
}

/** Row/column clue: the target count plus a tick (satisfied) or alert (over / unreachable) shape. */
export const ClueLabel = memo(ClueLabelImpl);

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
  },
  pillStacked: { flexDirection: 'column', paddingHorizontal: 2 },
  pillDone: { backgroundColor: palette.mossSoft },
  pillProblem: { backgroundColor: palette.berrySoft },
  hinted: {
    backgroundColor: palette.skySoft,
    borderWidth: 2,
    borderStyle: 'dotted',
    borderColor: palette.sky,
  },
  violated: { backgroundColor: palette.berrySoft },
  value: { fontWeight: '800', fontVariant: ['tabular-nums'], includeFontPadding: false },
});
