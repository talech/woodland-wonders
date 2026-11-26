import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Art } from './art.tsx';
import { AlertIcon, EmptyMarkIcon, HintIcon, SparkleIcon } from './icons.tsx';
import { palette, radii } from './theme.ts';
import type { CellModel } from './types.ts';

export interface CellProps {
  readonly model: CellModel;
  readonly index: number;
  readonly size: number;
  readonly onPress: (index: number) => void;
}

const GAP = 2;

function CellImpl({ model, index, size, onPress }: CellProps) {
  const { content, flagged, highlighted, hint } = model;
  const inner = size - GAP * 2;
  const badge = Math.max(10, Math.round(size * 0.3));
  const glyphSize = Math.max(9, Math.round(size * 0.26));
  const isHabitat = content.kind === 'habitat';

  const ground =
    content.kind === 'habitat'
      ? palette.soil
      : content.kind === 'animal'
        ? palette.card
        : hint
          ? palette.skySoft
          : palette.grass;
  const ring = flagged
    ? { borderColor: palette.berry, borderWidth: 2, borderStyle: 'dashed' as const }
    : hint === 'focus'
      ? { borderColor: palette.sky, borderWidth: 3, borderStyle: 'solid' as const }
      : hint === 'region'
        ? { borderColor: palette.sky, borderWidth: 3, borderStyle: 'dotted' as const }
        : highlighted
          ? { borderColor: palette.honey, borderWidth: 3, borderStyle: 'solid' as const }
          : { borderColor: palette.grassEdge, borderWidth: 1, borderStyle: 'solid' as const };

  return (
    <Pressable
      testID={`cell-${index}`}
      onPress={() => onPress(index)}
      disabled={isHabitat}
      accessibilityRole="button"
      accessibilityLabel={model.accessibilityLabel}
      {...(model.accessibilityHint ? { accessibilityHint: model.accessibilityHint } : {})}
      accessibilityState={{ disabled: isHabitat, selected: content.kind === 'animal' }}
      style={{ width: size, height: size, padding: GAP }}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.inner,
            ring,
            { width: inner, height: inner, backgroundColor: ground, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {(content.kind === 'habitat' || content.kind === 'animal') && (
            <>
              <Art
                artKey={content.art.artKey}
                color={content.art.color}
                size={Math.round(inner * (isHabitat ? 0.62 : 0.68))}
              />
              <Text
                style={[styles.glyph, { fontSize: glyphSize }]}
                maxFontSizeMultiplier={1.2}
                importantForAccessibility="no"
                accessibilityElementsHidden
              >
                {content.art.glyph}
              </Text>
            </>
          )}
          {content.kind === 'empty' && <EmptyMarkIcon size={Math.round(inner * 0.5)} />}
          {highlighted && (
            <View style={[styles.badge, styles.topLeft]}>
              <SparkleIcon size={badge} />
            </View>
          )}
          {hint && (
            <View style={[styles.badge, styles.bottomLeft]} testID={`cell-${index}-hint`}>
              <HintIcon size={hint === 'focus' ? badge + 4 : badge} color={palette.sky} />
            </View>
          )}
          {flagged && (
            <View style={[styles.badge, styles.topRight]}>
              <AlertIcon size={badge} />
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

/** The accessibility label encodes content and issues, so it doubles as a cheap change key. */
function sameCell(a: CellProps, b: CellProps): boolean {
  return (
    a.index === b.index &&
    a.size === b.size &&
    a.onPress === b.onPress &&
    a.model.accessibilityLabel === b.model.accessibilityLabel &&
    a.model.flagged === b.model.flagged &&
    a.model.highlighted === b.model.highlighted &&
    a.model.hint === b.model.hint &&
    a.model.accessibilityHint === b.model.accessibilityHint &&
    a.model.content.kind === b.model.content.kind
  );
}

/** One board cell. Habitat cells are inert (disabled); every state shows a shape, not just a colour. */
export const Cell = memo(CellImpl, sameCell);

const styles = StyleSheet.create({
  inner: { borderRadius: radii.cell, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  glyph: {
    position: 'absolute',
    right: 2,
    bottom: 0,
    fontWeight: '700',
    color: palette.bark,
  },
  badge: { position: 'absolute' },
  topLeft: { left: -3, top: -3 },
  topRight: { right: -3, top: -3 },
  bottomLeft: { left: -3, bottom: -3 },
});
