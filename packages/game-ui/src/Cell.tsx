import { memo, type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Art } from './art.tsx';
import { AlertIcon, EmptyMarkIcon, HintIcon, SparkleIcon } from './icons.tsx';
import { palette, radii } from './theme.ts';
import type { CellModel } from './types.ts';

/** Completion-scene state shared by every cell of a board (stable object per scene state). */
export interface CellScene {
  /** 0 = puzzle grid, 1 = woodland scene (grid lines and ground faded away). */
  readonly progress: Animated.Value;
  /** Animals do a small idle hop (false under reduced motion). */
  readonly hop: boolean;
}

export interface CellProps {
  readonly model: CellModel;
  readonly index: number;
  readonly size: number;
  readonly onPress: (index: number) => void;
  /** Present while the completion scene is shown. */
  readonly scene?: CellScene | null;
  /** Stagger for the idle hop, in ms. */
  readonly hopDelay?: number;
}

/** Small staggered idle hop; stops (and settles) when disabled or unmounted. Interruptible by design. */
function Hop({ active, delay, children }: { active: boolean; delay: number; children: ReactNode }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      y.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, {
          toValue: -5,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(y, { toValue: 0, duration: 300, easing: Easing.bounce, useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      y.setValue(0);
    };
  }, [active, delay, y]);
  return <Animated.View style={{ transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

const GAP = 2;

const fade = (progress: Animated.Value) => progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

function CellImpl({ model, index, size, onPress, scene = null, hopDelay = 0 }: CellProps) {
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
        <View style={[styles.inner, { width: inner, height: inner, opacity: pressed ? 0.8 : 1 }]}>
          {/* Grid frame: ground, ring and marks. Fades away in the completion scene. */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.frame,
              ring,
              { backgroundColor: ground },
              scene && { opacity: fade(scene.progress) },
            ]}
            testID={`cell-${index}-frame`}
          >
            {content.kind === 'empty' && <EmptyMarkIcon size={Math.round(inner * 0.5)} />}
          </Animated.View>
          {(content.kind === 'habitat' || content.kind === 'animal') && (
            <>
              <Hop active={scene?.hop === true && content.kind === 'animal'} delay={hopDelay}>
                <Art
                  artKey={content.art.artKey}
                  color={content.art.color}
                  size={Math.round(inner * (isHabitat ? 0.62 : 0.68))}
                />
              </Hop>
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
          {!scene && highlighted && (
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
    a.model.content.kind === b.model.content.kind &&
    a.scene === b.scene &&
    a.hopDelay === b.hopDelay
  );
}

/** One board cell. Habitat cells are inert (disabled); every state shows a shape, not just a colour. */
export const Cell = memo(CellImpl, sameCell);

const styles = StyleSheet.create({
  inner: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  frame: { borderRadius: radii.cell, alignItems: 'center', justifyContent: 'center' },
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
