import { HintIcon, MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STRINGS } from '../game/labels.ts';

export interface CoachCardProps {
  /** 1-based step number. */
  readonly step: number;
  readonly total: number;
  readonly title: string;
  readonly body: string;
  /** Shown on teaching steps. */
  readonly onSkip?: () => void;
  /** Shown on the final step. */
  readonly onDone?: () => void;
}

/** Tutorial coach step. Advances on the player's actions; the buttons only skip or close. */
export function CoachCard({ step, total, title, body, onSkip, onDone }: CoachCardProps) {
  const last = onDone !== undefined;
  return (
    <View style={styles.card} testID="coach-card" accessibilityLiveRegion="polite">
      <View style={styles.titleRow}>
        <HintIcon size={22} color={palette.sky} />
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.footer}>
        {!last && <Text style={styles.progress}>{STRINGS.tutorialStep(step, total - 1)}</Text>}
        {onSkip && (
          <Pressable
            testID="coach-skip"
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.skipTutorial}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{STRINGS.skipTutorial}</Text>
          </Pressable>
        )}
        {onDone && (
          <Pressable
            testID="coach-done"
            onPress={onDone}
            accessibilityRole="button"
            accessibilityLabel={STRINGS.startPlaying}
            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
          >
            <Text style={[styles.buttonText, styles.primaryText]}>{STRINGS.startPlaying}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.sky,
    backgroundColor: palette.skySoft,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1, fontSize: 17, fontWeight: '800', color: palette.bark },
  body: { fontSize: 15, lineHeight: 21, color: palette.bark },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  progress: { fontSize: 13, fontWeight: '700', color: palette.barkSoft },
  button: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.sky,
    backgroundColor: palette.card,
  },
  primary: { backgroundColor: palette.sky, flexGrow: 1 },
  pressed: { opacity: 0.85 },
  buttonText: { fontSize: 15, fontWeight: '700', color: palette.sky, textAlign: 'center' },
  primaryText: { color: palette.card },
});
