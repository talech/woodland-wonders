import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Art } from './art.tsx';
import { CheckIcon } from './icons.tsx';
import { MIN_TOUCH, palette, radii } from './theme.ts';
import type { ArtSpec } from './types.ts';

export interface SceneCompleteProps {
  readonly animals: readonly ArtSpec[];
  /** When true the animals sit still (no looping hop). */
  readonly reducedMotion: boolean;
  readonly title: string;
  readonly message: string;
  readonly nextLabel: string;
  readonly backLabel: string;
  /** Omit when there is no next puzzle. */
  readonly onNext?: () => void;
  readonly onBack: () => void;
  /** "Play again": clear the board and replay. */
  readonly replayLabel?: string;
  readonly onReplay?: () => void;
}

function HoppingAnimal({ art, delay, still }: { art: ArtSpec; delay: number; still: boolean }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) {
      y.setValue(0);
      return;
    }
    const hop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, {
          toValue: -8,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(y, { toValue: 0, duration: 320, easing: Easing.bounce, useNativeDriver: true }),
        Animated.delay(900),
      ]),
    );
    hop.start();
    return () => hop.stop();
  }, [y, delay, still]);
  return (
    <Animated.View style={{ transform: [{ translateY: y }] }}>
      <Art artKey={art.artKey} color={art.color} size={40} />
    </Animated.View>
  );
}

/** Gentle "scene complete" panel: a row of hopping animals (still under reduced motion) and next/back actions. */
export function SceneComplete({
  animals,
  reducedMotion,
  title,
  message,
  nextLabel,
  backLabel,
  onNext,
  onBack,
  replayLabel,
  onReplay,
}: SceneCompleteProps) {
  return (
    <View style={styles.panel} testID="scene-complete" accessibilityLiveRegion="polite">
      <View style={styles.titleRow}>
        <CheckIcon size={24} />
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {animals.length > 0 && (
        <View style={styles.animals}>
          {animals.map((art, i) => (
            <HoppingAnimal key={art.artKey} art={art} delay={i * 180} still={reducedMotion} />
          ))}
        </View>
      )}
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {onNext && (
          <Pressable
            testID="complete-next"
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel={nextLabel}
            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
          >
            <Text style={[styles.buttonText, styles.primaryText]}>{nextLabel}</Text>
          </Pressable>
        )}
        <Pressable
          testID="complete-back"
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{backLabel}</Text>
        </Pressable>
        {onReplay && replayLabel && (
          <Pressable
            testID="complete-replay"
            onPress={onReplay}
            accessibilityRole="button"
            accessibilityLabel={replayLabel}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{replayLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 8,
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.moss,
    backgroundColor: palette.mossSoft,
    alignItems: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: palette.bark },
  animals: { flexDirection: 'row', gap: 12, paddingTop: 8, minHeight: 52, alignItems: 'flex-end' },
  message: { fontSize: 15, color: palette.bark, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  button: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.moss,
    backgroundColor: palette.card,
  },
  primary: { backgroundColor: palette.moss },
  pressed: { opacity: 0.85 },
  buttonText: { fontSize: 16, fontWeight: '700', color: palette.moss, textAlign: 'center' },
  primaryText: { color: palette.card },
});
