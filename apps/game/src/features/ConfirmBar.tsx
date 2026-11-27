import { MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface ConfirmBarProps {
  readonly testID: string;
  readonly question: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** In-UI confirmation (works on web, where `Alert` dialogs are unavailable). */
export function ConfirmBar({
  testID,
  question,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmBarProps) {
  return (
    <View style={styles.bar} testID={testID} accessibilityLiveRegion="polite">
      <Text style={styles.question}>{question}</Text>
      <View style={styles.actions}>
        <Pressable
          testID={`${testID}-confirm`}
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
          style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
        >
          <Text style={[styles.buttonText, styles.primaryText]}>{confirmLabel}</Text>
        </Pressable>
        <Pressable
          testID={`${testID}-cancel`}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>{cancelLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: 8,
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: palette.honey,
    backgroundColor: palette.honeySoft,
  },
  question: { fontSize: 15, color: palette.bark },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    flexGrow: 1,
    minHeight: MIN_TOUCH,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: palette.bark,
    backgroundColor: palette.card,
  },
  primary: { backgroundColor: palette.bark },
  pressed: { opacity: 0.85 },
  buttonText: { fontSize: 15, fontWeight: '700', color: palette.bark, textAlign: 'center' },
  primaryText: { color: palette.card },
});
