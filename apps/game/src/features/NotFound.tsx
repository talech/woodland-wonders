import { MIN_TOUCH, palette, radii } from '@ww/game-ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STRINGS } from '../game/labels.ts';

export interface NotFoundProps {
  readonly onBack: () => void;
}

/** Gentle fallback for an unknown puzzle id. */
export function NotFound({ onBack }: NotFoundProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title} accessibilityRole="header">
        {STRINGS.notFoundTitle}
      </Text>
      <Text style={styles.message}>{STRINGS.notFoundMessage}</Text>
      <Pressable
        testID="not-found-back"
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.backToList}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>{STRINGS.backToList}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: palette.paper,
  },
  title: { fontSize: 24, fontWeight: '800', color: palette.bark, textAlign: 'center' },
  message: { fontSize: 16, color: palette.barkSoft, textAlign: 'center' },
  button: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: palette.moss,
  },
  pressed: { opacity: 0.85 },
  buttonText: { fontSize: 16, fontWeight: '700', color: palette.card },
});
